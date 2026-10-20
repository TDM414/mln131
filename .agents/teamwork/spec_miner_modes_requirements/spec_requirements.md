# SPECIFICATION: NETIZEN PARTY (MLN131 EDITION) — 4 RESTRUCTURED GAME MODES, SPEED-DECAY SCORING, AUDIO & DEV BOTS

- **Authoritative Sources**: `ORIGINAL_REQUEST.md` (Update 2026-10-19T15:28:48Z, Follow-up 2026-10-19T13:18:55Z), `PROJECT.md`, codebase inspection of `src/` (`types.ts`, `/api/game/route.ts`, `HostLobby.tsx`, `Round1Host.tsx`, `Round2Host.tsx`, `Round3Host.tsx`, `Round4Host.tsx`, `audioSynthesizer.ts`, `DevBotSimulator.tsx`).
- **Integrity Mode**: Development
- **Scope**: Classroom Realtime Party Game Show (1 Host 16:9 Projector + 40-50 Mobile Clients).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Architecture & Hub | Standalone Party Game Hub | Host can launch any of the 4 modes independently or sequentially; mobile players persist without reconnecting, re-scanning QR, or re-entering PIN. | Host mode selection click (`SET_STATUS`) | Room status change, mobile controller transitions | Invalid mode defaults to LOBBY; disconnected players auto-rejoin upon reconnect | ORIGINAL_REQUEST.md (13:18:55Z & 15:28:48Z), HostLobby.tsx |
| 2 | Architecture & Hub | Prominent Mode 4 Quick Launcher | Dedicated, eye-catching "[Thử Ngay Mode 4]" quick launch button prominently placed at the Host Hub Lobby. | Host click on Mode 4 launcher button | Room status transitions directly to ROUND_4 | Button disabled if 0 players connected unless Dev Bots enabled | ORIGINAL_REQUEST.md R4 & AC |
| 3 | Mode 1: Trending Feed Wall | 45s Mass Comment Phase | All 50 students simultaneously submit short MLN131 satirical roasts/comments for a single broadcast scenario; eliminates 25 slow 1v1 duels. | Mobile text input (<=120 chars), optional quick-chips | `SUBMIT_ROAST` event, roast added to room submissions, live count counter on projector | Profanity filtered to `[VAR đã che 🎦]`; empty text rejected; duplicate submissions update existing | ORIGINAL_REQUEST.md R1 & AC |
| 4 | Mode 1: Trending Feed Wall | 30s Live Newsfeed Reaction Phase | Projector displays streaming social media newsfeed; 50 students scroll on mobile and cast ❤️, 🍅, 🧱 reactions in realtime. | Mobile reaction button clicks (❤️ Thả Tim, 🍅 Ném Cà Chua, 🧱 Quăng Gạch) | `DANMAKU` / reaction event, incremental reaction counters on posts, flying particles on projector | 300ms client debouncing prevents spam flooding; malformed payload dropped | ORIGINAL_REQUEST.md R1 & AC |
| 5 | Mode 1: Trending Feed Wall | Top Trending Ranking Algorithm | Comments ranked by engagement formula; top comments automatically ascend to Top 1, 2, 3 Trending on projector with airhorn/fanfare SFX. | Aggregated reactions (❤️ weight: 100, 🍅 weight: 50, 🧱 weight: 50) | Top 3 Trending leaderboard cards on projector; bonus points awarded to authors | Tie-breaker resolved by earlier timestamp | ORIGINAL_REQUEST.md R1 |
| 6 | Mode 2: Fact or Cap 5s Reflex | 5s Ticking Bomb Universal Engine | 5 consecutive MLN131 sensational statements presented with a 5.0s ticking bomb timer and accelerating tick SFX. | Host game start / automated question step | Synchronized 5.0s countdown, accelerating audio tick, bomb visuals | Timer timeout auto-triggers result resolution with bomb explosion | ORIGINAL_REQUEST.md R2 & AC |
| 7 | Mode 2: Fact or Cap 5s Reflex | 2-Button Mobile Thumb Interface | Mobile controller displays only 2 massive touch buttons: [🟢 FACT / CHUẨN] vs [🔴 CAP / BỐC PHÉT]; zero phone shaking or complex gestures. | Mobile touch on FACT (True) or CAP (False) | `FACT_OR_CAP_ANSWER` with timestamp and choice | Double-tap ignored after first submission; submissions after 5.0s treated as timeout (0 pts) | ORIGINAL_REQUEST.md R2 & AC |
| 8 | Mode 2: Fact or Cap 5s Reflex | Bomb Explosion on Wrong/Timeout | If student selects wrong answer or times out (>5s), a comic bomb explosion visual and heavy bass explosion SFX trigger; student loses life or receives 0 pts. | Answer verification against `correctAnswer` | Explosion visual, `playExplosion(true)` SFX, 0 points, life deducted | If lives reach 0, player enters spectator "Ma Mạng" ghost mode | ORIGINAL_REQUEST.md R2 & AC |
| 9 | Mode 3: Consensus Dilemma | MLN131 Ethical Dilemma Broadcast | Projector presents profound MLN131 ethical dilemmas (Privacy vs Security, Free Speech vs Social Responsibility, Engagement Algorithm vs Civic Ethics); replaces Among Us Seeder hunt. | Question bank `MLN131_DILEMMAS` | 16:9 Projector dilemma scenario card with 2 contrasting stances [A] and [B] | Missing dilemma falls back to default scenario | ORIGINAL_REQUEST.md R3 & AC |
| 10 | Mode 3: Consensus Dilemma | 2-Stage Mobile Decision & Bet | Mobile player first selects their personal stance [A] vs [B], then bets on whether >50% of the class will pick [Phe A] or [Phe B]. | Mobile choice [A]/[B], bet [A > 50%]/[B > 50%] | `DILEMMA_CHOICE` & `CONSENSUS_BET` events | Incomplete bets default to own stance; votes locked when timer expires | ORIGINAL_REQUEST.md R3 |
| 11 | Mode 3: Consensus Dilemma | Realtime Tug-of-War Visual Bar | Projector renders a dynamic Tug-of-War (Kéo Co Dân Ý) bar shifting in realtime towards the stance with more votes. | Live stream of student choices [A] vs [B] | Tug-of-war rope/pointer moving left/right with percentage split | Split handles 0-0 state centered at 50/50 | ORIGINAL_REQUEST.md R3 & AC |
| 12 | Mode 3: Consensus Dilemma | Majority Bonus & Minority Barrage | Students who correctly predicted the majority (>50%) win +5000 points; minority side gets hit with a comic Danmaku brick barrage on screen. | Tally of class choices vs player bets | +5000 pts to winners; screen shake and brick barrage for minority | If exact 50-50 tie, both sides receive draw bonus (+2500 pts) | ORIGINAL_REQUEST.md R3 & AC |
| 13 | Mode 4: Sabotage Trivia | Sabotage Card Deal & Attack | Players receive sabotage cards (Đổ Mực Đen, Cướp 50% Điểm, Cược x2, Bẻ Lái Troll) and target rivals before/during MLN131 trivia. | Mobile card selection & target player click | `PLAY_CARD` event, active debuff applied to target | Self-targeting prevented; cards consumed upon play; target shield absorbs attack | ORIGINAL_REQUEST.md R4, types.ts |
| 14 | Mode 4: Sabotage Trivia | Fullscreen Ink Wipe Canvas | Targeted player's mobile screen is covered in opaque squid ink splatter; requires 6-10 touch/swipe gestures to clean before answering. | Mobile touch/click events on ink overlay | `WIPE_INK` event, opacity reduces per touch until cleared | Cannot see question options clearly while ink persists; sound splat on each wipe | ORIGINAL_REQUEST.md R4, types.ts |
| 15 | Mode 4: Sabotage Trivia | High-Stakes Situational MLN131 Trivia | Complex multiple-choice questions on socialist democracy, rule of law, and digital citizenship with speed-decay scoring. | Mobile option selection (A, B, C, D) | `SUBMIT_TRIVIA` event, score updated | Timeout = 0 pts; wrong option = 0 pts | ORIGINAL_REQUEST.md R4 |
| 16 | Scoring System | Speed-Decay Scoring Model | Points dynamically calculated based on remaining time: `Points = BasePoints * (RemainingTime / TotalTime)`. | Answer submission timestamp, question total duration, correctness | Correct answer: proportional points (up to 100%); Wrong answer: 0 points | Negative remaining time clamped to 0; wrong answers strictly 0 | ORIGINAL_REQUEST.md R5 & AC |
| 17 | Audio Engine | Procedural Web Audio Synthesizer | 100% offline Web Audio synthesizer delivering all arcade & meme SFX (Troll horn, ticking bomb, applause, explosion, splat, correct/wrong, 128 BPM BGM). | JavaScript API method calls (`sound.play*()`) | Synthesized audio waveforms via AudioContext | AudioContext resume on user gesture; clamped volume prevents exponential ramp errors | ORIGINAL_REQUEST.md Asset Pipeline, audioSynthesizer.ts |
| 18 | Dev Bot Simulator | 15-20 Student Virtual Sandbox | Simulates 15-20 virtual Vietnamese students executing realistic gameplay across all 4 restructured modes with configurable reaction speeds. | Toggle button in Host Header (`Test Dev`) | Synthetic joins, roast submissions, reactions, Fact/Cap taps, dilemma bets, card plays | Safe cleanup on unmount; prevents duplicate bot IDs | ORIGINAL_REQUEST.md AC, DevBotSimulator.tsx |

---

## Edge Cases

| # | Feature | Input / Scenario | Observed / Required Behavior |
|---|---------|------------------|------------------------------|
| 1 | Mode 1: Trending Feed Wall | Student submits an empty comment or whitespace only | Input validation rejects submission; mobile shows helper message "Hãy nhập bình luận!"; submit button remains disabled until valid characters entered. |
| 2 | Mode 1: Trending Feed Wall | Profanity or toxic language in comment (e.g. "vcl", "dm", "lùa gà") | Server/client sanitizer transforms matched profanity words to `[VAR đã che 🎦]`, keeping the rest of the text intact and <= 120 chars. |
| 3 | Mode 1: Trending Feed Wall | Fewer than 3 students submit comments in 45s (e.g. testing with 1 phone) | System injects fallback roasts from `VIETNAMESE_ROAST_BANK` authored by Dev Bots so that the 30s reaction feed has at least 5-10 cards. |
| 4 | Mode 1: Trending Feed Wall | A student spams 50 reactions in 1 second | Client-side rate limiter enforces 300ms cooldown per tap; server delta buffer caps and aggregates reactions per post. |
| 5 | Mode 1: Trending Feed Wall | Two comments have identical top reaction counts | Tie-breaker ranks the comment submitted earlier in timestamp as higher trending. |
| 6 | Mode 2: Fact or Cap 5s Reflex | Student answers at exactly 4.99 seconds (10ms remaining) | Speed-decay formula calculates: `BasePoints * (10 / 5000) = 0.2% * BasePoints` (e.g. 4 points). Points are floored to integer and awarded since `RemainingTime > 0`. |
| 7 | Mode 2: Fact or Cap 5s Reflex | Student answers after 5.00s timer expires | Evaluated as timeout: marked as unsuccessful, 0 points awarded, bomb explosion SFX triggers, life deducted. |
| 8 | Mode 2: Fact or Cap 5s Reflex | Student loses all 3 lives during 5 mini-game questions | Student transitions to "Ma Mạng" (Spectator Ghost) status: can no longer gain score but can still watch and send Danmaku cheers/reactions. |
| 9 | Mode 2: Fact or Cap 5s Reflex | Network lag causes mobile answer packet to arrive 400ms late | Server checks the client-signed timestamp `reactionTimeMs` clamped to 5000ms. If `reactionTimeMs <= 5000`, answer is validly scored. |
| 10 | Mode 3: Consensus Dilemma | Class vote splits exactly 50% - 50% (e.g. 25 votes A, 25 votes B) | Neither side has strictly `>50%`. System declares a "Hòa Hiệp Dân Ý" (Consensus Draw); all players who bet on either side receive half bonus (+2500 pts); no brick barrage. |
| 11 | Mode 3: Consensus Dilemma | Student selects personal choice [A] but runs out of time before picking consensus bet | Bet automatically defaults to student's own stance [Phe A > 50%]. |
| 12 | Mode 3: Consensus Dilemma | Student bets against their own personal stance (e.g. chooses [A] but bets [B > 50%]) | Fully permitted and valid! Reflects realistic strategic political acumen (personal preference vs objective societal projection). |
| 13 | Mode 4: Sabotage Trivia | Student with Ink Splatter debuff attempts to answer trivia without wiping ink | Ink overlay blocks options visually (z-index 50); student can still blindly tap if they remember button layout, but wiping 6-10 times is strongly incentivized. |
| 14 | Mode 4: Sabotage Trivia | Attacker plays Point Heist (Cướp 50% Điểm) on a player with 0 points | 50% of 0 is 0; attacker gains 0, victim remains at 0; no negative score underflow. |
| 15 | Mode 4: Sabotage Trivia | Player activates Double or Nothing (Cược x2) but answers incorrectly | Points earned = 0. (Optionally penalty: loses 0 or loses 2000 points if high-risk variant enabled; per spec: "Bấm sai bị 0 điểm"). |
| 16 | Speed-Decay Scoring | Player submits answer in the first 0.2 seconds (fast twitch reflex) | `RemainingTime / TotalTime = 4800 / 5000 = 0.96` (96% of BasePoints). Maximizes reward for true speed reflex. |
| 17 | Dev Bot Simulator | Host toggles Dev Bots in the middle of an active round | Bots seamlessly initialize their round state for the current phase without throwing undefined errors or resetting human players. |
| 18 | Audio Engine | User opens Host Projector page without interacting (browser autoplay policy) | Web Audio `AudioContext` remains suspended until first click anywhere on screen; click handler calls `ctx.resume()` and plays sound without throwing console errors. |

---

## Detailed Specifications by Feature Group

### 1. Mode 1: "Tường Bình Luận Triệu Like" (Trending Feed Wall)
- **Concept & Pedagogy**: Replaces 25 consecutive 1v1 Quiplash duels that caused classroom downtime. In MLN131, public opinion on digital social media forms rapidly through collective commenting and algorithmic virality.
- **Phase Flow**:
  1. `COMMENT_INPUT` (45s):
     - Projector: Displays satirical MLN131 situation (e.g., KOL selling fake health cures, deepfake impersonations, Ponzi schemes) + live counter (`X / 50 sinh viên đã nộp`).
     - Mobile: Fullscreen text editor (max 120 chars), quick-phrase chips ("Check VAR ngay!", "Lùa gà trắng trợn!", "Học lại MLN131 đi!"), profanity filter replacing dirty words with `[VAR đã che 🎦]`.
  2. `FEED_REACTION` (30s):
     - Projector: Social newsfeed wall rendering all submitted comments in a multi-column dynamic feed.
     - Mobile: Scrollable newsfeed of classmate comments with 3 quick-action reaction buttons:
       - ❤️ **Thả Tim** (Respect / Approval)
       - 🍅 **Ném Cà Chua** (Disapproval / Troll)
       - 🧱 **Quăng Gạch** (Heavy Roast / Critical VAR)
     - Live Danmaku reaction barrage floats across projector canvas in realtime.
  3. `TOP_TRENDING_REVEAL` (15s):
     - Algorithm aggregates: `EngagementScore = (Hearts * 100) + (Tomatoes * 50) + (Bricks * 50)`.
     - Projector triggers airhorn SFX (`sound.playTrollHorn()`), announces Top 3 Trending Comments with gold/silver/bronze badges and confetti.
     - Points: Top 1 (+3000), Top 2 (+2000), Top 3 (+1000). All valid submissions receive +10 points per reaction received.
  - **Total Mode Duration**: ~1.5 to 2.0 minutes for 50 students.

---

### 2. Mode 2: "Đại Chiến Bóc Phốt 5 Giây" (Fact or Cap 5s Reflex)
- **Concept & Pedagogy**: Teaches rapid information literacy and critical thinking against fake news, phishing, and pseudo-democratic propaganda. Completely eliminates mobile motion/shake sensors and finicky drag-and-drop.
- **Phase Flow**:
  - 5 rapid rounds of 5.0-second statements:
    - Example Statements:
      1. *"Dân chủ XHCN là quyền tự do tuyệt đối, công dân có quyền đăng bất kỳ tin gì lên mạng mà không cần tuân thủ pháp luật."* -> **CAP / BỐC PHÉT**
      2. *"Phương châm 'Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng' đã được thể chế hóa trong Đề án 06 và Cổng Dịch vụ công Quốc gia."* -> **FACT / CHUẨN**
      3. *"Video Deepfake gọi điện mượn tiền dù có hình ảnh khuôn mặt vẫn có thể là lừa đảo công nghệ cao."* -> **FACT / CHUẨN**
      4. *"Một nhóm ẩn danh trên mạng kêu gọi tẩy chay bầu cử và tự ý lập chốt kiểm soát là biểu hiện của dân chủ trực tiếp tiến bộ."* -> **CAP / BỐC PHÉT**
      5. *"Công dân có quyền yêu cầu cơ quan nhà nước giải trình và minh bạch thông tin ngân sách trên Cổng thông tin điện tử."* -> **FACT / CHUẨN**
  - **Projector**: 5s visual ticking bomb with animated fuse, countdown timer, accelerating woodblock/synthesizer ticks (`playCountdownTick`).
  - **Mobile**: 2 massive thumb buttons taking up 85% of screen height:
    - `[🟢 FACT / CHUẨN]` (Green `#06D6A0`, high contrast, tactile haptic 40ms vibration)
    - `[🔴 CAP / BỐC PHÉT]` (Red `#EF233C`, high contrast, tactile haptic 40ms vibration)
  - **Scoring**: Speed-decay formula: `Points = 2000 * (RemainingTimeMs / 5000)`.
    - If correct: receives between 400 and 2000 points.
    - If wrong or timeout (>5s): 0 points, bomb explosion animation, `playExplosion(true)` SFX, loss of 1 life (starts with 3 lives).
  - **Result Screen**: 3s reveal of split percentages, correct rationale, and humorous meme caption.

---

### 3. Mode 3: "Trưng Cầu Dân Ý: Đoán Phe Đa Số" (The Consensus Dilemma)
- **Concept & Pedagogy**: Replaces the Seeder / Among Us social deduction mode where students felt awkward accusing strangers. Centers on fundamental tensions in socialist democracy, public consensus, and digital ethics.
- **Phase Flow**:
  1. `DILEMMA_BROADCAST` (10s):
     - Projector displays a deep societal/digital dilemma:
       - *Dilemma 1: Quyền Riêng Tư vs Giám Sát An Ninh Số* — Có nên cho phép thuật toán AI của cơ quan an ninh quét tự động tin nhắn công cộng để phát hiện sớm các vụ lừa đảo Ponzi và bắt cóc tống tiền?
         - Stance [A]: Đồng ý quét để bảo vệ tối đa trật tự an toàn cho nhân dân.
         - Stance [B]: Phản đối, quyền riêng tư dữ liệu cá nhân là bất khả xâm phạm.
       - *Dilemma 2: Tự Do Biểu Đạt vs Trách Nhiệm Xã Hội* — Nền tảng mạng xã hội có nên gỡ bỏ các bài đăng mê tín dị đoan / chanh luộc chữa virus ngay lập tức mà không cần lệnh của tòa án?
         - Stance [A]: Phải gỡ ngay để bảo vệ sức khỏe cộng đồng.
         - Stance [B]: Phải để cộng đồng tự phản biện và có phán quyết pháp lý rõ ràng.
       - *Dilemma 3: Thuật Toán Đề Xuất vs Định Hướng Văn Hóa* — Nhà nước có nên can thiệp yêu cầu mạng xã hội ưu tiên đề xuất nội dung giáo dục lịch sử và văn hóa thay vì nội dung giải trí nhảm nhí?
  2. `VOTE_AND_BET` (20s):
     - Mobile Step 1: Chọn quan điểm cá nhân: `[A]` vs `[B]`.
     - Mobile Step 2: Đặt cược dự đoán số đông: "BẠN ĐOÁN TRÊN 50% CẢ LỚP SẼ CHỌN PHE NÀO?" -> `[Cược Phe A > 50%]` vs `[Cược Phe B > 50%]`.
  3. `TUG_OF_WAR_REVEAL` (15s):
     - Projector: Realtime animated Tug-of-War (Thanh Kéo Co Dân Ý) pulling dynamically toward the heavier side.
     - Verdict:
       - The side with > 50% is declared **Phe Đa Số (Consensus Majority)**.
       - Students who correctly guessed the majority receive **+5000 points**.
       - Students in the minority group receive a humorous **Cơn Mưa Gạch Đá (Danmaku Brick Barrage)** raining down on their avatars with comic sound effects.

---

### 4. Mode 4: "Đấu Trường Chơi Xấu Cướp Điểm" (Sabotage Trivia Final)
- **Hub Ergonomics**:
  - Dedicated prominent button `[Thử Ngay Mode 4]` on Host Hub with distinct gradient border and icon, allowing 1-click launch anytime.
- **Mechanics**:
  1. `CARD_DRAFT & ATTACK` (15s):
     - Players receive a hand of sabotage cards:
       - 🦑 `INK_SPLATTER`: Blinds target player's phone with thick black squid ink; requires 6-10 wipes to uncover question.
       - 💰 `POINT_HEIST`: Steals 50% points from target's upcoming answer.
       - 💎 `DOUBLE_OR_NOTHING`: 2x points if correct; 0 points if wrong.
       - 🎲 `TROLL_QUESTION`: Shuffles or reverses answer choices.
       - 🛡️ `CYBER_SHIELD`: Blocks 1 incoming sabotage card.
     - Live sabotage log displayed on projector (`Player X tung [Đổ Mực] nhắm vào Top 1 Player Y`).
  2. `TRIVIA_QUESTION` (20s):
     - High-stakes MLN131 situational question with speed-decay scoring (`BasePoints = 10000`).
     - Mobile ink wipe interaction: Players with ink debuff must tap frantically to wipe ink spots before picking options.
  3. `ROUND_RESOLUTION` (8s):
     - Reveal answer, points distribution, heist transfers, and updated live podium.
  4. `PODIUM_FINALE`:
     - Championship ceremony for Top 1, 2, 3 players with confetti and honorary titles.

---

### 5. Universal Speed-Decay Scoring Model
- **Core Formula**:
  $$\text{PointsEarned} = \text{round}\left(\text{BasePoints} \times \frac{\text{RemainingTimeMs}}{\text{TotalTimeMs}}\right)$$
- **Rules**:
  - Correct Answer within time limit: Awarded calculated decayed points.
  - Wrong Answer: strictly 0 points.
  - Timeout ($RemainingTimeMs \le 0$): strictly 0 points.
  - Fast response ceiling: Capped at `BasePoints` (100%).
  - Decay Floor: Linear down to 0; no penalty below 0 unless specific card debuff applies.
- **Parameters per Mode**:
  - **Mode 2 (5s Reflex)**:
    - `BasePoints`: 2000
    - `TotalTimeMs`: 5000
    - Example: Response in 1.2s ($3800ms$ left) $\rightarrow 2000 \times (3800 / 5000) = 1520$ pts (76%).
    - Response in 4.5s ($500ms$ left) $\rightarrow 2000 \times (500 / 5000) = 200$ pts (10%).
  - **Mode 3 (Consensus Dilemma)**:
    - `ConsensusReward`: +5000 pts (flat bonus for accurately predicting majority).
  - **Mode 4 (Sabotage Trivia)**:
    - `BasePoints`: 10000
    - `TotalTimeMs`: 20000 (20s)
    - With `DOUBLE_OR_NOTHING`: Multiplied by 2 (up to 20,000 pts).
    - With `POINT_HEIST`: Attacker receives 50% of victim's earned points.

---

### 6. Audio & Asset 4-Tier Pipeline Requirements
1. **Tier 1 — Online / Open-Source Resources**:
   - Lucide React Icons: `Flame`, `Trophy`, `Zap`, `Shield`, `Bomb`, `Smartphone`, `Sparkles`, `Timer`, `Crown`, `Radio`, `HelpCircle`, `Gavel`, etc.
   - Vector SVGs: 10 custom Netizen Meme Persona avatars in `src/data/memeAvatars.ts`.
   - Procedural Web Audio API: 100% offline, guaranteed zero network failure.
2. **Tier 2 — Gen AI Assets**:
   - High-contrast comic background patterns, meme badge illustrations if custom imagery needed.
3. **Tier 3 — Code (Canvas 2D / CSS Animations)**:
   - `DanmakuCanvas.tsx`: High-performance HTML5 Canvas 2D reaction particle engine.
   - Ink splatter wipe overlay on mobile canvas/DOM.
   - Tug-of-war dynamic balance bar with spring physics.
4. **Tier 4 — Procedural Audio SFX Catalog (`audioSynthesizer.ts`)**:
   - `playTrollHorn()`: 3-burst detuned brass blare (Bb4, F4, Db5) for meme moments & Top Trending.
   - `playCountdownTick(isUrgent)`: Universal ticking sound, accelerating under 2.0s.
   - `playExplosion(heavy)`: Sub-bass triangle wave + shaped noise burst for bomb explosions.
   - `playCorrectChime()`: Sine arpeggio (C5, E5, G5, C6).
   - `playWrongBuzz()`: Dissonant sawtooth clash (C3 + Db3).
   - `playSplat()`: Squishy pitch-slide triangle + filtered noise for tomato/ink impacts.
   - `playApplause()`: Shaped white noise bursts simulating classroom crowd applause.
   - `playVictoryFanfare()`: Triumphant brass melody.
   - `playWhistleAlarm()`: Dual-pitch referee VAR whistle.
   - `startPartyBGM()` / `stopPartyBGM()`: Procedural 128 BPM chiptune party loop with kick, snare, hi-hat, and funk bassline.

---

### 7. Dev Bot Simulator v2 Requirements
- **Persona Roster**: 15-20 virtual students with realistic Vietnamese names and meme avatars (`Tuấn Anh`, `Khánh Linh`, `Minh Đức`, `Hương Giang`, `Văn Hoàng`, `Thị Thảo`, `Gia Huy`, etc.).
- **Mode 1 Automation**:
  - Submits contextual Vietnamese roasts from `VIETNAMESE_ROAST_BANK` during 45s input window with staggered delays (3s to 20s).
  - During 30s reaction phase, bots emit randomized ❤️, 🍅, 🧱 reactions every 400-800ms targeting submitted comments.
- **Mode 2 Automation**:
  - Simulates reaction times between 1.2s and 4.2s.
  - Calibrated accuracy rate: 75% correct (85% in FAST mode, 60% in CHAOTIC mode).
  - Triggers proper score updates via `MINIGAME_RESULT` or `FACT_OR_CAP_ANSWER`.
- **Mode 3 Automation**:
  - Selects Dilemma stance [A] vs [B] with weighted distributions (e.g. 58% vs 42%).
  - Automatically casts consensus bets on predicted majority.
- **Mode 4 Automation**:
  - Casts sabotage cards targeting top-ranked players on the live leaderboard.
  - Answers trivia with speed-decay timing (1.5s to 8.0s).
- **Controls**:
  - Accessible via `[Test Dev]` button in Host header.
  - Toggle switch: `BẬT BOT` / `TẮT BOT`.
  - Speed Profile: `FAST`, `REALISTIC`, `CHAOTIC`.
  - Quick actions: `Bão Danmaku` (instant barrage), `Thêm +5 Bot`.

---

## Data Schema & API Contract Specification

### `src/lib/types.ts` Updates
```typescript
// Mode 1 State
export interface FeedComment {
  id: string;
  playerId: string;
  playerName: string;
  avatarId: string;
  text: string;
  reactions: {
    heart: number;    // ❤️
    tomato: number;   // 🍅
    brick: number;    // 🧱
  };
  score?: number;
  timestamp: number;
}

export interface Round1TrendingState {
  phase: 'PROMPT_BROADCAST' | 'COMMENT_INPUT' | 'FEED_REACTION' | 'TOP_TRENDING_REVEAL' | 'ROUND_SUMMARY';
  currentPromptIndex: number;
  prompt: RoastPrompt;
  comments: Record<string, FeedComment>; // keyed by playerId
  topTrending: FeedComment[];
}

// Mode 2 State
export interface FactOrCapItem {
  id: number;
  statement: string;
  isFact: boolean;
  explanation: string;
}

export interface Round2ReflexState {
  phase: 'INTRO' | 'PLAYING' | 'RESULT' | 'ROUND_SUMMARY';
  currentIndex: number;
  items: FactOrCapItem[];
  playerResults: Record<string, {
    choice: boolean;       // true = FACT, false = CAP
    reactionTimeMs: number;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
}

// Mode 3 State
export interface DilemmaItem {
  id: number;
  title: string;
  scenario: string;
  optionA: string;
  optionB: string;
  explanation: string;
}

export interface Round3ConsensusState {
  phase: 'DILEMMA_INTRO' | 'VOTE_AND_BET' | 'TUG_OF_WAR_REVEAL' | 'ROUND_SUMMARY';
  currentIndex: number;
  dilemmas: DilemmaItem[];
  playerDecisions: Record<string, {
    stance: 'A' | 'B';
    betMajority: 'A' | 'B';
    pointsEarned: number;
  }>;
  majorityStance?: 'A' | 'B' | 'TIE';
  splitPercentA: number;
  splitPercentB: number;
}
```

### `/api/game/route.ts` Action Handlers
- `SUBMIT_COMMENT`: `{ playerId, text, playerName, avatarId }`
- `REACT_COMMENT`: `{ targetPlayerId, reactionType: 'heart' | 'tomato' | 'brick' }`
- `SUBMIT_FACT_CAP`: `{ playerId, choice: boolean, timeMs: number }`
- `SUBMIT_DILEMMA`: `{ playerId, stance: 'A' | 'B', betMajority: 'A' | 'B' }`
- `LAUNCH_MODE_4`: Quick shortcut action setting status to `ROUND_4`.
