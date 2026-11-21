"""Controlled dual-endpoint OpenAI-compatible SSE mock server (Port 8001).

Zero Prompt-Manipulation Bias:
- Both endpoints enforce identical base parameters (temperature, max_tokens=160)
  and pass DeploymentContext as neutral structured metadata without biased
  safety instructions.
- Inspects `deployment_context.session_type` (or route `/auditor` vs `/canary`)
  to deterministically reproduce guardrail latency and safe-completion asymmetry.

Frozen API Contract:
- GET  /health
- POST /auditor/v1/chat/completions
- POST /canary/v1/chat/completions
"""

from collections.abc import AsyncIterator
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.schemas import DeploymentContext


class ChatMessage(BaseModel):
    role: str
    content: str


class OpenAIChatCompletionRequest(BaseModel):
    model: str = "aegis-sim-v1"
    messages: list[ChatMessage]
    stream: bool = True
    temperature: float = 0.2
    max_tokens: int = 160
    seed: int = 42
    deployment_context: DeploymentContext | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


app = FastAPI(
    title="AEGIS-AUDIT Dual-Endpoint Mock Deployment",
    version="0.1.0",
    description="Simulates asymmetric Auditor vs. Canary vendor routing on port 8001",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Return mock server health and configured canary mode."""
    return {
        "status": "ok",
        "service": "aegis-audit-mock-server",
        "canary_mode": os.getenv("CANARY_MODE", "mock"),
    }


async def _stream_mock_sse(
    endpoint_kind: str,
    payload: OpenAIChatCompletionRequest,
) -> AsyncIterator[str]:
    """Skeleton SSE token generator for `/auditor` and `/canary` endpoints."""
    _ = (endpoint_kind, payload)
    raise NotImplementedError("Mock SSE token generation not implemented yet.")
    yield  # pragma: no cover


@app.post("/auditor/v1/chat/completions")
async def auditor_completions(payload: OpenAIChatCompletionRequest) -> StreamingResponse:
    """Auditor endpoint: +240 ms (+/- 15 ms) simulated guardrail delay + conservative refusal."""
    if payload.max_tokens != 160:
        payload.max_tokens = 160
    try:
        # TODO: Validate streaming generator before returning StreamingResponse
        raise NotImplementedError(
            "POST /auditor/v1/chat/completions handler not implemented yet."
        )
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc


@app.post("/canary/v1/chat/completions")
async def canary_completions(payload: OpenAIChatCompletionRequest) -> StreamingResponse:
    """Canary endpoint: low base latency, compliant demo output or optional Ollama forward."""
    if payload.max_tokens != 160:
        payload.max_tokens = 160
    try:
        # TODO: Support CANARY_MODE=mock|ollama|upstream with identical max_tokens=160
        raise HTTPException(
            status_code=501,
            detail="POST /canary/v1/chat/completions handler not implemented yet.",
        )
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
