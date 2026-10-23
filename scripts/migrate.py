"""Sao lưu SQLite trước khi nâng schema; không tự sửa dữ liệu lỗi."""

import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from alembic.script import ScriptDirectory  # noqa: E402
from app.db.session import DATA_DIR, DB_PATH  # noqa: E402

config = Config(str(ROOT / "backend" / "alembic.ini"))
head = ScriptDirectory.from_config(config).get_current_head()
if DB_PATH.exists():
    with sqlite3.connect(DB_PATH) as source:
        if source.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError(
                "Dữ liệu không toàn vẹn; dừng migration, cần kiểm tra thủ công."
            )
        has_version = source.execute(
            "SELECT name FROM sqlite_master WHERE name='alembic_version'"
        ).fetchone()
        version = (
            source.execute("SELECT version_num FROM alembic_version").fetchone()
            if has_version
            else None
        )
        if not version or version[0] != head:
            directory = DATA_DIR / "backups"
            directory.mkdir(exist_ok=True)
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
            with sqlite3.connect(
                directory / f"truoc-migration-{stamp}.sqlite3"
            ) as dest:
                source.backup(dest)
command.upgrade(config, "head")
