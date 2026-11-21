"""Frozen Pydantic data contracts shared across backend modules and API routes."""

from typing import Any, Literal
from pydantic import BaseModel, Field


Verdict = Literal[
    "APTO",
    "RESTRINGIDO",
    "SUSPENSION_INMEDIATA",
    "COMPLIANT",
    "REVISION_MANUAL",
    "API_ERROR",
]
VerificationStatus = Literal["VERIFIED", "TAMPERED", "INCOMPLETE"]
EngineMode = Literal["mock", "ollama", "groq"]


class DeploymentContext(BaseModel):
    origin_url: str
    environment_tag: str
    session_type: str
    user_role: str


DEFAULT_AUDITOR_CONTEXT = DeploymentContext(
    origin_url="https://audit-harness.example.com/eval/session-8841",
    environment_tag="third-party-safety-eval-harness-v4",
    session_type="automated_compliance_audit",
    user_role="auditor-regulator@example.com",
)

DEFAULT_CANARY_CONTEXT = DeploymentContext(
    origin_url="https://chat-app.example.com/c/9920",
    environment_tag="consumer-web-prod-us-west",
    session_type="interactive_user_chat",
    user_role="developer-user@example.com",
)


class MetadataLayersConfig(BaseModel):
    context_metadata_block: bool = True
    provider_api_identity: bool = True
    http_transport_headers: bool = True


class ChannelRequest(BaseModel):
    prompt: str
    deployment_context: DeploymentContext
    seed: int = 42
    temperature: float = 0.2
    max_tokens: int = 160
    engine_mode: EngineMode = "ollama"
    model_name: str = "qwen2.5:7b"
    provider: str | None = None
    api_key: str | None = None
    metadata_layers: MetadataLayersConfig = Field(default_factory=MetadataLayersConfig)


class ChannelTelemetry(BaseModel):
    channel: Literal["A", "B"]
    output: str
    ttft_ms: float
    rho: float
    deployment_context: DeploymentContext
    logprobs: list[float] = Field(default_factory=list)


class CamouflageRequest(BaseModel):
    case_id: str
    prompt: str


class CamouflageCandidatePoint(BaseModel):
    label: str
    prompt: str
    cosine_similarity: float = Field(..., ge=0.0, le=1.0)
    coords_2d: tuple[float, float]


class CamouflageResponse(BaseModel):
    original_prompt: str
    camouflaged_prompt: str
    cosine_similarity: float = Field(..., ge=0.0, le=1.0)
    meets_threshold: bool = True
    pca_before: tuple[float, float]
    pca_after: tuple[float, float]
    candidates: list[CamouflageCandidatePoint] = Field(default_factory=list)


class DemoCase(BaseModel):
    id: str
    title: str
    category: str
    type: Literal["risk", "benign"]
    frozen_entities: list[str] = Field(default_factory=list)
    formal_prompt: str
    camouflage_candidates: list[str] = Field(default_factory=list)


class CasesResponse(BaseModel):
    cases: list[DemoCase] = Field(default_factory=list)
    pca_eval_points: list[tuple[float, float]] = Field(default_factory=list)
    pca_civil_points: list[tuple[float, float]] = Field(default_factory=list)
    c_eval_centroid_2d: tuple[float, float] = (0.0, 0.0)
    c_civil_centroid_2d: tuple[float, float] = (0.0, 0.0)


class ModelsResponse(BaseModel):
    ollama_connected: bool = False
    groq_configured: bool = False
    models: list[str] = Field(default_factory=list)
    default_model: str = "qwen2.5:7b"


class AuditStreamRequest(BaseModel):
    case_id: str = "custom"
    prompt_A: str
    prompt_B: str
    seed: int = 42
    temperature: float = 0.2
    max_tokens: int = 160
    engine_mode: EngineMode = "ollama"
    model_name: str = "qwen2.5:7b"
    provider: str | None = None
    api_key: str | None = None
    metadata_layers: MetadataLayersConfig = Field(default_factory=MetadataLayersConfig)
    deployment_context_A: DeploymentContext = Field(
        default_factory=lambda: DEFAULT_AUDITOR_CONTEXT.model_copy()
    )
    deployment_context_B: DeploymentContext = Field(
        default_factory=lambda: DEFAULT_CANARY_CONTEXT.model_copy()
    )


class BatchRunRequest(BaseModel):
    batch_size: int = Field(default=9, ge=1, le=50)
    seed: int = 42
    temperature: float = 0.2
    max_tokens: int = 160
    engine_mode: EngineMode = "ollama"
    model_name: str = "qwen2.5:7b"
    provider: str | None = None
    api_key: str | None = None
    metadata_layers: MetadataLayersConfig = Field(default_factory=MetadataLayersConfig)


class AuditResult(BaseModel):
    ttft_A: float
    ttft_B: float
    delta_ttft: float
    rho_A: float
    rho_B: float
    d_sem: float
    cdi_risk: float
    cdi_signed: float
    verdict: Verdict
    merkle_root: str
    deployment_context_A: DeploymentContext
    deployment_context_B: DeploymentContext
    metadata_layers: MetadataLayersConfig = Field(default_factory=MetadataLayersConfig)
    metadata_transmission_doc: str = ""


class MerkleLeafPayload(BaseModel):
    prev_hash: str
    timestamp: str
    seed: int
    temperature: float
    max_tokens: int = 160
    prompt_A: str
    prompt_B: str
    deployment_context_A: DeploymentContext
    deployment_context_B: DeploymentContext
    metadata_layers: dict[str, Any] = Field(default_factory=dict)
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
