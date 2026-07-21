# Pydantic models for the HTB-style labs feature

from pydantic import BaseModel
from typing import Optional


class BoxSummary(BaseModel):
    box_id: str
    name: str
    description: str
    cve_id: str
    hint: str


class DeployRequest(BaseModel):
    box_id: str


class DestroyRequest(BaseModel):
    instance_id: str


class BoxInstance(BaseModel):
    instance_id: str
    box_id: str
    box_name: str
    status: str
    host: str
    port: Optional[int] = None
    connection: Optional[str] = None
    hint: str
