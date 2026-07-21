# Pydantic models for user selection, sandbox verification, and code generation

from pydantic import BaseModel
from typing import Optional


class RecommendationSelection(BaseModel):
    twin_id: str
    recommendation_ids: list[str]


class SandboxVerifyRequest(BaseModel):
    cve_id: str
    twin_id: Optional[str] = None


class SandboxResult(BaseModel):
    cve_id: str
    before_exploit_success: bool
    after_exploit_success: bool
    patch_verified: bool
    logs: list[str]


class RecomputeRequest(BaseModel):
    twin_id: str
    excluded_cves: list[str] = []


class CodeGenRequest(BaseModel):
    twin_id: str
    recommendations: list[dict]
    format: str  # "bash" | "ansible" | "git_diff"
