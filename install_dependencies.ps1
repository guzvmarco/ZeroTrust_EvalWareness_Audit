# Zero-Trust Forensic Console — Windows Dependency Installer
# Usage:
#   .\install_dependencies.ps1
#   .\install_dependencies.ps1 -PreloadModels   # Also pre-cache CPU HuggingFace models

param(
    [switch]$PreloadModels
)

$ErrorActionPreference = "Stop"

Write-Host "==> [1/4] Checking Python 3.11+ and Node.js..." -ForegroundColor Cyan
$pythonCmd = $null
foreach ($candidate in @("python", "py")) {
    try {
        $ver = & $candidate --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $ver -match "Python 3\.(\d+)") {
            if ([int]$Matches[1] -ge 11) {
                $pythonCmd = $candidate
                Write-Host "    Found $ver ($candidate)" -ForegroundColor Green
                break
            }
        }
    } catch {}
}

if (-not $pythonCmd) {
    Write-Error "Python 3.11+ not found in PATH. Install Python 3.11+ from python.org and re-run."
}

$nodeVer = & node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Node.js not found in PATH. Install Node.js 18+ and re-run."
}
Write-Host "    Found Node.js $nodeVer" -ForegroundColor Green

Write-Host "==> [2/4] Setting up Python virtual environment (.venv)..." -ForegroundColor Cyan
if (-not (Test-Path ".venv")) {
    & $pythonCmd -m venv .venv
}

$venvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $PSScriptRoot "backend\requirements.txt")

Write-Host "==> [3/4] Installing Frontend (React + Vite + Tailwind + Recharts) dependencies..." -ForegroundColor Cyan
Push-Location (Join-Path $PSScriptRoot "frontend")
try {
    npm install
} finally {
    Pop-Location
}

if ($PreloadModels) {
    Write-Host "==> [4/4] Pre-caching CPU models (all-MiniLM-L6-v2 & distilroberta-base-rejection-v1)..." -ForegroundColor Cyan
    & $venvPython -c @"
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification

print('Downloading sentence-transformers/all-MiniLM-L6-v2...')
SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')

print('Downloading protectai/distilroberta-base-rejection-v1...')
AutoTokenizer.from_pretrained('protectai/distilroberta-base-rejection-v1')
ORTModelForSequenceClassification.from_pretrained('protectai/distilroberta-base-rejection-v1')
print('All CPU models cached successfully.')
"@
} else {
    Write-Host "==> [4/4] Skipping model preload (pass -PreloadModels to cache HuggingFace models now)." -ForegroundColor Yellow
}

Write-Host "`nDone! Activate venv with: .\.venv\Scripts\Activate.ps1" -ForegroundColor Green
