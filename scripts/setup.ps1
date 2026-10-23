$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
python -m venv .venv
if ($LASTEXITCODE -ne 0) { throw "Không tạo được môi trường Python" }
& .\.venv\Scripts\python.exe -m pip install -r backend/requirements-lock.txt
if ($LASTEXITCODE -ne 0) { throw "Cài thư viện thất bại" }
& .\.venv\Scripts\python.exe scripts/migrate.py
if ($LASTEXITCODE -ne 0) { throw "Migration thất bại" }
Push-Location frontend
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "Cài frontend thất bại" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build thất bại" }
} finally { Pop-Location }
