import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronLeft, FileText, Upload } from "lucide-react";
import type { Chunk, Doc } from "../types";
import { api, date } from "../services/api";
import { Empty, ErrorBox, PageTitle } from "../components/ui";
export default function Library() {
  const [docs, setDocs] = useState<Doc[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Doc | null>(null),
    [chunks, setChunks] = useState<Chunk[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const load = () =>
    api<Doc[]>("/documents")
      .then(setDocs)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <PageTitle
        eyebrow="NGUỒN HỌC TIN CẬY"
        title={selected ? selected.ten : "Thư viện tài liệu"}
        description={
          selected
            ? "Văn bản trích xuất để đối chiếu và trích dẫn. Hãy kiểm tra lại với tài liệu gốc."
            : "Lưu tài liệu ngay trên máy. Đọc, trích dẫn và xây dựng kiến thức."
        }
        action={
          selected ? (
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              <ChevronLeft size={16} /> Thư viện
            </button>
          ) : (
            <button
              className="button"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              <Upload size={17} />
              {busy ? "Đang trích xuất…" : "Nhập tài liệu"}
            </button>
          )
        }
      />
      <ErrorBox message={error} />
      <input
        hidden
        ref={input}
        type="file"
        accept=".pdf,.docx"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            const body = new FormData();
            body.append("file", file);
            await api("/documents", "POST", body);
            await load();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {selected ? (
        <div className="reader">
          {chunks.map((c) => (
            <article key={c.id}>
              <div className="eyebrow">
                TRANG {c.trang} · ĐOẠN #{c.id}
              </div>
              <p>{c.noi_dung}</p>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="notice">
            <BookOpen size={18} />
            <span>
              Hỗ trợ PDF có văn bản và DOCX, tối đa 20 MB. Tài liệu không được
              gửi đến dịch vụ AI. PDF ảnh quét cần OCR riêng.
            </span>
          </div>
          {!docs.length ? (
            <div
              className="upload-area"
              onClick={() => {
                if (!busy) input.current?.click();
              }}
            >
              <span className="empty-icon">
                <Upload size={30} />
              </span>
              <h2>Góc tài liệu của bạn</h2>
              <p>Chọn tài liệu đầu tiên để bắt đầu xây dựng thư viện.</p>
              <button className="button secondary" disabled={busy}>
                Chọn PDF hoặc DOCX
              </button>
              <span className="small muted">
                Lưu trữ cục bộ · Chống trùng bằng SHA-256
              </span>
            </div>
          ) : (
            <div className="document-grid">
              {docs.map((d) => (
                <button
                  className="document-card"
                  key={d.id}
                  onClick={async () => {
                    setError("");
                    try {
                      setChunks(
                        await api<Chunk[]>(`/documents/${d.id}/chunks`),
                      );
                      setSelected(d);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <span className="doc-icon">
                    <FileText size={27} />
                  </span>
                  <span className="badge draft">
                    {d.ten.toLowerCase().endsWith(".pdf") ? "PDF" : "DOCX"}
                  </span>
                  <h3>{d.ten}</h3>
                  <p>
                    {d.so_doan} đoạn văn bản · {date(d.ngay_tao)}
                  </p>
                  <span className="text-button">Đọc tài liệu →</span>
                </button>
              ))}
            </div>
          )}
          <Empty title="Trích dẫn có thể kiểm chứng">
            Khi soạn câu hỏi, chọn đoạn nguồn và trích nguyên văn để liên kết
            kiến thức với tài liệu.
          </Empty>
        </>
      )}
    </>
  );
}
