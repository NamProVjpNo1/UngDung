import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Save,
} from "lucide-react";
import type { Attempt, Exam, Result } from "../types";
import { api, labels } from "../services/api";
import { ErrorBox, PageTitle } from "../components/ui";
export function ExamRoom({
  exam,
  initial,
  onResult,
}: {
  exam: Exam;
  initial: Attempt;
  onResult: (r: Result) => void;
}) {
  const [attempt, setAttempt] = useState(initial),
    [position, setPosition] = useState(0),
    [seconds, setSeconds] = useState(
      Math.max(0, Math.ceil((Date.parse(initial.han_nop) - Date.now()) / 1000)),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("Đáp án sẽ tự lưu khi bạn chọn.");
  const autoSubmitted = useRef(false);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      onResult(await api<Result>(`/attempts/${attempt.id}/submit`, "POST"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const timer = setInterval(
      () =>
        setSeconds(
          Math.max(
            0,
            Math.ceil((Date.parse(initial.han_nop) - Date.now()) / 1000),
          ),
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, [initial.han_nop]);
  useEffect(() => {
    if (seconds === 0 && !busy && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit();
    }
  }, [seconds, busy]);
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, []);
  const q = exam.cau_hoi[position],
    selected = attempt.dap_an[String(position)] ?? [],
    count = Object.values(attempt.dap_an).filter((x) => x.length).length;
  const select = async (index: number) => {
    if (busy || seconds === 0) return;
    const values =
      q.loai === "multiple"
        ? selected.includes(index)
          ? selected.filter((x) => x !== index)
          : [...selected, index]
        : [index];
    setBusy(true);
    setError("");
    setSaved("Đang lưu…");
    try {
      await api(`/attempts/${attempt.id}/answers/${position}`, "PUT", {
        lua_chon: values,
      });
      setAttempt({
        ...attempt,
        dap_an: { ...attempt.dap_an, [String(position)]: values },
      });
      setSaved("Đã lưu trên máy của bạn");
    } catch (e) {
      setError((e as Error).message);
      setSaved("Chưa lưu được. Hãy chọn lại.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="KHÔNG GIAN TẬP TRUNG"
        title={exam.ten}
        description={`${exam.cau_hoi.length} câu hỏi · Mẫu đề tự cấu hình · Đáp án hiển thị sau khi nộp`}
      />
      <ErrorBox message={error} />
      <div className="exam-layout">
        <section className="exam-main">
          <div className="section-head">
            <span className="eyebrow">
              CÂU {position + 1} / {exam.cau_hoi.length}
            </span>
            <span className="badge draft">{labels[q.loai]}</span>
          </div>
          <h2 className="exam-question">{q.noi_dung}</h2>
          <p className="muted small">
            {q.loai === "multiple"
              ? "Chọn tất cả đáp án đúng."
              : "Chọn một đáp án đúng."}
          </p>
          <div className="exam-options">
            {q.lua_chon.map((text, i) => (
              <button
                key={i}
                className={`exam-option ${selected.includes(i) ? "selected" : ""}`}
                disabled={busy || seconds === 0}
                onClick={() => void select(i)}
                aria-pressed={selected.includes(i)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{text}</span>
                {selected.includes(i) && <CheckCircle2 size={20} />}
              </button>
            ))}
          </div>
          <div className="section-head exam-navigation">
            <button
              className="button secondary"
              disabled={!position || busy}
              onClick={() => setPosition(position - 1)}
            >
              <ChevronLeft size={16} /> Câu trước
            </button>
            <span className="small muted">
              <Save size={13} /> {saved}
            </span>
            <button
              className="button secondary"
              disabled={position === exam.cau_hoi.length - 1 || busy}
              onClick={() => setPosition(position + 1)}
            >
              Câu sau <ChevronRight size={16} />
            </button>
          </div>
        </section>
        <aside className="exam-aside">
          <div className={`timer ${seconds < 60 ? "urgent" : ""}`}>
            <span>
              <Clock3 size={17} /> Thời gian còn lại
            </span>
            <strong>
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </strong>
          </div>
          <div className="section-head">
            <h3>Tiến độ làm bài</h3>
            <span className="small">
              {count}/{exam.cau_hoi.length}
            </span>
          </div>
          <div className="progress">
            <i style={{ width: `${(count / exam.cau_hoi.length) * 100}%` }} />
          </div>
          <div className="question-map">
            {exam.cau_hoi.map((_, i) => (
              <button
                key={i}
                className={`${attempt.dap_an[String(i)]?.length ? "answered" : ""} ${position === i ? "current" : ""}`}
                disabled={busy}
                onClick={() => setPosition(i)}
                aria-label={`Đến câu ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="small muted">
            Có thể quay lại bài từ Lịch sử. Thời gian vẫn tiếp tục khi bạn đóng
            trang.
          </p>
          <button
            className="button full"
            disabled={busy}
            onClick={() => {
              if (
                seconds === 0 ||
                confirm(
                  `Nộp bài với ${count}/${exam.cau_hoi.length} câu đã trả lời?`,
                )
              )
                void submit();
            }}
          >
            Nộp bài & xem kết quả
          </button>
        </aside>
      </div>
    </>
  );
}
export function ResultView({
  result,
  onBack,
}: {
  result: Result;
  onBack: () => void;
}) {
  return (
    <>
      <PageTitle
        eyebrow="MỖI LẦN LUYỆN, MỘT BƯỚC TIẾN"
        title="Kết quả luyện thi"
        description={result.ten}
        action={
          <button className="button secondary" onClick={onBack}>
            Về lịch sử
          </button>
        }
      />
      <div className="result-hero">
        <div className="score-ring">
          <strong>{result.diem}</strong>
          <span>/ 10 điểm</span>
        </div>
        <div>
          <span className="eyebrow">BẠN ĐÃ HOÀN THÀNH</span>
          <h2>
            {result.so_dung} / {result.tong_cau} câu trả lời đúng
          </h2>
          <p>
            Thời gian làm bài: {Math.floor(result.thoi_gian_giay / 60)} phút{" "}
            {result.thoi_gian_giay % 60} giây
          </p>
          <p className="small muted">
            Mỗi câu có trọng số bằng nhau. Câu sai và bỏ trống: 0 điểm.
          </p>
        </div>
      </div>
      <h2 className="section-title">Xem lại để hiểu sâu hơn</h2>
      <div className="question-list">
        {result.chi_tiet.map((q, i) => (
          <article className="question-card" key={i}>
            <div className="section-head">
              <span className="eyebrow">CÂU {i + 1}</span>
              <span className={`badge ${q.dung ? "approved" : "rejected"}`}>
                {q.dung
                  ? "Chính xác"
                  : q.da_chon.length
                    ? "Chưa chính xác"
                    : "Chưa trả lời"}
              </span>
            </div>
            <h3>{q.noi_dung}</h3>
            <div className="result-options">
              {q.lua_chon.map((c, j) => (
                <div
                  key={j}
                  className={`${q.dap_an_dung.includes(j) ? "is-correct" : ""} ${q.da_chon.includes(j) && !q.dap_an_dung.includes(j) ? "is-wrong" : ""}`}
                >
                  <span>
                    {String.fromCharCode(65 + j)}. {c}
                  </span>
                  <small>
                    {q.dap_an_dung.includes(j) ? "Đáp án đúng" : ""}
                    {q.da_chon.includes(j) ? " · Bạn đã chọn" : ""}
                  </small>
                </div>
              ))}
            </div>
            {q.giai_thich && (
              <div className="explanation">
                <b>Giải thích</b>
                <p>{q.giai_thich}</p>
              </div>
            )}
            {q.trich_dan && <blockquote>{q.trich_dan}</blockquote>}
          </article>
        ))}
      </div>
    </>
  );
}
