from fastapi import APIRouter, HTTPException, Query
from ..services.sonarqube_service import run_sast_scan, SastSummary

router = APIRouter()


@router.get("/scan", response_model=SastSummary)
async def scan_repository_sast(repo_url: str = Query(..., description="GitHub repository URL or owner/repo")):
    """Performs static code analysis (SAST), code smell detection, and security flaw
    scanning across multi-language source repositories using SonarQube / SAST rules."""
    try:
        return run_sast_scan(repo_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
