from fastapi import HTTPException
from app.models.entities import Chunk, Question, QuestionVersion, Topic
from app.repositories.questions import current_questions


def validate_question(db, payload, exclude_id=None):
    if not db.get(Topic, payload.chu_de_id):
        raise HTTPException(404, "Không tìm thấy chủ đề.")
    normalized = " ".join(payload.noi_dung.casefold().split())
    if any(q.id != exclude_id and " ".join(v.noi_dung["noi_dung"].casefold().split()) == normalized for q, v in current_questions(db)):
        raise HTTPException(409, "Nội dung câu hỏi đã tồn tại.")
    if payload.doan_tai_lieu_id is not None:
        chunk = db.get(Chunk, payload.doan_tai_lieu_id)
        if not chunk or not payload.trich_dan or payload.trich_dan not in chunk.noi_dung:
            raise HTTPException(422, "Trích dẫn phải khớp nguyên văn đoạn nguồn đã lưu.")
    elif payload.trich_dan:
        raise HTTPException(422, "Hãy chọn đoạn tài liệu nguồn cho trích dẫn.")


def save_question(db, payload, question=None):
    validate_question(db, payload, question.id if question else None)
    if question is None:
        question = Question(chu_de_id=payload.chu_de_id, trang_thai="draft", phien_ban=1)
        db.add(question)
        db.flush()
    else:
        question.chu_de_id = payload.chu_de_id
        question.phien_ban += 1
        question.trang_thai = "draft"
    version = QuestionVersion(cau_hoi_id=question.id, so_phien_ban=question.phien_ban, noi_dung=payload.model_dump(), doan_tai_lieu_id=payload.doan_tai_lieu_id)
    db.add(version)
    db.commit()
    return question, version
