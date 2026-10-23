$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
& .\.venv\Scripts\python.exe scripts/migrate.py
if ($LASTEXITCODE -ne 0) { throw "Migration thất bại" }
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --workers 1
