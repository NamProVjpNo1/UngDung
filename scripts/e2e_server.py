"""Máy chủ kiểm thử trình duyệt với dữ liệu tạm, không chạm dữ liệu người dùng."""

import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

with tempfile.TemporaryDirectory(prefix="vb2-ca4-e2e-") as directory:
    os.environ["APP_DATA_DIR"] = directory
    from alembic import command
    from alembic.config import Config
    import uvicorn

    command.upgrade(Config(str(ROOT / "backend" / "alembic.ini")), "head")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, workers=1)
