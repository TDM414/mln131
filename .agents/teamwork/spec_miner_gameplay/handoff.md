# Handoff Report: Gameplay Mechanics & Specifications

**Agent**: spec_miner_gameplay  
**Recipient**: Project Orchestrator (45f106cf-224a-4102-aeee-b56815847bc0)  
**Date**: 2026-10-19  
**Target Project**: NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)  
**Workspace**: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`

---

## 1. Observation

1. **Original Request File**: `ORIGINAL_REQUEST.md` lines 5, 21-35, 49-62 explicitly redefines the project from an old single-loop boss battle into a complete 4-round Game Show:
   - *"Xây dựng 'NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)' — Nền tảng Game Show tương tác lớp học thời gian thực (Host máy chiếu + 40-50 mobile client) phục vụ môn MLN131 (Dân chủ XHCN & Truyền thông số)..."* (Line 5)
   - *"Thay vì 4 trò chơi rời rạc làm loãng trải nghiệm, hệ thống tổ chức thành Một Giải Đấu Hoàn Chỉnh (Full Game Show) giữ nguyên điểm số và cảm xúc leo thang, đồng thời cho phép Host chọn chơi riêng từng vòng"* (Line 21-22)
   - Round 1: *"Đại Hội Cà Khịa & Check VAR" (Jackbox / Quiplash)* (Line 23-26)
   - Round 2: *"Chiến Binh 5 Giây Dị Hợm" (WarioWare / Dumb Ways to Die)* (Line 27-29)
   - Round 3: *"Vạch Mặt Seeder & Check VAR" (Among Us / Social Deduction)* (Line 30-32)
   - Round 4: *"Đại Chiến Lật Kèo & Cướp Điểm" (Sabotage Trivia Final)* (Line 33-35)
   - Dev Bot Simulator: *"Tích hợp chế độ Dev Bot Simulator (giả lập 15-20 sinh viên ảo) để test toàn bộ các vòng trực tiếp mà không cần nhiều điện thoại."* (Line 60)
2. **Current Codebase State**:
   - `src/lib/types.ts` lines 1-118 contain legacy models `BossState`, `MinionUnit`, `QuizQuestion`, `DamagePopup`, `Projectile` from an earlier "Democracy Raid" boss clicker prototype.
   - `src/lib/syncEngine.ts` lines 1-181 provide hybrid `BroadcastChannel` (for instant local multi-tab sync) + periodic HTTP polling (`/api/game?room=...`) for cross-device mobile-to-projector synchronization.
   - `src/app/api/game/route.ts` lines 1-165 implement an in-memory `RoomSession` with actions `JOIN`, `SUMMON`, `WHISTLE`, `TAP`, `HOST_UPDATE`.
   - `src/data/questions.ts` lines 1-200 contain 12+ meticulously crafted real-world MLN131 curriculum scenarios with topics: "Dân Biết Số", "Dân Bàn Số", "Dân Kiểm Tra & Giám Sát Số", "Pháp Quyền & Kỷ Cương Số", "Dân Thụ Hưởng Số", "Chống Dân Túy Mạng", "Dân Làm Số", "Khối Liên Minh Trên Không Gian Số", "Bản Chất Dân Chủ XHCN", "Trách Nhiệm Công Dân Số", "Cạm Bẫy Deepfake".
   - `src/lib/audioSynthesizer.ts` lines 1-216 use the Web Audio API to synthesize sounds (lasers, explosions, gacha fanfares, siren whistles) without external MP3 files.

---

## 2. Logic Chain

1. **From Observation 1**: The game must support **two game modes**:
   - **Tournament Mode**: Sequences from Lobby -> Round 1 -> Round 2 -> Round 3 -> Round 4 -> Grand Champion Podium. Total player scores accumulate across all 4 rounds.
   - **Free-Play Mode**: The host can jump directly into any single round (Round 1, 2, 3, or 4) to play standalone, test a specific mechanic, or replay a favorite mode with isolated scoring.
2. **From Observation 1 & 2 (Round 1)**: Round 1 ("Đại Hội Cà Khịa & Check VAR") follows Quiplash/Jackbox party game mechanics:
   - Prompt is broadcast to mobile devices.
   - Mobile players enter roast/counter-argument texts (max 120 chars).
   - Server pairs submissions into 1v1 showdowns on the projector screen.
   - Class votes via mobile (Vote A or Vote B) while simultaneously spamming Danmaku reactions (🍅 Cà chua, ❤️ Thả tim, 🧱 Ném gạch, 🤡 Chú hề).
   - "VAR Reveal" dramatic sequence discloses vote percentages, reveals authors, and awards points.
3. **From Observation 1 & 2 (Round 2)**: Round 2 ("Chiến Binh 5 Giây Dị Hợm") follows WarioWare/Dumb Ways to Die frantic micro-games:
   - Each mini-game has a strict 5.0-second countdown.
   - All connected players play simultaneously on their phones.
   - Requires at least 4 mini-games:
     1. *Catch Escaping Report Button*: evasive button physics with decoy buttons.
     2. *Shake Phone for OTP*: DeviceMotion / shake gesture (with button spam fallback).
     3. *Dodge Drama Bricks*: 2D swipe/drag dodging falling hazard bricks.
     4. *Spot Deepfake Glitch*: tap anomalous AI glitch hotspot in an image.
   - Explosive fail animations and funny sound effects on loss. 3 lives system per player.
4. **From Observation 1 & 2 (Round 3)**: Round 3 ("Vạch Mặt Seeder & Check VAR") follows Among Us social deduction mechanics:
   - Secret role assignment (~90% Netizens vs ~10% Seeders/Botnet).
   - Clue investigation phase: inspecting suspicious forum posts and uncovering IP/comment telemetry.
   - Public discussion and accusation phase: chat shoutbox, nominate suspects to the "Ghế Nóng" (Hot Seat).
   - Voting and expulsion ceremony: class votes to eject suspect; dramatic VAR reveal whether the suspect was a Seeder or innocent Netizen.
5. **From Observation 1 & 2 (Round 4)**: Round 4 ("Đại Chiến Lật Kèo & Cướp Điểm") is a sabotage trivia final:
   - Players hold a hand of Sabotage Cards: *Đổ Mực Màn Hình (Ink Splatter)*, *Cướp 50% Điểm (Point Heist)*, *Bẻ Lái Troll (Button Scramble)*, *Đặt Cược Niềm Tin x2 (Double or Nothing)*, *Khiên Tường Lửa (Firewall Shield)*.
   - Card play phase before each question. Targeted players experience real-time sabotage (e.g. wiping ink off screen).
   - High-stakes MLN131 questions with escalating point multipliers.
   - Grand finale podium with meme awards (Top 1 "Đại Hiệp Dân Chủ Số", "Bậc Thầy Check VAR", etc.).
6. **From Observation 1 & 2 (Dev Bot Simulator)**:
   - Must simulate 15-20 virtual students with realistic Vietnamese names, randomized avatars, and round-appropriate automated behaviors (submitting prompt answers, casting votes, generating Danmaku emoji streams, dodging/failing 5s mini-games, using sabotage cards, and targeting leaderboard leaders).
   - Accessible via Host Dev Panel toggle so developers and educators can test all 4 rounds in single-player or LAN settings without 20 physical phones.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Hub & Mode | Tournament Mode Controller | Orchestrates complete 4-round tournament, retaining cumulative scores and displaying round-by-round leaderboards | Host click `[Bắt Đầu Giải Đấu]`, next round triggers | State transition `LOBBY` -> `R1` -> `R2` -> `R3` -> `R4` -> `FINALE` | If round fails to start, fallback to current round state | `ORIGINAL_REQUEST.md` R1 |
| 2 | Hub & Mode | Free-Play Mode Selector | Allows host to select and play any individual round standalone with isolated scoring | Host click `[Chơi Vòng 1/2/3/4]` | Direct jump into chosen round state | If invalid round selected, defaults to Lobby | `ORIGINAL_REQUEST.md` R1 |
| 3 | Hub & Mode | Cross-Round Score Retention | Accumulates total scores across rounds while storing per-round breakdowns | Player actions in R1-R4 | `player.score`, `player.roundScores{r1,r2,r3,r4}` | Score clamped to >= 0, NaN defaults to 0 | `ORIGINAL_REQUEST.md` R1 |
| 4 | Hub & Mode | Dynamic Room Management & QR | Generates room PIN (`MLN131`) and QR Code for instant student join; displays live player roster | Host mounts page, URL param | QR Code DataURL, player count, roster | If room disconnected, auto-reconnects via polling | `src/app/host/page.tsx` + `ORIGINAL_REQUEST.md` |
| 5 | Round 1 | Prompt Broadcast Phase | Projector and phones display social drama prompt for MLN131 roasting | Host advances or timer starts | 45-60s countdown, prompt text, response counter | Timeout auto-advances to next phase | `ORIGINAL_REQUEST.md` R1 |
| 6 | Round 1 | Mobile Roast Text Input | Mobile keyboard input (max 120 chars) with quick emoji/phrase chips | Player text submission | `submit_roast` payload to server | Submissions exceeding 120 chars truncated; empty text rejected | `ORIGINAL_REQUEST.md` R1 |
| 7 | Round 1 | Head-to-Head Pairing | Pairs two submitted roasts anonymously on projector screen in comic duel cards | Server pairing algorithm | Card A vs Card B layout on projector | If odd responses, bot injects witty response | `ORIGINAL_REQUEST.md` R1 |
| 8 | Round 1 | Live Danmaku Reactions | Real-time flying emojis (🍅 tomato, ❤️ heart, 🧱 brick, 🤡 clown) across projector screen | Mobile tap Danmaku buttons | Animated floating particle sprites across canvas | Rate-limited to max 5 taps/sec per player to prevent flood | `ORIGINAL_REQUEST.md` R1 |
| 9 | Round 1 | Anonymous Voting & VAR Reveal | Class votes for Card A or B; dramatic whistle animation reveals vote split, authors, and points | Mobile vote tap | Split bar (e.g. 65% vs 35%), winner highlight, score update | Tied votes award equal split bonus | `ORIGINAL_REQUEST.md` R1 |
| 10 | Round 2 | 5-Second Universal Engine | Master 5.0-second timer with accelerating tick audio and simultaneous multi-client dispatch | Host start mini-game | Synchronized 5.0s countdown bar and sound | Client clock drift synced via server timestamp | `ORIGINAL_REQUEST.md` R1 |
| 11 | Round 2 | Mini-Game: Catch Report Button | Phishing post appears; red "Report" button runs away erratically with physics; player must tap it | Touch/click on moving button | Success/Fail event, +500 pts or -1 life | Missing touch counts as no-op until 5s timeout | `ORIGINAL_REQUEST.md` R1 |
| 12 | Round 2 | Mini-Game: Shake Phone for OTP | Hack attempt in progress; shake phone or rapidly spam button to fill security meter to 100% | `DeviceMotionEvent` or tap spam | Meter 0-100%, +500 pts or -1 life | Fallback to click/tap spam if sensor permissions denied | `ORIGINAL_REQUEST.md` R1 |
| 13 | Round 2 | Mini-Game: Dodge Drama Bricks | 2D canvas falling hazard bricks/comments; swipe avatar left/right to stay in safe gaps | Touch drag / horizontal swipe | Collision detection, +500 pts or -1 life | Out of screen bounds clamped to viewport | `ORIGINAL_REQUEST.md` R1 |
| 14 | Round 2 | Mini-Game: Spot Deepfake Glitch | AI scam photo with 1 anomalous glitch (6 fingers, warped ear); tap the glitch hotspot within 5s | Tap coordinates (x, y) | Hotspot bounding check, +500 pts or -1 life | Tap outside hotspot counts as miss | `ORIGINAL_REQUEST.md` R1 |
| 15 | Round 2 | Explosive Game Over & Lives | Comic meme explosion animations, shattered screen, and -1 Life on fail; player starts with 3 Lives | Mini-game fail trigger | Explosion visual, meme audio, live survival grid update | 0 lives disables further score gains in R2 | `ORIGINAL_REQUEST.md` R1 |
| 16 | Round 3 | Secret Role Assignment | Secretly assigns ~90% players as "Dân Mạng Lương Thiện" and ~10% as "Seeder Bẩn / Botnet Lùa Gà" | Round start trigger | Secret role card on mobile with badge | Fixed seed ensures deterministic assignment per room | `ORIGINAL_REQUEST.md` R1 |
| 17 | Round 3 | Clue & Evidence Investigation | 3 social media posts display on screen; Netizens use investigation tools; Seeders use sabotage | Mobile investigation taps | Clue hints revealed, false trails, counter-evidence | Tool cooldown prevents spam | `ORIGINAL_REQUEST.md` R1 |
| 18 | Round 3 | Public Discussion & Accusation | 45-60s discussion with mobile quick-chat / shoutbox; nominate suspects to the "Ghế Nóng" | Player shoutbox messages, nominations | Hot seat candidates displayed on projector | Profanity filtered; nomination counter tracked | `ORIGINAL_REQUEST.md` R1 |
| 19 | Round 3 | Expulsion Vote & Exile Animation | Class casts vote to eject top suspect; Among Us style cyberspace ejection animation and VAR verdict | Mobile vote selection | Ejection sequence, role reveal (Seeder or Innocent), points | Skip vote option prevents forced wrongful ejection | `ORIGINAL_REQUEST.md` R1 |
| 20 | Round 4 | Sabotage Card Deal & Hand | Dealt 3 random cards: Đổ Mực Màn Hình, Cướp 50% Điểm, Bẻ Lái Troll, Đặt Cược x2, Khiên Tường Lửa | Round 4 start | Hand of 3 usable action cards on mobile | Cards can only be played once per question | `ORIGINAL_REQUEST.md` R1 |
| 21 | Round 4 | Ink Screen Sabotage Mechanic | Splatters thick virtual black ink on victim's phone; victim must swipe 5-10 times to wipe clean | Attacker targets player, plays Ink card | Fullscreen ink overlay with touch-clearing canvas | If player wipes completely, question becomes visible | `ORIGINAL_REQUEST.md` R1 |
| 22 | Round 4 | Point Heist & 2x Bet Resolution | Steals 50% points from target if attacker is right and target is wrong; 2x bet doubles gain or loss | Answer submissions and card targets | Stolen points animation, score ledger update | Stolen points cannot reduce victim below 0 | `ORIGINAL_REQUEST.md` R1 |
| 23 | Round 4 | High-Stakes MLN131 Trivia Final | 4-5 situation questions with escalating multipliers (1x -> 1.5x -> 2x -> 3x) | Player answer selection | Real-time leaderboard shifts | Answer locked on first tap | `ORIGINAL_REQUEST.md` R1 + `questions.ts` |
| 24 | Round 4 | Grand Finale Podium Ceremony | Displays Top 1, 2, 3 podium, confetti blast, and honorary titles ("Đại Hiệp Dân Chủ Số", "Bậc Thầy VAR") | Tournament completion | Fullscreen cinematic podium with fanfare | Replay tournament or return to hub | `ORIGINAL_REQUEST.md` R1 |
| 25 | Simulator | Dev Bot Simulator Engine | Simulates 15-20 virtual students with Vietnamese names to test all 4 rounds end-to-end | Dev Panel toggle [Bật Bot Simulator] | Virtual player entries injected into room state | Cleans up bot entries when toggled off | `ORIGINAL_REQUEST.md` AC |
| 26 | Simulator | Round-Specific Bot AI Behaviors | Bots submit roasts, vote, spawn Danmaku, react in 5s games, nominate suspects, and play cards | Game state transitions | Automated events dispatched at realistic intervals | Non-blocking asynchronous timers | `ORIGINAL_REQUEST.md` AC |

---

## 4. Edge Cases

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---------|-------------------|-----------------------------|
| 1 | Hub & Mode | Player disconnects or refreshes mobile browser mid-tournament | Player data (`playerId`, `playerName`, `roomCode`, `score`) preserved in `localStorage`; client automatically reconnects and receives current game round/phase without score loss. |
| 2 | Hub & Mode | Host switches to Free-play while in active Tournament | Host is prompted with confirmation modal: `[Tiếp tục giải đấu]` vs `[Chuyển sang chơi tự do]`. Current tournament progress saved to session state. |
| 3 | Round 1 | Fewer than 2 players submit roasts before timer expires | Dev Bot Simulator or fallback system automatically injects pre-seeded humorous student roasts so the head-to-head showdown proceeds seamlessly. |
| 4 | Round 1 | Player submits offensive or vulgar text in roast input | Client-side and server-side regex profanity filter replaces words with `[ĐÃ BỊ CHECK VAR ***]`. |
| 5 | Round 1 | 100% of the class votes for one candidate (Clean Sweep) | Triggers special "Cú VAR Lịch Sử" fanfare with +500 bonus points to the author and extra confetti explosion. |
| 6 | Round 1 | Exact 50% - 50% tie in head-to-head vote | Referee whistle blows with "VAR XÁC ĐỊNH BẤT PHÂN THẮNG BẠI!"; both players receive equal bonus points (+800 pts). |
| 7 | Round 2 | Mobile device does not support or denies `DeviceMotionEvent` (Shake OTP) | System detects lack of shake sensor within 0.5s and immediately displays prominent fallback button: "📱 BẤM LIÊN TỤC ĐỂ LẮC!" allowing tap spam. |
| 8 | Round 2 | Client network lag delays 5-second completion packet | Client timestamp of tap is checked against server start timestamp with a 500ms grace window. Late packets (> 5.5s) are marked as expired (Fail). |
| 9 | Round 2 | Player loses all 3 Lives before mini-games conclude | Mobile enters "Khán Giả Cổ Vũ" mode with ghost avatar; player can still cheer and view scoreboard, but gains 0 survival points for remaining games. |
| 10 | Round 3 | Room has fewer than 10 players (small group / testing) | Minimum 1 Seeder is assigned, or bots are auto-spawned to satisfy the 10:1 Netizen-to-Seeder ratio. |
| 11 | Round 3 | Tie vote for expulsion between two suspects | "VAR Kiểm Tra Bằng Chứng": Tie results in NO expulsion ("Chưa đủ chứng cứ bế đi, cả hai được tạm tha!"). Discussion continues or round ends. |
| 12 | Round 3 | Innocent Netizen is wrongfully expelled by class vote | Dramatic "OAN SAI LỊCH SỬ!" reveal screen; class is penalized (-200 trust points), giving Seeders a tactical victory. |
| 13 | Round 4 | Top 1 player is targeted by multiple Ink Splatter cards simultaneously | Ink splatters stack up to a maximum of 3 layers; clearing threshold scales capped at 12 swipes so screen remains recoverable within 8 seconds. |
| 14 | Round 4 | Target player has an active "Khiên Tường Lửa" (Firewall Shield) | Attacking card is deflected with metallic shield sound effect; attacker loses card, victim receives "ĐÃ CHẶN THÀNH CÔNG ĐÒN CHƠI XẤU!" notification. |
| 15 | Round 4 | Player plays "Cướp 50% Điểm" against a player with 0 points | Steal executes successfully but steals 0 points; notification states "Mục tiêu không có điểm để cướp!". |
| 16 | Dev Bot Simulator | Human player joins room while 20 bots are active | Real player is assigned index 21 seamlessly; bots interact with human player (voting, targeting with cards, reacting in chat) without collision. |

---

## 5. Detailed Gameplay Specifications by Module

### Module A: Hub & Tournament Architecture
1. **Host Screen Hierarchy**:
   - Header: Room Code (`MLN131`), QR toggle, Sound FX toggle, Fullscreen toggle, Dev Bot Simulator badge.
   - Main Stage: Dynamic round-specific viewport (16:9 canvas / responsive flex container).
   - Footer / Status Bar: Current Phase indicator, Connected Player counter (`XX Chiến sĩ đang trực chiến`), Next Phase / Advance Button.
2. **Mobile Controller Hierarchy**:
   - Top Bar: Player name, avatar badge, current total score, round streak / lives.
   - Action Center: Contextual touch interface tailored for the active round:
     - R1: Text input box or Vote A/B cards + Danmaku emoji dock.
     - R2: Fullscreen interactive canvas (touch button, swipe area, shake meter, image hotspot).
     - R3: Secret badge, clue feed, chat shoutbox, expulsion ballot.
     - R4: Card drawer, target selector, 4 trivia buttons, ink scratch canvas.
   - Bottom Bar: Feedback toast ("Đã gửi thành công", "Thưởng VAR +500", etc.).

### Module B: Round 1 ("Đại Hội Cà Khịa & Check VAR")
- **Prompt Bank Requirements**: 10+ satirical situations inspired by MLN131 (e.g. *Bẫy đa cấp tiền ảo hứa hẹn lãi 500%*, *Chuyên gia mạng tự xưng bẻ cong lịch sử*, *Tin giả cắt ghép phát gạo online*, *Bình luận viên toxic núp bóng ẩn danh*).
- **Danmaku System**:
  - Particles: 🍅 Tomato (splat sound + red drip), ❤️ Heart (fire sound + upward pulse), 🧱 Brick (crunch sound + gravity bounce), 🤡 Clown (honk sound + wobble).
  - Floating speed: 3-5 seconds across screen with random vertical lanes.
- **Scoring Matrix**:
  - Winner of Duel: +1000 base + (winning % * 10) pts.
  - Loser of Duel: +250 sympathy pts.
  - Clean Sweep (100% vote): +500 bonus pts.
  - Voters who picked winner: +150 pts.

### Module C: Round 2 ("Chiến Binh 5 Giây Dị Hợm")
- **Timing & Precision**: Master clock synced at 60fps with CSS animation / Canvas RAF.
- **Micro-game 1 (Catch Report Button)**:
  - Velocity: 300px/s with directional change on boundary collision and touch proximity avoidance.
  - Decoy buttons: 3 decoy buttons labeled "Nhận Thưởng", "Xem Thêm", "Quảng Cáo" that penalize player if clicked.
- **Micro-game 2 (Shake for OTP)**:
  - Acceleration threshold: `Math.abs(accel.x + accel.y + accel.z) > 25`. Each shake adds 8% to progress.
  - Desktop fallback: Click/Tap adds 10% per tap.
- **Micro-game 3 (Dodge Drama Bricks)**:
  - Player width: 48px. Brick width: 40-60px. Falling speed: 200px/s to 400px/s.
  - Safe gaps: at least 100px wide.
- **Micro-game 4 (Spot Deepfake Glitch)**:
  - Image size: 320x240px. Glitch hotspot: 40x40px bounding box.
  - Correct tap within hotspot triggers instant win checkmark.

### Module D: Round 3 ("Vạch Mặt Seeder & Check VAR")
- **Role Ratios**:
  - 10-20 players: 2 Seeders, 8-18 Netizens.
  - 21-35 players: 3 Seeders, 18-32 Netizens.
  - 36-50 players: 4-5 Seeders, 31-45 Netizens.
- **Manh Mối (Clues)**: Generated dynamically based on the actual players assigned to the Seeder role (e.g. initial letters of names, score brackets, avatar color).
- **Expulsion Logic**: Player receiving relative majority (> 30% of total cast votes) is ejected.

### Module E: Round 4 ("Đại Chiến Lật Kèo & Cướp Điểm")
- **Card Distribution**: Each player receives 3 cards at start:
  - 1 Offensive card (*Đổ Mực* or *Bẻ Lái Troll*)
  - 1 Strategic card (*Cướp 50% Điểm* or *Cược x2*)
  - 1 Defensive card (*Khiên Tường Lửa*)
- **Ink Canvas Mechanic**:
  - Splatters 4-6 black ink circles (radius 30-50px) on mobile viewport.
  - Touch event / mouse move with `globalCompositeOperation = 'destination-out'` cleans 25px brush per stroke.
  - When erased pixels > 80%, overlay dissolves completely.
- **Questions**: 4 progressive MLN131 trivia questions from `src/data/questions.ts`. Base score: Q1: 1000, Q2: 1500, Q3: 2000, Q4: 3000 pts.

### Module F: Dev Bot Simulator
- **Config**: Toggle on Host Dev Panel with slider (10 to 30 bots).
- **Name Pool**: 30 diverse Vietnamese names with appropriate meme titles ("Tuấn Cà Khịa", "Linh Check VAR", "Bảo Thợ Lặn", "Huy Seeder").
- **Automation Timers**:
  - R1: Bots type between 4s and 20s. Bots vote within 5s with realistic random distribution (55/45 or 70/30). Bots fire Danmaku emojis at 10-20 Hz collective frequency.
  - R2: Bots roll RNG for survival (75% pass, 25% fail).
  - R3: Bots cast votes weighted toward suspect with highest evidence + 20% random noise.
  - R4: Bots target the top 3 leaderboard spots with Sabotage cards.

---

## 6. Caveats

1. **Audio Autoplay Policies**: Modern browsers require user interaction before playing Web Audio. The Host screen must have an explicit "Bật Âm Thanh / Nhấp Để Bắt Đầu" overlay on first load.
2. **Device Motion Permissions**: iOS Safari requires `DeviceMotionEvent.requestPermission()` over HTTPS. The shake mini-game must smoothly fall back to rapid tap spamming if motion permission is denied or running on desktop.
3. **No External Server Dependency**: All game logic runs synchronously via Next.js API routes with in-memory state and BroadcastChannel fallback for zero-configuration LAN or Vercel deployment.

---

## 7. Conclusion

The specification mining for "NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)" is complete. The gameplay mechanics, user stories, acceptance criteria, state transitions, scoring equations, failure modes, and edge cases are rigorously cataloged. The existing `src` codebase provides a functioning foundation (Next.js, Tailwind, BroadcastChannel sync engine, question bank, Web Audio synthesizer) that can be seamlessly upgraded into the 4-round Game Show and Dev Bot Simulator.

---

## 8. Verification Method

To verify these specifications independently:
1. Inspect `ORIGINAL_REQUEST.md` to confirm all 4 rounds, Hub/Tournament mode, and Dev Bot simulator match verbatim requirements.
2. Inspect `src/data/questions.ts` lines 1-150 to verify curriculum topics and question schema.
3. Run `npm run build` from project root to ensure type safety and build validity.
4. Verify edge cases (disconnects, device motion fallback, Danmaku throttling) against the defined criteria in Section 4.
