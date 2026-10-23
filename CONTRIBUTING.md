# Đóng góp

Đọc `AGENTS.md`, `docs/PROJECT_SPEC.md` và `docs/architecture.md`. Cài theo README, dùng nhánh hiện có trong môi trường cloud; không tự tạo worktree.

Giữ nghiệp vụ xác định và khóa ngoại, lưu bất biến lịch sử, sao lưu trước migration. Không đưa tài liệu, DB, bản sao lưu hoặc thông tin xác thực vào Git. Không gửi nội dung tới AI nếu chưa có sự đồng ý rõ ràng.

Mỗi thay đổi có kiểm thử cho hành vi, chạy pytest/Ruff và build/typecheck frontend; thay đổi luồng giao diện chạy Playwright. Ghi rõ kiểm thử chưa chạy, giới hạn và thay đổi API/schema. Bổ sung migration mới thay vì sửa migration đã có dữ liệu triển khai.

Chưa có giấy phép phân phối được chủ dự án lựa chọn. Cần chốt trước khi phát hành hoặc nhận đóng góp bên ngoài theo một giấy phép cụ thể.
