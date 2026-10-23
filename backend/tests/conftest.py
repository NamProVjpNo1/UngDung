import os
import tempfile
from pathlib import Path

# Always isolate tests from real user data, including when APP_DATA_DIR is set.
os.environ["APP_DATA_DIR"] = tempfile.mkdtemp(prefix="vb2-ca4-tests-")

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from app.db.session import DB_PATH, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def migrated_database():
    engine.dispose()
    DB_PATH.unlink(missing_ok=True)
    command.upgrade(Config(str(Path(__file__).resolve().parents[1] / "alembic.ini")), "head")
    yield
    engine.dispose()


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client


@pytest.fixture
def topic(client):
    return client.post("/api/v1/topics", json={"ten": "Kiến thức mẫu thử nghiệm"}).json()["id"]


def question_payload(topic, text="Câu hỏi thử nghiệm số một?", **kwargs):
    return {"chu_de_id": topic, "noi_dung": text, "lua_chon": ["Lựa chọn đúng", "Lựa chọn sai"], "dap_an_dung": [0], "loai": "single", "do_kho": "medium", "giai_thich": "Nội dung dùng cho kiểm thử.", **kwargs}


def add_approved(client, topic, text="Câu hỏi thử nghiệm số một?", **kwargs):
    response = client.post("/api/v1/questions", json=question_payload(topic, text, **kwargs))
    assert response.status_code == 201, response.text
    question = response.json()
    assert client.post(f"/api/v1/questions/{question['id']}/review", json={"trang_thai": "approved"}).status_code == 200
    return question


def add_blueprint(client, topic, count=1, slots=None):
    response = client.post("/api/v1/blueprints", json={"ten": "Đề luyện thử, không chính thức", "thoi_gian_phut": 1, "phan_bo": slots or [{"chu_de_id": topic, "so_luong": count}]})
    assert response.status_code == 201, response.text
    return response.json()["id"]


def generate(client, blueprint, seed=42):
    return client.post("/api/v1/exams/generate", json={"mau_de_thi_id": blueprint, "hat_giong": seed, "cua_so_gan_day": 0})


def start(client, exam):
    response = client.post("/api/v1/attempts", json={"de_thi_id": exam["id"]})
    assert response.status_code == 201, response.text
    return response.json()["id"]
