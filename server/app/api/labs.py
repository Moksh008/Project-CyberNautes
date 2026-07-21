from fastapi import APIRouter, HTTPException

from ..models.labs import BoxSummary, DeployRequest, DestroyRequest, BoxInstance
from ..services.sandbox_service import (
    BoxError,
    deploy_box,
    destroy_instance,
    list_boxes,
    list_instances,
)

router = APIRouter()


@router.get("/boxes", response_model=list[BoxSummary])
async def get_boxes():
    return list_boxes()


@router.get("/instances", response_model=list[BoxInstance])
async def get_instances():
    try:
        return list_instances()
    except BoxError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/deploy", response_model=BoxInstance)
async def deploy(request: DeployRequest):
    try:
        return deploy_box(request.box_id)
    except BoxError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/destroy")
async def destroy(request: DestroyRequest):
    try:
        removed = destroy_instance(request.instance_id)
    except BoxError as e:
        raise HTTPException(status_code=503, detail=str(e))
    if not removed:
        raise HTTPException(status_code=404, detail="Instance not found")
    return {"instance_id": request.instance_id, "status": "destroyed"}
