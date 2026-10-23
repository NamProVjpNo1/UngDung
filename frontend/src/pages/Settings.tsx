import { useEffect, useRef, useState } from "react";
import {
  Database,
  Download,
  HardDrive,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { api } from "../services/api";
import { ErrorBox, PageTitle } from "../components/ui";
export default function Settings({ onRestore }: { onRestore: () => void }) {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    api<Record<string, unknown>>("/system/health")
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageTitle
        eyebrow="DỮ LIỆU CỦA BẠN, QUYỀN KIỂM SOÁT CỦA BẠN"
        title="Cài đặt & sao lưu"
        description="Dữ liệu được lưu cục bộ. Hãy tạo bản sao lưu thường xuyên."
      />
      <ErrorBox message={error} />
      {message && (
        <div className="success" role="status">
          {message}
        </div>
      )}
      <div className="settings-grid">
        <section className="panel">
          <span className="tile-icon">
            <HardDrive />
          </span>
          <h2>Sao lưu dữ liệu</h2>
          <p>
            Cơ sở dữ liệu SQLite và tài liệu gốc trong một tệp ZIP. Kiểm tra
            tính toàn vẹn trước khi tạo bản sao lưu.
          </p>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const b = await api<{ tai_xuong: string }>("/backup", "POST");
                const link = document.createElement("a");
                link.href = b.tai_xuong;
                link.download = "";
                link.click();
                setMessage(
                  "Đã tạo bản sao lưu. Hãy lưu tệp ZIP ở nơi an toàn.",
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Download size={16} /> Tạo & tải bản sao lưu
          </button>
        </section>
        <section className="panel">
          <span className="tile-icon warm">
            <Upload />
          </span>
          <h2>Khôi phục dữ liệu</h2>
          <p>
            Thay thế dữ liệu bằng bản sao lưu đã chọn. Một bản sao dữ liệu hiện
            tại được tự động giữ lại trước khi khôi phục.
          </p>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            Chọn bản sao lưu ZIP
          </button>
          <input
            hidden
            ref={input}
            type="file"
            accept=".zip"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                !confirm(
                  "Khôi phục sẽ thay thế dữ liệu hiện tại. Bạn đã đóng các bài đang làm và muốn tiếp tục?",
                )
              ) {
                e.target.value = "";
                return;
              }
              setBusy(true);
              setError("");
              try {
                const form = new FormData();
                form.append("file", file);
                const r = await api<{
                  thong_bao: string;
                  sao_luu_truoc_khoi_phuc: string;
                }>("/backup/restore?xac_nhan=true", "POST", form);
                setMessage(
                  `${r.thong_bao} Bản trước khôi phục: ${r.sao_luu_truoc_khoi_phuc}`,
                );
                onRestore();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </section>
      </div>
      <section className="panel">
        <div className="section-head">
          <h2>
            <Database size={20} /> Chẩn đoán hệ thống
          </h2>
          <span className={`badge ${health ? "approved" : "draft"}`}>
            {health ? "Đã kết nối" : "Đang kiểm tra"}
          </span>
        </div>
        <div className="diagnostics">
          <div>
            <span>Cơ sở dữ liệu</span>
            <b>{String(health?.co_so_du_lieu ?? "—")}</b>
          </div>
          <div>
            <span>Ràng buộc khóa ngoại</span>
            <b>{health?.khoa_ngoai ? "Đang bật" : "—"}</b>
          </div>
          <div>
            <span>Phiên bản migration</span>
            <b>{String(health?.phien_ban ?? "—")}</b>
          </div>
          <div>
            <span>Chế độ hoạt động</span>
            <b>Một người dùng · localhost</b>
          </div>
        </div>
      </section>
      <div className="privacy-card">
        <ShieldCheck size={28} />
        <div>
          <h3>Không tài khoản. Không gửi tài liệu ra ngoài.</h3>
          <p>
            Lõi học tập hoạt động offline sau khi cài đặt. AI chưa được cấu hình
            trong phiên bản này; tài liệu và câu hỏi được xử lý trên máy của
            bạn.
          </p>
        </div>
      </div>
    </>
  );
}
