# Pydantic and SQLAlchemy models go here

from pydantic import BaseModel, Field
from typing import Optional


class Software(BaseModel):
    name: str
    version: Optional[str] = None


class Asset(BaseModel):
    id: str
    name: str
    type: str  # e.g. "server", "application", "database"
    os: Optional[str] = None
    internet_facing: bool = False
    software: list[Software] = Field(default_factory=list)


class Connection(BaseModel):
    source: str  # Asset.id
    target: str  # Asset.id
    protocol: Optional[str] = None
    port: Optional[int] = None


class InfrastructurePayload(BaseModel):
    name: str
    assets: list[Asset]
    connections: list[Connection] = Field(default_factory=list)


class GithubIngestRequest(BaseModel):
    repo_url: str
