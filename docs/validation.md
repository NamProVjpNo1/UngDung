# Kết quả kiểm tra bản 0.1

Ngày kiểm tra: 23/10/2026. Môi trường Linux, Python 3.12, Node 24, Chromium 154 hệ thống. Dữ liệu thử luôn được tạo trong thư mục tạm riêng.

| Kiểm tra | Kết quả |
| --- | --- |
| `bash scripts/setup.sh` | Đạt: cài theo lockfile, migration và build lại |
| `python -m pytest -q backend/tests` | 20 đạt; có cảnh báo deprecation httpx từ Starlette, không phải lỗi kiểm thử |
| `ruff check backend scripts` | Đạt |
| `ruff format --check backend scripts` | Đạt |
| `npm run build` | TypeScript + Vite đạt |
| `npm run format:check` | Đạt |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e` | 2 đạt: desktop và mobile |
| `npm audit` | Không báo lỗ hổng tại thời điểm kiểm tra |
| `pip check` | Không có xung đột dependency |

Backend bao phủ migration/FK, trạng thái/phiên bản/trùng câu, kiểm tra đáp án, matching slot chồng lấn, thiếu câu không lưu đề, seed tái lập, ưu tiên tránh đề gần đây, tự lưu/tiếp tục, hết hạn, chấm nhiều đáp án, nộp idempotent, bảo toàn lịch sử, khóa đáp án khi thi, thống kê/lịch ôn, PDF/DOCX/trích dẫn, sao lưu/khôi phục có tài liệu, ZIP traversal và chặn origin ngoài.

E2E dùng giao diện thật để thêm chủ đề, soạn và duyệt câu hỏi, tạo mẫu đề, chọn đáp án, tải lại trang, tiếp tục từ lịch sử, nộp/chấm, xem thống kê và tải ZIP. Kiểm tra không có lỗi JavaScript và không tràn ngang trang tổng quan trên điện thoại. Đã xem ảnh giao diện do Chromium tạo.

Chưa kiểm thử PowerShell trên Windows, đóng gói desktop, OCR hoặc AI (ba phần sau chưa triển khai). Kiểm tra cục bộ không khẳng định đã publish snapshot môi trường hay phát hành ứng dụng.
