import logging

from fastapi import APIRouter, HTTPException

from ..core.firestore_db import db
from ..models.remediation import (
    RecommendationSelection,
    SandboxVerifyRequest,
    SandboxResult,
    CodeGenRequest,
    OpenPRRequest,
    ManifestPRRequest,
)
from ..services.sandbox_service import verify_cve
from ..services.remediation_service import generate_remediation
from ..services.github_pr_service import GithubPRError, open_remediation_pr
from ..services.manifest_patch_service import open_manifest_fix_pr

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/select")
async def select_recommendations(selection: RecommendationSelection):
    if db is not None:
        try:
            db.collection("selections").document(selection.twin_id).set(selection.model_dump())
        except Exception as e:
            logger.warning(f"Failed to persist selection: {e}")
    else:
        logger.warning("Firestore not configured; selection not persisted.")
    return {
        "twin_id": selection.twin_id,
        "selected": selection.recommendation_ids,
        "message": "Selection recorded",
    }


@router.post("/verify", response_model=SandboxResult)
async def verify(request: SandboxVerifyRequest):
    return verify_cve(request.cve_id)


@router.post("/generate")
async def generate(request: CodeGenRequest):
    try:
        code = generate_remediation(request.recommendations, request.format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"twin_id": request.twin_id, "format": request.format, "code": code}


@router.post("/pr")
async def open_pr(request: OpenPRRequest):
    try:
        return open_remediation_pr(
            request.repo_url, request.code, request.format, request.title, request.body
        )
    except GithubPRError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/manifest-pr")
async def manifest_pr(request: ManifestPRRequest):
    try:
        return open_manifest_fix_pr(request.repo_url, request.twin_id)
    except GithubPRError as e:
        raise HTTPException(status_code=400, detail=str(e))
