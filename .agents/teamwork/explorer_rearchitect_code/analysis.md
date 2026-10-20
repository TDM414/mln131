# BÁO CÁO PHÂN TÍCH KIẾN TRÚC & KẾ HOẠCH TÁI CẤU TRÚC
## DỰ ÁN: NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 EDITION)
**Thời gian phân tích:** 2026-10-19T15:40:00Z  
**Tác giả:** Explorer Subagent (`explorer_rearchitect_code`)  
**Đối tượng bàn giao:** Orchestrator & Builder Team  
**Căn cứ chỉ đạo:** `ORIGINAL_REQUEST.md` (Update 2026-10-19T15:28:48Z) & `DISPATCH.md`

---

## 1. TỔNG QUAN HIỆN TRẠNG (EXECUTIVE SUMMARY)

Dự án hiện đã hoàn thành khung cơ sở của ứng dụng Next.js 14 App Router với hệ thống đồng bộ lưỡng kênh (`BroadcastChannel` cho tab nội bộ + HTTP Delta Polling cho mobile LAN/Vercel), hệ thống tổng hợp âm thanh thủ tục Web Audio API không phụ thuộc file ngoài, và sảnh chờ Hub.

Tuy nhiên, cấu trúc hiện tại đang triển khai theo đặc tả vòng chơi ban đầu, dẫn đến nhiều điểm nghẽn nghiêm trọng khi chạy trong lớp học 40-50 sinh viên:
1. **Vòng 1 cũ (Quiplash Duel 1v1):** Chia 50 sinh viên thành 25 cặp đấu 1v1 độc lập. Mỗi cặp phải chiếu lên máy chiếu và chờ cả lớp vote 15 giây ➔ Cần tới 20-25 phút cho chỉ riêng Vòng 1, làm loãng nhịp Game Show.
2. **Vòng 2 cũ (WarioWare mini-games):** Sử dụng các mini-game phức tạp như lắc gia tốc kế điện thoại (`DeviceMotionEvent` thường bị chặn quyền trên Safari/Android), kéo thả né gạch trên canvas nhỏ, gây ức chế và không đồng đều phần cứng.
3. **Vòng 3 cũ (Social Deduction / Vạch mặt Seeder):** Chỉ định 3 sinh viên làm nghi phạm và đưa lên ghế nóng để cả lớp thẩm vấn bế đi. Trong lớp học thực tế 40-50 người, sinh viên thường không quen nhau, gây ngại ngùng, gượng gạo và thụ động.
4. **Vòng 4 cũ:** Chưa có nút truy cập trực tiếp nổi bật ngoài Hub; cơ chế tính điểm chưa tích hợp công thức phản xạ giảm dần theo thời gian (Speed-Decay).
5. **DevBotSimulator:** Mới chỉ giả lập theo luồng Quiplash 1v1 cũ và 4 mini-game WarioWare cũ, chưa hỗ trợ các cơ chế mới.

---

## 2. KIỂM KÊ VÀ ĐÁNH GIÁ CHI TIẾT TỪNG MODULE HIỆN CÓ

| File / Module | Hiện trạng | Khả năng tái sử dụng | Cần refactor / viết lại |
|---|---|---|---|
| `src/lib/types.ts` | 432 dòng. Chứa định nghĩa `Round1State` (Quiplash duels), `Round2State` (WarioWare), `Round3State` (Suspects/Exile), `Round4State`. Còn chứa nhiều alias Boss Raid cũ. | Tái sử dụng `Player`, `DanmakuMessage`, `GameMode`, `GameStatus`, `SabotageCard`. | Thêm các interface mới cho 4 Mode: `TrendingPost`, `FactOrCapQuestion`, `ConsensusDilemma`. Cập nhật `Round1State`, `Round2State`, `Round3State`, `Round4State`. Dọn dẹp legacy. |
| `src/app/api/game/route.ts` | 600 dòng. Lưu trữ state in-memory `rooms`, hỗ trợ GET polling delta events, POST actions (`JOIN`, `SUBMIT_ROAST`, `VOTE_ROAST`, `MINIGAME_RESULT`, `VOTE_EXILE`, `PLAY_CARD`, `SUBMIT_TRIVIA`). | Cơ chế in-memory room, delta ring buffer 120 events rất mượt, có thể giữ nguyên 100% khung sườn. | Cập nhật logic xử lý POST: thêm `SUBMIT_FEED_COMMENT`, `REACT_FEED_POST` (cho Mode 1); `SUBMIT_FACT_OR_CAP` (cho Mode 2); `SUBMIT_CONSENSUS` (cho Mode 3); cập nhật Speed-Decay scoring cho Mode 2, 3, 4. |
| `src/lib/syncEngine.ts` | 283 dòng. Lưỡng kênh: `BroadcastChannel` (0ms) + Polling (Host 350ms, Client 700ms). Bounded `seenEventIds`. | Khung sườn cực tốt, hoạt động rất ổn định cả trên Vercel serverless và Local LAN. | Bổ sung các action methods: `submitFeedPost()`, `reactToPost()`, `submitFactOrCap()`, `submitConsensus()`. Giữ tương thích ngược. |
| `src/lib/audioSynthesizer.ts` | 663 dòng. Web Audio API 100% procedural (Troll Airhorn, Applause, Countdown Tick, Splat, Correct Chime, Wrong Buzz, Sabotage Stab, Victory Fanfare, 128 BPM Party BGM Loop). | Tái sử dụng 100%. Các hiệu ứng còi troll, bom nổ, vỗ tay, countdown tick rất phong phú và sẵn sàng phục vụ 4 mode mới. | Không cần sửa code âm thanh, chỉ cần gọi đúng SFX trong từng mode mới. |
| `src/data/questions.ts` | 328 dòng. Chứa 15 câu trắc nghiệm `MLN131_QUESTIONS`, 8 tình huống `MLN131_ROAST_PROMPTS`, `ROAST_QUICK_CHIPS`, `VIETNAMESE_ROAST_BANK`, bộ lọc profanity. | Rất phong phú, chất lượng cao, đúng chuẩn môn MLN131. | Bổ sung thêm ngân hàng câu hỏi cho Mode 2 (`MLN131_FACT_OR_CAP_QUESTIONS`: 8-10 câu) và Mode 3 (`MLN131_CONSENSUS_DILEMMAS`: 5-6 tình huống tiến thoái lưỡng nan). |
| `src/components/HostLobby.tsx` | 325 dòng. Sảnh chờ, QR code, danh sách sinh viên, chọn Tournament vs Free-Play. | Giữ bố cục 3 cột trực quan, QR code máy chiếu, danh sách sinh viên theo 10 Persona. | Đưa nút `[Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm]` ra vị trí nổi bật tại Sảnh chính (Hub). Cập nhật mô tả và tiêu đề 4 Mode. |
| `src/components/Round1Host.tsx` & `Round1Play.tsx` | 811 dòng (Host), 427 dòng (Play). Hiện đang chạy 1v1 Quiplash duels. | Tái sử dụng component hiển thị Persona avatar, chips gợi ý bắt trend, profanity filter. | **Viết lại thành Trending Feed Wall**: 45s gõ bình luận ➔ 30s lướt feed thả ❤️/🍅/🧱 ➔ Vinh danh Top Trending trên máy chiếu. |
| `src/components/Round2Host.tsx` & `Round2Play.tsx` | 1049 dòng (Host), 823 dòng (Play). Hiện chạy 4 mini-game WarioWare. | Tái sử dụng thanh đếm ngược, bom nổ, hiển thị 3 mạng ❤️❤️❤️, chế độ Ma Mạng 👻. | **Viết lại thành Fact or Cap 5s Reflex**: 5 câu phát ngôn giật gân, quả bom 5s đếm ngược trên máy chiếu, Mobile chỉ có 2 nút to đùng `[🟢 FACT / CHUẨN]` và `[🔴 CAP / BỐC PHÉT]`. |
| `src/components/Round3Host.tsx` & `Round3Play.tsx` | 437 dòng (Host), 192 dòng (Play). Hiện chạy suy đoán xã hội bế Seeder đi. | Tái sử dụng thẻ Persona, hiển thị countdown, confetti. | **Viết lại thành Trưng Cầu Dân Ý (Consensus Dilemma)**: Dilemma MLN131 ➔ Mobile chọn phe A/B & cược >50% ➔ Máy chiếu hiển thị thanh Kéo co Tug-of-war realtime giằng co ➔ Phe đa số ăn điểm lớn (+5000), phe thiểu số ăn gạch. |
| `src/components/Round4Host.tsx` & `Round4Play.tsx` | 324 dòng (Host), 272 dòng (Play). Sabotage Trivia (Mực đen, Cướp điểm, Cược x2). | Tái sử dụng 100% cơ chế thẻ bài, overlay lau mực, chọn đáp án. | Tích hợp công thức điểm Speed-Decay. Đảm bảo nút Return to Hub hoạt động mượt mà. |
| `src/components/DevBotSimulator.tsx` | 445 dòng. Giả lập 15 sinh viên ảo tham gia phòng. | Giữ nguyên danh sách 15 bot sinh viên Việt Nam, tốc độ phản ứng Fast/Realistic/Chaotic, bão Danmaku. | Cập nhật phản hồi bot cho 4 mode mới: Mode 1 nộp bài & like/ném gạch feed; Mode 2 bấm Fact/Cap trong 5s; Mode 3 vote phe A/B & cược đa số; Mode 4 tung thẻ bài & trả lời trắc nghiệm với speed decay. |

---

## 3. THIẾT KẾ CHI TIẾT & BẢN VẼ TÁI CẤU TRÚC CHO 4 GAME MODE MỚI

### 3.1. Mode 1 Mới: "Tường Bình Luận Triệu Like" (Trending Feed Wall)
- **Mục tiêu gameplay**: 50 sinh viên cùng tham gia đồng thời, nhịp độ dồn dập, tổng thời gian toàn vòng gói gọn trong **1.5 - 2 phút**.
- **Cấu trúc 3 Phase**:
  1. **Phase 1: Gõ Bình Luận Cà Khịa (45 giây)**:
     - Máy chiếu: Hiển thị tình huống drama số MLN131 (ví dụ: KOL bán thực phẩm chức năng lừa đảo, tin đồn đổi tiền, đa cấp công nghệ blockchain lượng tử). Đồng hồ đếm ngược 45s kèm âm thanh tick.
     - Mobile: Form nhập comment tối đa 100 ký tự kèm khay chip bắt trend nhanh (Ủa alo, Lùa gà trắng trợn, Dân biết dân bàn nha, Check VAR ngay). Sinh viên có thể nộp ngay.
     - Bộ đếm realtime trên máy chiếu nhảy số: "ĐÃ CÓ 38/50 BÌNH LUẬN LÊN TƯỜNG".
  2. **Phase 2: Lướt Feed & Thả Bão Tương Tác (30 giây)**:
     - Máy chiếu: Biến thành **Newsfeed mạng xã hội trực tiếp**. Tất cả các bình luận của sinh viên hiện lên thành các thẻ bài post sinh động, kèm avatar meme.
     - Mobile: Biến thành giao diện lướt feed mạng xã hội (dạng cuộn dọc). Mỗi post của bạn cùng lớp đều có 3 nút tương tác lớn dễ bấm:
       - ❤️ **Thả Tim (+1 điểm uy tín)**
       - 🍅 **Ném Cà Chua (+1 gạch đá drama)**
       - 🧱 **Quăng Gạch (+1 bất bình)**
     - Cơ chế chống spam: Mỗi người chơi được tương tác thoải mái nhưng mỗi post tối đa 1 reaction.
  3. **Phase 3: Đại Tiệc Top Trending & Vinh Danh (15-20 giây)**:
     - Máy chiếu: Tự động tính toán điểm tương tác `(Likes + Tomatoes + Bricks)`. Top 3 - Top 5 bài viết có lượng tương tác "khủng" nhất tự động phóng to, bay lên vị trí **TOP TRENDING MẠNG XÃ HỘI** với hiệu ứng viền vàng phát sáng, còi Troll Airhorn và pháo hoa giấy!
     - Điểm thưởng:
       - Top 1 Trending: **+3,000 điểm**
       - Top 2 Trending: **+2,000 điểm**
       - Top 3 Trending: **+1,500 điểm**
       - Tất cả người tham gia: **+100 điểm/mỗi tương tác nhận được**

### 3.2. Mode 2 Mới: "Đại Chiến Bóc Phốt 5 Giây" (Fact or Cap 5s Reflex)
- **Mục tiêu gameplay**: Loại bỏ hoàn toàn cảm biến lắc hay kéo thả phức tạp; tối ưu 100% cho màn hình cảm ứng di động với 2 nút to đùng.
- **Cấu trúc vòng chơi**: Chuỗi 5 câu phát ngôn giật gân liên tiếp (mỗi câu 5 giây).
- **Màn hình máy chiếu (Projector)**:
  - Hiển thị quả bom hẹn giờ 5 giây (`Bomb` icon to, nhấp nháy chuyển từ xanh ➔ vàng ➔ đỏ rực, âm thanh tick dồn dập).
  - Nội dung câu phát ngôn giật gân về Dân chủ XHCN & truyền thông số (ví dụ: *"Dân chủ XHCN là quyền tự do ngôn luận tuyệt đối, có thể ẩn danh chửi bới bất kỳ ai trên mạng xã hội mà không sợ bị pháp luật xử lý?"*).
  - Khi hết giờ (hoặc toàn bộ lớp đã bấm): Quả bom nổ tung (`sound.playExplosion`), hiển thị đáp án đúng kèm tóm tắt lý luận 1 dòng.
- **Màn hình điện thoại (Mobile)**:
  - Chia làm 2 nửa màn hình khổng lồ, touch target cực lớn:
    - Nửa trên / Trái: **[🟢 FACT / CHUẨN MEN]** (Nền xanh lá, chữ to, icon khiên chân lý).
    - Nửa dưới / Phải: **[🔴 CAP / BỐC PHÉT]** (Nền đỏ rực, chữ to, icon mũi tên xạo ke).
  - Khi bấm: Rung nhẹ haptic, hiển thị trạng thái đã chốt đáp án kèm thời gian phản xạ (ví dụ: `0.85s`).
- **Cơ chế 3 mạng & Ma Mạng**:
  - Mỗi sinh viên khởi đầu với 3 mạng ❤️❤️❤️. Bấm sai hoặc hết giờ bị nổ bom trừ 1 mạng.
  - Hết 3 mạng: Biến thành **Ma Mạng 👻**, vẫn tiếp tục tham gia bấm vote dự đoán và thả Danmaku troll máy chiếu.

### 3.3. Mode 3 MỚI: "Trưng Cầu Dân Ý: Đoán Phe Đa Số" (The Consensus Dilemma)
- **Mục tiêu gameplay**: Thay thế trò ma sói/bắt bớ sinh viên gây ngại ngùng bằng một cơ chế tâm lý xã hội học cực kỳ hấp dẫn, gắn liền với các tình huống tiến thoái lưỡng nan của môn MLN131.
- **Quy trình 1 câu Dilemma**:
  1. **Tình huống Dilemma MLN131 chiếu trên máy chiếu**:
     - Ví dụ: *"Nhà nước triển khai hệ thống AI giám sát không gian mạng để phát hiện sớm các vụ lừa đảo tài chính và tin giả bảo vệ người già. Tuy nhiên, một số netizen lo ngại điều này có thể ảnh hưởng đến quyền riêng tư cá nhân."*
     - **Phe A:** Ưu tiên an ninh số & an toàn cộng đồng, chấp nhận để thuật toán giám sát dữ liệu công khai.
     - **Phe B:** Ưu tiên quyền riêng tư dữ liệu cá nhân tuyệt đối, hạn chế tối đa việc can thiệp bằng thuật toán.
  2. **Thao tác 2 bước trên điện thoại của sinh viên**:
     - **Bước 1 (Lập trường cá nhân):** Chọn bạn theo `[Phe A]` hay `[Phe B]`?
     - **Bước 2 (Trực giác dân mạng / Đặt cược):** Dự đoán xem `TRÊN 50% CẢ LỚP SẼ CHỌN PHE NÀO?` (Cược Phe A hay Cược Phe B).
  3. **Hiệu ứng Kéo Co Realtime trên máy chiếu (Tug-of-war)**:
     - Màn hình máy chiếu hiển thị sợi dây kéo co khổng lồ nằm ngang chia đôi màn hình:
       - Bên trái: `Phe A (An ninh số)` - Màu Xanh Cyan neon.
       - Bên phải: `Phe B (Quyền riêng tư)` - Màu Đỏ Cam neon.
     - Giữa sợi dây là biểu tượng Cán cân Dân chủ hoặc Nắm tay kéo co. Khi 50 sinh viên bấm chọn, thanh kéo co **giằng co giật lắc qua lại Realtime** theo tỷ lệ phiếu bầu!
     - Cả lớp có thể cùng nhìn thấy phe nào đang kéo áp đảo phe nào!
  4. **Phán quyết kết quả & Ném gạch phe thiểu số**:
     - Khi hết 20 giây: Còi trọng tài vang lên, phe có số phiếu `>50%` là **Phe Đa Số Chiến Thắng**.
     - Điểm thưởng lớn: Những ai **đoán trúng phe đa số** được thưởng nóng **+5,000 điểm** (cộng thêm Speed-Decay bonus nếu cược sớm)!
     - Phe thiểu số bị hiệu ứng: Cả dàn gạch đá và cà chua nổ tung trên nửa màn hình của phe thiểu số!

### 3.4. Mode 4: "Đấu Trường Chơi Xấu Cướp Điểm" (Sabotage Trivia) & Vị trí nổi bật tại Hub
- **Cải tiến vị trí Hub (`HostLobby.tsx`)**:
  - Bố trí một Banner / Nút bấm đặc biệt siêu nổi bật ngay đầu trang:  
    `[🔥 THỬ NGAY MODE 4: ĐẤU TRƯỜNG CHƠI XẤU CƯỚP ĐIỂM 👑]` với hiệu ứng viền vàng phát sáng nhấp nháy, giúp Host có thể 1-click kích hoạt ngay lập tức.
- **Gameplay**:
  - Giai đoạn 1: Sinh viên nhận thẻ bài chơi xấu ngẫu nhiên trên điện thoại (Mực đen 🦑, Cướp 50% điểm 💰, Cược x2 💎, Khiên hộ thể 🛡️).
  - Giai đoạn 2: Chọn mục tiêu trong phòng để tấn công. Nạn nhân bị đổ mực đen phải chạm liên tục 5-6 lần vào màn hình mới lau sạch được mực để đọc câu hỏi!
  - Giai đoạn 3: Trả lời trắc nghiệm tình huống MLN131 với **Speed-Decay scoring**.

---

## 4. ĐẶC TẢ CÔNG THỨC ĐIỂM GIẢM DẦN THEO THỜI GIAN (SPEED-DECAY SCORING)

Áp dụng cho các vòng có yếu tố thời gian và câu hỏi (Mode 2, Mode 3 cược consensus, Mode 4 trắc nghiệm):

### Công thức chuẩn:
$$\text{PointsEarned} = \text{BasePoints} \times \left( \frac{\text{RemainingTime}}{\text{TotalTime}} \right) \times \text{Multiplier}$$

Trong đó:
- `BasePoints`: Điểm gốc của câu hỏi / thử thách (ví dụ: Mode 2 = 2,000 điểm; Mode 3 = 5,000 điểm; Mode 4 = 10,000 điểm).
- `TotalTime`: Tổng thời gian cho phép (Mode 2: 5,000ms; Mode 3: 20,000ms; Mode 4: 20,000ms).
- `RemainingTime`: Thời gian còn lại tại thời điểm nhận được câu trả lời:
  $$\text{RemainingTime} = \max\left(0, \text{TotalTime} - \text{ReactionTimeMs}\right)$$
- `Multiplier`: Hệ số nhân từ thẻ bài (Thẻ Cược x2 = 2.0; Thường = 1.0).
- Nếu trả lời **sai** hoặc **hết giờ**: $\text{PointsEarned} = 0$.

### Bảng minh họa mẫu điểm nhận được (với BasePoints = 2,000 điểm, TotalTime = 5s):
| Thời gian phản xạ (Reaction Time) | Tỷ lệ thời gian còn lại | Điểm nhận được |
|---|---|---|
| 0.5 giây (siêu nhanh) | 90% | **1,800 điểm** |
| 1.0 giây | 80% | **1,600 điểm** |
| 2.0 giây | 60% | **1,200 điểm** |
| 3.0 giây | 40% | **800 điểm** |
| 4.5 giây (sát nút) | 10% | **200 điểm** |
| Hết 5.0 giây hoặc bấm sai | 0% | **0 điểm** |

Hệ thống cho phép quy định điểm sàn tối thiểu khi trả lời đúng (ví dụ tối thiểu 10% BasePoints để khuyến khích sinh viên trả lời đúng dù chậm).

---

## 5. ĐẶC TẢ TÁI CẤU TRÚC DEVBOTSIMULATOR

File `src/components/DevBotSimulator.tsx` sẽ được cập nhật bộ não mô phỏng để tự động xử lý mượt mà cả 4 chế độ mới mà không cần can thiệp thủ công:

1. **Mode 1 (Trending Feed Wall)**:
   - Trong 45s: 15 bot tự động chọn các câu bình luận sắc bén từ `VIETNAMESE_ROAST_BANK` và gửi rải rác từ giây thứ 3 đến giây thứ 25.
   - Trong 30s lướt Feed: Mỗi bot tự động cuộn qua các bài post của nhau và thả ngẫu nhiên ❤️, 🍅, 🧱 với tần suất 800ms - 1500ms, tạo nên bão tương tác sống động trên Newsfeed máy chiếu.
2. **Mode 2 (Fact or Cap 5s Reflex)**:
   - Khi mỗi câu hỏi 5s kích hoạt, 15 bot tính toán thời gian phản xạ ngẫu nhiên (từ 1.2s đến 4.2s).
   - Tỷ lệ đúng được cấu hình theo Speed Profile:
     - `FAST`: 85% đúng, phản xạ 0.8s - 2.5s.
     - `REALISTIC`: 75% đúng, phản xạ 1.5s - 4.0s.
     - `CHAOTIC`: 55% đúng, phản xạ 0.5s - 4.8s.
   - Bot hết 3 mạng sẽ tự động chuyển sang thả biểu cảm Ma Mạng 👻.
3. **Mode 3 (Consensus Dilemma Tug-of-war)**:
   - 15 bot tự động chọn ngẫu nhiên Phe A hoặc Phe B (tỷ lệ 55:45 hoặc 60:40) và đặt cược phe đa số.
   - Nhịp gửi phân tán trong 15s đầu giúp thanh Kéo Co trên máy chiếu giằng co, dao động chân thực.
4. **Mode 4 (Sabotage Trivia)**:
   - Bot tự động tung thẻ bài chơi xấu vào các bot khác hoặc người chơi thật, sau đó trả lời trắc nghiệm theo công thức Speed-Decay.

---

## 6. HỆ THỐNG DATA CONTRACTS MỚI (`types.ts`, `route.ts`, `syncEngine.ts`)

### 6.1. Hợp đồng dữ liệu `src/lib/types.ts`:

```typescript
// Mode 1: Trending Feed Wall
export type Round1Phase = 'COMMENT_INPUT' | 'FEED_REACTION' | 'TRENDING_REVEAL' | 'ROUND_SUMMARY';

export interface TrendingPost {
  id: string;
  playerId: string;
  playerName: string;
  avatarId: string;
  text: string;
  timestamp: number;
  likes: number; // ❤️
  tomatoes: number; // 🍅
  bricks: number; // 🧱
  totalReactions: number;
}

export interface Round1State {
  phase: Round1Phase;
  currentPromptIndex: number;
  prompt: RoastPrompt;
  posts: Record<string, TrendingPost>; // postId -> TrendingPost
  trendingTopIds: string[];
}

// Mode 2: Fact or Cap 5s
export type Round2Phase = 'INTRO' | 'QUESTION_ACTIVE' | 'QUESTION_RESULT' | 'ROUND_SUMMARY';

export interface FactOrCapQuestion {
  id: number;
  statement: string;
  isFact: boolean; // true = FACT, false = CAP
  explanation: string;
  category: string;
  basePoints: number;
}

export interface Round2State {
  phase: Round2Phase;
  currentQuestionIndex: number;
  questions: FactOrCapQuestion[];
  playerResults: Record<string, {
    choice: 'FACT' | 'CAP';
    isCorrect: boolean;
    reactionTimeMs: number;
    pointsEarned: number;
    livesRemaining: number;
  }>;
  survivorIds: string[];
}

// Mode 3: Consensus Dilemma (Trưng Cầu Dân Ý)
export type Round3Phase = 'DILEMMA_INTRO' | 'VOTE_AND_BET' | 'TUG_OF_WAR_REVEAL' | 'ROUND_SUMMARY';

export interface ConsensusDilemma {
  id: number;
  title: string;
  topic: string;
  scenario: string;
  choiceA: { text: string; label: string };
  choiceB: { text: string; label: string };
  contextMLN131: string;
}

export interface Round3State {
  phase: Round3Phase;
  currentDilemmaIndex: number;
  dilemmas: ConsensusDilemma[];
  playerChoices: Record<string, {
    personalChoice: 'A' | 'B';
    betConsensus: 'A' | 'B';
    timeMs: number;
    pointsEarned?: number;
  }>;
  voteCountA: number;
  voteCountB: number;
  majoritySide?: 'A' | 'B' | 'TIE';
}

// Mode 4: Sabotage Trivia
export interface Round4State {
  phase: Round4Phase;
  currentQuestionIndex: number;
  questions: TriviaQuestion[];
  activeSabotages: Array<{
    id: string;
    fromPlayerId: string;
    fromPlayerName: string;
    targetPlayerId: string;
    cardType: SabotageCardType;
  }>;
  playerAnswers: Record<string, {
    optionIndex: number;
    timeMs: number;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
}
```

### 6.2. Các Action API mới trong `src/app/api/game/route.ts`:
1. `SUBMIT_FEED_COMMENT`: Đăng bài lên tường (Mode 1).
2. `REACT_FEED_POST`: Thả ❤️, 🍅, 🧱 vào bài post cụ thể (Mode 1).
3. `SUBMIT_FACT_OR_CAP`: Nộp đáp án FACT/CAP kèm `reactionTimeMs` ➔ Tính điểm Speed-Decay (Mode 2).
4. `SUBMIT_CONSENSUS`: Nộp lập trường cá nhân + cược đa số kèm `timeMs` ➔ Cập nhật tỷ lệ Tug-of-war realtime (Mode 3).
5. `PLAY_CARD`, `WIPE_INK`, `SUBMIT_TRIVIA`: Đã có sẵn, cập nhật Speed-Decay cho `SUBMIT_TRIVIA` (Mode 4).

---

## 7. KẾ HOẠCH TRIỂN KHAI CHO BUILDER AGENT (FILE-BY-FILE ROADMAP)

Để đảm bảo thực thi chuẩn xác, không gây lỗi biên dịch và giữ mã nguồn luôn ở trạng thái buildable, Builder Agent nên thực hiện theo 4 bước tuần tự sau:

### Bước 1: Foundation & Data (Types, Mock Data, API, Sync Engine)
- File 1: `src/lib/types.ts` — Thêm các interface mới của Mode 1, Mode 2, Mode 3; cập nhật `GameShowState`.
- File 2: `src/data/questions.ts` — Thêm dữ liệu `MLN131_FACT_OR_CAP_QUESTIONS` (10 câu) và `MLN131_CONSENSUS_DILEMMAS` (6 câu).
- File 3: `src/app/api/game/route.ts` — Cập nhật `createInitialRound1State()`, `createInitialRound2State()`, `createInitialRound3State()`, thêm xử lý action `SUBMIT_FEED_COMMENT`, `REACT_FEED_POST`, `SUBMIT_FACT_OR_CAP`, `SUBMIT_CONSENSUS`, áp dụng Speed-Decay formula.
- File 4: `src/lib/syncEngine.ts` — Bổ sung các helper methods tương ứng.

### Bước 2: Tái cấu trúc Mode 1 & Mode 2 (Host & Play)
- File 5: `src/components/Round1Host.tsx` — Xây dựng giao diện Newsfeed Wall + Hiệu ứng Top Trending.
- File 6: `src/components/Round1Play.tsx` — Giao diện nộp comment 45s + Feed cuộn thả ❤️/🍅/🧱 30s.
- File 7: `src/components/Round2Host.tsx` — Màn hình quả bom 5s chớp tắt + bảng kết quả sống/chết.
- File 8: `src/components/Round2Play.tsx` — 2 nút bấm khổng lồ `[🟢 FACT / CHUẨN]` và `[🔴 CAP / BỐC PHÉT]`.

### Bước 3: Tái cấu trúc Mode 3, Mode 4 & Sảnh Hub
- File 9: `src/components/Round3Host.tsx` — Máy chiếu thanh Kéo co Tug-of-war giằng co realtime + mưa gạch phe thiểu số.
- File 10: `src/components/Round3Play.tsx` — Chọn phe A/B + Đặt cược >50% consensus.
- File 11: `src/components/HostLobby.tsx` — Thêm nút nổi bật `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` và cập nhật danh mục 4 Mode.
- File 12: `src/components/Round4Host.tsx` & `Round4Play.tsx` — Tích hợp Speed-Decay cho phần tính điểm trivia.

### Bước 4: Tự động hóa DevBotSimulator & Kiểm thử E2E
- File 13: `src/components/DevBotSimulator.tsx` — Viết lại logic bot phản hồi cho cả 4 chế độ mới.
- Chạy `npm run build` xác minh 0 lỗi TypeScript / SSR.

---

## 8. ĐÁNH GIÁ RỦI RO VÀ BIỆN PHÁP DỰ PHÒNG (RISKS & MITIGATION)

| Rủi ro | Mức độ | Biện pháp dự phòng |
|---|---|---|
| 50 sinh viên cùng spam reaction ❤️/🍅/🧱 trong 30s gây nghẽn network | Trung bình | Tích hợp debounce/throttle nhẹ phía client (100ms), gửi gom payload reaction hoặc dùng cơ chế incremental count in-memory ở server. |
| Độ lệch đồng hồ (Timestamp Drift) giữa Host và Mobile ảnh hưởng Speed-Decay | Thấp | Sử dụng `reactionTimeMs` tính từ lúc client nhận được câu hỏi (local client timer bắt đầu đếm khi component mount `Date.now() - startTimeRef.current`). Server kiểm tra trần tối đa không vượt quá `TotalTime + 1000ms grace period`. |
| Giao diện mobile bị giật/cuộn ngoài ý muốn trên iOS Safari | Thấp | Áp dụng triệt để `h-[100dvh]`, `overflow-hidden`, `select-none`, `touch-none` tại các vùng tương tác chính, touch targets tối thiểu 56px. |

---
*Báo cáo được hoàn thiện và sẵn sàng để chuyển tiếp tới Orchestrator và Builder.*
