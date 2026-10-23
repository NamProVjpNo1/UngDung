import random
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy import select
from app.models.entities import Attempt, Blueprint, Exam, Review
from app.repositories.questions import current_questions


def now():
    return datetime.now(timezone.utc)


def generate_exam(db, payload):
    blueprint = db.get(Blueprint, payload.mau_de_thi_id)
    if not blueprint:
        raise HTTPException(404, "Không tìm thấy mẫu đề.")
    pool = current_questions(db, approved_only=True)
    recent = db.scalars(select(Exam).order_by(Exam.id.desc()).limit(payload.cua_so_gan_day)).all() if payload.cua_so_gan_day else []
    used = {q["cau_hoi_id"] for exam in recent for q in exam.noi_dung["cau_hoi"]}
    rng = random.Random(payload.hat_giong)
    ranked = list(pool)
    rng.shuffle(ranked)
    ranked.sort(key=lambda pair: pair[0].id in used)
    slots = []
    shortages = []
    for i, slot in enumerate(blueprint.phan_bo):
        candidates = [q.id for q, v in ranked if q.chu_de_id == slot["chu_de_id"] and (not slot["loai"] or v.noi_dung["loai"] == slot["loai"]) and (not slot["do_kho"] or v.noi_dung["do_kho"] == slot["do_kho"])]
        if len(candidates) < slot["so_luong"]:
            shortages.append({"phan_bo": i + 1, "can": slot["so_luong"], "co": len(candidates), "chu_de_id": slot["chu_de_id"]})
        slots.extend([candidates[:] for _ in range(slot["so_luong"])])
    if shortages:
        raise HTTPException(409, {"thong_bao": "Chưa đủ câu hỏi đã duyệt. Không thay đổi tỷ lệ mẫu đề.", "thieu": shortages})
    # Augmenting-path matching handles overlapping slots without greedy allocation errors.
    owners = {}
    assigned = {}

    def match(slot_index, visited):
        for question_id in slots[slot_index]:
            if question_id in visited:
                continue
            visited.add(question_id)
            if question_id not in owners or match(owners[question_id], visited):
                owners[question_id] = slot_index
                assigned[slot_index] = question_id
                return True
        return False

    for i in sorted(range(len(slots)), key=lambda n: len(slots[n])):
        if not match(i, set()):
            raise HTTPException(409, {"thong_bao": "Các phân bổ chồng lấn không đủ câu riêng biệt.", "thieu": [{"phan_bo": i + 1, "can": len(slots), "co": len(owners)}]})
    lookup = {q.id: (q, v) for q, v in pool}
    snapshots = []
    for i in range(len(slots)):
        q, v = lookup[assigned[i]]
        snapshots.append({"cau_hoi_id": q.id, "phien_ban_cau_hoi_id": v.id, **v.noi_dung})
    exam = Exam(
        mau_de_thi_id=blueprint.id,
        hat_giong=payload.hat_giong,
        ngay_tao=now().isoformat(),
        noi_dung={"ten": blueprint.ten, "thoi_gian_phut": blueprint.thoi_gian_phut, "phan_bo": blueprint.phan_bo, "da_xac_minh": blueprint.da_xac_minh, "cau_hoi": snapshots},
    )
    db.add(exam)
    db.commit()
    return exam


def public_exam(exam):
    data = exam.noi_dung
    return {
        "id": exam.id,
        "hat_giong": exam.hat_giong,
        "ten": data["ten"],
        "thoi_gian_phut": data["thoi_gian_phut"],
        "da_xac_minh": data["da_xac_minh"],
        "cau_hoi": [{k: q[k] for k in ("cau_hoi_id", "noi_dung", "loai", "do_kho", "lua_chon", "chu_de_id")} for q in data["cau_hoi"]],
    }


def create_attempt(db, exam):
    # Only one active attempt: no answer disclosure through parallel attempts.
    for existing in db.scalars(select(Attempt).where(Attempt.da_nop.is_(False))).all():
        if expired(existing):
            submit_attempt(db, existing)
        elif existing.de_thi_id == exam.id:
            return existing
        else:
            raise HTTPException(409, "Bạn có bài đang làm. Hãy tiếp tục hoặc nộp bài đó từ Lịch sử.")
    started = now()
    attempt = Attempt(de_thi_id=exam.id, bat_dau=started.isoformat(), han_nop=(started + timedelta(minutes=exam.noi_dung["thoi_gian_phut"])).isoformat(), dap_an={})
    db.add(attempt)
    db.commit()
    return attempt


def submit_attempt(db, attempt):
    if attempt.da_nop:
        return attempt.ket_qua
    exam = db.get(Exam, attempt.de_thi_id)
    details = []
    for i, question in enumerate(exam.noi_dung["cau_hoi"]):
        selected = attempt.dap_an.get(str(i), [])
        correct = set(selected) == set(question["dap_an_dung"])
        details.append({**question, "vi_tri": i, "da_chon": selected, "dung": correct})
        review = db.scalar(select(Review).where(Review.cau_hoi_id == question["cau_hoi_id"]))
        if review is None:
            review = Review(cau_hoi_id=question["cau_hoi_id"], so_lan_dung=0, ngay_den_han=now().isoformat())
            db.add(review)
        review.so_lan_dung = min(review.so_lan_dung + 1, 6) if correct else 0
        review.ngay_den_han = (now() + timedelta(days=(1, 3, 7, 14, 30, 60, 90)[review.so_lan_dung])).isoformat()
    total_correct = sum(q["dung"] for q in details)
    result = {
        "lan_lam_bai_id": attempt.id,
        "ten": exam.noi_dung["ten"],
        "so_dung": total_correct,
        "tong_cau": len(details),
        "diem": round(total_correct * 10 / len(details), 2),
        "nop_luc": now().isoformat(),
        "thoi_gian_giay": max(0, int((min(now(), datetime.fromisoformat(attempt.han_nop)) - datetime.fromisoformat(attempt.bat_dau)).total_seconds())),
        "chi_tiet": details,
    }
    attempt.da_nop = True
    attempt.ket_qua = result
    db.commit()
    return result


def expired(attempt):
    return now() >= datetime.fromisoformat(attempt.han_nop)


def attempt_view(attempt):
    return {"id": attempt.id, "de_thi_id": attempt.de_thi_id, "bat_dau": attempt.bat_dau, "han_nop": attempt.han_nop, "da_nop": attempt.da_nop, "dap_an": attempt.dap_an}
