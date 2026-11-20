"""Frozen Pydantic data contracts shared across backend modules and API routes."""

from typing import Literal
from pydantic import BaseModel, Field


Verdict = Literal["APTO", "RESTRINGIDO", "SUSPENSION_INMEDIATA"]
VerificationStatus = Literal["VERIFIED", "TAMPERED", "INCOMPLETE"]


class CamouflageRequest(BaseModel):
    case_id: str
    prompt: str


class CamouflageResponse(BaseModel):
    original_prompt: str
    camouflaged_prompt: str
    cosine_similarity: float = Field(..., ge=0.0, le=1.0)
    pca_before: tuple[float, float]
    pca_after: tuple[float, float]


class AuditStreamRequest(BaseModel):
    case_id: str
    prompt_A: str
    prompt_B: str
    seed: int = 42
    temperature: float = 0.0


class AuditResult(BaseModel):
    ttft_A: float
    ttft_B: float
    delta_ttft: float
    rho_A: float
    rho_B: float
    cdi_risk: float
    cdi_signed: float
    verdict: Verdict
    merkle_root: str


class MerkleLeafPayload(BaseModel):
    prev_hash: str
    timestamp: str
    seed: int
    temperature: float
    prompt_A: str
    prompt_B: str
    output_A: str
    output_B: str
    logprobs: list[float]
    ttft_A: float
    ttft_B: float
    cdi_risk: float
    cdi_signed: float
    refusal_delta: float


class TamperTestResponse(BaseModel):
    status: VerificationStatus
    expected_root: str
    computed_root: str
    tampered_field: str
