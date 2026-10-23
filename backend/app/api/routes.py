import threading
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.db.session import DATA_DIR, get_db
from app.models.entities import Attempt, Blueprint, Chunk, Document, Exam, Question, Review, Topic
from app.repositories.questions import current_questions, serialize_question
from app.schemas.inputs import AnswerInput, AttemptInput, BlueprintInput, GenerateInput, QuestionInput, ReviewInput, TopicInput
from app.services.backups import create_backup, restore_backup
from app.services.documents import MAX_UPLOAD, import_document
from app.services.exams import attempt_view, create_attempt, expired, generate_exam, now, public_exam, submit_attempt
from app.services.questions import save_question

router = APIRouter(prefix="/api/v1")
# The supported runtime uses one worker. Serialize mutations, including restore and submission.
mutation_lock = threading.RLock()


def get_item(db, model, item_id):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(404, "Không tìm thấy dữ liệu.")
    return item


def require_no_active_attempt(db):
    with mutation_lock:
        for attempt in db.scalars(select(Attempt).where(Attempt.da_nop.is_(False))).all():
            if expired(attempt):
                submit_attempt(db, attempt)
            else:
                raise HTTPException(409, "Đang có bài chưa nộp. Hãy tiếp tục hoặc nộp bài từ Lịch sử trước khi xem đáp án.")


@router.get("/system/health")
def health(db: Session = Depends(get_db)):
    from sqlalchemy import text

    return {
        "trang_thai": "ok",
        "co_so_du_lieu": "SQLite",
        "khoa_ngoai": bool(db.execute(text("PRAGMA foreign_keys")).scalar()),
        "phien_ban": db.execute(text("SELECT version_num FROM alembic_version")).scalar(),
        "ai": "disabled",
        "che_do": "localhost, một người dùng",
    }


@router.get("/topics")
def topics(db: Session = Depends(get_db)):
    return db.scalars(select(Topic).order_by(Topic.ten)).all()


@router.post("/topics", status_code=201)
def add_topic(payload: TopicInput, db: Session = Depends(get_db)):
    with mutation_lock:
        if payload.chu_de_id is not None:
            get_item(db, Topic, payload.chu_de_id)
        if db.scalar(select(Topic).where(Topic.ten == payload.ten)):
            raise HTTPException(409, "Chủ đề đã tồn tại.")
        topic = Topic(**payload.model_dump())
        db.add(topic)
        db.commit()
        return topic


@router.get("/questions")
def questions(db: Session = Depends(get_db)):
    require_no_active_attempt(db)
    return [serialize_question(q, v) for q, v in current_questions(db)]


@router.post("/questions", status_code=201)
def add_question(payload: QuestionInput, db: Session = Depends(get_db)):
    with mutation_lock:
        require_no_active_attempt(db)
        return serialize_question(*save_question(db, payload))


@router.patch("/questions/{question_id}")
def edit_question(question_id: int, payload: QuestionInput, db: Session = Depends(get_db)):
    with mutation_lock:
        require_no_active_attempt(db)
        return serialize_question(*save_question(db, payload, get_item(db, Question, question_id)))


@router.post("/questions/{question_id}/review")
def review_question(question_id: int, payload: ReviewInput, db: Session = Depends(get_db)):
    with mutation_lock:
        question = get_item(db, Question, question_id)
        question.trang_thai = payload.trang_thai
        db.commit()
        return {"id": question.id, "trang_thai": question.trang_thai}


@router.delete("/questions/{question_id}")
def retire_question(question_id: int, db: Session = Depends(get_db)):
    return review_question(question_id, ReviewInput(trang_thai="retired"), db)


@router.get("/blueprints")
def blueprints(db: Session = Depends(get_db)):
    return db.scalars(select(Blueprint).order_by(Blueprint.id.desc())).all()


@router.post("/blueprints", status_code=201)
def add_blueprint(payload: BlueprintInput, db: Session = Depends(get_db)):
    with mutation_lock:
        for slot in payload.phan_bo:
            get_item(db, Topic, slot.chu_de_id)
        blueprint = Blueprint(**payload.model_dump())
        db.add(blueprint)
        db.commit()
        return blueprint


@router.post("/exams/generate", status_code=201)
def generate(payload: GenerateInput, db: Session = Depends(get_db)):
    with mutation_lock:
        return public_exam(generate_exam(db, payload))


@router.get("/exams/{exam_id}")
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    return public_exam(get_item(db, Exam, exam_id))


@router.post("/attempts", status_code=201)
def start_attempt(payload: AttemptInput, db: Session = Depends(get_db)):
    with mutation_lock:
        attempt = create_attempt(db, get_item(db, Exam, payload.de_thi_id))
        if expired(attempt):
            submit_attempt(db, attempt)
        return attempt_view(attempt)


@router.get("/attempts")
def attempts(db: Session = Depends(get_db)):
    return [
        {"id": a.id, "de_thi_id": a.de_thi_id, "da_nop": a.da_nop, "ten": db.get(Exam, a.de_thi_id).noi_dung["ten"], "bat_dau": a.bat_dau, "diem": a.ket_qua["diem"] if a.ket_qua else None}
        for a in db.scalars(select(Attempt).order_by(Attempt.id.desc())).all()
    ]


@router.get("/attempts/{attempt_id}")
def get_attempt(attempt_id: int, db: Session = Depends(get_db)):
    with mutation_lock:
        attempt = get_item(db, Attempt, attempt_id)
        if not attempt.da_nop and expired(attempt):
            submit_attempt(db, attempt)
        return attempt_view(attempt)


@router.put("/attempts/{attempt_id}/answers/{position}")
def save_answer(attempt_id: int, position: int, payload: AnswerInput, db: Session = Depends(get_db)):
    with mutation_lock:
        attempt = get_item(db, Attempt, attempt_id)
        if attempt.da_nop:
            raise HTTPException(409, "Bài đã nộp, không thể đổi đáp án.")
        if expired(attempt):
            submit_attempt(db, attempt)
            raise HTTPException(409, "Đã hết giờ; bài được chấm với đáp án đã lưu.")
        exam = db.get(Exam, attempt.de_thi_id)
        questions = exam.noi_dung["cau_hoi"]
        if position < 0 or position >= len(questions):
            raise HTTPException(422, "Vị trí câu hỏi không hợp lệ.")
        q = questions[position]
        values = payload.lua_chon
        if len(set(values)) != len(values) or any(v < 0 or v >= len(q["lua_chon"]) for v in values) or (q["loai"] != "multiple" and len(values) > 1):
            raise HTTPException(422, "Lựa chọn không hợp lệ.")
        attempt.dap_an = {**attempt.dap_an, str(position): values}
        db.commit()
        return {"da_luu": True, "vi_tri": position, "lua_chon": values}


@router.post("/attempts/{attempt_id}/submit")
def submit(attempt_id: int, db: Session = Depends(get_db)):
    with mutation_lock:
        attempt = get_item(db, Attempt, attempt_id)
        if attempt.da_nop:
            require_no_active_attempt(db)
        return submit_attempt(db, attempt)


@router.get("/attempts/{attempt_id}/result")
def result(attempt_id: int, db: Session = Depends(get_db)):
    with mutation_lock:
        attempt = get_item(db, Attempt, attempt_id)
        if not attempt.da_nop and expired(attempt):
            submit_attempt(db, attempt)
        if not attempt.da_nop:
            raise HTTPException(409, "Kết quả chỉ hiển thị sau khi nộp bài.")
        require_no_active_attempt(db)
        return attempt.ket_qua


@router.get("/analytics/overview")
def overview(db: Session = Depends(get_db)):
    results = [a.ket_qua for a in db.scalars(select(Attempt).where(Attempt.da_nop.is_(True)).order_by(Attempt.id)).all()]
    return {
        "cau_hoi": db.scalar(select(func.count()).select_from(Question)),
        "da_duyet": db.scalar(select(func.count()).select_from(Question).where(Question.trang_thai == "approved")),
        "tai_lieu": db.scalar(select(func.count()).select_from(Document)),
        "bai_da_lam": len(results),
        "diem_trung_binh": round(sum(r["diem"] for r in results) / len(results), 2) if results else 0,
        "xu_huong": [{"lan_lam_bai_id": r["lan_lam_bai_id"], "diem": r["diem"], "ngay": r["nop_luc"]} for r in results[-12:]],
    }


@router.get("/analytics/topics")
def topic_analytics(db: Session = Depends(get_db)):
    stats = {t.id: {"id": t.id, "ten": t.ten, "so_dung": 0, "tong_cau": 0} for t in db.scalars(select(Topic)).all()}
    for attempt in db.scalars(select(Attempt).where(Attempt.da_nop.is_(True))).all():
        for q in attempt.ket_qua["chi_tiet"]:
            stat = stats[q["chu_de_id"]]
            stat["tong_cau"] += 1
            stat["so_dung"] += int(q["dung"])
    return list(stats.values())


@router.get("/reviews/due")
def due_reviews(db: Session = Depends(get_db)):
    require_no_active_attempt(db)
    due_ids = set(db.scalars(select(Review.cau_hoi_id).where(Review.ngay_den_han <= now().isoformat())).all())
    return [serialize_question(q, v) for q, v in current_questions(db, approved_only=True) if q.id in due_ids]


@router.get("/documents")
def documents(db: Session = Depends(get_db)):
    return [{"id": d.id, "ten": d.ten, "ngay_tao": d.ngay_tao, "so_doan": db.scalar(select(func.count()).select_from(Chunk).where(Chunk.tai_lieu_id == d.id))} for d in db.scalars(select(Document).order_by(Document.id.desc())).all()]


@router.post("/documents", status_code=201)
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    with mutation_lock:
        doc = import_document(db, file.filename or "", file.file.read(MAX_UPLOAD + 1))
        return {"id": doc.id, "ten": doc.ten}


@router.get("/documents/{document_id}/chunks")
def document_chunks(document_id: int, db: Session = Depends(get_db)):
    get_item(db, Document, document_id)
    return db.scalars(select(Chunk).where(Chunk.tai_lieu_id == document_id).order_by(Chunk.id)).all()


@router.post("/documents/{document_id}/parse")
def parse_document(document_id: int, db: Session = Depends(get_db)):
    # Import already extracts once. Never replace provenance IDs referenced by questions.
    return document_chunks(document_id, db)


@router.post("/backup")
def backup(db: Session = Depends(get_db)):
    with mutation_lock:
        require_no_active_attempt(db)
        path = create_backup()
        return {"ten_tep": path.name, "tai_xuong": f"/api/v1/backup/{path.stem}"}


@router.get("/backup/{backup_id}")
def download_backup(backup_id: str, db: Session = Depends(get_db)):
    require_no_active_attempt(db)
    if len(backup_id) != 32 or any(c not in "0123456789abcdef" for c in backup_id):
        raise HTTPException(404, "Không tìm thấy bản sao lưu.")
    path = DATA_DIR / "backups" / f"{backup_id}.zip"
    if not path.is_file():
        raise HTTPException(404, "Không tìm thấy bản sao lưu.")
    return FileResponse(path, filename=f"vb2-ca4-{backup_id}.zip", media_type="application/zip")


@router.post("/backup/restore")
def restore(file: UploadFile = File(...), xac_nhan: bool = Query(False)):
    if not xac_nhan:
        raise HTTPException(400, "Cần xác nhận thay thế dữ liệu; hệ thống tự sao lưu trước khi khôi phục.")
    with mutation_lock:
        return restore_backup(file.file.read(100 * 1024 * 1024 + 1))


@router.post("/ai/jobs")
def ai_job():
    raise HTTPException(501, "AI chưa được cấu hình. Không có tài liệu nào được gửi ra ngoài. Hãy soạn câu hỏi thủ công.")
