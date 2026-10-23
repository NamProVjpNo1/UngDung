# Dữ liệu

Migration: `backend/migrations/versions/0001_initial.py`. Schema ứng dụng dùng tiếng Việt không dấu; bảng `alembic_version` do Alembic quản lý là ngoại lệ thư viện.

| Bảng | Vai trò |
| --- | --- |
| `chu_de` | Chủ đề có khóa ngoại cha tùy chọn |
| `tai_lieu` | Tài liệu gốc, hash SHA-256 duy nhất, đường dẫn UUID |
| `doan_tai_lieu` | Văn bản theo trang/khối, nguồn của trích dẫn |
| `cau_hoi` | Chủ đề, trạng thái và số phiên bản hiện tại |
| `phien_ban_cau_hoi` | Phiên bản nội dung JSON bất biến, liên kết đoạn nguồn |
| `mau_de_thi` | Phân bổ JSON theo chủ đề/loại/độ khó, thời lượng |
| `de_thi` | Snapshot câu hỏi, đáp án, quy tắc điểm, phân bổ, seed |
| `lan_lam_bai` | Bắt đầu/deadline UTC, đáp án tự lưu, kết quả bất biến |
| `lich_on_tap` | Số lần đúng liên tiếp và thời điểm đến hạn |

PK `id`, FK `<ten_bang>_id`; mọi kết nối SQLAlchemy bật `PRAGMA foreign_keys=ON`. Có chỉ mục cho trạng thái, chủ đề và các quan hệ dùng thường xuyên. JSON thay bảng option/slot/snapshot riêng trong lát cắt đầu tiên; kiểm tra chặt bằng Pydantic và dịch vụ. Các bảng phiên bản tài liệu, AI audit, kiểm duyệt audit chưa được triển khai.

Không dùng `create_all()` khi chạy ứng dụng: chạy migration bằng script. Thử nghiệm dùng Alembic thật trên DB tạm. Tất cả thời gian lưu ISO 8601 UTC. Mỗi câu đúng bằng `10 / tổng câu`; lựa chọn dùng chỉ số bắt đầu từ 0.
