$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot\..")
python -m uvicorn backend.app.main:app --reload --port 8765
