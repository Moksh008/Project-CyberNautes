# Builds an InfrastructurePayload by scanning a public GitHub repository's
# dependency manifests, so a repo can be fed through the same digital-twin /
# threat-intel / attack-path pipeline as a manually-described JSON environment.

import contextvars
import io
import json
import logging
import re
import tarfile
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

from ..core.config import settings
from ..models.infrastructure import Asset, InfrastructurePayload, Software

logger = logging.getLogger(__name__)

# Per-request GitHub token override (e.g. a user-supplied PAT from the client).
# Falls back to the server-configured GITHUB_TOKEN when unset.
_token_override: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "github_token_override", default=None
)


def active_github_token() -> str | None:
    """The token to use for GitHub calls: request override, else server config."""
    return _token_override.get() or settings.GITHUB_TOKEN


def set_token_override(token: str | None):
    """Set the per-request token override. Returns a token handle for reset()."""
    return _token_override.set(token or None)


def reset_token_override(handle) -> None:
    _token_override.reset(handle)

# Caps the number of NVD lookups triggered per scan so ingestion stays fast.
MAX_SOFTWARE_PER_ASSET = 25


class GithubScanError(Exception):
    """Raised when a repository can't be located, downloaded, or profiled."""


def _parse_repo_url(repo_url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a full GitHub URL or an 'owner/repo' shorthand."""
    repo_url = repo_url.strip().rstrip("/")
    if repo_url.endswith(".git"):
        repo_url = repo_url[:-4]
    if repo_url.startswith("http"):
        parts = [p for p in urlparse(repo_url).path.split("/") if p]
    else:
        parts = [p for p in repo_url.split("/") if p]
    if len(parts) < 2:
        raise GithubScanError(f"Could not parse a GitHub owner/repo from '{repo_url}'.")
    return parts[0], parts[1]


def _github_headers() -> dict:
    headers = {"User-Agent": "SentinelAI-CyberTwin/1.0", "Accept": "application/vnd.github+json"}
    token = active_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _get_default_branch(owner: str, repo: str) -> str:
    """Falls back to the GitHub REST API only when neither common default branch
    name works — the unauthenticated API is rate-limited far more aggressively
    (60 req/hr per IP) than the codeload archive endpoint used below."""
    url = f"https://api.github.com/repos/{owner}/{repo}"
    req = urllib.request.Request(url, headers=_github_headers())
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data.get("default_branch", "main")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise GithubScanError(f"Repository {owner}/{repo} was not found (or is private).") from e
        raise GithubScanError(f"GitHub API error while resolving {owner}/{repo}: {e}") from e
    except Exception as e:
        raise GithubScanError(f"Failed to reach the GitHub API: {e}") from e


def _download_tarball(owner: str, repo: str) -> tuple[tarfile.TarFile, str]:
    for branch in ("main", "master"):
        url = f"https://codeload.github.com/{owner}/{repo}/tar.gz/refs/heads/{branch}"
        req = urllib.request.Request(url, headers={"User-Agent": "SentinelAI-CyberTwin/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                buf = io.BytesIO(resp.read())
            return tarfile.open(fileobj=buf, mode="r:gz"), branch
        except urllib.error.HTTPError as e:
            if e.code != 404:
                raise GithubScanError(f"Failed to download the repository archive: {e}") from e
        except Exception as e:
            raise GithubScanError(f"Failed to download the repository archive: {e}") from e

    # Neither common name matched (e.g. "develop", "trunk") — resolve via the API.
    branch = _get_default_branch(owner, repo)
    url = f"https://codeload.github.com/{owner}/{repo}/tar.gz/refs/heads/{branch}"
    req = urllib.request.Request(url, headers={"User-Agent": "SentinelAI-CyberTwin/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            buf = io.BytesIO(resp.read())
    except Exception as e:
        raise GithubScanError(f"Failed to download the repository archive: {e}") from e
    return tarfile.open(fileobj=buf, mode="r:gz"), branch


def _strip_version_prefix(version: str) -> str:
    return re.sub(r"^[\^~>=<\s]+", "", version).split(",")[0].strip()


def _parse_package_json(text: str) -> list[Software]:
    try:
        data = json.loads(text)
    except Exception:
        return []
    deps: dict = {}
    deps.update(data.get("dependencies", {}) or {})
    deps.update(data.get("devDependencies", {}) or {})
    out = []
    for name, ver in deps.items():
        version = _strip_version_prefix(str(ver))
        if version:
            out.append(Software(name=name, version=version))
    return out


def _parse_requirements_txt(text: str) -> list[Software]:
    out = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        match = re.match(r"^([A-Za-z0-9_.\-]+)\s*(?:==|>=|<=|~=)\s*([A-Za-z0-9_.\-]+)", line)
        if match:
            name, version = match.groups()
            out.append(Software(name=name, version=version))
    return out


def _parse_go_mod(text: str) -> list[Software]:
    out = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("module") or line.startswith("go ") or not line:
            continue
        match = re.match(r"^([a-zA-Z0-9_.\-/]+)\s+v([0-9][a-zA-Z0-9_.\-+]*)", line)
        if match:
            name, version = match.groups()
            out.append(Software(name=name.rsplit("/", 1)[-1], version=version))
    return out


def _parse_pom_xml(text: str) -> list[Software]:
    out = []
    for match in re.finditer(
        r"<dependency>\s*<groupId>.*?</groupId>\s*<artifactId>(.*?)</artifactId>\s*<version>(.*?)</version>",
        text,
        re.DOTALL,
    ):
        name, version = match.groups()
        out.append(Software(name=name.strip(), version=version.strip()))
    return out


def _parse_dockerfile(text: str) -> list[Software]:
    """A Dockerfile's base image is software actually deployed on the asset
    (the runtime), not a source-level dependency, so it's tracked separately
    from the manifest parsers below."""
    out = []
    for line in text.splitlines():
        match = re.match(r"^FROM\s+([a-zA-Z0-9_.\-/]+):([a-zA-Z0-9_.\-]+)", line.strip(), re.IGNORECASE)
        if match:
            image, tag = match.groups()
            out.append(Software(name=image.rsplit("/", 1)[-1], version=tag))
    return out


_MANIFEST_PARSERS = {
    "package.json": _parse_package_json,
    "requirements.txt": _parse_requirements_txt,
    "go.mod": _parse_go_mod,
    "pom.xml": _parse_pom_xml,
}


def scan_repository(repo_url: str) -> tuple[InfrastructurePayload, dict]:
    """Download a public GitHub repo's default branch and build an
    InfrastructurePayload from its real dependency manifests (package.json,
    requirements.txt, go.mod, pom.xml, Dockerfile). This profiles what the
    codebase declares — it does not probe a live deployment."""
    owner, repo = _parse_repo_url(repo_url)
    tar, branch = _download_tarball(owner, repo)

    manifest_software: dict[str, Software] = {}
    dockerfile_software: list[Software] = []
    files_scanned: list[str] = []

    try:
        for member in tar.getmembers():
            if not member.isfile():
                continue
            filename = Path(member.name).name

            if filename.lower() == "dockerfile":
                content = tar.extractfile(member)
                if content is None:
                    continue
                text = content.read().decode("utf-8", errors="replace")
                dockerfile_software.extend(_parse_dockerfile(text))
                files_scanned.append(member.name)
                continue

            parser = _MANIFEST_PARSERS.get(filename)
            if parser is None:
                continue
            content = tar.extractfile(member)
            if content is None:
                continue
            text = content.read().decode("utf-8", errors="replace")
            files_scanned.append(member.name)
            for sw in parser(text):
                manifest_software.setdefault(sw.name.lower(), sw)
    finally:
        tar.close()

    software = dockerfile_software + list(manifest_software.values())[:MAX_SOFTWARE_PER_ASSET]

    if not software:
        raise GithubScanError(
            "No recognized dependency manifests (package.json, requirements.txt, go.mod, "
            "pom.xml, Dockerfile) with pinned versions were found on the default branch."
        )

    asset = Asset(
        id="repo-app-1",
        name=repo,
        type="application",
        os=None,
        internet_facing=True,
        software=software,
    )
    payload = InfrastructurePayload(name=f"{owner}/{repo}", assets=[asset], connections=[])
    summary = {
        "owner": owner,
        "repo": repo,
        "branch": branch,
        "files_scanned": files_scanned,
        "dependencies_found": len(software),
    }
    return payload, summary
