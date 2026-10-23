import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATA_DIR = Path(os.environ.get("APP_DATA_DIR", Path(__file__).resolve().parents[3] / "data")).resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "study.sqlite3"
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False, "timeout": 20})


@event.listens_for(engine, "connect")
def configure_sqlite(connection, _):
    connection.execute("PRAGMA foreign_keys=ON")
    connection.execute("PRAGMA busy_timeout=20000")


class Base(DeclarativeBase):
    pass


SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_db():
    with SessionLocal() as session:
        yield session
