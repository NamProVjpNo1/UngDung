import io
import json
import shutil
import sqlite3
import tempfile
import uuid
import zipfile
from pathlib import Path
from fastapi import HTTPException
from app.db.session import DATA_DIR, DB_PATH, engine


def check_database(path):
    with sqlite3.connect(path) as db:
        if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok" or db.execute("PRAGMA foreign_key_check").fetchall():
            raise ValueError("Cơ sở dữ liệu không toàn vẹn.")
        version = db.execute("SELECT version_num FROM alembic_version").fetchone()
        if not version or version[0] != "0001":
            raise ValueError("Phiên bản dữ liệu không tương thích.")
        for table in ("cau_hoi", "phien_ban_cau_hoi", "chu_de", "de_thi", "lan_lam_bai", "tai_lieu", "doan_tai_lieu", "mau_de_thi", "lich_on_tap"):
            db.execute(f"SELECT * FROM {table} LIMIT 0")
        for (relative,) in db.execute("SELECT duong_dan FROM tai_lieu"):
            p = Path(relative)
            if p.is_absolute() or ".." in p.parts or len(p.parts) != 2 or p.parts[0] != "documents":
                raise ValueError("Đường dẫn tài liệu không hợp lệ.")


def create_backup():
    backup_dir = DATA_DIR / "backups"
    backup_dir.mkdir(exist_ok=True)
    target = backup_dir / f"{uuid.uuid4().hex}.zip"
    with tempfile.TemporaryDirectory() as temp:
        snapshot = Path(temp) / "study.sqlite3"
        with sqlite3.connect(DB_PATH) as source, sqlite3.connect(snapshot) as dest:
            source.backup(dest)
        check_database(snapshot)
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.write(snapshot, "study.sqlite3")
            with sqlite3.connect(snapshot) as db:
                for (relative,) in db.execute("SELECT duong_dan FROM tai_lieu"):
                    archive.write(DATA_DIR / relative, relative)
    return target


def restore_backup(content):
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(413, "Bản sao lưu vượt 100 MB.")
    with tempfile.TemporaryDirectory(dir=DATA_DIR) as temp:
        temp_path = Path(temp)
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                infos = archive.infolist()
                names = [i.filename for i in infos]
                if len(set(names)) != len(names) or sum(i.file_size for i in infos) > 250 * 1024 * 1024:
                    raise ValueError("Bản sao lưu quá lớn hoặc trùng đường dẫn.")
                for info in infos:
                    p = Path(info.filename)
                    if p.is_absolute() or ".." in p.parts or not (info.filename == "study.sqlite3" or (len(p.parts) == 2 and p.parts[0] == "documents")):
                        raise ValueError("Bản sao lưu chứa đường dẫn không hợp lệ.")
                    archive.extract(info, temp_path)
            check_database(temp_path / "study.sqlite3")
            with sqlite3.connect(temp_path / "study.sqlite3") as db:
                for (relative,) in db.execute("SELECT duong_dan FROM tai_lieu"):
                    if not (temp_path / relative).is_file():
                        raise ValueError("Thiếu tài liệu gốc trong bản sao lưu.")
                # Parse stored JSON now, before changing the active database.
                for table, column in (("phien_ban_cau_hoi", "noi_dung"), ("de_thi", "noi_dung"), ("mau_de_thi", "phan_bo")):
                    for (value,) in db.execute(f"SELECT {column} FROM {table}"):
                        json.loads(value)
        except (zipfile.BadZipFile, sqlite3.Error, ValueError, OSError, KeyError) as exc:
            raise HTTPException(422, "Bản sao lưu không hợp lệ hoặc không tương thích.") from exc
        previous = create_backup()
        engine.dispose()
        # Originals remain in the automatic pre-restore backup. Keep extra documents locally.
        for path in (temp_path / "documents").glob("*"):
            (DATA_DIR / "documents").mkdir(exist_ok=True)
            shutil.copy2(path, DATA_DIR / "documents" / path.name)
        (temp_path / "study.sqlite3").replace(DB_PATH)
    return {"thong_bao": "Đã khôi phục dữ liệu.", "sao_luu_truoc_khoi_phuc": previous.name}
