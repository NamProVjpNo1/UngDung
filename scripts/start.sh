#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/python scripts/migrate.py
exec .venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --workers 1
