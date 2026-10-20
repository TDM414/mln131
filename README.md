# 🛡️ DEMOCRACY RAID: ĐẠI CHIẾN KHÔNG GIAN SỐ
> **Chủ đề môn học:** *Dân chủ xã hội chủ nghĩa và liên hệ phát huy dân chủ xã hội chủ nghĩa thông qua nền tảng truyền thông số hiện nay (MLN131)*  
> **Thể loại:** Massive Multiplayer Co-op / Minion Auto-Battler & Gacha Quiz (40 - 50 người cùng chơi trên điện thoại + Máy chiếu trung tâm)  
> **Công nghệ:** Next.js 14, TypeScript, TailwindCSS, HTML5 Canvas 2D Engine, Web Audio API Synthesizer.

---

## 🌟 ĐIỂM NỔI BẬT CỦA TRÒ CHƠI
1. **Zero Friction (Không cần cài app):** 50 bạn sinh viên chỉ cần dùng camera điện thoại quét mã QR trên máy chiếu là vào phòng chơi ngay lập tức.
2. **Khớp 100% nội dung MLN131:**
   - Khai thác trọn vẹn phương châm: *"Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng"* trên không gian số.
   - Nhận diện ranh giới giữa phản biện xã hội văn minh với các thủ đoạn tin giả, Deepfake, bạo lực mạng, vi phạm Luật An ninh mạng.
3. **Cơ chế Gacha Triệu Hồi Quân Đoàn Số:**
   - Trả lời đúng tình huống ➔ Nổ rương Gacha rơi thẻ binh lính (Common ➔ Rare ➔ Epic ➔ Legendary).
   - Lính xuất trận trực tiếp trên màn hình máy chiếu kèm **tên của sinh viên bay lơ lửng trên đầu lính** và xông lên công kích Boss!
   - Trả lời đúng trong 3 giây ➔ Kích hoạt **Đòn Chí Mạng (CRIT x2.5)** và tỷ lệ cao nổ **RỒNG THẦN ĐỒNG THUẬN QUỐC GIA**!
4. **Cơ chế Thổi Còi Giám Sát (Bắt Quả Tang Boss):**
   - Boss thỉnh thoảng vận chiêu nguy hiểm (tung tin giả bôi nhọ, thao túng thuật toán).
   - Màn hình 50 điện thoại rung đỏ báo động ➔ Cả lớp bấm nút **[🚨 THỔI CÒI GIÁM SÁT SỐ]** trong 7 giây để làm Boss bị Choáng (Stun) nhận thêm 50% sát thương!
5. **Phase Kết Liễu (Zerg Rush):**
   - Máu Boss < 5%, toàn bộ điện thoại chuyển sang chế độ **BÃO TAP TOÀN DÂN** để dồn tổng lực sát thương kết liễu bạo chúa trong tiếng hò reo!

---

## 🚀 HƯỚNG DẪN CHẠY THỬ NGHIỆM TRÊN MÁY (LOCAL)

```bash
# 1. Đi vào thư mục dự án
cd C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131

# 2. Khởi chạy máy chủ phát triển
npm run dev
```
Mở trình duyệt:
* **Màn hình Máy chiếu (Host):** `http://localhost:3000/host`
* **Màn hình Điện thoại (Player):** `http://localhost:3000/play?room=MLN131` (hoặc mở nhiều tab ẩn danh để giả lập nhiều sinh viên cùng chơi).

---

## 🌐 HƯỚNG DẪN DEPLOY LÊN VERCEL (1-CLICK HOÀN TOÀN MIỄN PHÍ)

Để cả lớp có thể dùng điện thoại thật (4G / Wi-Fi) quét mã QR, bạn deploy dự án lên Vercel theo các bước cực kỳ đơn giản sau:

### Cách 1: Đẩy code lên GitHub rồi kết nối Vercel (Khuyên dùng)
1. Tạo một repository mới trên GitHub (ví dụ: `democracy-raid-mln131`).
2. Mở terminal tại thư mục dự án và đẩy code lên:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Democracy Raid MLN131"
   git branch -M main
   git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/democracy-raid-mln131.git
   git push -u origin main
   ```
3. Truy cập [vercel.com](https://vercel.com) ➔ Đăng nhập bằng GitHub ➔ Bấm **"Add New Project"** ➔ Chọn repo `democracy-raid-mln131` ➔ Bấm **"Deploy"**.
4. Sau 1 phút, Vercel sẽ cấp cho bạn một đường link HTTPS (ví dụ: `https://democracy-raid-mln131.vercel.app`).
5. Vào ngày thuyết trình trên lớp, bạn chỉ cần mở link: `https://democracy-raid-mln131.vercel.app/host` lên máy chiếu lớp học. Cả lớp quét mã QR trên màn hình là xong!

### Cách 2: Sử dụng Vercel CLI (Deploy trực tiếp từ máy)
```bash
npm install -g vercel
vercel
```
Làm theo hướng dẫn trên màn hình, dự án sẽ được deploy lên Vercel ngay lập tức!

---

## 🎮 CẤU TRÚC 6 BINH CHỦNG DÂN CHỦ SỐ
1. 🤖 **Chiến Binh Fact-Check (Common):** Bắn tia giải mã sự thật làm suy yếu giáp Boss.
2. 🛡️ **Hộ Vệ Tường Lửa 2FA (Common):** Đi tiên phong che chắn các đòn quét diện rộng của Boss.
3. 🛸 **Drone Tuyên Truyền Khai Sáng (Rare):** Bay trên không trung, buff +35% sát thương và tốc độ đánh cho toàn quân.
4. ⚡ **Pháp Sư Luật An Ninh Mạng (Epic):** Giáng sấm sét pháp quyền làm Boss bị choáng (Slow 40%).
5. 🚜 **Xe Tăng Chuyển Đổi Số (Epic):** Bọc thép 5G, nã pháo Big Data càn quét dữ dội.
6. 🐉 **RỒNG THẦN ĐỒNG THUẬN QUỐC GIA (Legendary):** Rồng vàng hoàng kim thiêu đốt 50.000 HP diện rộng và hồi sinh toàn bộ binh lính!
