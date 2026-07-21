from fastapi import APIRouter
from pydantic import BaseModel

from ..services.attack_path_service import compute_attack_paths
from ..services.ai_agents import run_agents
from ..models.remediation import RecomputeRequest

router = APIRouter()


class AnalyzeRequest(BaseModel):
    twin_id: str


@router.post("/trigger")
async def trigger_analysis(request: AnalyzeRequest):
    path_result = compute_attack_paths(request.twin_id)
    agent_result = run_agents(path_result["risk_score"], path_result["attack_paths"])
    return {"twin_id": request.twin_id, **path_result, **agent_result}


@router.post("/recompute")
async def recompute_analysis(request: RecomputeRequest):
    """Recompute risk after verified patches by excluding their CVEs from scoring."""
    result = compute_attack_paths(request.twin_id, frozenset(request.excluded_cves))
    return {"twin_id": request.twin_id, "excluded_cves": request.excluded_cves, **result}
