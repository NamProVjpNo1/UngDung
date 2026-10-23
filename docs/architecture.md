# Kiến trúc và quyết định

## Biên mô-đun

React trình bày và thu thập đầu vào; `services/api.ts` gọi API. `api/routes.py` kiểm tra request và điều phối. `schemas/inputs.py` kiểm tra dữ liệu Pydantic. `services/questions.py`, `exams.py`, `documents.py`, `backups.py` giữ nghiệp vụ. `repositories/questions.py` truy vấn phiên bản hiện hành; `models/entities.py` ánh xạ SQLite. `db/session.py` bật khóa ngoại cho mọi kết nối. API chỉ phục vụ localhost, một người dùng, một worker.

Không có AI được gọi; endpoint AI trả 501. Giai đoạn AI cần một interface provider, opt-in theo nội dung gửi, schema JSON và nhật ký tác vụ; chưa được coi là tính năng hoàn tất.

## Tính xác định và lịch sử

Phân bổ dùng matching bằng đường tăng (augmenting path), xử lý cả slot rộng và slot hẹp chồng lấn. Seed cố định với cùng pool/trạng thái và cửa sổ gần đây cho kết quả giống nhau. Cửa sổ gần đây chỉ là ưu tiên mềm; không giảm số câu. Chưa tối ưu đa dạng nguồn/ngữ nghĩa. Thứ tự lựa chọn hiện giữ nguyên từ phiên bản câu hỏi.

Đề lưu JSON snapshot gồm nội dung, ID phiên bản, lựa chọn, đáp án, giải thích, trích dẫn, phân bổ, seed, thời lượng. Kết quả lưu thêm lựa chọn của người học và điểm. Các bản này không bị sửa khi ngân hàng thay đổi. Sửa câu hỏi tạo phiên bản, tự chuyển về nháp; ngừng dùng thay cho xóa vật lý.

Một bài đang làm tại một thời điểm, deadline do máy chủ xác định. Tự lưu từng thao tác, không đánh dấu thành công trước phản hồi máy chủ. Khi tải lại trang, tiếp tục từ Lịch sử. Hết giờ không cho sửa; server chấm khi có yêu cầu tiếp theo, không có daemon. Nộp lại trả kết quả cũ, không cập nhật lịch ôn lần nữa. Câu nhiều đáp án chấm theo so sánh tập hợp chính xác.

## An toàn dữ liệu

Tệp có tên UUID; tên người dùng chỉ là nhãn. PDF/DOCX kiểm tra định dạng, kích thước, DOCX có giới hạn dung lượng giải nén. Văn bản PDF tách theo trang; DOCX mới đọc paragraph, chưa bảng hoặc trang thật. Dữ liệu không truyền ra dịch vụ ngoài. Chưa quản lý phiên bản/hiệu lực tài liệu; không tự xác nhận giá trị pháp lý của tài liệu hay trích dẫn.

Sao lưu lấy snapshot SQLite bằng API online backup rồi đóng gói đúng tài liệu được tham chiếu. Khôi phục xác minh trước, tạo bản dự phòng, đóng connection pool và thay DB qua rename cùng filesystem. Tài liệu ngoài bản restore được giữ trên đĩa, không còn trong danh mục DB. ZIP giới hạn 100 MB nén, 250 MB giải nén. Migration lưu bản SQLite trước thay đổi schema. Không xóa hoặc tự sửa dữ liệu lỗi.

Khóa trong tiến trình serialize mutations. Chỉ hỗ trợ một worker; không phù hợp nhiều người dùng/máy chủ. Các tab đang mở cần tải lại sau restore. Đây không phải sandbox bảo vệ khỏi người có quyền đọc trực tiếp file SQLite trên máy.

## Lộ trình

- P0–P2: luồng thủ công, thi, kết quả, thống kê, backup/restore đã có kiểm thử.
- P3: mới nhập/trích văn bản, chống trùng và trích dẫn; cần versioning nguồn, hiệu lực, segmentation theo điều/khoản và OCR riêng.
- P4: AI nháp/opt-in/audit chưa triển khai.
- P5: có lịch ôn cơ bản; còn drill chuyên biệt, tự luận, bộ cài Windows và polish.

Không đoán cấu trúc đề chính thức, giấy phép, nhà cung cấp AI hoặc phương án đóng gói. Các quyết định đó cần thông tin từ chủ dự án ở giai đoạn tương ứng.
