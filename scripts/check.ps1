$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot\..")
python -B -c "import backend.app.main as m; print(m.app.title)"
Set-Location (Resolve-Path "$PSScriptRoot\..\frontend")
npm.cmd run build
