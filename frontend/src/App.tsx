import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  CheckCheck,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  History as HistoryIcon,
  LayoutDashboard,
  Leaf,
  Menu,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import QuestionBank from "./pages/QuestionBank";
import Blueprints from "./pages/Blueprints";
import { ExamRoom, ResultView } from "./pages/ExamRoom";
import Library from "./pages/Library";
import { Analytics, History, Reviews } from "./pages/Insights";
import Settings from "./pages/Settings";
import { api, date } from "./services/api";
import type {
  Attempt,
  AttemptSummary,
  Exam,
  Overview,
  Result,
  Topic,
  TopicStat,
} from "./types";
import { Empty, ErrorBox, PageTitle } from "./components/ui";
const navigation = [
  { key: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { key: "documents", label: "Thư viện tài liệu", icon: BookOpen },
  { key: "questions", label: "Ngân hàng câu hỏi", icon: FileQuestion },
  { key: "blueprints", label: "Mẫu đề & luyện thi", icon: ClipboardList },
  { key: "history", label: "Lịch sử luyện thi", icon: HistoryIcon },
  { key: "analytics", label: "Thống kê học tập", icon: BarChart3 },
  { key: "reviews", label: "Ôn tập đến hạn", icon: BookMarked },
];
function Dashboard({ go }: { go: (page: string) => void }) {
  const [overview, setOverview] = useState<Overview | null>(null),
    [attempts, setAttempts] = useState<AttemptSummary[]>([]),
    [stats, setStats] = useState<TopicStat[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api<Overview>("/analytics/overview"),
      api<AttemptSummary[]>("/attempts"),
      api<TopicStat[]>("/analytics/topics"),
    ])
      .then(([o, a, s]) => {
        setOverview(o);
        setAttempts(a);
        setStats(s);
      })
      .catch((e) => setError(e.message));
  }, []);
  const learned = stats.filter((s) => s.tong_cau);
  return (
    <>
      <PageTitle
        eyebrow="HÔM NAY LÀ MỘT NGÀY ĐẸP ĐỂ HỌC"
        title="Chào bạn, cùng tiến bộ nhé."
        description="Một chút tập trung mỗi ngày, vững vàng hơn trước kỳ thi."
        action={
          <span className="date-chip">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        }
      />
      <ErrorBox message={error} />
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">
            <span /> KHÔNG GIAN HỌC TẬP CỦA BẠN
          </span>
          <h2>
            Học có định hướng.
            <br />
            Tự tin từng bước.
          </h2>
          <p>
            Xây dựng kiến thức từ tài liệu của bạn,
            <br />
            luyện tập chủ động và nhìn thấy sự tiến bộ.
          </p>
          <button className="button cream" onClick={() => go("blueprints")}>
            Bắt đầu luyện thi <ArrowRight size={17} />
          </button>
          <span className="hero-foot">
            <ShieldCheck size={14} /> Riêng tư · Lưu trữ cục bộ · Học tập
            offline
          </span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="star star-one">✦</span>
          <span className="star star-two">✦</span>
          <div className="art-card back-card" />
          <div className="art-card front-card">
            <div className="art-seal">
              <GraduationCap size={34} />
            </div>
            <div className="art-line long" />
            <div className="art-line" />
            {[1, 2, 3].map((i) => (
              <div className="art-check" key={i}>
                <CheckCheck size={21} />
                <span />
                <b>0{i}</b>
              </div>
            ))}
          </div>
          <div className="art-note">
            <Leaf size={17} />
            <div>
              Tiến bộ mỗi ngày<small>Từng bước nhỏ, mục tiêu lớn.</small>
            </div>
          </div>
        </div>
      </section>
      <div className="stats-grid">
        {[
          {
            label: "Câu hỏi đã duyệt",
            value: overview?.da_duyet ?? 0,
            sub: `Trong ${overview?.cau_hoi ?? 0} câu hỏi của bạn`,
            icon: FileQuestion,
            color: "green",
          },
          {
            label: "Bài thi hoàn thành",
            value: overview?.bai_da_lam ?? 0,
            sub: "Mỗi lần luyện là một bước tiến",
            icon: ClipboardList,
            color: "peach",
          },
          {
            label: "Điểm trung bình",
            value: overview?.bai_da_lam ? overview.diem_trung_binh : "—",
            sub: "Thang điểm 10 · Theo bài đã nộp",
            icon: Target,
            color: "purple",
          },
          {
            label: "Tài liệu đã lưu",
            value: overview?.tai_lieu ?? 0,
            sub: "Nguồn kiến thức của riêng bạn",
            icon: BookOpen,
            color: "blue",
          },
        ].map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat-top">
              <span>{s.label}</span>
              <span className={`stat-icon ${s.color}`}>
                <s.icon size={19} />
              </span>
            </div>
            <strong>{s.value}</strong>
            <small>{s.sub}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="section-head">
            <h2>Luyện tập gần đây</h2>
            <button className="text-button" onClick={() => go("history")}>
              Xem tất cả <ChevronRight size={15} />
            </button>
          </div>
          {attempts.length ? (
            <div className="recent-list">
              {attempts.slice(0, 4).map((a) => (
                <button key={a.id} onClick={() => go("history")}>
                  <span className="tile-icon small-tile">
                    <ClipboardList size={18} />
                  </span>
                  <span>
                    <b>{a.ten}</b>
                    <small>
                      {date(a.bat_dau)} ·{" "}
                      {a.da_nop ? "Đã hoàn thành" : "Đang làm"}
                    </small>
                  </span>
                  <strong>
                    {a.diem ?? "…"}
                    <small>{a.da_nop ? "/10" : ""}</small>
                  </strong>
                </button>
              ))}
            </div>
          ) : (
            <Empty title="Trang đầu tiên đang chờ bạn">
              Chưa có bài luyện thi. Bắt đầu bằng việc thêm câu hỏi và cấu hình
              mẫu đề.
            </Empty>
          )}
          <button className="dashed-button" onClick={() => go("blueprints")}>
            <ClipboardList size={17} /> Chọn mẫu đề luyện tập{" "}
            <ArrowRight size={15} />
          </button>
        </section>
        <section className="panel">
          <div className="section-head">
            <h2>Góc nhìn học tập</h2>
            <span className="mini-label">THEO CHỦ ĐỀ</span>
          </div>
          {learned.length ? (
            <div className="topic-stats">
              {learned.slice(0, 4).map((s) => (
                <div key={s.id}>
                  <div className="section-head">
                    <b>{s.ten}</b>
                    <span>{Math.round((s.so_dung / s.tong_cau) * 100)}%</span>
                  </div>
                  <div className="progress">
                    <i
                      style={{ width: `${(s.so_dung / s.tong_cau) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="insight-empty">
              <div className="mini-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <h3>Hiểu rõ thế mạnh của bạn</h3>
              <p>
                Hoàn thành bài luyện thi để khám phá
                <br />
                chủ đề đã vững và phần cần ôn thêm.
              </p>
            </div>
          )}
          <button className="text-button" onClick={() => go("analytics")}>
            Khám phá thống kê <ArrowRight size={15} />
          </button>
        </section>
      </div>
      <div className="section-head section-title">
        <h2>Tiếp nối hành trình học tập</h2>
        <span className="muted small">Chủ động học theo cách của bạn</span>
      </div>
      <div className="quick-grid">
        {[
          {
            key: "documents",
            icon: BookOpen,
            title: "Thêm nguồn kiến thức",
            text: "Nhập PDF, DOCX và lưu trích dẫn.",
          },
          {
            key: "questions",
            icon: FileQuestion,
            title: "Xây nền tảng vững chắc",
            text: "Soạn và kiểm duyệt câu hỏi của bạn.",
          },
          {
            key: "reviews",
            icon: Bell,
            title: "Ôn đúng lúc, nhớ lâu hơn",
            text: "Quay lại những câu hỏi đã đến hạn.",
          },
        ].map((c) => (
          <button className="quick-card" key={c.key} onClick={() => go(c.key)}>
            <c.icon size={23} />
            <div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
      <div className="bottom-note">
        <Leaf size={17} />
        <span>
          Không cần học hết trong một ngày. Chỉ cần tốt hơn hôm qua một chút.
        </span>
      </div>
    </>
  );
}
export default function App() {
  const [page, setPage] = useState("dashboard"),
    [topics, setTopics] = useState<Topic[]>([]),
    [active, setActive] = useState<{ exam: Exam; attempt: Attempt } | null>(
      null,
    ),
    [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [mobile, setMobile] = useState(false);
  const loadTopics = () => {
    api<Topic[]>("/topics")
      .then(setTopics)
      .catch((e) => setError(e.message));
  };
  useEffect(loadTopics, []);
  const go = (key: string) => {
    if (
      active &&
      key !== "exam" &&
      !confirm(
        "Rời phòng thi? Đáp án đã lưu, thời gian vẫn tiếp tục. Bạn có thể quay lại từ Lịch sử.",
      )
    )
      return;
    setActive(null);
    setResult(null);
    setPage(key);
    setMobile(false);
    setError("");
    window.scrollTo({ top: 0 });
  };
  const openAttempt = async (id: number, submitted: boolean) => {
    setError("");
    try {
      if (submitted) {
        setResult(await api<Result>(`/attempts/${id}/result`));
        setPage("result");
        return;
      }
      const attempt = await api<Attempt>(`/attempts/${id}`);
      if (attempt.da_nop) {
        setResult(await api<Result>(`/attempts/${id}/result`));
        setPage("result");
      } else {
        const exam = await api<Exam>(`/exams/${attempt.de_thi_id}`);
        setActive({ exam, attempt });
        setPage("exam");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const currentLabel =
    page === "exam"
      ? "Phòng luyện thi"
      : page === "result"
        ? "Kết quả luyện thi"
        : (navigation.find((n) => n.key === page)?.label ??
          (page === "settings" ? "Cài đặt & sao lưu" : "Trợ lý AI"));
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("dashboard");
          }}
        >
          <span className="brand-mark">
            <BookOpen size={24} />
          </span>
          <span>
            ôn học<span className="brand-sub">VB2 CA4 STUDY</span>
          </span>
        </a>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobile(false)}
          aria-label="Đóng menu"
        >
          <X />
        </button>
        <div className="workspace-label">GÓC HỌC TẬP</div>
        <nav>
          {navigation.map((n) => (
            <button
              key={n.key}
              className={page === n.key ? "active" : ""}
              onClick={() => go(n.key)}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {page === n.key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={page === "ai" ? "active" : ""}
            onClick={() => go("ai")}
          >
            <Sparkles size={18} />
            <span>Trợ lý AI</span>
            <span className="soon">Sắp có</span>
          </button>
          <button
            className={page === "settings" ? "active" : ""}
            onClick={() => go("settings")}
          >
            <SettingsIcon size={18} />
            <span>Cài đặt & sao lưu</span>
          </button>
          <div className="local-status">
            <span className="status-dot" />
            <div>
              Không gian riêng tư<small>Dữ liệu lưu trên máy của bạn</small>
            </div>
            <ShieldCheck size={17} />
          </div>
          <div className="sidebar-footer">
            Học chủ động. Vững tương lai.<small>Phiên bản 0.1.0</small>
          </div>
        </div>
      </aside>
      {mobile && (
        <div className="menu-overlay" onClick={() => setMobile(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobile(true)}
              aria-label="Mở menu"
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Không gian học tập <ChevronRight size={13} />{" "}
              <b>{currentLabel}</b>
            </span>
          </div>
          <div className="topbar-right">
            <span className="local-pill">
              <span /> Cục bộ & riêng tư
            </span>
            <span className="avatar">B</span>
          </div>
        </header>
        <main>
          <ErrorBox message={error} />
          {page === "dashboard" && <Dashboard go={go} />}{" "}
          {page === "questions" && (
            <QuestionBank topics={topics} onTopicsChange={loadTopics} />
          )}{" "}
          {page === "blueprints" && (
            <Blueprints
              topics={topics}
              onStart={(exam, attempt) => {
                setActive({ exam, attempt });
                setPage("exam");
              }}
            />
          )}{" "}
          {page === "documents" && <Library />}{" "}
          {page === "history" && (
            <History
              onOpen={(id, submitted) => void openAttempt(id, submitted)}
            />
          )}{" "}
          {page === "analytics" && <Analytics />}{" "}
          {page === "reviews" && <Reviews />}{" "}
          {page === "settings" && (
            <Settings
              onRestore={() => {
                loadTopics();
                setActive(null);
                setResult(null);
              }}
            />
          )}{" "}
          {page === "exam" && active && (
            <ExamRoom
              key={active.attempt.id}
              exam={active.exam}
              initial={active.attempt}
              onResult={(r) => {
                setActive(null);
                setResult(r);
                setPage("result");
              }}
            />
          )}{" "}
          {page === "result" && result && (
            <ResultView result={result} onBack={() => go("history")} />
          )}{" "}
          {page === "ai" && (
            <>
              <PageTitle
                eyebrow="TÙY CHỌN · CẦN KẾT NỐI MẠNG"
                title="Trợ lý AI"
                description="Chức năng AI chưa được triển khai trong phiên bản này."
              />
              <section className="panel">
                <span className="tile-icon warm">
                  <Sparkles />
                </span>
                <h2>Quyền riêng tư luôn ở trước</h2>
                <p>
                  Chưa có nhà cung cấp hoặc mô hình AI được cấu hình. Không tài
                  liệu nào được gửi ra ngoài. Bạn có thể soạn câu hỏi thủ công
                  và luyện thi offline.
                </p>
                <p className="muted">
                  Giai đoạn tiếp theo: tạo câu hỏi nháp có trích dẫn, kiểm tra
                  JSON, nhật ký tác vụ và duyệt thủ công. Chỉ gửi nội dung khi
                  bạn xác nhận rõ ràng.
                </p>
                <button className="button" onClick={() => go("questions")}>
                  Soạn câu hỏi thủ công <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
        </main>
        <footer className="main-footer">
          <span>Ôn học · VB2 CA4 Study</span>
          <span>Kiến thức vững vàng, hành trình bền bỉ.</span>
        </footer>
      </div>
    </div>
  );
}
