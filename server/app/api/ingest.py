from fastapi import APIRouter, HTTPException

from ..models.infrastructure import GithubIngestRequest, InfrastructurePayload
from ..services.digital_twin_service import create_digital_twin
from ..services.github_scan_service import GithubScanError, scan_repository

router = APIRouter()

@router.post("/repo")
async def ingest_repo(payload: InfrastructurePayload):
    twin_id = create_digital_twin(payload)
    return {"message": "Digital twin created", "twin_id": twin_id}


@router.post("/github")
async def ingest_github(request: GithubIngestRequest):
    try:
        payload, summary = scan_repository(request.repo_url)
    except GithubScanError as e:
        raise HTTPException(status_code=400, detail=str(e))
    twin_id = create_digital_twin(payload)
    return {
        "message": "Digital twin created from GitHub repository",
        "twin_id": twin_id,
        "payload": payload,
        "scan_summary": summary,
    }
