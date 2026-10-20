# Original User Request

## Initial Request — 2026-10-19T11:38:49Z

Xây dựng "NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)" — Nền tảng Game Show tương tác lớp học thời gian thực (Host máy chiếu + 40-50 mobile client) phục vụ môn MLN131 (Dân chủ XHCN & Truyền thông số). Game được tổ chức theo cấu trúc Game Show giải đấu 4 vòng dồn dập (hoặc chơi lẻ từng mode), phong cách đồ họa meme hoạt hình hiện đại, âm thanh bựa, văn phong Gen Z châm biếm thông minh, loại bỏ hoàn toàn lối mòn trắc nghiệm giáo điều.

Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Integrity mode: development

## Asset & Visual Pipeline (Quy tắc bắt buộc)
Thực hiện tìm kiếm và thu thập tài nguyên đồ họa/âm thanh theo thứ tự ưu tiên nghiêm ngặt:
1. **Ưu tiên 1 - Tải trên mạng:** Tìm kiếm và tích hợp tài nguyên đồ họa chất lượng cao (SVG, PNG minh họa meme, icon vector, sound effect arcade/meme từ các kho mở hoặc CDN công khai: Lucide, OpenGameArt, Flaticon open assets, Google Fonts, Freesound).
2. **Ưu tiên 2 - Gen AI:** Nếu trên mạng không có ảnh/meme đúng ngữ cảnh MLN131, sử dụng subagent tạo ảnh hoặc công cụ sinh đồ họa.
3. **Ưu tiên 3 - Code:** Tự dựng hoạt họa bằng HTML5 Canvas 2D, SVG hoặc Tailwind/CSS Keyframe animations.
4. **Ưu tiên 4 - Báo cáo:** Nếu gặp bế tắc kỹ thuật không thể tìm hay dựng được, dừng lại và báo cáo phương án cho người dùng.

---

## Requirements

### R1. Cấu Trúc Game Show 4 Vòng Đấu Dồn Dập (Tournament & Free-play)
Thay vì 4 trò chơi rời rạc làm loãng trải nghiệm, hệ thống tổ chức thành Một Giải Đấu Hoàn Chỉnh (Full Game Show) giữ nguyên điểm số và cảm xúc leo thang, đồng thời cho phép Host chọn chơi riêng từng vòng:
- **Vòng 1: "Đại Hội Cà Khịa & Check VAR" (Jackbox / Quiplash):**
  - Màn hình máy chiếu đưa ra tình huống drama số hài hước.
  - Người chơi gõ câu phản biện/bình luận bựa nhất trên điện thoại.
  - 2 câu ngẫu nhiên lên máy chiếu đối đầu; cả lớp đọc to và vote câu mặn nhất, ném cà chua, thả tim, gạch đá bay ngập màn hình (Danmaku realtime).
- **Vòng 2: "Chiến Binh 5 Giây Dị Hợm" (WarioWare / Dumb Ways to Die):**
  - Chuỗi mini-game phản xạ 5 giây: Bấm tóm nút Report đang chạy trốn, lắc điện thoại lấy OTP, né gạch đá drama, soi điểm ảnh Deepfake.
  - Tốc độ dồn dập, hiệu ứng nổ tung khi thua, mang lại tiếng cười sảng khoái.
- **Vòng 3: "Vạch Mặt Seeder & Check VAR" (Among Us / Social Deduction):**
  - 45 Dân Mạng lương thiện đối đầu 5 "Seeder Bẩn / Botnet Lùa Gà" trà trộn.
  - Cả lớp tranh luận, kiểm tra manh mối bài đăng và tiến hành bỏ phiếu công khai để bế Seeder đi.
- **Vòng 4: "Đại Chiến Lật Kèo & Cướp Điểm" (Sabotage Trivia Final):**
  - Vòng chung kết giải quyết các tình huống MLN131 kết hợp thẻ bài chơi xấu: Đổ mực màn hình Top 1, Cướp 50% điểm, Bẻ lái câu hỏi troll, Đặt cược niềm tin x2 điểm.

### R2. Visual Identity & Tone (Party Game Gen Z)
- Thiết kế đồ họa meme tươi sáng, biểu cảm nhân vật hài hước, layout 16:9 sắc nét cho máy chiếu phòng học và giao diện mobile tối ưu chạm 1 ngón tay.
- Văn phong hoàn toàn trẻ trung, hóm hỉnh (Cảnh sát chính tả, Bẫy lùa gà, Check VAR, Anh hùng bàn phím), lồng ghép kiến thức MLN131 một cách tự nhiên, duyên dáng, không giáo điều.

### R3. Hệ Thống Âm Thanh Bựa & Sống Động
- Tích hợp âm thanh arcade, tiếng vỗ tay, còi troll, tiếng nổ, nhạc nền dồn dập tăng nhịp tim qua Web Audio API hoặc audio assets tải về.

### R4. Kiến Trúc Kỹ Thuật & Tương Thích Vercel
- Nền tảng Next.js, đồng bộ thời gian thực mượt mà cho 40-50 kết nối đồng thời.
- Mã nguồn chạy ổn định cả trên Local LAN (Offline trong lớp học) và 1-click deploy lên Vercel.

---

## Acceptance Criteria

### Tính Năng & Trải Nghiệm Gameplay
- [ ] Giao diện Hub cho phép Host bắt đầu giải đấu 4 vòng liên tục hoặc chọn chơi riêng từng vòng tùy thích.
- [ ] Vòng 1 (Cà Khịa): Nhập text mobile ➔ Hiển thị đối đầu trên máy chiếu ➔ Cả lớp vote và thả biểu cảm (cà chua, tim, gạch) bay trực tiếp trên màn hình.
- [ ] Vòng 2 (Mini-games 5s): Có ít nhất 4 mini-game phản xạ 5 giây hoạt động trơn tru với đồng hồ đếm ngược và hiệu ứng thắng/thua.
- [ ] Vòng 3 (Vạch mặt Seeder): Hệ thống phân vai bí mật (Dân mạng vs Seeder), có pha tranh luận và biểu quyết vote loại trừ.
- [ ] Vòng 4 (Lật kèo): Cơ chế thẻ bài chơi xấu (đổ mực, cướp điểm, cược x2) hoạt động chính xác.

### Chất Lượng Đồ Họa & Kỹ Thuật
- [ ] Đồ họa đạt chuẩn Party Game bắt mắt, tươi sáng, có icon/ảnh minh họa meme chất lượng cao.
- [ ] Tích hợp chế độ Dev Bot Simulator (giả lập 15-20 sinh viên ảo) để test toàn bộ các vòng trực tiếp mà không cần nhiều điện thoại.
- [ ] Giao diện điện thoại 100% Mobile-first, không bị cuộn trang ngoài ý muốn, touch target lớn.
- [ ] `npm run build` thành công, không có lỗi TypeScript hoặc SSR.


## Follow-up — 2026-10-19T13:18:55Z

CHỈ ĐẠO MỚI TỪ NGƯỜI DÙNG:
"không phải là chung 1 lần chơi mà mỗi cái là một mode game ấy host chọn để bắt đầu game ấy"

Yêu cầu kiến trúc:
1. KHÔNG chơi gộp thành 1 giải đấu tuyến tính (Round 1 -> 2 -> 3 -> 4 bắt buộc).
2. Thiết kế thành Party Game Hub với 4 Game Mode ĐỘC LẬP (như Jackbox Party Pack / Mario Party mini-games):
   - Mode 1: "Đại Hội Cà Khịa & Check VAR" (Jackbox Quiplash)
   - Mode 2: "Chiến Binh 5 Giây Dị Hợm" (WarioWare)
   - Mode 3: "Vạch Mặt Seeder & Check VAR" (Social Deduction)
   - Mode 4: "Đấu Trường Chơi Xấu Cướp Điểm" (Sabotage Trivia)
3. Host tại sảnh chính bấm chọn một chế độ bất kỳ để toàn bộ phòng cùng vào chơi chế độ đó.
4. Chơi xong một Mode sẽ có màn vinh danh và nút "Quay Về Sảnh Chính (Return to Hub)" để Host chọn Mode khác.
5. Người chơi trên điện thoại giữ nguyên kết nối (không phải quét lại QR hay nhập lại PIN), tự động chuyển đổi màn hình theo Mode mà Host kích hoạt.

Tài liệu prompt_draft.md đã được cập nhật. Hãy chuyển chỉ đạo này cho Orchestrator và các workers thực thi ngay.


## Follow-up — 2026-10-19T15:28:48Z

Xây dựng & Tái cấu trúc "NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)" — Nền tảng Party Game thời gian thực cho lớp học 40-50 sinh viên môn MLN131 (Dân chủ XHCN & Truyền thông số). Khắc phục toàn bộ các hạn chế về thời gian chờ, thao tác kỳ cục, đổi mới Game 3 thành Trưng Cầu Dân Ý gay cấn, và tích hợp cơ chế điểm thưởng giảm dần theo thời gian phản xạ.

Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Integrity mode: development

## Asset & Visual Pipeline (Quy tắc bắt buộc)
Thực hiện tìm kiếm và thu thập tài nguyên đồ họa/âm thanh theo thứ tự ưu tiên nghiêm ngặt:
1. **Ưu tiên 1 - Tải trên mạng:** SVG, PNG meme, icon Lucide, âm thanh Web Audio API / open-source.
2. **Ưu tiên 2 - Gen AI:** Sinh asset đồ họa khi thiếu hình ảnh ngữ cảnh MLN131.
3. **Ưu tiên 3 - Code:** HTML5 Canvas 2D, SVG component, Tailwind CSS Keyframes.
4. **Ưu tiên 4 - Báo cáo:** Báo cáo nếu gặp bế tắc kỹ thuật.

---

## Requirements

### R1. Mode 1 Mới: "Tường Bình Luận Triệu Like" (Trending Feed Wall)
- Thay thế hoàn toàn 25 cặp đấu 1v1: 50 sinh viên cùng gõ bình luận/cà khịa tình huống MLN131 trong 45 giây.
- Pha lướt Like & Reaction (30 giây): Màn hình máy chiếu hiển thị Newsfeed mạng xã hội. Tất cả 50 sinh viên cùng lướt trên điện thoại và bấm Thả Tim (❤️), Ném Cà Chua (🍅), Quăng Gạch (🧱) cho nhau.
- Các bình luận nhận nhiều tương tác nhất tự động nhảy lên Top Trending trên máy chiếu kèm hiệu ứng còi vinh danh. Tổng thời gian chỉ 1.5 - 2 phút cho cả lớp!

### R2. Mode 2 Mới: "Đại Chiến Bóc Phốt 5 Giây" (Fact or Cap 5s Reflex)
- Loại bỏ hoàn toàn các thao tác lắc điện thoại hoặc mini-game kéo thả kỳ cục.
- Cơ chế: Máy chiếu chớp 5 câu phát ngôn/tình huống giật gân về Dân chủ XHCN và truyền thông số kèm quả bom 5s đếm ngược.
- Điện thoại: Chỉ gồm 2 nút bấm khổng lồ: [🟢 FACT / CHUẨN] và [🔴 CAP / BỐC PHÉT]. Càng nhanh điểm càng cao, bấm sai bị nổ bom mất mạng.

### R3. Mode 3 MỚI: "Trưng Cầu Dân Ý: Đoán Phe Đa Số" (The Consensus Dilemma)
- Khắc phục việc sinh viên không quen mặt nhau: Không bắt người thật trong lớp.
- Cơ chế: Máy chiếu chiếu các tình huống tiến thoái lưỡng nan số (Dilemmas) sâu sắc gắn liền với MLN131 (quyền riêng tư vs giám sát an ninh, tự do phát ngôn vs trách nhiệm xã hội, thuật toán đề xuất vs đạo đức công dân).
- Cách chơi: Mỗi người chơi trên điện thoại (1) Chọn phe của mình [A] vs [B]; (2) Đặt cược xem TRÊN 50% CẢ LỚP SẼ CHỌN PHE NÀO?
- Hiệu ứng máy chiếu: Thanh kéo co Tug-of-war giằng co Realtime giữa 2 phe. Phe đa số ăn điểm lớn (+5000), phe thiểu số bị ăn gạch nát màn hình!

### R4. Mode 4: "Đấu Trường Chơi Xấu Cướp Điểm" (Sabotage Trivia)
- Đưa nút [Thử Ngay Mode 4] ra vị trí nổi bật tại Sảnh chính (Hub).
- Trả lời trắc nghiệm tình huống MLN131 kết hợp tung thẻ bài chơi xấu: Đổ mực đen che màn hình đối thủ, Cướp 50% điểm, Cược niềm tin x2.

### R5. Cơ Chế Tính Điểm Giảm Dần Theo Thời Gian (Speed-Decay Scoring)
- Áp dụng cho các vòng phản xạ và trắc nghiệm (Mode 2, Mode 3, Mode 4).
- Công thức: Điểm nhận được = BasePoints * (RemainingTime / TotalTime).
- Ví dụ: Trả lời trong 1 giây đầu nhận tối đa 100% điểm; trả lời muộn điểm giảm dần còn 80%, 60%, 40%... Bấm sai bị 0 điểm.

---

## Acceptance Criteria
- [ ] Mode 1 chuyển sang cơ chế Tường bình luận triệu like: 50 người cùng submit và cùng thả tim đồng thời, không chia 25 lượt vote lẻ.
- [ ] Mode 2 là chuỗi Fact or Cap 5 giây với 2 nút bấm lớn trên mobile, không dùng cảm biến lắc.
- [ ] Mode 3 là cơ chế Trưng Cầu Dân Ý (Consensus Dilemma): hiển thị thanh Tug-of-war kéo co realtime trên máy chiếu và tính điểm dựa trên việc đoán trúng phe đa số (>50%).
- [ ] Mode 4 có nút truy cập trực tiếp nổi bật ngay tại Hub sảnh chờ.
- [ ] Hệ thống điểm thưởng giảm dần theo thời gian (Speed-decay Scoring) hoạt động chuẩn xác trên các câu trả lời đúng.
- [ ] Dev Bot Simulator cập nhật tương thích với cả 4 cơ chế mới.
- [ ] npm run build thành công, 0 lỗi TypeScript/SSR.
