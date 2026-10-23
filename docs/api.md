# API 0.1

Prefix `/api/v1`; request/response JSON, ngoại trừ upload multipart và tải ZIP. OpenAPI tương tác tại `/docs` khi chạy máy chủ. Lỗi `{ "detail": ... }`; 404 không tìm thấy, 409 xung đột/trạng thái/thiếu câu, 422 đầu vào không hợp lệ, 413 tệp quá lớn. Đáp án và vị trí đánh số từ 0.

| Phương thức / đường dẫn | Công dụng |
| --- | --- |
| GET, POST `/topics` | Danh sách/thêm `{ten, chu_de_id?}` |
| GET, POST `/questions` | Ngân hàng/thêm nháp |
| PATCH `/questions/{id}` | Gửi toàn bộ nội dung form, tạo phiên bản mới về nháp |
| POST `/questions/{id}/review` | `{trang_thai: draft/approved/rejected/retired}` |
| DELETE `/questions/{id}` | Ngừng dùng, không xóa lịch sử |
| GET, POST `/blueprints` | Mẫu đề `{ten, thoi_gian_phut, phan_bo, da_xac_minh:false}` |
| POST `/exams/generate` | `{mau_de_thi_id, hat_giong:42, cua_so_gan_day:3}` |
| GET `/exams/{id}` | Snapshot công khai luôn ẩn đáp án, lời giải và trích dẫn |
| GET, POST `/attempts` | Lịch sử/bắt đầu hoặc tiếp tục `{de_thi_id}` |
| GET `/attempts/{id}` | Trạng thái, đáp án đã lưu và deadline; hết giờ tự chấm |
| PUT `/attempts/{id}/answers/{position}` | `{lua_chon:[0]}`, lưu ngay; `[]` bỏ chọn |
| POST `/attempts/{id}/submit` | Chấm xác định, gọi lại không thay đổi kết quả |
| GET `/attempts/{id}/result` | Chỉ sau nộp; không xem khi còn bài khác đang làm |
| GET `/analytics/overview`, `/analytics/topics` | Số liệu thật từ kết quả đã nộp |
| GET `/reviews/due` | Thẻ đến hạn đã duyệt; khóa trong lúc thi |
| GET, POST `/documents` | Danh sách/upload `file` PDF hoặc DOCX, trích xuất ngay |
| POST `/documents/{id}/parse` | Trả đoạn đã trích (idempotent, không thay ID trích dẫn) |
| GET `/documents/{id}/chunks` | Các đoạn nguồn với ID, trang và nội dung |
| POST `/backup` | Tạo ZIP, trả `{ten_tep,tai_xuong}` |
| GET `/backup/{id}` | Tải bản ZIP đã tạo |
| POST `/backup/restore?xac_nhan=true` | Upload `file` ZIP; kiểm tra, tự dự phòng, khôi phục |
| GET `/system/health` | SQLite, foreign keys, migration, AI disabled |
| POST `/ai/jobs` | 501, tính năng chưa triển khai |

Câu hỏi: `{chu_de_id, noi_dung, loai, do_kho, lua_chon:["A","B"], dap_an_dung:[0], giai_thich:"", doan_tai_lieu_id:null, trich_dan:""}`. `loai`: `single`, `multiple`, `true_false`; `do_kho`: `easy`, `medium`, `hard`. Trích dẫn phải là chuỗi con nguyên văn của đoạn nguồn. Chỉ duyệt thủ công.

Phân bổ: `{chu_de_id, so_luong, loai:null, do_kho:null}`. Tối đa 100 câu, 30 phân bổ, thời gian 1–240 phút. Lỗi thiếu câu: `409 {detail:{thong_bao,thieu:[{phan_bo,can,co,...}]}}`. Không persist đề dở dang.

API không yêu cầu tài khoản vì chỉ phục vụ một người dùng trên localhost; không triển khai ra mạng công cộng. Bật một worker. Ngân hàng và thẻ ôn tạm khóa nếu còn bài thi chưa hết hạn; bài hết hạn được chấm trước khi cho xem. Không có cam kết API multi-user hay phân quyền.
