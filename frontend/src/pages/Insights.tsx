import { useEffect, useState } from "react";
import { api, date } from "../services/api";
import type { AttemptSummary, Overview, Question, TopicStat } from "../types";
import { Empty, ErrorBox, PageTitle } from "../components/ui";
export function History({
  onOpen,
}: {
  onOpen: (id: number, submitted: boolean) => void;
}) {
  const [items, setItems] = useState<AttemptSummary[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api<AttemptSummary[]>("/attempts")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageTitle
        eyebrow="NHÌN LẠI HÀNH TRÌNH"
        title="Lịch sử luyện thi"
        description="Mỗi bài làm được lưu cùng phiên bản câu hỏi tại thời điểm tạo đề."
      />
      <ErrorBox message={error} />
      {!items.length ? (
        <Empty title="Hành trình bắt đầu từ bài đầu tiên">
          Chọn một mẫu đề để luyện tập. Kết quả và bài đang làm sẽ xuất hiện tại
          đây.
        </Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bài luyện thi</th>
                <th>Ngày bắt đầu</th>
                <th>Trạng thái</th>
                <th>Điểm</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.ten}</b>
                    <small>Lượt làm bài #{a.id}</small>
                  </td>
                  <td>{date(a.bat_dau)}</td>
                  <td>
                    <span
                      className={`badge ${a.da_nop ? "approved" : "draft"}`}
                    >
                      {a.da_nop ? "Đã hoàn thành" : "Đang làm"}
                    </span>
                  </td>
                  <td>{a.diem ?? "—"}</td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => onOpen(a.id, a.da_nop)}
                    >
                      {a.da_nop ? "Xem kết quả" : "Tiếp tục"} →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
export function Analytics() {
  const [stats, setStats] = useState<TopicStat[]>([]),
    [overview, setOverview] = useState<Overview | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api<TopicStat[]>("/analytics/topics"),
      api<Overview>("/analytics/overview"),
    ])
      .then(([s, o]) => {
        setStats(s);
        setOverview(o);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageTitle
        eyebrow="HIỂU MÌNH, HỌC TỐT HƠN"
        title="Thống kê học tập"
        description="Nhận diện thế mạnh và những phần kiến thức cần ôn lại."
      />
      <ErrorBox message={error} />
      <div className="stats-grid compact">
        <div className="stat">
          <span>Bài đã hoàn thành</span>
          <strong>{overview?.bai_da_lam ?? 0}</strong>
        </div>
        <div className="stat">
          <span>Điểm trung bình</span>
          <strong>
            {overview?.diem_trung_binh ?? 0}
            <small>/10</small>
          </strong>
        </div>
        <div className="stat">
          <span>Chủ đề đã luyện</span>
          <strong>{stats.filter((s) => s.tong_cau).length}</strong>
        </div>
      </div>
      <section className="panel">
        <h2>Độ chính xác theo chủ đề</h2>
        {stats.some((s) => s.tong_cau) ? (
          <div className="topic-stats">
            {stats
              .filter((s) => s.tong_cau)
              .sort((a, b) => a.so_dung / a.tong_cau - b.so_dung / b.tong_cau)
              .map((s) => (
                <div key={s.id}>
                  <div className="section-head">
                    <b>{s.ten}</b>
                    <span>
                      {Math.round((s.so_dung / s.tong_cau) * 100)}%{" "}
                      <small className="muted">
                        · {s.so_dung}/{s.tong_cau} câu
                      </small>
                    </span>
                  </div>
                  <div className="progress">
                    <i
                      style={{ width: `${(s.so_dung / s.tong_cau) * 100}%` }}
                    />
                  </div>
                  {s.so_dung / s.tong_cau < 0.6 && (
                    <small className="warm-text">
                      Nên dành thêm thời gian ôn tập chủ đề này.
                    </small>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <Empty title="Chưa đủ dữ liệu phân tích">
            Hoàn thành bài luyện thi đầu tiên để xem thống kê thật của bạn.
          </Empty>
        )}
      </section>
      <section className="panel">
        <h2>Điểm qua các lần luyện</h2>
        {overview?.xu_huong.length ? (
          <div className="chart" aria-label="Điểm các bài thi">
            {overview.xu_huong.map((r) => (
              <div className="chart-column" key={r.lan_lam_bai_id}>
                <b>{r.diem}</b>
                <div style={{ height: `${Math.max(2, r.diem * 14)}px` }} />
                <small>#{r.lan_lam_bai_id}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Biểu đồ sẽ được tạo từ kết quả bài làm của bạn.
          </p>
        )}
      </section>
    </>
  );
}
export function Reviews() {
  const [items, setItems] = useState<Question[]>([]),
    [revealed, setRevealed] = useState<Set<number>>(new Set()),
    [error, setError] = useState("");
  useEffect(() => {
    api<Question[]>("/reviews/due")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageTitle
        eyebrow="ÔN ĐÚNG LÚC, NHỚ DÀI LÂU"
        title="Hàng đợi ôn tập"
        description="Lịch ôn được cập nhật theo kết quả bài thi: 1, 3, 7, 14, 30, 60 và 90 ngày."
      />
      <ErrorBox message={error} />
      <div className="notice">
        Đây là thẻ tự ôn. Kết quả tự xem không thay đổi lịch; hãy làm bài luyện
        thi để cập nhật tiến độ.
      </div>
      {!items.length ? (
        <Empty title="Chưa có câu hỏi đến hạn">
          Câu hỏi từ các bài đã nộp sẽ xuất hiện tại đây khi đến lịch ôn.
        </Empty>
      ) : (
        <div className="question-list">
          {items.map((q) => (
            <article className="question-card" key={q.id}>
              <h3>{q.noi_dung}</h3>
              <ol type="A">
                {q.lua_chon.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
              {revealed.has(q.id) ? (
                <div className="explanation">
                  <b>
                    Đáp án:{" "}
                    {q.dap_an_dung
                      .map((i) => String.fromCharCode(65 + i))
                      .join(", ")}
                  </b>
                  <p>{q.giai_thich}</p>
                </div>
              ) : (
                <button
                  className="button secondary"
                  onClick={() => setRevealed(new Set([...revealed, q.id]))}
                >
                  Xem đáp án & giải thích
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
