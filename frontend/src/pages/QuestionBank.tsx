import { useEffect, useState } from "react";
import { Plus, Search, Check, Pencil, Archive, BookOpen } from "lucide-react";
import type { Chunk, Doc, Question, QuestionInput, Topic } from "../types";
import { api, labels } from "../services/api";
import { Empty, ErrorBox, Modal, PageTitle } from "../components/ui";
const fresh = (topic = 0): QuestionInput => ({
  chu_de_id: topic,
  noi_dung: "",
  loai: "single",
  do_kho: "medium",
  lua_chon: ["", "", "", ""],
  dap_an_dung: [0],
  giai_thich: "",
  doan_tai_lieu_id: null,
  trich_dan: "",
});
export default function QuestionBank({
  topics,
  onTopicsChange,
}: {
  topics: Topic[];
  onTopicsChange: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [topicFilter, setTopicFilter] = useState("all"),
    [editor, setEditor] = useState<QuestionInput | null>(null),
    [editing, setEditing] = useState<number | null>(null),
    [topicName, setTopicName] = useState(""),
    [showTopic, setShowTopic] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]),
    [chunks, setChunks] = useState<Chunk[]>([]),
    [formError, setFormError] = useState("");
  const load = () =>
    api<Question[]>("/questions")
      .then(setQuestions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
    api<Doc[]>("/documents")
      .then(setDocs)
      .catch((e) => setError(e.message));
  }, []);
  const action = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const open = (q?: Question) => {
    setEditing(q?.id ?? null);
    setFormError("");
    setChunks([]);
    setEditor(
      q
        ? {
            chu_de_id: q.chu_de_id,
            noi_dung: q.noi_dung,
            loai: q.loai,
            do_kho: q.do_kho,
            lua_chon: [...q.lua_chon],
            dap_an_dung: [...q.dap_an_dung],
            giai_thich: q.giai_thich,
            doan_tai_lieu_id: q.doan_tai_lieu_id,
            trich_dan: q.trich_dan,
          }
        : fresh(topics[0]?.id),
    );
  };
  const filtered = questions.filter(
    (q) =>
      (status === "all" || q.trang_thai === status) &&
      (topicFilter === "all" || q.chu_de_id === Number(topicFilter)) &&
      q.noi_dung
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <>
      <PageTitle
        eyebrow="GÓC KIẾN THỨC"
        title="Ngân hàng câu hỏi"
        description="Từng câu hỏi chất lượng, một nền tảng vững vàng."
        action={
          <div className="button-row">
            <button
              className="button secondary"
              onClick={() => setShowTopic(true)}
            >
              Thêm chủ đề
            </button>
            <button
              className="button"
              disabled={!topics.length}
              onClick={() => open()}
            >
              <Plus size={17} /> Soạn câu hỏi
            </button>
          </div>
        }
      />
      <ErrorBox message={error} />
      {!topics.length && (
        <div className="notice">
          Bắt đầu bằng cách thêm chủ đề, sau đó soạn và duyệt câu hỏi của bạn.
        </div>
      )}
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Tìm câu hỏi"
            placeholder="Tìm trong ngân hàng câu hỏi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Lọc chủ đề"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
        >
          <option value="all">Tất cả chủ đề</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ten}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          {["draft", "approved", "rejected", "retired"].map((s) => (
            <option key={s} value={s}>
              {labels[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="section-head">
        <span className="muted">{filtered.length} câu hỏi</span>
        <span className="small muted">
          Chỉ câu đã duyệt được dùng để tạo đề
        </span>
      </div>
      {loading ? (
        <p>Đang tải câu hỏi…</p>
      ) : !filtered.length ? (
        <Empty title="Chưa có câu hỏi phù hợp">
          Thêm câu hỏi của riêng bạn hoặc thay đổi bộ lọc.
        </Empty>
      ) : (
        <div className="question-list">
          {filtered.map((q) => (
            <article className="question-card" key={q.id}>
              <div className="question-meta">
                <span className={`badge ${q.trang_thai}`}>
                  {labels[q.trang_thai]}
                </span>
                <span>{topics.find((t) => t.id === q.chu_de_id)?.ten}</span>
                <span>
                  · {labels[q.do_kho]} · Phiên bản {q.phien_ban}
                </span>
              </div>
              <h3>{q.noi_dung}</h3>
              <div className="option-preview">
                {q.lua_chon.map((c, i) => (
                  <span
                    className={q.dap_an_dung.includes(i) ? "correct" : ""}
                    key={i}
                  >
                    {String.fromCharCode(65 + i)}. {c}
                  </span>
                ))}
              </div>
              {q.giai_thich && <p className="explanation">{q.giai_thich}</p>}
              {q.trich_dan && (
                <blockquote>
                  <BookOpen size={14} /> {q.trich_dan}
                </blockquote>
              )}
              <div className="card-actions">
                <button className="text-button" onClick={() => open(q)}>
                  <Pencil size={15} /> Chỉnh sửa
                </button>
                {q.trang_thai !== "approved" && (
                  <button
                    className="text-button"
                    onClick={() =>
                      void action(() =>
                        api(`/questions/${q.id}/review`, "POST", {
                          trang_thai: "approved",
                        }),
                      )
                    }
                  >
                    <Check size={15} /> Duyệt câu hỏi
                  </button>
                )}
                {q.trang_thai === "draft" && (
                  <button
                    className="text-button danger-text"
                    onClick={() =>
                      void action(() =>
                        api(`/questions/${q.id}/review`, "POST", {
                          trang_thai: "rejected",
                        }),
                      )
                    }
                  >
                    Từ chối
                  </button>
                )}
                {q.trang_thai !== "retired" && (
                  <button
                    className="text-button muted"
                    onClick={() => {
                      if (
                        confirm(
                          "Ngừng sử dụng câu hỏi này? Lịch sử bài thi được giữ nguyên.",
                        )
                      )
                        void action(() => api(`/questions/${q.id}`, "DELETE"));
                    }}
                  >
                    <Archive size={15} /> Ngừng dùng
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {showTopic && (
        <Modal title="Thêm chủ đề" onClose={() => setShowTopic(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("/topics", "POST", { ten: topicName });
                setTopicName("");
                setShowTopic(false);
                onTopicsChange();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Tên chủ đề
              <input
                required
                maxLength={200}
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="Ví dụ: Chủ đề tự chọn"
              />
            </label>
            <button className="button" disabled={busy}>
              Lưu chủ đề
            </button>
          </form>
        </Modal>
      )}
      {editor && (
        <Modal
          title={editing ? "Chỉnh sửa câu hỏi" : "Soạn câu hỏi mới"}
          onClose={() => {
            if (!busy) setEditor(null);
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setFormError("");
              try {
                await api(
                  editing ? `/questions/${editing}` : "/questions",
                  editing ? "PATCH" : "POST",
                  editor,
                );
                setEditor(null);
                await load();
              } catch (err) {
                setFormError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <ErrorBox message={formError} />
            <div className="notice small">
              Lưu thành bản nháp. Cần kiểm duyệt trước khi đưa vào đề thi.
            </div>
            <div className="form-grid">
              <label>
                Chủ đề
                <select
                  value={editor.chu_de_id}
                  onChange={(e) =>
                    setEditor({ ...editor, chu_de_id: Number(e.target.value) })
                  }
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ten}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Độ khó
                <select
                  value={editor.do_kho}
                  onChange={(e) =>
                    setEditor({
                      ...editor,
                      do_kho: e.target.value as QuestionInput["do_kho"],
                    })
                  }
                >
                  {["easy", "medium", "hard"].map((s) => (
                    <option key={s} value={s}>
                      {labels[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Loại câu hỏi
              <select
                value={editor.loai}
                onChange={(e) => {
                  const loai = e.target.value as QuestionInput["loai"];
                  setEditor({
                    ...editor,
                    loai,
                    lua_chon:
                      loai === "true_false" ? ["Đúng", "Sai"] : editor.lua_chon,
                    dap_an_dung: [0],
                  });
                }}
              >
                {["single", "multiple", "true_false"].map((s) => (
                  <option key={s} value={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nội dung câu hỏi
              <textarea
                required
                minLength={5}
                maxLength={10000}
                rows={3}
                value={editor.noi_dung}
                onChange={(e) =>
                  setEditor({ ...editor, noi_dung: e.target.value })
                }
              />
            </label>
            <label>
              Các lựa chọn{" "}
              <span className="muted small">· Đánh dấu đáp án đúng</span>
            </label>
            {editor.lua_chon.map((c, i) => (
              <div className="answer-editor" key={i}>
                <input
                  type={editor.loai === "multiple" ? "checkbox" : "radio"}
                  name="correct"
                  aria-label={`Đáp án đúng ${String.fromCharCode(65 + i)}`}
                  checked={editor.dap_an_dung.includes(i)}
                  onChange={() =>
                    setEditor({
                      ...editor,
                      dap_an_dung:
                        editor.loai === "multiple"
                          ? editor.dap_an_dung.includes(i)
                            ? editor.dap_an_dung.filter((x) => x !== i)
                            : [...editor.dap_an_dung, i]
                          : [i],
                    })
                  }
                />
                <input
                  required
                  maxLength={3000}
                  aria-label={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                  placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                  value={c}
                  onChange={(e) =>
                    setEditor({
                      ...editor,
                      lua_chon: editor.lua_chon.map((v, j) =>
                        i === j ? e.target.value : v,
                      ),
                    })
                  }
                />
                {editor.lua_chon.length > 2 && editor.loai !== "true_false" && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Xóa lựa chọn ${i + 1}`}
                    onClick={() =>
                      setEditor({
                        ...editor,
                        lua_chon: editor.lua_chon.filter((_, j) => j !== i),
                        dap_an_dung: editor.dap_an_dung
                          .filter((x) => x !== i)
                          .map((x) => (x > i ? x - 1 : x)),
                      })
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {editor.lua_chon.length < 8 && editor.loai !== "true_false" && (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setEditor({ ...editor, lua_chon: [...editor.lua_chon, ""] })
                }
              >
                + Thêm lựa chọn
              </button>
            )}
            <label>
              Giải thích
              <textarea
                rows={2}
                value={editor.giai_thich}
                onChange={(e) =>
                  setEditor({ ...editor, giai_thich: e.target.value })
                }
              />
            </label>
            <details>
              <summary>Trích dẫn tài liệu nguồn (tùy chọn)</summary>
              <label>
                Tài liệu
                <select
                  defaultValue=""
                  onChange={async (e) => {
                    setEditor({
                      ...editor,
                      doan_tai_lieu_id: null,
                      trich_dan: "",
                    });
                    setChunks([]);
                    if (e.target.value)
                      try {
                        setChunks(
                          await api<Chunk[]>(
                            `/documents/${e.target.value}/chunks`,
                          ),
                        );
                      } catch (err) {
                        setFormError((err as Error).message);
                      }
                  }}
                >
                  <option value="">Chọn tài liệu</option>
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.ten}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Đoạn nguồn
                <select
                  value={editor.doan_tai_lieu_id ?? ""}
                  onChange={(e) =>
                    setEditor({
                      ...editor,
                      doan_tai_lieu_id: Number(e.target.value) || null,
                      trich_dan: "",
                    })
                  }
                >
                  <option value="">Chọn đoạn nguồn</option>
                  {chunks.map((c) => (
                    <option key={c.id} value={c.id}>
                      Trang {c.trang} · {c.noi_dung.slice(0, 80)}
                    </option>
                  ))}
                </select>
              </label>
              {chunks.find((c) => c.id === editor.doan_tai_lieu_id) && (
                <blockquote>
                  {
                    chunks.find((c) => c.id === editor.doan_tai_lieu_id)
                      ?.noi_dung
                  }
                </blockquote>
              )}
              <label>
                Trích nguyên văn
                <textarea
                  value={editor.trich_dan}
                  onChange={(e) =>
                    setEditor({ ...editor, trich_dan: e.target.value })
                  }
                />
              </label>
            </details>
            <div className="modal-footer">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                Hủy
              </button>
              <button className="button" disabled={busy}>
                {busy ? "Đang lưu…" : "Lưu bản nháp"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
