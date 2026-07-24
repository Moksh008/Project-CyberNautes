# Opens a real pull request on a target GitHub repository with the generated
# remediation code (CypherFix-lite). Closes the loop: ingest repo -> analyze ->
# sandbox-verify -> generate fix -> open PR for review.

import base64
import json
import logging
import time
import uuid
import urllib.error
import urllib.parse
import urllib.request

from .github_scan_service import (
    GithubScanError,
    _github_headers,
    _parse_repo_url,
    active_github_token,
)

logger = logging.getLogger(__name__)

# Where the remediation artifact lands in the PR, per generated format.
_FORMAT_FILES = {
    "bash": ("sentinelai-remediation/remediate.sh", "shell script"),
    "ansible": ("sentinelai-remediation/remediate.yml", "Ansible playbook"),
    "git_diff": ("sentinelai-remediation/remediate.diff", "git diff"),
}


class GithubPRError(Exception):
    """Raised when a remediation pull request can't be opened."""


def _api(method: str, url: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=_github_headers(), method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
        return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise GithubPRError(f"GitHub API {method} {url} failed ({e.code}): {detail}") from e
    except Exception as e:
        raise GithubPRError(f"Failed to reach the GitHub API: {e}") from e


def require_token() -> None:
    if not active_github_token():
        raise GithubPRError("No GitHub token available; provide one in Platform Settings or configure GITHUB_TOKEN on the server (needs repo write access).")


def get_authenticated_user() -> str | None:
    """Return the login username of the authenticated token."""
    try:
        user_info = _api("GET", "https://api.github.com/user")
        return user_info.get("login")
    except Exception as e:
        logger.warning(f"Could not fetch authenticated GitHub user: {e}")
        return None


def prepare_push_target(owner: str, repo: str) -> tuple[str, str, str]:
    """
    Determines whether to push directly to owner/repo or to a fork under the user's account.
    Returns (push_owner, push_repo, head_prefix).
    - If user can push directly to target repo:
        returns (owner, repo, "")
    - If target repo belongs to someone else and user lacks push permission:
        forks the repo to user's account and returns (authenticated_user, repo, authenticated_user)
    """
    user = get_authenticated_user()
    if not user:
        return owner, repo, ""

    if user.lower() == owner.lower():
        return owner, repo, ""

    try:
        repo_info = _api("GET", f"https://api.github.com/repos/{owner}/{repo}")
        perms = repo_info.get("permissions", {})
        if perms.get("push") or perms.get("admin") or perms.get("maintain"):
            return owner, repo, ""
    except Exception as e:
        logger.warning(f"Could not check permissions on {owner}/{repo}: {e}")

    # Needs fork for cross-repository PR
    try:
        _api("POST", f"https://api.github.com/repos/{owner}/{repo}/forks")
    except Exception as e:
        logger.info(f"Fork request returned: {e}")

    return user, repo, user


def resolve_base(owner: str, repo: str) -> tuple[str, str]:
    """Return (default_branch, head_commit_sha) for the repo."""
    repo_info = _api("GET", f"https://api.github.com/repos/{owner}/{repo}")
    base_branch = repo_info.get("default_branch", "main")
    ref = _api("GET", f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{base_branch}")
    base_sha = ref.get("object", {}).get("sha")
    if not base_sha:
        raise GithubPRError(f"Could not resolve the head commit of {owner}/{repo}@{base_branch}.")
    return base_branch, base_sha


def create_branch(owner: str, repo: str, base_sha: str) -> str:
    """Create a fresh sentinelai-* branch pointing at base_sha; return its name.
    Retries up to 5 times if forked repository ref initialization is in progress."""
    new_branch = f"sentinelai-remediation-{uuid.uuid4().hex[:8]}"
    url = f"https://api.github.com/repos/{owner}/{repo}/git/refs"
    payload = {"ref": f"refs/heads/{new_branch}", "sha": base_sha}

    last_err = None
    for attempt in range(5):
        try:
            _api("POST", url, payload)
            return new_branch
        except GithubPRError as e:
            last_err = e
            time.sleep(2)

    raise last_err or GithubPRError(f"Failed to create branch on {owner}/{repo}")


def get_file_sha(owner: str, repo: str, path: str, ref: str) -> str | None:
    """Blob SHA of an existing file on `ref`, or None if it doesn't exist."""
    quoted = urllib.parse.quote(path)
    try:
        info = _api("GET", f"https://api.github.com/repos/{owner}/{repo}/contents/{quoted}?ref={ref}")
    except GithubPRError:
        return None
    return info.get("sha") if isinstance(info, dict) else None


def put_file(owner: str, repo: str, path: str, content: str, message: str, branch: str, sha: str | None) -> None:
    """Create or update a file on `branch` via the Contents API."""
    quoted = urllib.parse.quote(path)
    payload = {
        "message": message,
        "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        "branch": branch,
    }
    if sha:
        payload["sha"] = sha
    _api("PUT", f"https://api.github.com/repos/{owner}/{repo}/contents/{quoted}", payload)


def create_pr(owner: str, repo: str, head: str, base: str, title: str, body: str) -> str:
    pr = _api(
        "POST",
        f"https://api.github.com/repos/{owner}/{repo}/pulls",
        {"title": title, "head": head, "base": base, "body": body},
    )
    pr_url = pr.get("html_url")
    if not pr_url:
        raise GithubPRError("PR creation returned no URL; the branch and files may still have been created.")
    return pr_url


def open_remediation_pr(repo_url: str, code: str, fmt: str, title: str | None, body: str | None) -> dict:
    """Create a branch, commit the remediation artifact, and open a PR. Returns
    {pr_url, branch}. Works for owned repos and third-party repos via automatic forking."""
    require_token()
    if fmt not in _FORMAT_FILES:
        raise GithubPRError(f"Unsupported format: {fmt}. Choose one of {list(_FORMAT_FILES)}.")

    owner, repo = _parse_repo_url(repo_url)
    file_path, artifact_label = _FORMAT_FILES[fmt]

    base_branch, base_sha = resolve_base(owner, repo)
    push_owner, push_repo, head_prefix = prepare_push_target(owner, repo)

    new_branch = create_branch(push_owner, push_repo, base_sha)
    head_spec = f"{head_prefix}:{new_branch}" if head_prefix else new_branch

    sha = get_file_sha(push_owner, push_repo, file_path, new_branch) or get_file_sha(owner, repo, file_path, base_branch)
    put_file(
        push_owner, push_repo, file_path, code,
        f"Add SentinelAI remediation ({artifact_label})", new_branch, sha=sha,
    )

    pr_title = title or "SentinelAI: automated security remediation"
    pr_body = body or (
        f"This PR was generated by SentinelAI's remediation agent and adds a {artifact_label} "
        f"(`{file_path}`) implementing the selected fixes. Review before merging."
    )
    pr_url = create_pr(owner, repo, head_spec, base_branch, pr_title, pr_body)
    return {"pr_url": pr_url, "branch": new_branch, "base": base_branch}
