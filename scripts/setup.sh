#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements-lock.txt
.venv/bin/python scripts/migrate.py
cd frontend
npm ci --cache "${NPM_CONFIG_CACHE:-$PWD/.npm-cache}"
npm run build
