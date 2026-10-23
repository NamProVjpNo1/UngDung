import io
import json
import sqlite3
import zipfile
from datetime import timedelta

import pymupdf
import pytest
from docx import Document
from sqlalchemy import inspect, text
from app.db.session import DB_PATH, SessionLocal, engine
from app.models.entities import Attempt, Review
from app.services.exams import now
from conftest import add_approved, add_blueprint, generate, question_payload, start


def test_migration_foreign_keys_and_vietnamese_schema(client):
    assert client.get("/api/v1/system/health").json()["khoa_ngoai"] is True
    assert client.get("/api/v1/system/health").json()["phien_ban"] == "0001"
    inspector = inspect(engine)
    for table in inspector.get_table_names():
        if table == "alembic_version":
            continue
        assert table.isascii() and table.lower() == table
        assert all(c["name"].isascii() and c["name"].lower() == c["name"] for c in inspector.get_columns(table))
    with engine.connect() as connection, pytest.raises(Exception):
        connection.execute(text("INSERT INTO cau_hoi(chu_de_id,trang_thai,phien_ban) VALUES (999,'draft',1)"))


def test_question_crud_versions_duplicates_and_retirement(client, topic):
    payload = question_payload(topic)
    q = client.post("/api/v1/questions", json=payload).json()
    assert q["trang_thai"] == "draft"
    assert client.post("/api/v1/questions", json={**payload, "noi_dung": "  Câu hỏi thử nghiệm số một?  "}).status_code == 409
    client.post(f"/api/v1/questions/{q['id']}/review", json={"trang_thai": "approved"})
    changed = client.patch(f"/api/v1/questions/{q['id']}", json={**payload, "noi_dung": "Nội dung thay đổi mới?"}).json()
    assert changed["phien_ban"] == 2 and changed["trang_thai"] == "draft"
    assert client.delete(f"/api/v1/questions/{q['id']}").json()["trang_thai"] == "retired"
    with engine.connect() as db:
        assert db.execute(text("SELECT count(*) FROM phien_ban_cau_hoi")).scalar() == 2


@pytest.mark.parametrize("changes", [{"dap_an_dung": [9]}, {"dap_an_dung": []}, {"dap_an_dung": [0, 0]}, {"dap_an_dung": [0, 1]}, {"lua_chon": ["A", "A"]}, {"lua_chon": [" ", "B"]}, {"loai": "true_false", "lua_chon": ["A", "B", "C"]}])
def test_answer_key_validation(client, topic, changes):
    assert client.post("/api/v1/questions", json=question_payload(topic, **changes)).status_code == 422


def test_approved_only_and_structured_shortage_no_partial_exam(client, topic):
    client.post("/api/v1/questions", json=question_payload(topic))
    blueprint = add_blueprint(client, topic, 2)
    response = generate(client, blueprint)
    assert response.status_code == 409
    assert response.json()["detail"]["thieu"][0]["co"] == 0
    with engine.connect() as db:
        assert db.execute(text("SELECT count(*) FROM de_thi")).scalar() == 0


def test_exact_overlapping_assignment_reproducible_no_duplicates(client, topic):
    for i, difficulty in enumerate(["easy", "medium", "hard", "hard"]):
        add_approved(client, topic, f"Câu hỏi phân bổ số {i}?", do_kho=difficulty)
    blueprint = add_blueprint(client, topic, slots=[{"chu_de_id": topic, "so_luong": 2}, {"chu_de_id": topic, "so_luong": 2, "do_kho": "hard"}])
    first = generate(client, blueprint).json()
    second = generate(client, blueprint).json()
    assert len(first["cau_hoi"]) == 4
    assert len({q["cau_hoi_id"] for q in first["cau_hoi"]}) == 4
    assert all(q["do_kho"] == "hard" for q in first["cau_hoi"][2:])
    assert first["cau_hoi"] == second["cau_hoi"]
    assert "dap_an_dung" not in json.dumps(first)
    assert "giai_thich" not in json.dumps(first)


def test_overlapping_shortage(client, topic):
    add_approved(client, topic)
    blueprint = add_blueprint(client, topic, slots=[{"chu_de_id": topic, "so_luong": 1}, {"chu_de_id": topic, "so_luong": 1, "do_kho": "medium"}])
    assert generate(client, blueprint).status_code == 409


def test_soft_recent_preference(client, topic):
    for i in range(4):
        add_approved(client, topic, f"Câu hỏi tránh trùng số {i}?")
    blueprint = add_blueprint(client, topic, 2)
    first = generate(client, blueprint).json()
    second = client.post("/api/v1/exams/generate", json={"mau_de_thi_id": blueprint, "hat_giong": 42, "cua_so_gan_day": 3}).json()
    assert not ({q["cau_hoi_id"] for q in first["cau_hoi"]} & {q["cau_hoi_id"] for q in second["cau_hoi"]})


def test_autosave_resume_grading_idempotent_and_historical_integrity(client, topic):
    q = add_approved(client, topic)
    blueprint = add_blueprint(client, topic)
    exam = generate(client, blueprint).json()
    # Editing after generation must not affect the snapshot's content or scoring.
    changed = question_payload(topic, "Câu hỏi đã đổi đáp án?", dap_an_dung=[1])
    client.patch(f"/api/v1/questions/{q['id']}", json=changed)
    attempt_id = start(client, exam)
    assert client.get(f"/api/v1/attempts/{attempt_id}/result").status_code == 409
    assert client.put(f"/api/v1/attempts/{attempt_id}/answers/0", json={"lua_chon": [0]}).status_code == 200
    resumed = client.post("/api/v1/attempts", json={"de_thi_id": exam["id"]}).json()
    assert resumed["id"] == attempt_id and resumed["dap_an"] == {"0": [0]}
    assert "dap_an_dung" not in json.dumps(resumed)
    result = client.post(f"/api/v1/attempts/{attempt_id}/submit").json()
    assert result["diem"] == 10 and result["chi_tiet"][0]["noi_dung"] == q["noi_dung"]
    assert client.post(f"/api/v1/attempts/{attempt_id}/submit").json() == result
    assert client.put(f"/api/v1/attempts/{attempt_id}/answers/0", json={"lua_chon": [1]}).status_code == 409
    assert client.get("/api/v1/analytics/overview").json()["bai_da_lam"] == 1
    assert client.get("/api/v1/analytics/topics").json()[0]["so_dung"] == 1
    with SessionLocal() as db:
        review = db.query(Review).one()
        assert review.so_lan_dung == 1
        assert now() + timedelta(days=2) < __import__("datetime").datetime.fromisoformat(review.ngay_den_han) < now() + timedelta(days=4)


def test_deadline_and_invalid_answers(client, topic):
    add_approved(client, topic)
    exam = generate(client, add_blueprint(client, topic)).json()
    attempt_id = start(client, exam)
    for position, values in [(0, [99]), (-1, [0]), (1, [0]), (0, [0, 1]), (0, [0, 0])]:
        assert client.put(f"/api/v1/attempts/{attempt_id}/answers/{position}", json={"lua_chon": values}).status_code == 422
    with SessionLocal() as db:
        attempt = db.get(Attempt, attempt_id)
        attempt.han_nop = (now() - timedelta(seconds=1)).isoformat()
        db.commit()
    assert client.put(f"/api/v1/attempts/{attempt_id}/answers/0", json={"lua_chon": [0]}).status_code == 409
    result = client.get(f"/api/v1/attempts/{attempt_id}/result").json()
    assert result["diem"] == 0
    with SessionLocal() as db:
        review = db.query(Review).one()
        assert review.so_lan_dung == 0
        review.ngay_den_han = (now() - timedelta(seconds=1)).isoformat()
        db.commit()
    assert len(client.get("/api/v1/reviews/due").json()) == 1


def test_multiple_choice_requires_exact_set(client, topic):
    add_approved(client, topic, loai="multiple", lua_chon=["A", "B", "C"], dap_an_dung=[0, 2])
    blueprint = add_blueprint(client, topic)
    for values, score in [([0], 0), ([2, 0], 10), ([], 0)]:
        attempt_id = start(client, generate(client, blueprint).json())
        client.put(f"/api/v1/attempts/{attempt_id}/answers/0", json={"lua_chon": values})
        assert client.post(f"/api/v1/attempts/{attempt_id}/submit").json()["diem"] == score


def docx_content():
    doc = Document()
    doc.add_paragraph("Đoạn văn bản mẫu có nguồn để kiểm tra trích dẫn.")
    output = io.BytesIO()
    doc.save(output)
    return output.getvalue()


def test_document_import_citations_dedup_pdf_docx(client, topic):
    content = docx_content()
    response = client.post("/api/v1/documents", files={"file": ("../../nguon.docx", content)})
    assert response.status_code == 201, response.text
    doc_id = response.json()["id"]
    chunks = client.get(f"/api/v1/documents/{doc_id}/chunks").json()
    assert chunks[0]["trang"] == 1
    assert client.post("/api/v1/documents", files={"file": ("other.docx", content)}).status_code == 409
    assert client.post("/api/v1/questions", json=question_payload(topic, doan_tai_lieu_id=chunks[0]["id"], trich_dan="Tham chiếu bịa")).status_code == 422
    assert client.post("/api/v1/questions", json=question_payload(topic, doan_tai_lieu_id=chunks[0]["id"], trich_dan="Đoạn văn bản mẫu")).status_code == 201
    with pymupdf.open() as pdf:
        page = pdf.new_page()
        page.insert_text((50, 50), "Sanitized sample PDF text")
        assert client.post("/api/v1/documents", files={"file": ("sample.pdf", pdf.tobytes())}).status_code == 201
    assert client.post("/api/v1/documents", files={"file": ("bad.pdf", b"invalid")}).status_code == 422
    assert client.post("/api/v1/documents", files={"file": ("bad.exe", b"invalid")}).status_code == 415


def test_backup_restore_including_documents_and_safety(client, topic):
    q = add_approved(client, topic)
    client.post("/api/v1/documents", files={"file": ("sample.docx", docx_content())})
    backup = client.post("/api/v1/backup").json()
    archive = client.get(backup["tai_xuong"]).content
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        assert "study.sqlite3" in z.namelist()
        assert any(n.startswith("documents/") for n in z.namelist())
    client.post("/api/v1/topics", json={"ten": "Chủ đề sau sao lưu"})
    assert client.post("/api/v1/backup/restore", files={"file": ("backup.zip", archive)}).status_code == 400
    restored = client.post("/api/v1/backup/restore?xac_nhan=true", files={"file": ("backup.zip", archive)})
    assert restored.status_code == 200, restored.text
    assert len(client.get("/api/v1/topics").json()) == 1
    assert client.get("/api/v1/questions").json()[0]["id"] == q["id"]
    assert len(client.get("/api/v1/documents/1/chunks").json()) == 1
    assert client.get("/api/v1/system/health").json()["khoa_ngoai"]
    with sqlite3.connect(DB_PATH) as db:
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    bad = io.BytesIO()
    with zipfile.ZipFile(bad, "w") as z:
        z.writestr("../escape", "no")
    assert client.post("/api/v1/backup/restore?xac_nhan=true", files={"file": ("bad.zip", bad.getvalue())}).status_code == 422
    assert len(client.get("/api/v1/questions").json()) == 1
    assert client.post("/api/v1/backup/restore?xac_nhan=true", files={"file": ("bad.zip", b"not zip")}).status_code == 422


def test_privacy_guards_and_no_external_ai(client):
    assert client.post("/api/v1/topics", json={"ten": "X"}, headers={"origin": "https://attacker.example"}).status_code == 403
    assert client.get("/api/v1/system/health", headers={"host": "attacker.example"}).status_code == 403
    assert client.post("/api/v1/ai/jobs").status_code == 501


def test_answer_keys_blocked_through_bank_during_active_attempt(client, topic):
    add_approved(client, topic)
    blueprint = add_blueprint(client, topic)
    first = generate(client, blueprint).json()
    second = generate(client, blueprint).json()
    attempt_id = start(client, first)
    assert client.get("/api/v1/questions").status_code == 409
    assert client.post("/api/v1/backup").status_code == 409
    assert client.get("/api/v1/reviews/due").status_code == 409
    assert client.post("/api/v1/questions", json=question_payload(topic, "Không trả đáp án khi đang thi?")).status_code == 409
    assert client.post("/api/v1/attempts", json={"de_thi_id": second["id"]}).status_code == 409
    assert "dap_an_dung" not in json.dumps(client.get(f"/api/v1/exams/{first['id']}").json())
    client.post(f"/api/v1/attempts/{attempt_id}/submit")
    assert client.get("/api/v1/questions").status_code == 200
    next_attempt = start(client, second)
    assert client.get(f"/api/v1/attempts/{attempt_id}/result").status_code == 409
    assert client.post(f"/api/v1/attempts/{attempt_id}/submit").status_code == 409
    client.post(f"/api/v1/attempts/{next_attempt}/submit")
    assert client.get(f"/api/v1/attempts/{attempt_id}/result").status_code == 200
