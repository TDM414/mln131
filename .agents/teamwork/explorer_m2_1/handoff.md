# Handoff Report: Milestone 2 — "Round 1: Cà Khịa & Check VAR"

**Author**: `explorer_m2_1`  
**Date**: 2026-10-19  
**Target Milestone**: Milestone 2 (Round 1: Cà Khịa & Check VAR)  
**Parent Agent**: `45f106cf-224a-4102-aeee-b56815847bc0`  

---

## 1. Observation

### 1.1 Existing Architecture & File State
- **Types Architecture (`src/lib/types.ts`)**:
  - `Round1Phase` (lines 49-55): `'PROMPT_BROADCAST' | 'ROAST_INPUT' | 'DUEL_SHOWDOWN' | 'VOTE_ACTIVE' | 'VAR_REVEAL' | 'ROUND_SUMMARY'` is already defined.
  - `RoastPrompt` (lines 57-62): `{ id: string; situation: string; category: string; context: string }`.
  - `RoastSubmission` (lines 64-71): `{ id: string; playerId: string; playerName: string; avatarId: string; text: string; timestamp: number }`.
  - `DuelPair` (lines 73-82): `{ id: string; prompt: RoastPrompt; submissionA: RoastSubmission; submissionB: RoastSubmission; votesA: string[]; votesB: string[]; winnerId?: string; revealed?: boolean }`.
  - `Round1State` (lines 84-91): `{ phase: Round1Phase; currentPromptIndex: number; prompts: RoastPrompt[]; submissions: Record<string, RoastSubmission>; duels: DuelPair[]; currentDuelIndex: number }`.
  - `DanmakuMessage` (lines 228-238): `{ id: string; text?: string; emoji: string; senderName: string; senderAvatar: string; color?: string; yPosition?: number; speed?: number; timestamp: number }`.

- **API Route Protocol (`src/app/api/game/route.ts`)**:
  - `SUBMIT_ROAST` (lines 346-357): Records player roast into `room.round1State.submissions[playerId]` and emits `roast_submitted` event.
  - `VOTE_ROAST` (lines 359-378): Appends voterId to `duel.votesA` or `duel.votesB`. Currently lacks deduplication if a voter switches their vote between A and B.
  - `DANMAKU` (lines 336-343): Broadcasts `danmaku` reaction events through delta buffer.
  - `HOST_UPDATE_STATE` (lines 512-522): Authoritative host patch mechanism that accepts partial updates to `room`.

- **Realtime Sync Engine (`src/lib/syncEngine.ts`)**:
  - `submitRoast(text, playerId, playerName, avatarId)` (lines 185-200): Dispatches `SUBMIT_ROAST`.
  - `voteRoast(duelId, choice, voterId)` (lines 202-204): Dispatches `VOTE_ROAST`.
  - `sendDanmaku(emoji, text, senderName, senderAvatar)` (lines 168-183): Dispatches `DANMAKU`.
  - `hostUpdateState(patch)` (lines 250-252): Dispatches `HOST_UPDATE_STATE`.

- **Procedural Sound Engine (`src/lib/audioSynthesizer.ts`)**:
  - `sound.playWhistleAlarm()` (lines 588-612): Referee whistle alarm for VAR reveal.
  - `sound.playSplat()` (lines 172-219): Comic liquid splat for 🍅 tomato and 🧱 brick impact.
  - `sound.playApplause()` (lines 91-138): Crowd cheer for duel winner.
  - `sound.playTrollHorn()` (lines 44-86): Meme airhorn blast for dramatic triggers.
  - `sound.playCountdownTick(isUrgent)` (lines 143-167): 1s countdown clicks with urgent frequency shift for the last 10s.
  - `sound.playCorrectChime()` (lines 224-250) & `sound.playVictoryFanfare()` (lines 330-366).

- **Current Host Screen (`src/app/host/page.tsx`)**:
  - Lines 365-381 use a naive CSS-animated `div` for Danmaku reactions instead of an HTML5 Canvas 2D engine.
  - Lines 395-442 contain a static placeholder for `ROUND_1` that only displays a static card with "Đã nộp: X / Y", lacking the 3-phase flow, duel pairing, voting arena, and VAR reveal.

- **Current Player Screen (`src/app/play/page.tsx`)**:
  - Lines 365-393 contain a static message "HÃY QUAN SÁT MÁY CHIẾU LỚP HỌC!", without the 120-character roast input view, quick phrase chips, or 1v1 A/B voting buttons.

- **Dev Bot Simulator (`src/components/DevBotSimulator.tsx`)**:
  - Contains basic bot submission and voting templates, but only 6 roasts and minimal staggered delay handling.

- **Test Infrastructure (`scripts/run_e2e_tests.mjs`)**:
  - `npm test` runs 6 suites and 62 tests across Tier 1 to Tier 6 with 100% pass rate.
  - `npm run build` compiles with 0 TypeScript/Next.js errors.

---

## 2. Logic Chain

1. **Why HTML5 Canvas 2D for Danmaku (`DanmakuCanvas.tsx`)?**  
   CSS DOM-based elements for 60+ simultaneous flying emojis cause browser layout thrashing, DOM node bloat, and frame drops on 60Hz/120Hz displays. A pooled Canvas 2D engine with pre-allocated particle buffers (80 max particles) and `requestAnimationFrame` maintains rock-solid 60 FPS while enabling particle physics (gravity parabolic arcs for thrown tomatoes, sine-wave wobbling for floating text banners, and splat droplet bursts on impact).

2. **Why 3 Strict Phases for Host Projector (`Round1Host.tsx`)?**  
   Classroom projection requires clear focal shifts to keep 40-50 students synchronized:
   - *Phase 1 (Prompt & Typing)*: Broad focus on reading the satirical MLN131 scenario, high-energy countdown, and progress tracking (`X / Y Đã Nộp`).
   - *Phase 2 (1v1 Comic Duel Showdown)*: Focus narrows to two competing roasts with anonymous identities, comic starburst "VS", 15s voting timer, and live Danmaku reaction barrage.
   - *Phase 3 (Check VAR & Reveal)*: Climax of the round with referee whistle alarm, caution stripes banner, dramatic vote split percentage bar, unmasking of authors, winner crowning (+1000 pts), sympathy bonus (+250 pts), and voter accuracy rewards (+150 pts).

3. **Why 1-Finger Touch Mobile Ergonomics (`Round1Play.tsx`)?**  
   In a crowded lecture hall, students hold their phone with one hand. All primary actions (Roast Input Submit, Big Vote A/B cards, and Danmaku reaction dock) must live in the natural thumb reach zone (bottom 65% of viewport). The UI must lock viewport height to `100dvh` with zero unintended scroll, and provide haptic feedback (`navigator.vibrate`) upon submitting and voting.

4. **Why Dev Bot Simulation is Essential (`DevBotSimulator.tsx`)?**  
   Testing a 40-player classroom game requires realistic multi-agent simulation. Without bots that submit humorous Vietnamese roasts with realistic delays (4s-20s) and vote with natural distributions (e.g. 60/40, 70/30), the host view cannot be validated without dozens of physical devices. Furthermore, if fewer than 2 students submit during a live session, the system must gracefully inject bot roasts so the game never stalls.

---

## 3. Detailed Blueprint & File-by-File Implementation Plan

### 3.1 `src/components/DanmakuCanvas.tsx` (New Component)
- **Role**: High-performance HTML5 Canvas 2D reaction engine.
- **Specs**:
  - `canvas` styled with `absolute inset-0 pointer-events-none z-20 w-full h-full`.
  - Supports Retina high-DPI scaling via `devicePixelRatio`.
  - Pre-allocated particle pool of 80 `DanmakuParticle` objects.
  - Particle categories:
    1. `EMOJI_BARRAGE`: Horizontal flight from right to left (`x: width -> -200`, `vx: -180` to `-380` px/s) with sine wave wobble (`y = baseY + Math.sin(time * freq) * amp`). Uses discrete vertical lanes (10%-85% height) to prevent overlap.
    2. `SPLAT_PROJECTILE`: For `🍅` (tomato) and `🧱` (brick). Parabolic trajectory launched from bottom screen edge with initial upward velocity and gravity (`vy += 650 * dt`). Upon reaching target duel card coordinates or impact plane, triggers `sound.playSplat()` and bursts 8-12 mini splatter droplets.
    3. `FLOATING_HEART`: For `❤️`. Gentle upward drift (`vy: -80` to `-140` px/s) with horizontal sway and scale pulsing.
    4. `TEXT_PILL`: Custom netizen comments rendered inside a comic neo-brutalist pill (black background, 2px cyber border, emoji icon on left, author badge, drop shadow).
  - Listens to `sync.on('danmaku')` and provides an imperative ref or prop callback `spawnParticle(emoji, text, senderName)`.
  - Memory bounds: Zero allocation in animation loop; particles marked inactive (`active = false`) are recycled.

### 3.2 `src/data/questions.ts` (Data Bank Expansion)
- **Role**: Curated MLN131 satirical prompts, quick phrases, profanity masks, and dev bot roasts.
- **Additions**:
  1. `MLN131_ROAST_PROMPTS: RoastPrompt[]`: At least 6 rich drama prompts covering:
     - *KOL bán chanh luộc ngừa virus 500k/lạng* (Chống lừa đảo sức khỏe).
     - *Admin group 200k mem biến thành sân sau lùa gà khóa học AI* (Thao túng không gian mạng).
     - *Chuyên gia tài chính hứa hẹn lãi 100%/tháng do chuyên gia bảo chứng* (Chống đa cấp số).
     - *Bác tổ trưởng gửi nhầm ảnh chế vào nhóm Zalo tổ dân phố* (Dân biết dân bàn).
     - *Chiến thần livestream khóc lóc vì bị công an triệu tập do tung tin thất thiệt* (Kỷ cương pháp quyền).
     - *Deepfake giọng nói lãnh đạo gọi điện xin chuyển tiền cứu trợ khẩn cấp* (Cạm bẫy công nghệ).
  2. `ROAST_QUICK_CHIPS: string[]`:
     - `['Ủa alo?', 'Lùa gà trắng trợn!', 'Bảo chứng bằng niềm tin à?', 'Cảnh sát chính tả gõ đầu!', 'Học lại MLN131 đi bạn!', 'Đỉnh nóc kịch trần!', 'Check VAR ngay và luôn!', 'Chuyên gia mõm!', 'Nói có sách mách có chứng!']`
  3. `VIETNAMESE_ROAST_BANK: string[]`: 25+ witty, Gen Z Vietnamese student roasts tailored for MLN131.
  4. `PROFANITY_FILTER_WORDS: string[]`: Standard offensive wordlist sanitized to `***` or funny meme replacements (e.g. `[đã bị VAR che]`).

### 3.3 `src/components/Round1Host.tsx` (New Component)
- **Role**: 16:9 Classroom Projector orchestration view.
- **Props**:
  - `state: GameShowState`
  - `onAdvanceToRound2: () => void`
  - `onResetGame: () => void`
- **Sub-Phases**:
  1. `ROAST_INPUT` / `PROMPT_BROADCAST`:
     - Topic category badge (e.g. "CHỐNG TIN GIẢ & LỪA ĐẢO SỐ").
     - Large prompt card (text size 32-36px, font-black, leading-relaxed).
     - Circular / bar countdown timer (60s default, ticking audio in last 10s).
     - Submission Tracker: "ĐÃ NỘP: X / Y SINH VIÊN" with live badge grid showing avatars of submitted players.
     - Host controls: "Bắt Đầu Đối Đầu Ngay" (forces duel generation) and "Gia Hạn +15s".
     - Automatic duel pairing algorithm: pairs submissions into 1v1 showdowns; if odd or < 2, supplements with bot roasts from `VIETNAMESE_ROAST_BANK`.
  2. `DUEL_SHOWDOWN` & `VOTE_ACTIVE`:
     - Duel indicator: "TRẬN ĐẤU {index + 1} / {totalDuels}".
     - Side-by-side 1v1 comic cards:
       - **Card A (Left)**: Cyan accent border, avatar silhouette, large quote typography (26-30px).
       - **VS Comic Starburst (Center)**: Jagged yellow badge with pulsing glow and 15s voting timer.
       - **Card B (Right)**: Crimson accent border, avatar silhouette, large quote typography (26-30px).
     - Live Danmaku layer overlaying the arena.
     - Anonymous vote counter: "Đã có X người bỏ phiếu" (suspense mode: hides split until VAR).
     - Auto-advance to VAR when 15s voting timer reaches 0 or Host clicks "Check VAR Ngay 🎦".
  3. `VAR_REVEAL`:
     - Stage 1: Whistle alarm sound (`sound.playWhistleAlarm()`), referee hazard caution stripes banner, dramatic "CHECKING VAR..." radar/magnifying glass animation (1.8s pause).
     - Stage 2: Author unmasking flip animation (reveals actual player names & avatars).
     - Split Bar: Animated percentage meter (e.g., 65% vs 35%, or 50% vs 50% tie) with vote tallies.
     - Winner coronation: Gold glow, winner crown, crowd cheer (`sound.playApplause()`), confetti blast.
     - Points allocation logic:
       - Winner: **+1000 pts**
       - Runner-up: **+250 pts**
       - Correct voters: **+150 pts**
       - Tie (50-50): **+500 pts each** and **+100 pts** to all voters.
     - Authoritative sync: Host calls `sync.hostUpdateState` with updated `players` scores and `roundScores.ROUND_1`.
     - Controls: "Trận Kế Tiếp ➡️" (if duels remain) or "Tổng Kết Vòng 1 🏆".
  4. `ROUND_SUMMARY`:
     - Top 5 Leaderboard of Round 1 with rank badges, Round 1 points, and cumulative scores.
     - Transition buttons: "Tiếp Tục Giải Đấu (Sang Vòng 2)" or "Về Sảnh Chờ".

### 3.4 `src/components/Round1Play.tsx` (New Component)
- **Role**: 1-finger touch mobile controller for 40-50 students.
- **Props**:
  - `state: GameShowState`
  - `playerId: string`
  - `playerName: string`
  - `avatarId: string`
- **Sub-Views**:
  1. `ROAST_INPUT`:
     - Prompt context display at top.
     - Textarea with 120-character counter (turns yellow at > 90, red at 120).
     - Quick phrase chips carousel for single-tap insertion.
     - Profanity sanitizer.
     - Submit button: triggers `sync.submitRoast` and `navigator.vibrate(50)`.
     - Submitted waiting screen: "ĐÃ BÀN GIAO CHO BAN TỔ CHỨC! Quan sát máy chiếu để xem câu đối đầu!".
  2. `VOTE_ACTIVE`:
     - Candidate check: If `playerId` is in the current duel, renders Gladiator banner: "⚔️ BẠN ĐANG LÊN SÀN ĐẤU! Cả lớp đang bỏ phiếu cho câu của bạn!".
     - Voter view: 2 massive thumb-friendly voting cards:
       - `[VOTE CÂU A]` with preview snippet of roast A.
       - `[VOTE CÂU B]` with preview snippet of roast B.
     - Tap triggers `sync.voteRoast(duel.id, choice, playerId)` and `navigator.vibrate(35)`.
     - Selected button locks with green checkmark badge: "ĐÃ GHI NHẬN PHIẾU BẦU ✅".
  3. `VAR_REVEAL`:
     - Shows dynamic personal verdict:
       - "🎉 BẠN ĐÃ THẮNG TRẬN! +1000 ĐIỂM"
       - "👏 SUÝT THẮNG! +250 ĐIỂM CẢM THÔNG"
       - "🎯 ĐOÁN ĐÚNG! +150 ĐIỂM CỬ TRI THÔNG THÁI"
       - "😅 CHÚC MAY MẮN LẦN SAU!"
  4. `PERSISTENT DANMAKU DOCK`:
     - 6 Quick Emoji buttons (`🍅`, `🧱`, `❤️`, `🤡`, `🔥`, `🎦`) with 300ms cooldown.
     - Custom comment input (up to 40 characters) to fire text barrages directly onto projector screen.

### 3.5 `src/components/DevBotSimulator.tsx` (Enhancement)
- **Role**: Realistic multi-bot simulation engine for Milestone 2.
- **Enhancements**:
  - Integrate `VIETNAMESE_ROAST_BANK`: Bots pick contextually relevant roasts.
  - Staggered delays: During `ROAST_INPUT`, 10-15 bots submit with realistic random delays between 4.0s and 22.0s, giving the host screen authentic increments.
  - Natural voting distribution: In `VOTE_ACTIVE`, bots cast votes over 2.0s to 12.0s with weighted distributions (55/45 or 70/30).
  - Danmaku bursts: Bots react with emojis during duel reveals and punchlines.

### 3.6 Host & Play Page Integrations
- `src/app/host/page.tsx`:
  - Mount `<DanmakuCanvas />` over projector view.
  - Replace static `status === 'ROUND_1'` block with `<Round1Host ... />`.
- `src/app/play/page.tsx`:
  - When `gameState.status === 'ROUND_1'`, render `<Round1Play ... />`.
- `src/app/api/game/route.ts`:
  - Enhance `VOTE_ROAST` to cleanly remove previous vote from opposite choice if voter switches vote.

---

## 4. Caveats & Assumptions

1. **No External Server / WebSocket Requirement**:
   - The system strictly relies on the dual-channel sync engine (`BroadcastChannel` + HTTP delta polling `/api/game`). No WebSocket server or Redis is required, ensuring 1-click deployment on Vercel and zero setup on local classroom LAN.
2. **Audio Autoplay Policy**:
   - Browsers block Web Audio API until the first user interaction. The host projector page handles this cleanly with an `onClick` resume trigger and clear UI sound toggles.
3. **Screen Resolution Independence**:
   - The host layout is strictly 16:9 responsive with minimum font sizes (24px+) to guarantee legibility from the back of a 50-person lecture hall. Mobile view is strictly 100dvh with zero horizontal or vertical page bounce.

---

## 5. Conclusion

Milestone 2 ("Round 1: Cà Khịa & Check VAR") transforms the party game show into a Quiplash-style classroom hit. The architecture seamlessly integrates:
1. `DanmakuCanvas.tsx`: High-performance 60 FPS reaction engine.
2. `Round1Host.tsx`: 3-phase classroom projector experience with suspenseful VAR reveal.
3. `Round1Play.tsx`: 1-finger mobile controller with quick phrase chips and massive vote touch targets.
4. `DevBotSimulator.tsx`: 20+ curated student roasts and realistic staggered bot interactions.
5. Zero-regression integration with existing Milestone 1 sync, audio synthesizer, and test harness.

---

## 6. Verification Method

To verify the implementation independently after code changes:
1. **Automated Test Suite**:
   ```powershell
   npm test
   ```
   Must pass 100% of all test tiers (Tier 1 to Tier 6, 62+ tests).
2. **TypeScript & Next.js Build**:
   ```powershell
   npm run build
   ```
   Must compile cleanly with 0 type errors and 0 build warnings.
3. **End-to-End Gameplay Walkthrough**:
   - Open Host Projector at `http://localhost:3000/host`.
   - Open Mobile Controller at `http://localhost:3000/play`.
   - Click "Test Dev" -> "Bật Bot Ngay" in Host. 15 bots auto-join.
   - Click "Bắt Đầu Giải Đấu" -> Enters Round 1.
   - Verify prompt broadcast, countdown timer, and bot submissions incrementally reaching 15/16.
   - Verify 1v1 duel showdown cards render cleanly side-by-side.
   - Verify mobile player sees big Vote A / Vote B buttons.
   - Cast votes and verify Danmaku reactions fly across canvas.
   - Verify VAR referee whistle alarm, caution banner, vote split bar, and points distribution (+1000, +250, +150).
