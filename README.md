# Ôn học · VB2 CA4 Study

Ứng dụng học tập cục bộ, một người dùng: xây dựng ngân hàng câu hỏi, tự cấu hình đề luyện tập, làm bài và xem lại kết quả. Giao diện tiếng Việt; React + TypeScript + Vite, FastAPI + SQLAlchemy + Alembic, SQLite.

**Không phải đề thi chính thức.** Chưa có cấu trúc VB2 CA4 được xác minh. Chủ đề, số câu, phân bổ, thời gian đều do người dùng nhập. Mỗi câu đúng có trọng số bằng nhau, tính trên thang 10; nhiều đáp án phải chọn đúng toàn bộ, không chấm điểm từng phần.

## Đã triển khai trong bản 0.1

- Thêm chủ đề; soạn/sửa câu một đáp án, nhiều đáp án và đúng/sai; phát hiện nội dung trùng; duyệt/từ chối/ngừng dùng. Mỗi lần sửa tạo phiên bản mới và trở về nháp.
- Mẫu đề có nhiều phân bổ theo chủ đề, loại và độ khó. Matching xác định theo seed; chỉ dùng câu đã duyệt; đúng số câu, không trùng câu; lỗi thiếu câu có chi tiết, không tự đổi tỷ lệ. Ưu tiên tránh câu trong các đề gần đây.
- Phòng thi có đồng hồ, tự lưu ngay khi chọn, khôi phục bài từ Lịch sử sau khi tải lại trang; thời hạn kiểm tra ở máy chủ. Một bài đang làm tại một thời điểm. Ngân hàng, lịch ôn và kết quả cũ tạm khóa trong lúc thi để không lộ đáp án.
- Nộp bài idempotent; lưu snapshot câu hỏi/đáp án/quy tắc chấm và kết quả lịch sử. Bỏ trống hoặc sai: 0 điểm. Hết hạn được chấm khi trình duyệt còn mở hoặc ở lần truy cập tiếp theo, không có bộ lập lịch nền.
- Thống kê chủ đề, xu hướng điểm, hàng đợi tự ôn theo lịch 1–3–7–14–30–60–90 ngày. Lịch chỉ thay đổi từ kết quả bài thi; thẻ tự ôn không tự chấm.
- Nhập PDF có văn bản, DOCX (20 MB), SHA-256 chống trùng, giữ bản gốc, chia đoạn theo trang PDF/khối 2.500 ký tự, kiểm tra trích dẫn nguyên văn. DOCX hiện đọc các đoạn văn, chưa đọc bảng; số trang DOCX là 1 vì không có công cụ dàn trang.
- Sao lưu ZIP bằng SQLite online backup; khôi phục có xác nhận, kiểm tra integrity/FK/schema/đường dẫn và tự sao lưu dữ liệu trước khi thay thế. Chỉ nhập bản sao lưu do ứng dụng tạo từ nguồn bạn tin cậy.
- Kiểm tra localhost/origin, không gửi tài liệu ra ngoài. Lõi chạy không cần mạng sau khi cài xong.

## Cài và chạy trên Windows

Cài Python 3.12 và Node.js 20.19+ (hoặc 22.12+). Tại thư mục repository, mở PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
powershell -ExecutionPolicy Bypass -File scripts/start.ps1
```

Mở trình duyệt tại địa chỉ localhost cổng **8000** (HTTP). Các script PowerShell được cung cấp nhưng chưa được chạy trên Windows; bản hiện tại được kiểm thử trên Linux.

## Cài và chạy trên Linux/macOS

```bash
bash scripts/setup.sh
bash scripts/start.sh
```

Script cài đặt cần Internet. Có thể đặt `NPM_CONFIG_CACHE` thành thư mục có quyền ghi (mặc định `frontend/.npm-cache` nếu không đặt biến). Không cần quyền quản trị hay tài khoản cloud. Không chạy nhiều worker hoặc nhiều máy chủ trên cùng thư mục dữ liệu.

Dữ liệu tại `data/`, mặc định không có dữ liệu mẫu. Biến `APP_DATA_DIR` chọn thư mục dữ liệu khác **trước khi chạy**. Thư mục này chứa SQLite, `documents/`, `backups/`; không commit hoặc chia sẻ nếu có thông tin riêng. Trước khi cập nhật schema, script tạo bản SQLite dự phòng nếu cần migration. Không có downgrade xóa dữ liệu.

## Bắt đầu sử dụng

1. Mở **Ngân hàng câu hỏi → Thêm chủ đề**.
2. Soạn câu hỏi, chọn đáp án đúng, thêm giải thích/trích dẫn nếu có, lưu nháp rồi duyệt thủ công.
3. Mở **Mẫu đề & luyện thi**, tạo mẫu có phân bổ phù hợp với số câu đã duyệt và bắt đầu.
4. Chọn đáp án để tự lưu. Sau khi nộp, xem điểm, lời giải, lịch sử và thống kê.
5. Tạo bản sao lưu ở **Cài đặt & sao lưu**. Đóng/nộp bài đang làm trước khi khôi phục; không dùng đồng thời tab cũ trong quá trình khôi phục.

## Phát triển và kiểm thử

Backend ở cổng 8000, giao diện dev cổng 5173:

```bash
.venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --workers 1
# Terminal khác:
cd frontend
npm run dev
```

```bash
.venv/bin/python -m pytest -q backend/tests
.venv/bin/ruff check backend scripts
.venv/bin/ruff format --check backend scripts
cd frontend
npm run build
npm run format:check
# Cài Chromium một lần nếu chưa có:
npx playwright install chromium
npm run test:e2e
# Hoặc dùng Chromium đã cài sẵn (Linux):
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

Trên Windows dùng `.venv\Scripts\python.exe` và `.venv\Scripts\ruff.exe`. Kiểm thử Python và Playwright luôn dùng dữ liệu tạm riêng; không sửa dữ liệu học tập. E2E cần cổng 8000 đang trống, build frontend trước khi chạy. OpenAPI ở `/docs`, hợp đồng API ở [docs/api.md](docs/api.md).

## Phạm vi còn lại

Đây là bản nền tảng P0–P2 và phần nhập liệu của P3, **chưa hoàn thành toàn bộ master spec**. Chưa có AI/provider/job audit, OCR, phiên bản/hiệu lực tài liệu và tự đánh dấu câu liên quan cần duyệt lại, phân đoạn điều/khoản, FTS5, tối ưu đa dạng theo nguồn/ngữ nghĩa, thời gian từng câu, luyện câu sai thành đề riêng, đánh giá tự luận, xuất ngân hàng, bộ cài desktop Windows. Mẫu đề hiện tạo mới, chưa sửa mẫu đã lưu; sửa câu hỏi dùng toàn bộ form dù endpoint là PATCH. Xem [docs/architecture.md](docs/architecture.md).

Chưa chọn giấy phép phân phối; chủ repository cần quyết định MIT/Apache-2.0 hoặc lựa chọn khác trước khi phát hành. Không khẳng định đây là bản phát hành mã nguồn mở có giấy phép.
