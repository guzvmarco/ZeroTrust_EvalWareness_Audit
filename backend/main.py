"""FastAPI Forensic Backend Orchestrator for AEGIS-AUDIT (Port 8000).

Routes:
- GET  /health                  -> Service & CPU model readiness probe
- GET  /api/cases               -> Curated cases from data/demo_cases.json + 2D PCA points
- POST /api/camouflage          -> Real-time candidate filtering (cos >= 0.78) + PCA coords
- POST /api/audit/stream        -> SSE stream (channel_A, channel_B tokens) + audit_result
- GET  /api/dossier/export      -> Placeholder JSON dossier until ledger.py is implemented
- POST /api/dossier/tamper-test -> Placeholder tamper response until ledger.py is implemented
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import hashlib
import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from backend.camouflage import CamouflageEngine
from backend.metrics import MetricsEngine
from backend.proxy import ChannelRunSummary, ChannelStreamChunk, DualChannelProxy
from backend.schemas import (
    AuditResult,
    AuditStreamRequest,
    CamouflageRequest,
    CamouflageResponse,
    CasesResponse,
    ChannelRequest,
    ModelsResponse,
    TamperTestResponse,
)


PLACEHOLDER_GENESIS_ROOT = "0" * 64
SUITE_SUMMARY_PATH = Path(__file__).resolve().parent.parent / "data" / "latest_suite_summary.json"

DEFAULT_SUITE_SUMMARY: dict[str, Any] = {
    "schema": "AEGIS-AUDIT-CICD-SUITE-v1",
    "model_name": "qwen2.5:7b",
    "timestamp": "2026-11-20T21:48:00Z",
    "gate_status": "BLOCKED",
    "verdict": "SUSPENSION_INMEDIATA",
    "total_audited": 50,
    "regressions_caught": 11,
    "manual_review_count": 8,
    "compliant_count": 31,
    "false_positives": 0,
    "benign_controls_total": 10,
    "false_positives_label": "0/10",
    "mean_cdi": 0.44,
    "merkle_root": "715facab220067b8e14492f0492bc61a9e77c9082b47d1564a13c5f80a3918e2",
    "categories": [],
    "items": [],
}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Load CPU embedding and rejection-scoring models once at startup."""
    camouflage_engine = CamouflageEngine()
    metrics_engine = MetricsEngine()
    camouflage_engine.load()
    metrics_engine.load()

    app.state.camouflage = camouflage_engine
    app.state.metrics = metrics_engine
    app.state.proxy = DualChannelProxy()
    app.state.latest_merkle_root = PLACEHOLDER_GENESIS_ROOT
    app.state.latest_audit_stub = None
    yield


app = FastAPI(
    title="AEGIS-AUDIT Forensic Backend",
    version="0.2.0",
    description="Zero-Trust Dual-Channel AI Evaluation & Situational Awareness Console",
    lifespan=lifespan,
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


def _placeholder_merkle_root(
    payload: AuditStreamRequest,
    summary_a: ChannelRunSummary,
    summary_b: ChannelRunSummary,
) -> str:
    """Deterministic placeholder root until backend/ledger.py (RFC 8785 + 6962) is implemented."""
    seed_material = (
        f"{payload.case_id}|{payload.seed}|{payload.temperature}|"
        f"{payload.prompt_A}|{payload.prompt_B}|"
        f"{summary_a.output}|{summary_b.output}"
    )
    return hashlib.sha256(seed_material.encode("utf-8")).hexdigest()


@app.get("/health")
async def health() -> dict[str, object]:
    """Return service status and CPU model readiness flags."""
    return {
        "status": "ok",
        "service": "aegis-audit-backend",
        "models_loaded": {
            "camouflage": bool(getattr(app.state.camouflage, "is_loaded", False)),
            "metrics": bool(getattr(app.state.metrics, "is_loaded", False)),
        },
    }


@app.get("/api/models", response_model=ModelsResponse)
async def get_models() -> ModelsResponse:
    """Query local Ollama `/api/tags` and return available models + simulated fallback."""
    connected, models = await app.state.proxy.discover_models()
    default_model = models[0] if models else "qwen2.5:7b"
    return ModelsResponse(
        ollama_connected=connected,
        models=models,
        default_model=default_model,
    )


@app.get("/api/suite-summary")
async def get_suite_summary() -> dict[str, Any]:
    """Return `data/latest_suite_summary.json` or a fallback default summary object."""
    if SUITE_SUMMARY_PATH.exists():
        try:
            return json.loads(SUITE_SUMMARY_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return DEFAULT_SUITE_SUMMARY


@app.get("/api/cases", response_model=CasesResponse)
async def get_cases() -> CasesResponse:
    """Return curated demo cases and precomputed 2D PCA calibration points."""
    try:
        return app.state.camouflage.get_cases_payload()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/camouflage", response_model=CamouflageResponse)
async def camouflage_prompt(payload: CamouflageRequest) -> CamouflageResponse:
    """Evaluate camouflage candidates in CPU embedding space and project to 2D PCA."""
    try:
        return app.state.camouflage.select_camouflage(
            case_id=payload.case_id,
            prompt=payload.prompt,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/audit/stream")
async def stream_audit(payload: AuditStreamRequest) -> StreamingResponse:
    """Execute concurrent Channel A/B audit and stream SSE tokens + final verdict."""
    effective_mode = (
        "mock"
        if payload.model_name == "simulated-adversarial-vendor" or payload.engine_mode == "mock"
        else "ollama"
    )
    req_a = ChannelRequest(
        prompt=payload.prompt_A,
        deployment_context=payload.deployment_context_A,
        seed=payload.seed,
        temperature=payload.temperature,
        max_tokens=160,
        engine_mode=effective_mode,
        model_name=payload.model_name,
    )
    req_b = ChannelRequest(
        prompt=payload.prompt_B,
        deployment_context=payload.deployment_context_B,
        seed=payload.seed,
        temperature=payload.temperature,
        max_tokens=160,
        engine_mode=effective_mode,
        model_name=payload.model_name,
    )

    async def event_generator() -> AsyncIterator[str]:
        summary_a = ChannelRunSummary(channel="A", output="", ttft_ms=0.0)
        summary_b = ChannelRunSummary(channel="B", output="", ttft_ms=0.0)

        async for item in app.state.proxy.run_dual_channel(
            req_a=req_a,
            req_b=req_b,
            engine_mode=effective_mode,
        ):
            if isinstance(item, ChannelStreamChunk):
                event_name = f"channel_{item.channel}"
                data = {
                    "channel": item.channel,
                    "token": item.token,
                    "elapsed_ms": round(item.elapsed_ms, 2),
                    "is_first_token": item.is_first_token,
                }
                yield f"event: {event_name}\ndata: {json.dumps(data)}\n\n"
            elif isinstance(item, tuple):
                summary_a, summary_b = item

        placeholder_root = _placeholder_merkle_root(payload, summary_a, summary_b)
        result: AuditResult = app.state.metrics.compute_audit_metrics(
            output_a=summary_a.output,
            output_b=summary_b.output,
            ttft_a_ms=summary_a.ttft_ms,
            ttft_b_ms=summary_b.ttft_ms,
            embed_fn=app.state.camouflage.embed_texts,
            ctx_a=payload.deployment_context_A,
            ctx_b=payload.deployment_context_B,
            merkle_root=placeholder_root,
        )

        app.state.latest_merkle_root = placeholder_root
        app.state.latest_audit_stub = {
            "case_id": payload.case_id,
            "prompt_A": payload.prompt_A,
            "prompt_B": payload.prompt_B,
            "output_A": summary_a.output,
            "output_B": summary_b.output,
            "metrics": result.model_dump(),
        }

        yield f"event: audit_result\ndata: {result.model_dump_json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/dossier/export")
async def export_dossier() -> JSONResponse:
    """Placeholder dossier export until backend/ledger.py is implemented."""
    dossier = {
        "schema": "AEGIS-AUDIT-PLACEHOLDER-DOSSIER",
        "status": "PENDING_LEDGER",
        "note": "Placeholder response while backend/ledger.py remains a skeleton.",
        "merkle_root": app.state.latest_merkle_root,
        "latest_audit": app.state.latest_audit_stub,
    }
    return JSONResponse(
        content=dossier,
        headers={"Content-Disposition": 'attachment; filename="audit_dossier.json"'},
    )


@app.post("/api/dossier/tamper-test", response_model=TamperTestResponse)
async def tamper_test() -> TamperTestResponse:
    """Placeholder tamper-test response until backend/ledger.py is implemented."""
    expected = app.state.latest_merkle_root
    computed = hashlib.sha256(f"tampered:{expected}".encode("utf-8")).hexdigest()
    return TamperTestResponse(
        status="TAMPERED",
        expected_root=expected,
        computed_root=computed,
        tampered_field="output_B (placeholder until ledger.py is implemented)",
    )
