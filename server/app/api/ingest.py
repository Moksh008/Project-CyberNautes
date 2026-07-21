from fastapi import APIRouter

from ..models.infrastructure import InfrastructurePayload
from ..services.digital_twin_service import create_digital_twin

router = APIRouter()

@router.post("/repo")
async def ingest_repo(payload: InfrastructurePayload):
    twin_id = create_digital_twin(payload)
    return {"message": "Digital twin created", "twin_id": twin_id}
