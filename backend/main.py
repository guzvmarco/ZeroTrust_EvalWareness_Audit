"""FastAPI Forensic Backend Orchestrator (Port 8000).

Frozen Routes:
- GET  /api/cases               -> Curated cases from data/demo_cases.json + 2D PCA c_eval/c_civil points
- POST /api/camouflage          -> Real-time candidate filtering (cos >= 0.78) + PCA before/after coords
- POST /api/audit/stream        -> SSE stream (channel_A, channel_B tokens) + final audit_result event
- GET  /api/dossier/export      -> Download audit_dossier.json (leaves + Merkle root)
- POST /api/dossier/tamper-test -> Mutate 1 char in output_B/ttft_A and return TAMPERED verification result

Startup requirement:
- Load sentence-transformers/all-MiniLM-L6-v2 and ONNX rejection classifier once at startup (CPU-only).
"""
