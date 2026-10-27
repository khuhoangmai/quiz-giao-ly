# Quiz ôn tập Giáo lý – Tin Mừng theo Thánh Mát-thêu

## Cách dùng
Mở tệp `index.html` bằng trình duyệt (Chrome, Safari, Edge…) – không cần cài đặt hay kết nối mạng.
Có thể đưa cả thư mục lên bất kỳ dịch vụ hosting tĩnh nào (GitHub Pages, Netlify, Google Drive + trình xem web…).

## Thay logo nhóm
Hiện đang dùng logo tạm. Hãy **ghi đè** tệp `assets/logo.png` bằng logo thật của nhóm
**Sinh viên Công giáo Thái Bình - Hà Nội** (hình vuông, nền trong hoặc trắng, khoảng 256×256 px trở lên).

## Cấu trúc
```
index.html          Trang chủ: danh sách đề + tiến độ tổng
quiz.html           Trang làm bài (quiz.html?set=<mã đề>)
css/style.css       Giao diện
js/core.js          Lưu tiến độ, âm thanh đúng/sai
js/app.js           Logic trang chủ
js/quiz.js          Logic làm bài
assets/             bg.png (nền), logo.png (logo nhóm – thay bằng logo thật)
data/               Dữ liệu câu hỏi, chia nhỏ:
  01-de-cuong.js                      45 câu đề cương
  02-trac-nghiem-01..06.js            180 câu trắc nghiệm (6 × 30)
  02-trac-nghiem-random.js            bốc ngẫu nhiên 30/180
  03-dien-tu-01..10.js                300 câu điền từ (10 × 30)
  03-dien-tu-random.js                bốc ngẫu nhiên 30/300
  04-luoc-su-01..04.js                70 câu lược sử (20 + 20 + 20 + 10)
  04-luoc-su-random.js                bốc ngẫu nhiên 20/70
```

## Sửa / thêm câu hỏi
Mỗi câu trong `data/*.js` có dạng `{ n: số câu gốc, q: "câu hỏi", o: ["A","B","C","D"], a: 0 }`
(`a` là vị trí đáp án đúng: 0 = A, 1 = B, 2 = C, 3 = D).

## Tính năng
- Chọn đáp án: đúng hiện **xanh**, sai hiện **đỏ** (đồng thời hiện đáp án đúng), kèm âm thanh đúng/sai (nút 🔊 để tắt).
- Thanh tiến độ trong từng đề + tiến độ tổng ở trang chủ; tự lưu và làm tiếp khi mở lại.
- Màn hình kết quả, xem lại câu sai, luyện lại riêng các câu sai.
- Đề ngẫu nhiên: mỗi lần bấm "Bốc câu mới" sẽ ra bộ câu khác.
