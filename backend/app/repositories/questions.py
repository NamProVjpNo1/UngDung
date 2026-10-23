from sqlalchemy import select
from app.models.entities import Question, QuestionVersion


def current_questions(db, approved_only=False):
    query = select(Question, QuestionVersion).join(QuestionVersion, (QuestionVersion.cau_hoi_id == Question.id) & (QuestionVersion.so_phien_ban == Question.phien_ban))
    if approved_only:
        query = query.where(Question.trang_thai == "approved")
    return db.execute(query.order_by(Question.id)).all()


def serialize_question(q, v):
    return {"id": q.id, "chu_de_id": q.chu_de_id, "trang_thai": q.trang_thai, "phien_ban": q.phien_ban, **v.noi_dung}
