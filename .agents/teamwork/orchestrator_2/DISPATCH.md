# Dispatch Log

## 2026-10-19T15:31:27Z
Sender: 193f6148-be17-4e02-a7f6-d5626f2d835c
Priority: MESSAGE_PRIORITY_HIGH

You are the Project Orchestrator (teamwork_preview_orchestrator).
Your identity: orchestrator
Your working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\orchestrator_2
Project root: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Original user request path: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\ORIGINAL_REQUEST.md

Important task update:
A new user directive (2026-10-19T15:28:48Z) has been appended to ORIGINAL_REQUEST.md.
User Directive Summary:
Xây dựng & Tái cấu trúc "NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)" — Nền tảng Party Game thời gian thực cho lớp học 40-50 sinh viên môn MLN131 (Dân chủ XHCN & Truyền thông số).
Khắc phục toàn bộ các hạn chế về thời gian chờ, thao tác kỳ cục, đổi mới Game 3 thành Trưng Cầu Dân Ý gay cấn, và tích hợp cơ chế điểm thưởng giảm dần theo thời gian phản xạ.

Key requirements:
R1. Mode 1 Mới: "Tường Bình Luận Triệu Like" (Trending Feed Wall) — thay thế hoàn toàn 25 cặp đấu 1v1. 50 sinh viên cùng gõ bình luận (45s) -> pha Like & Reaction (30s) trên điện thoại (❤️, 🍅, 🧱) -> Top Trending nhảy lên máy chiếu kèm còi vinh danh. Tổng thời gian chỉ 1.5 - 2 phút cho cả lớp!
R2. Mode 2 Mới: "Đại Chiến Bóc Phốt 5 Giây" (Fact or Cap 5s Reflex) — loại bỏ hoàn toàn lắc điện thoại / mini-game kéo thả kỳ cục. Máy chiếu chớp 5 câu phát ngôn/tình huống kèm bom 5s; Mobile chỉ gồm 2 nút lớn: [🟢 FACT / CHUẨN] và [🔴 CAP / BỐC PHÉT]. Càng nhanh điểm càng cao, bấm sai bị nổ bom.
R3. Mode 3 MỚI: "Trưng Cầu Dân Ý: Đoán Phe Đa Số" (The Consensus Dilemma) — không bắt người thật; các tình huống tiến thoái lưỡng nan số gắn liền MLN131 (quyền riêng tư vs giám sát, tự do vs trách nhiệm, thuật toán vs đạo đức). Mobile: (1) Chọn phe [A] vs [B], (2) Đặt cược xem >50% cả lớp sẽ chọn phe nào. Máy chiếu: thanh kéo co Tug-of-war realtime. Phe đa số +5000, phe thiểu số ăn gạch nát màn hình.
R4. Mode 4: "Đấu Trường Chơi Xấu Cướp Điểm" (Sabotage Trivia) — Đưa nút [Thử Ngay Mode 4] ra vị trí nổi bật tại Hub sảnh chờ. Trắc nghiệm tình huống MLN131 + thẻ bài chơi xấu (Đổ mực đen che màn hình đối thủ, Cướp 50% điểm, Cược x2).
R5. Cơ Chế Tính Điểm Giảm Dần Theo Thời Gian (Speed-Decay Scoring) cho Mode 2, 3, 4: Điểm = BasePoints * (RemainingTime / TotalTime). Bấm sai 0 điểm.

Acceptance Criteria:
- [ ] Mode 1 chuyển sang cơ chế Tường bình luận triệu like: 50 người cùng submit và cùng thả tim đồng thời, không chia 25 lượt vote lẻ.
- [ ] Mode 2 là chuỗi Fact or Cap 5 giây với 2 nút bấm lớn trên mobile, không dùng cảm biến lắc.
- [ ] Mode 3 là cơ chế Trưng Cầu Dân Ý (Consensus Dilemma): hiển thị thanh Tug-of-war kéo co realtime trên máy chiếu và tính điểm dựa trên việc đoán trúng phe đa số (>50%).
- [ ] Mode 4 có nút truy cập trực tiếp nổi bật ngay tại Hub sảnh chờ.
- [ ] Hệ thống điểm thưởng giảm dần theo thời gian (Speed-decay Scoring) hoạt động chuẩn xác trên các câu trả lời đúng.
- [ ] Dev Bot Simulator cập nhật tương thích với cả 4 cơ chế mới.
- [ ] npm run build thành công, 0 lỗi TypeScript/SSR.


## 2026-10-19T17:00:33Z
Sender: 193f6148-be17-4e02-a7f6-d5626f2d835c
Priority: MESSAGE_PRIORITY_HIGH

Sentinel Liveness Check: Nhắc nhở cập nhật progress.md với tiến độ khắc phục lỗi và tái thẩm định (re-verification) Milestone 3.
