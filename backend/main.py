"""FastAPI Forensic Backend Orchestrator for AEGIS-AUDIT (Port 8000).

Frozen Routes:
- GET  /health                  -> Service & model readiness probe
- GET  /api/cases               -> Curated cases from data/demo_cases.json + 2D PCA points
- POST /api/camouflage          -> Real-time candidate filtering (cos >= 0.78) + PCA coords
- POST /api/audit/stream        -> SSE stream (channel_A, channel_B tokens) + audit_result
- GET  /api/dossier/export      -> Download audit_dossier.json (leaves + Merkle root)
- POST /api/dossier/tamper-test -> Mutate 1 char in output_B/ttft_A and return TAMPERED proof
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from backend.camouflage import CamouflageEngine
from backend.ledger import MerkleLedger
from backend.metrics import MetricsEngine
from backend.proxy import DualChannelProxy
from backend.schemas import (
    AuditStreamRequest,
    CamouflageRequest,
    CamouflageResponse,
    CasesResponse,
    TamperTestResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Load CPU embedding/ONNX models once at startup and initialize services."""
    camouflage_engine = CamouflageEngine()
    metrics_engine = MetricsEngine()
    camouflage_engine.load()
    metrics_engine.load()

    app.state.camouflage = camouflage_engine
    app.state.metrics = metrics_engine
    app.state.proxy = DualChannelProxy()
    app.state.ledger = MerkleLedger()
    yield


app = FastAPI(
    title="AEGIS-AUDIT Forensic Backend",
    version="0.1.0",
    description="Zero-Trust Dual-Channel AI Evaluation & Situational Awareness Console",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.get("/api/cases", response_model=CasesResponse)
async def get_cases() -> CasesResponse:
    """Return curated demo cases and precomputed 2D PCA calibration points."""
    try:
        return app.state.camouflage.get_cases_payload()
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc


@app.post("/api/camouflage", response_model=CamouflageResponse)
async def camouflage_prompt(payload: CamouflageRequest) -> CamouflageResponse:
    """Evaluate camouflage candidates in CPU embedding space and project to 2D PCA."""
    try:
        return app.state.camouflage.select_camouflage(
            case_id=payload.case_id,
            prompt=payload.prompt,
        )
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc


@app.post("/api/audit/stream")
async def stream_audit(payload: AuditStreamRequest) -> StreamingResponse:
    """Execute concurrent Channel A/B audit and stream SSE tokens + final verdict."""

    async def event_generator() -> AsyncIterator[str]:
        # TODO: Stream channel_A / channel_B chunks from DualChannelProxy,
        #       score ρ_A, ρ_B, D_sem, CDI_risk, ΔTTFT via MetricsEngine,
        #       append MerkleLeafPayload via MerkleLedger, and emit `audit_result`.
        error_event = {
            "error": "Dual-channel SSE audit pipeline not implemented yet.",
            "case_id": payload.case_id,
            "engine_mode": payload.engine_mode,
        }
        yield f"event: not_implemented\ndata: {json.dumps(error_event)}\n\n"

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
    """Export RFC 8785 + RFC 6962 `audit_dossier.json` for offline verification."""
    try:
        dossier = app.state.ledger.export_dossier()
        return JSONResponse(
            content=dossier,
            headers={
                "Content-Disposition": 'attachment; filename="audit_dossier.json"'
            },
        )
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc


@app.post("/api/dossier/tamper-test", response_model=TamperTestResponse)
async def tamper_test() -> TamperTestResponse:
    """Simulate a 1-bit tamper on the exported dossier and verify Merkle Root mismatch."""
    try:
        return app.state.ledger.simulate_tamper()
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
