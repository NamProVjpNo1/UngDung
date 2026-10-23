import { useEffect, useState } from "react";
import { ArrowRight, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { api, labels } from "../services/api";
import type { Attempt, Blueprint, Exam, Slot, Topic } from "../types";
import { Empty, ErrorBox, Modal, PageTitle } from "../components/ui";
export default function Blueprints({
  topics,
  onStart,
}: {
  topics: Topic[];
  onStart: (exam: Exam, attempt: Attempt) => void;
}) {
  const [items, setItems] = useState<Blueprint[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false),
    [name, setName] = useState(""),
    [minutes, setMinutes] = useState(20),
    [seed, setSeed] = useState(42),
    [recent, setRecent] = useState(3),
    [slots, setSlots] = useState<Slot[]>([]);
  const load = () =>
    api<Blueprint[]>("/blueprints")
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  const start = async (id: number) => {
    setBusy(true);
    setError("");
    try {
      const exam = await api<Exam>("/exams/generate", "POST", {
        mau_de_thi_id: id,
        hat_giong: seed,
        cua_so_gan_day: recent,
      });
      const attempt = await api<Attempt>("/attempts", "POST", {
        de_thi_id: exam.id,
      });
      onStart(exam, attempt);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const addSlot = () =>
    setSlots([
      ...slots,
      { chu_de_id: topics[0]?.id ?? 0, so_luong: 5, loai: null, do_kho: null },
    ]);
  return (
    <>
      <PageTitle
        eyebrow="LUYỆN TẬP CÓ ĐỊNH HƯỚNG"
        title="Mẫu đề & luyện thi"
        description="Bạn chọn cấu trúc. Hệ thống chọn câu hỏi đúng phân bổ."
        action={
          <button
            className="button"
            disabled={!topics.length}
            onClick={() => {
              setSlots([
                {
                  chu_de_id: topics[0].id,
                  so_luong: 5,
                  loai: null,
                  do_kho: null,
                },
              ]);
              setShow(true);
            }}
          >
            <Plus size={17} /> Tạo mẫu đề
          </button>
        }
      />
      <ErrorBox message={error} />
      <div className="notice">
        <SlidersHorizontal size={18} />
        <span>
          Các mẫu đề do bạn tự cấu hình, chưa xác minh theo kỳ thi VB2 CA4 chính
          thức. Mỗi câu đúng tính bằng nhau trên thang điểm 10.
        </span>
      </div>
      <div className="toolbar">
        <label className="inline-label">
          Hạt giống ngẫu nhiên
          <input
            type="number"
            min={0}
            max={2147483647}
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
          />
        </label>
        <label className="inline-label">
          Ưu tiên tránh đề gần đây
          <input
            type="number"
            min={0}
            max={20}
            value={recent}
            onChange={(e) => setRecent(Number(e.target.value))}
          />
        </label>
        <span className="small muted">
          Số câu và điều kiện phân bổ luôn được giữ nguyên.
        </span>
      </div>
      {!items.length ? (
        <Empty title="Tạo lộ trình luyện thi đầu tiên">
          Thêm chủ đề và câu hỏi đã duyệt, rồi cấu hình một mẫu đề phù hợp.
        </Empty>
      ) : (
        <div className="blueprint-grid">
          {items.map((b) => (
            <article className="blueprint-card" key={b.id}>
              <div className="section-head">
                <span className="tile-icon">
                  <SlidersHorizontal size={23} />
                </span>
                <span className="badge draft">Tự cấu hình</span>
              </div>
              <h2>{b.ten}</h2>
              <p className="muted">
                {b.phan_bo.reduce((s, x) => s + x.so_luong, 0)} câu hỏi{" "}
                <span className="dot">·</span> {b.thoi_gian_phut} phút
              </p>
              <div className="allocations">
                {b.phan_bo.map((s, i) => (
                  <div key={i}>
                    <span>
                      {topics.find((t) => t.id === s.chu_de_id)?.ten}
                      <small>
                        {s.loai ? labels[s.loai] : "Mọi loại"} ·{" "}
                        {s.do_kho ? labels[s.do_kho] : "Mọi độ khó"}
                      </small>
                    </span>
                    <b>{s.so_luong}</b>
                  </div>
                ))}
              </div>
              <button
                className="button full"
                disabled={busy}
                onClick={() => void start(b.id)}
              >
                {busy ? "Đang tạo đề…" : "Bắt đầu luyện thi"}
                <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
      {show && (
        <Modal
          title="Cấu hình mẫu đề"
          onClose={() => {
            if (!busy) setShow(false);
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("/blueprints", "POST", {
                  ten: name,
                  thoi_gian_phut: minutes,
                  phan_bo: slots,
                  da_xac_minh: false,
                });
                setShow(false);
                setName("");
                await load();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <ErrorBox message={error} />
            <label>
              Tên mẫu đề
              <input
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Ôn tập cuối tuần"
              />
            </label>
            <label>
              Thời gian (phút)
              <input
                type="number"
                min={1}
                max={240}
                required
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
            <h3>Phân bổ câu hỏi</h3>
            {slots.map((s, i) => (
              <div className="slot-editor" key={i}>
                <div className="form-grid">
                  <label>
                    Chủ đề
                    <select
                      value={s.chu_de_id}
                      onChange={(e) =>
                        setSlots(
                          slots.map((x, j) =>
                            j === i
                              ? { ...x, chu_de_id: Number(e.target.value) }
                              : x,
                          ),
                        )
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
                    Số câu
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={s.so_luong}
                      onChange={(e) =>
                        setSlots(
                          slots.map((x, j) =>
                            j === i
                              ? { ...x, so_luong: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Loại câu
                    <select
                      value={s.loai ?? ""}
                      onChange={(e) =>
                        setSlots(
                          slots.map((x, j) =>
                            j === i
                              ? { ...x, loai: e.target.value || null }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="">Mọi loại</option>
                      {["single", "multiple", "true_false"].map((x) => (
                        <option key={x} value={x}>
                          {labels[x]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Độ khó
                    <select
                      value={s.do_kho ?? ""}
                      onChange={(e) =>
                        setSlots(
                          slots.map((x, j) =>
                            j === i
                              ? { ...x, do_kho: e.target.value || null }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="">Mọi độ khó</option>
                      {["easy", "medium", "hard"].map((x) => (
                        <option key={x} value={x}>
                          {labels[x]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {slots.length > 1 && (
                  <button
                    className="text-button danger-text"
                    type="button"
                    onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={14} /> Xóa phân bổ
                  </button>
                )}
              </div>
            ))}
            <button
              className="text-button"
              type="button"
              disabled={slots.length >= 30}
              onClick={addSlot}
            >
              + Thêm phân bổ
            </button>
            <div className="modal-footer">
              <span className="muted">
                Tổng {slots.reduce((a, s) => a + s.so_luong, 0)} câu · Tối đa
                100
              </span>
              <button className="button" disabled={busy}>
                Lưu mẫu đề
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
