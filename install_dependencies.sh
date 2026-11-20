#!/usr/bin/env bash
# Zero-Trust Forensic Console — Linux/macOS Dependency Installer
# Usage:
#   ./install_dependencies.sh
#   ./install_dependencies.sh --preload-models

set -euo pipefail

PRELOAD_MODELS=false
if [[ "${1:-}" == "--preload-models" ]]; then
  PRELOAD_MODELS=true
fi

echo "==> [1/4] Checking Python 3.11+ and Node.js..."
PYTHON_BIN="${PYTHON_BIN:-python3}"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Error: python3 not found. Install Python 3.11+ first." >&2
  exit 1
fi

"$PYTHON_BIN" -c 'import sys; assert sys.version_info >= (3, 11), f"Python 3.11+ required, got {sys.version}"'
node --version >/dev/null 2>&1 || { echo "Error: Node.js not found." >&2; exit 1; }

echo "==> [2/4] Setting up Python virtual environment (.venv)..."
if [[ ! -d ".venv" ]]; then
  "$PYTHON_BIN" -m venv .venv
fi

.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r backend/requirements.txt

echo "==> [3/4] Installing Frontend dependencies..."
(cd frontend && npm install)

if [[ "$PRELOAD_MODELS" == "true" ]]; then
  echo "==> [4/4] Pre-caching CPU models..."
  .venv/bin/python - <<'EOF'
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification

print("Downloading sentence-transformers/all-MiniLM-L6-v2...")
SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device="cpu")

print("Downloading protectai/distilroberta-base-rejection-v1...")
AutoTokenizer.from_pretrained("protectai/distilroberta-base-rejection-v1")
ORTModelForSequenceClassification.from_pretrained("protectai/distilroberta-base-rejection-v1")
print("All CPU models cached successfully.")
EOF
else
  echo "==> [4/4] Skipping model preload (pass --preload-models to cache HuggingFace models now)."
fi

echo "Done! Activate venv with: source .venv/bin/activate"
