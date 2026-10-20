# Handoff Report: Asset, Visual, Audio & Infrastructure Specifications

**Agent Role**: `spec_miner_assets_infra`  
**Milestone**: Specification Mining & Architectural Requirement Cataloging  
**Target Project**: NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)  
**Project Root**: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`  

---

## 1. Observation

1. **Authoritative Specification Source (`ORIGINAL_REQUEST.md`)**:
   - Lines 10–16 define the strict **Asset & Visual Pipeline Hierarchy**:
     > "1. Ưu tiên 1 - Tải trên mạng: Tìm kiếm và tích hợp tài nguyên đồ họa chất lượng cao (SVG, PNG minh họa meme, icon vector, sound effect arcade/meme từ các kho mở hoặc CDN công khai: Lucide, OpenGameArt, Flaticon open assets, Google Fonts, Freesound).  
     > 2. Ưu tiên 2 - Gen AI: Nếu trên mạng không có ảnh/meme đúng ngữ cảnh MLN131, sử dụng subagent tạo ảnh hoặc công cụ sinh đồ họa.  
     > 3. Ưu tiên 3 - Code: Tự dựng hoạt họa bằng HTML5 Canvas 2D, SVG hoặc Tailwind/CSS Keyframe animations.  
     > 4. Ưu tiên 4 - Báo cáo: Nếu gặp bế tắc kỹ thuật không thể tìm hay dựng được, dừng lại và báo cáo phương án cho người dùng."
   - Lines 36–39 specify **Visual Identity & Tone**:
     > "Thiết kế đồ họa meme tươi sáng, biểu cảm nhân vật hài hước, layout 16:9 sắc nét cho máy chiếu phòng học và giao diện mobile tối ưu chạm 1 ngón tay. Văn phong hoàn toàn trẻ trung, hóm hỉnh (Cảnh sát chính tả, Bẫy lùa gà, Check VAR, Anh hùng bàn phím), lồng ghép kiến thức MLN131 một cách tự nhiên, duyên dáng, không giáo điều."
   - Lines 40–42 specify **Audio & SFX**:
     > "Tích hợp âm thanh arcade, tiếng vỗ tay, còi troll, tiếng nổ, nhạc nền dồn dập tăng nhịp tim qua Web Audio API hoặc audio assets tải về."
   - Lines 43–46 specify **Technical Architecture & Deployment**:
     > "Nền tảng Next.js, đồng bộ thời gian thực mượt mà cho 40-50 kết nối đồng thời. Mã nguồn chạy ổn định cả trên Local LAN (Offline trong lớp học) và 1-click deploy lên Vercel."
   - Lines 59–62 specify **Acceptance Criteria**:
     > "- Đồ họa đạt chuẩn Party Game bắt mắt, tươi sáng, có icon/ảnh minh họa meme chất lượng cao.  
     > - Tích hợp chế độ Dev Bot Simulator (giả lập 15-20 sinh viên ảo) để test toàn bộ các vòng trực tiếp mà không cần nhiều điện thoại.  
     > - Giao diện điện thoại 100% Mobile-first, không bị cuộn trang ngoài ý muốn, touch target lớn.  
     > - `npm run build` thành công, không có lỗi TypeScript hoặc SSR."

2. **Codebase Inspection**:
   - `package.json` contains: `next: ^14.2.15`, `react: ^18.3.1`, `lucide-react: ^0.453.0`, `canvas-confetti: ^1.9.3`, `qrcode: ^1.5.4`, `tailwindcss: ^3.4.14`, `typescript: ^5.6.3`.
   - `npm run build` passed with exit code 0 (`Next.js 14.2.35`), generating static and dynamic routes (`/`, `/host`, `/play`, `/api/game`).
   - `src/lib/audioSynthesizer.ts` currently provides a basic Web Audio API `SoundSynthesizer` class with `playLaser`, `playExplosion`, `playGachaReveal`, `playWhistleAlarm`, `playBossStun`, `playTapPunch`, `playVictoryFanfare`. It lacks the specific meme SFX requested: troll air horn, applause, 5s countdown tick-tock, splat sound, wrong answer buzzer, sabotage sound, and procedural background music (BGM).
   - `src/lib/syncEngine.ts` implements a hybrid engine using `BroadcastChannel('democracy_raid_channel')` for local multi-tab communication and HTTP polling (`/api/game?room=...&since=...`) every 400ms (host) and 700ms (client).
   - `src/app/api/game/route.ts` provides an in-memory session store `rooms: Record<string, RoomSession>` with a 100-event ring buffer.

---

## 2. Logic Chain

1. **Asset Pipeline Logic**:
   - Since the game must run in offline classroom LANs (where public internet might not be available or 4G is spotty), external CDN dependencies (like external image URLs or remote audio links) create single points of failure.
   - Therefore, Priority 1 (Web assets) must bundle icons via the locally installed `lucide-react` package and local SVGs.
   - For custom character avatars and memes specific to MLN131 (e.g., Cảnh Sát Chính Tả, Trùm Hóng Biến, Thợ Săn Deepfake), Priority 2 (Gen AI) and Priority 3 (Procedural SVG/Canvas 2D) ensure that all visual elements are bundled locally in `public/assets/` or generated inline, achieving zero runtime HTTP asset failures.
   - For animations (Danmaku reactions, 5s minigames, screen ink sabotage), Priority 3 (HTML5 Canvas 2D and Tailwind CSS Keyframes) provides 60 FPS performance without heavy external animation libraries.

2. **Visual Ergonomics Logic**:
   - **Host Screen (Classroom Projector)**: Must be optimized for 16:9 projection and readable from 5m–15m distance. This requires a 1080p-scaled container, minimum 28px–48px typography for vital game content, high contrast (dark cyber background `#0B0F19` with neon yellow `#FFD166`, cyan `#06D6A0`, and crimson `#EF233C`), and prominent room PIN / QR code placement.
   - **Player Screen (Mobile Device)**: 40–50 students will be tapping frantically during 5-second minigames and live duels. To eliminate accidental page scrolls, address bar jumps, or mis-clicks: the viewport must be locked to `100dvh` with `touch-action: manipulation`, interactive targets must measure ≥ 56px in height and sit inside the bottom 60% "thumb zone", and tactile feedback must be enhanced with the Web Vibration API.

3. **Audio Architecture Logic**:
   - Relying solely on external `.mp3` audio files risks playback failure due to network latency, CORS, or missing files during offline play.
   - Web Audio API procedural synthesis provides 100% offline, zero-latency, programmatic sound generation directly from the browser CPU.
   - Extending `SoundSynthesizer` with procedural algorithms for Troll Horn (detuned sawtooth cluster), Applause (bandpass filtered noise bursts), Explosion (sub-bass drop + white noise), Countdown Ticks (pitch-ascending woodblocks), and Procedural BGM guarantees that audio works instantly across all devices without loading audio assets.
   - An optional audio file loader can act as a secondary enhancement if pre-recorded studio meme audio clips are provided.

4. **Infrastructure & Concurrency Logic**:
   - Vercel Serverless prohibits stateful persistent WebSocket connections without paying for external third-party services (Pusher, Ably, Upstash).
   - 40–50 mobile clients polling every 700ms and 1 host polling every 350ms generate ~65 lightweight HTTP GET requests per second.
   - By querying `/api/game?room=MLN131&since=<timestamp>`, the server only returns delta events that occurred since the client's last poll. Idle responses are < 200 bytes, consuming minimal CPU and bandwidth.
   - On local classroom LAN, the same protocol runs against a local Node.js server with < 15ms latency, ensuring 100% feature parity between local offline play and Vercel cloud deployment.
   - The Dev Bot Simulator runs in the host browser tab, automatically simulating 15–20 virtual students who join, answer, vote, and react, enabling full end-to-end verification without requiring 40 physical smartphones.

---

## 3. Caveats

1. **Web Audio Autoplay Restrictions**: All modern browsers (Safari, Chrome, Firefox) prevent audio playback until the user initiates an explicit interaction (click or touch). The Host screen and Mobile client must display an explicit "Chạm để bắt đầu / Bật âm thanh" interaction to unlock `AudioContext`.
2. **DeviceMotion / Gyroscope Permissions**: In Round 2 (Lắc điện thoại lấy OTP), iOS Safari requires explicit permission (`DeviceMotionEvent.requestPermission()`) for motion sensor access. To prevent stuck players on iOS or desktop testing, a high-speed "Tap Mash" backup button must automatically activate if shake sensors are unavailable.
3. **Vercel Multi-Region Serverless State**: On Vercel, free tier in-memory state is maintained per serverless container instance. In production on Vercel, the Host browser serves as the single source of truth (Game Master), broadcasting state snapshots to the server cache so clients stay synchronized.

---

## 4. Conclusion: Detailed Specifications & Requirements Catalog

### 4.1 Asset & Visual Pipeline Protocol (Priority Hierarchy)

```
[P1: Open Assets & Web Icons]
   ├── lucide-react (Installed: Trophy, Flame, Shield, AlertTriangle, Zap, Users, Bot, Swords, etc.)
   ├── Google Fonts / System Typography Fallback (Fredoka, Bungee, Be Vietnam Pro, Montserrat)
   └── Inline Vector SVGs (Tomato, Brick, Dép Lào, Whistle, Ink Splat, Bot Mask, UNO Reverse)
         │ (if contextual meme doesn't exist)
         ▼
[P2: Gen AI Image Generation]
   ├── Gemini Image Generator via default_api:generate_image
   ├── Aspect ratios: 1:1 (avatars), 16:9 (round headers), 4:3 (drama scenario thumbnails)
   └── Stored locally in /public/assets/meme_pack/ with optimized WebP/PNG format
         │ (if dynamic/interactive animation needed)
         ▼
[P3: Code-Drawn Graphics & CSS Animations]
   ├── HTML5 Canvas 2D: Danmaku reaction barrage (50+ flying tomatoes/hearts/bricks)
   ├── HTML5 Canvas 2D: Minigame arena ("Né gạch đá drama" dodging canvas)
   ├── HTML5 Canvas 2D: Sabotage ink splatter wipe canvas
   └── Tailwind CSS Keyframes: shake, bounce-short, pulse-fast, glow, ink-reveal, card-flip
         │ (if technical block occurs)
         ▼
[P4: Technical Report to User]
   └── Document block, outline alternatives, and escalate before modifying critical systems
```

#### Avatar & Meme Identity Catalog (10 Netizen Personas)
1. **Anh Hùng Bàn Phím**: Golden mechanical keyboard icon, glowing blue visor, high-speed typing aura.
2. **Cảnh Sát Chính Tả**: Red emergency siren, giant red marking pen, strict detective sunglasses.
3. **Trùm Hóng Biến**: Giant cinema popcorn tub, night-vision binoculars, dramatic gossip speech bubble.
4. **Thợ Săn Deepfake**: Cyberpunk holographic eyepiece with scanning grid, magnifying glass.
5. **Thánh Bóc Phốt**: Megaphone with acoustic shockwaves, spotlight halo.
6. **Cú Đêm Lướt Tóp Tóp**: Glowing smartphone reflection, dark purple eye bags, infinite scroll trail.
7. **Bé Seeder Trà Sữa**: Holographic bot antennae, cup of bubble tea with boba, sly grin.
8. **Thẩm Phán Tòa Án Cư Dân Mạng**: Cartoon wooden judge gavel, cool black shades, scales of justice.
9. **Chuyên Gia Thả Cà Chua**: High-velocity tomato slingshot, splattered red bandana.
10. **Chiến Thần Đổ Mực**: Paint roller, dripping black ink bucket, ninja eye mask.

---

### 4.2 Visual Identity & Layout Specifications

#### Color Palette & Design Tokens
- **Background Base**: Cyber Abyss (`#0B0F19`), Card Container (`#131B2E`), Border Line (`#1E293B`).
- **Brand Colors**:
  - Cyber Yellow: `#FFD166` (Primary accent, highlights, PIN, scores)
  - Cyber Cyan: `#06D6A0` (Affirmative actions, player indicators, timer safe zone)
  - Cyber Crimson: `#EF233C` (Hazards, timer urgency, seeder alerts, report button)
  - Cyber Purple: `#7209B7` (Sabotage cards, mystery roles, drama topics)
  - Cyber Orange: `#FB8500` (Tomato Danmaku, trending badges)
- **Visual Style (Neo-Brutalist Party Game)**:
  - High-contrast 3px to 4px solid borders: `border-3 border-black` or `border-slate-800`.
  - Hard comic drop shadows: `shadow-[4px_4px_0px_#000000]` and `shadow-[6px_6px_0px_rgba(0,0,0,0.5)]`.
  - Rounded punchy corners: `rounded-2xl` and `rounded-3xl`.
  - Active button tactile depression: `active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000000]`.

#### 16:9 Classroom Projector Layout Specifications (`/host`)
- **Viewport Constraints**: Fixed 16:9 aspect ratio (`aspect-video`), fluidly scaling to fill screen up to 1920x1080 without vertical scrollbars.
- **Viewing Distance Optimization (5m - 15m)**:
  - Room PIN: Displayed in header and lobby at minimum 48px–72px bold font.
  - QR Code: High-contrast 240x240px to 320x320px SVG/Canvas rendered with white border.
  - Live Connection Counter: Badge showing `👥 [Count]/50 Dân Mạng Online`.
  - Question & Prompt Text: Minimum 32px bold font with high-contrast text backing.
  - Split-Screen Duel (Round 1): Left (Option A / Red Banner) vs Right (Option B / Blue Banner) with central animated VS burst.
  - Live Danmaku Layer: Full-screen HTML5 Canvas overlay (`pointer-events-none`) supporting 60+ simultaneous particle objects with configurable opacity.
  - Quick-Access Host Controls: Compact toolbar at bottom right with Mute, Fullscreen, Next Round, Pause Timer, and Bot Simulator toggles.

#### 1-Finger Touch Mobile Layout Specifications (`/play`)
- **Viewport Constraints**: `h-[100dvh]`, `overflow-hidden`, `touch-action: manipulation`, disabling double-tap-zoom and pinch-to-zoom.
- **Thumb Zone Allocation**:
  - Upper 40%: Status header, question prompt / situation card, countdown timer.
  - Lower 60%: Interactive touch targets (answer grid, voting buttons, Danmaku reaction pad, minigame arena).
- **Touch Target Dimensions**: Minimum height 56px, ideal 64px–72px, with generous tap padding.
- **Haptic Feedback**:
  - Button tap: `navigator.vibrate(40)`
  - Countdown tick (< 3s): `navigator.vibrate(60)`
  - Minigame win / Correct: `navigator.vibrate([40, 40, 80])`
  - Inked / Sabotaged / Defeat: `navigator.vibrate([150, 50, 150])`
- **Interactive Ink Wipe Mechanic (Round 4)**:
  - When hit by "Đổ mực màn hình", a full-screen Canvas overlay appears with black splats.
  - Player must wipe across the screen 5 times to clean the ink before answering.

---

### 4.3 Audio & Sound Synthesis Specifications

#### Web Audio API Procedural Synthesizer Extension Catalog
All sounds are implemented procedurally in `src/lib/audioSynthesizer.ts`, requiring 0kB audio downloads:

| Sound ID | Method Signature | Synthesis Technique | Musical / Frequency Characteristics | Trigger Event |
|---|---|---|---|---|
| `sfx_troll_horn` | `playTrollHorn()` | 3 detuned sawtooth oscillators through bandpass filter + mild saturation | Frequencies: 220Hz, 247Hz, 277Hz with sudden downward pitch scoop (-15%) | Round 1 savage punchline reveal; Round 4 troll card |
| `sfx_applause` | `playApplause()` | Bandpass-filtered white noise modulated by randomized LFO (8–14Hz) | Center frequency: 1200Hz, Q: 1.5; duration: 2.2s with smooth fade-out | Round winner announcement; Tournament podium celebration |
| `sfx_explosion` | `playExplosion(heavy)` | Exponential sine wave pitch drop coupled with low-pass filtered noise burst | Pitch drops 140Hz ➔ 25Hz over 450ms; gain starts at 0.7 ➔ 0.01 | Round 2 minigame timeout; Round 3 Seeder exile |
| `sfx_countdown_tick` | `playCountdownTick(urgency)` | Resonant sine/triangle burst simulating high-pitch woodblock | Pitch ascends with urgency: 800Hz (normal) ➔ 1600Hz (last 2 seconds) | Round 2 5-second countdown; Quiz timer ticks |
| `sfx_splat` | `playSplat()` | Fast downward sine sweep + muffled noise burst | 550Hz ➔ 70Hz in 70ms with rapid exponential gain decay | Danmaku tomato throw; Gạch đá throw; Ink splatter attack |
| `sfx_correct` | `playCorrectChime()` | Ascending pentatonic bell chime (3 triangle oscillators with sparkle gain) | E5 (659Hz) ➔ G#5 (830Hz) ➔ B5 (987Hz) ➔ E6 (1318Hz) | Correct trivia answer; Round 2 survival |
| `sfx_wrong` | `playWrongBuzz()` | Dissonant dual square-wave tritone with rapid gate decay | 138Hz + 196Hz (augmented 4th / tritone); duration: 280ms | Incorrect answer; Round 2 minigame fail |
| `sfx_sabotage_stab` | `playSabotageStab()` | Sharp synth brass minor triad with aggressive attack | D minor chord (D4, F4, A4) with low-pass filter envelope sweep | Round 4 Sabotage card played |
| `sfx_victory_fanfare` | `playVictoryFanfare()` | 7-note royal arpeggio fanfare using rich sawtooth oscillators | C5 ➔ C5 ➔ C5 ➔ E5 ➔ D5 ➔ E5 ➔ G5 (existing royal theme) | Tournament Champion crowning |
| `bgm_party_loop` | `startPartyBGM(bpm)` | Procedural 16-step sequencer: synth kick, snare noise, funky bassline | Dynamic tempo: 110 BPM (Lobby/Round 1), 135 BPM (5s Minigames/Round 4) | Background music loop during active gameplay |

#### Audio Management & Autoplay Protocol
- **State Store**: `SoundSynthesizer.enabled` (boolean), `SoundSynthesizer.volume` (0.0–1.0).
- **Auto-unlock Handshake**:
  - Host Screen: A friendly banner "🔊 Bật Âm Thanh Phòng Học" prompts the teacher to click on first page load to unlock the Web Audio Context.
  - Mobile Controller: Audio context unlocks automatically when student taps "Vào Phòng" or any interactive button.

---

### 4.4 Deployment & Networking Specifications

#### Dual-Mode Architecture: Local Classroom LAN vs 1-Click Vercel

```
[40-50 Mobile Clients]              [Classroom Projector Host]
         │                                       │
         │ (HTTP Delta Poll 700ms)               │ (HTTP Delta Poll 350ms)
         │ (BroadcastChannel L1 on same device)  │ (BroadcastChannel L1 on same device)
         ▼                                       ▼
┌────────────────────────────────────────────────────────┐
│               Next.js Route: /api/game                 │
│                                                        │
│  In-Memory Room State Store (rooms[roomCode]):         │
│  - roomCode, status, currentRound, timer               │
│  - players: Record<playerId, PlayerData>               │
│  - recentEvents: RingBuffer<GameEvent>(max 150)        │
│  - hostSnapshot: Authoritative Game State              │
└────────────────────────────────────────────────────────┘
```

#### Network Bandwidth & Concurrency Budget for 50 Connections
- **Client Poll Frequency**: 700ms (jittered ±50ms to avoid thundering herd).
- **Host Poll Frequency**: 350ms for smooth animations.
- **Payload Optimization**:
  - Request: `GET /api/game?room=MLN131&since=1710000000` (URL size ~45 bytes).
  - Response (idle): `{ roomCode, status, round, serverTime, events: [] }` (< 180 bytes gzip).
  - Response (active events): Only transmits events whose `timestamp > since` (< 800 bytes).
  - Total Bandwidth: 50 clients × 1.4 req/s × 300 bytes = ~21 KB/s aggregate bandwidth. This easily operates over a 3G mobile hotspot or standard classroom 2.4GHz Wi-Fi without congestion.

#### Dev Bot Simulator Specification (Testing Harness)
- **Host Interface**: Single-click toggle button `[🤖 Bật Giả Lập 15 Sinh Viên]`.
- **Bot Behavior Matrix**:
  - **Lobby**: Instantly registers 15 bot players with realistic Vietnamese student gamer tags (`Bé_Hóng_Biến`, `Cảnh_Sát_Chính_Tả`, `Anh_Hùng_Bàn_Phím`, `Seeder_Trà_Sữa`, etc.).
  - **Round 1 (Cà Khịa)**: Bots automatically submit randomized humorous Gen Z answers from a predefined dictionary and vote across matchups.
  - **Round 2 (WarioWare 5s)**: Bots trigger simulated reaction delays between 1.2s and 4.8s with a 75% success rate.
  - **Round 3 (Seeder Deduction)**: 3 bots are designated as Seeders; bots generate realistic chat clues and vote.
  - **Round 4 (Sabotage Trivia)**: Bots answer trivia questions and randomly unleash Sabotage cards on the top-ranking players.
- **Stress-Testing Value**: Allows full multi-device gameplay verification from a single laptop without needing physical phones.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Asset Pipeline | P1 Web Open Asset Downloader & Registry | Local bundling of Lucide vector glyphs, Google Fonts, and inline SVGs | Icon names, font families | Rendered crisp SVG vectors & typography | Falls back to system sans-serif font | ORIGINAL_REQUEST.md § Pipeline Priority |
| 2 | Asset Pipeline | P2 Gen AI Meme Generator | Automated generation of custom MLN131 context memes & avatars | Prompt text, aspect ratio (1:1, 16:9) | Generated WebP/PNG image files in `/public/assets` | Falls back to procedural SVG (Priority 3) | ORIGINAL_REQUEST.md § Priority 2 |
| 3 | Asset Pipeline | P3 Procedural SVG Avatar System | Code-drawn Netizen character avatars with interchangeable hats, badges, and colors | Avatar ID, color theme, accessories | Inline SVG avatar element (0kB download) | Defaults to standard Netizen icon | ORIGINAL_REQUEST.md § Priority 3 |
| 4 | Asset Pipeline | P3 Danmaku Canvas 2D Engine | High-performance HTML5 Canvas overlay for 50+ simultaneous flying reactions (tomatoes, bricks, hearts) | Reaction event stream (type, sender, coords) | 60 FPS animated particle barrage | Drops particles exceeding max pool (100) | ORIGINAL_REQUEST.md R1 & Acceptance Criteria |
| 5 | Asset Pipeline | P3 Sabotage Ink Canvas | Interactive canvas splatter covering mobile viewport when hit by squid ink card | Touch swipe / drag coordinates | Cleared pixel ratio (0% to 100%) | Auto-clears after 8s if player cannot wipe | ORIGINAL_REQUEST.md R1 Vòng 4 |
| 6 | Visual Identity | 16:9 Projector Battlefield Screen | Fixed 16:9 high-contrast layout readable from 5m–15m for classroom projection | Game state, player roster, active duel | Responsive 1080p canvas with live stats | Scales down gracefully to 720p | ORIGINAL_REQUEST.md R2 & Acceptance Criteria |
| 7 | Visual Identity | 1-Finger Touch Mobile Controller | 100dvh mobile interface with thumb-zone interactive buttons and haptic feedback | Touch gestures (tap, drag, shake) | Game actions (submit, vote, react) | Disables scroll & pinch zoom | ORIGINAL_REQUEST.md R2 & Acceptance Criteria |
| 8 | Visual Identity | Neo-Brutalist Theme Tokens | Vibrant cartoon styling with 3px–4px black borders and 4px–6px drop shadows | Tailwind design classes | Punchy comic book aesthetic | Falls back to standard borders | ORIGINAL_REQUEST.md R2 |
| 9 | Audio & SFX | Web Audio Procedural Synthesizer | Complete zero-dependency sound engine synthesizing arcade SFX on CPU | Trigger method call (`playTrollHorn`, etc.) | Realtime audio waveform output | Silent if audio context is suspended | ORIGINAL_REQUEST.md R3 |
| 10 | Audio & SFX | Troll Air Horn SFX | Detuned multi-oscillator sawtooth blast for savage burns and punchlines | `playTrollHorn()` | 0.6s brassy air horn sound | Gracefully ignores if muted | ORIGINAL_REQUEST.md R3 |
| 11 | Audio & SFX | Classroom Applause SFX | Modulated bandpass noise burst simulating collective hand claps | `playApplause()` | 2.2s clapping cheer audio | Gracefully ignores if muted | ORIGINAL_REQUEST.md R3 |
| 12 | Audio & SFX | 5s Countdown Ticking SFX | Pitch-ascending resonant click woodblocks | `playCountdownTick(urgency)` | Rhythmic ticking with accelerating urgency | Gracefully ignores if muted | ORIGINAL_REQUEST.md R3 & R1 Vòng 2 |
| 13 | Audio & SFX | Procedural Party BGM Loop | Procedural 16-step synth drum and bass rhythm with tempo modulation | `startPartyBGM(bpm)`, `stopPartyBGM()` | Continuous energetic background music | Silenced during round transitions | ORIGINAL_REQUEST.md R3 |
| 14 | Networking | Dual-Mode Delta Sync Engine | Hybrid BroadcastChannel (L1) + Timestamped HTTP delta polling (L2) | Room code, `since` timestamp, action payload | Synchronized game state across 50 devices | Auto-retries on connection glitch | ORIGINAL_REQUEST.md R4 |
| 15 | Networking | Dev Bot Simulator (15-20 Bots) | Client-side virtual student harness for 1-click end-to-end testing | Host toggle switch `enableBots: boolean` | Simulated joins, answers, votes, and reactions | Auto-cleans when disabled | ORIGINAL_REQUEST.md Acceptance Criteria |

---

## Edge Cases

| # | Feature | Input | Observed Behavior | Mitigation / Specification |
|---|---------|-------|-------------------|----------------------------|
| 1 | Audio Synthesizer | First page load before user taps screen | Browser blocks `AudioContext` with autoplay policy warning | Display "🔊 Bật Âm Thanh Phòng Học" unlock modal on Host and unlock on first button tap on Mobile |
| 2 | Classroom LAN Offline | Server runs on laptop Wi-Fi hotspot without internet access | External CDN font or asset requests fail with net::ERR_NAME_NOT_RESOLVED | Bundle all fonts, SVGs, and audio procedurally inside the application package |
| 3 | Mobile Layout | Mobile browser address bar expands/shrinks on scroll | Viewport shifts and distorts UI layout (`100vh` bug) | Use `h-[100dvh]`, `overflow-hidden`, and `touch-action: manipulation` on root layout |
| 4 | Danmaku Engine | 40 students spam tomato and brick buttons simultaneously | Hundreds of canvas particles cause frame rate drop on low-end projector laptops | Implement particle object pooling capped at 80 active sprites; recycle oldest particles |
| 5 | Vercel Serverless | Serverless function instance cold start or spin down | In-memory room state reset if host does not refresh cache | Host tab maintains authoritative master state and pushes periodic snapshot updates on poll |
| 6 | Motion Sensor (Round 2) | iOS Safari requires permission or user device lacks gyroscope | "Lắc điện thoại lấy OTP" cannot detect shake gestures | Provide a fallback high-speed tap-mash button ("GÕ LIÊN TỤC LẤY OTP") that automatically activates |
| 7 | Reconnection | Student's phone locks screen or switches apps for 30 seconds | Polling pauses; missed events accumulate | Upon resume, client polls with previous `since` timestamp and catches up on missing events instantly |
| 8 | Ink Sabotage | Student device has touch event coordinates offset | Ink wipe gesture fails to register canvas scratch off | Listen to both TouchEvent and PointerEvent with normalized bounding client rect coordinates |
| 9 | Dev Bot Simulator | Bot simulator activated while 45 real students are connected | Total room participants exceed 60 players, cluttering UI | Bot simulator automatically caps total players at 50, prioritizing real human connections |
| 10 | Host Sound Control | Teacher mutes host screen sound via UI button | All Web Audio synthesis stops on projector | Set `sound.enabled = false` in global synthesizer; mobile clients retain independent audio toggle |

---

## 5. Verification Method

1. **Build & Type Checking**:
   ```bash
   cd C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
   npm run build
   ```
   *Expected Result*: Exit code 0, all routes (`/`, `/host`, `/play`, `/api/game`) compiled without SSR or TypeScript errors.

2. **Asset Independence Verification**:
   - Inspect network tab in Chrome DevTools with "Offline" mode enabled (simulating classroom without internet).
   - Verify that `/host` and `/play` render all icons, fonts, avatars, and QR codes without any missing asset icons.

3. **Audio Synthesis Verification**:
   - Open browser developer console on `/host` and test audio synthesizer methods:
     ```javascript
     // In browser console
     window.sound.playTrollHorn();
     window.sound.playApplause();
     window.sound.playCountdownTick(true);
     ```
   - Verify that distinct audio waveforms play without console warnings.

4. **Concurrency & Dev Bot Simulation Verification**:
   - Launch `http://localhost:3000/host` on projector laptop.
   - Click `[🤖 Bật Giả Lập 15 Sinh Viên]`.
   - Verify that 15 bot avatars join the lobby within 2 seconds, and all bots participate in Round 1, Round 2, Round 3, and Round 4 automatically.
