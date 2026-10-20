# DISPATCH: worker_m2_1 — Milestone 2 Implementation

## Assignment
You are `worker_m2_1`.
Your working directory: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m2_1`
Project root: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`
Parent conversation ID: `45f106cf-224a-4102-aeee-b56815847bc0`

## Mandatory Documents to Read
1. `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md`
2. `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md`
3. Architectural Blueprint: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m2_1\handoff.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Scope of Work — Milestone 2 ("Round 1: Cà Khịa & Check VAR")
Implement the genuine, complete Round 1 systems according to `explorer_m2_1/handoff.md`:

1. `src/components/DanmakuCanvas.tsx` (New):
   - High-performance HTML5 Canvas 2D engine with pre-allocated 80-particle pool.
   - 60 FPS requestAnimationFrame loop, high-DPI retina scaling.
   - Particle physics:
     * `EMOJI_BARRAGE`: Horizontal flight right-to-left with sine wave wobble across discrete vertical lanes.
     * `SPLAT_PROJECTILE`: Parabolic arcs with gravity for 🍅 tomato and 🧱 brick, bursting into mini splatter droplets upon impact with `sound.playSplat()`.
     * `FLOATING_HEART`: Upward drift with gentle sway for ❤️.
     * `TEXT_PILL`: Custom netizen comments inside neo-brutalist rounded badges.
   - Listens to `sync.on('danmaku')` and exposes callback or ref.

2. `src/data/questions.ts` (Expansion):
   - Add `MLN131_ROAST_PROMPTS`: At least 6 satirical drama prompts tailored to MLN131 (e.g. KOL chanh luộc 500k, Admin group lùa gà AI, chuyên gia tài chính đa cấp số, bác tổ trưởng gửi nhầm ảnh chế, livestream khóc lóc sau khi bị triệu tập, deepfake lừa đảo cứu trợ).
   - Add `ROAST_QUICK_CHIPS`: Quick phrase chips ('Ủa alo?', 'Lùa gà trắng trợn!', 'Bảo chứng bằng niềm tin à?', 'Cảnh sát chính tả gõ đầu!', etc.).
   - Add `VIETNAMESE_ROAST_BANK`: 25+ witty, authentic Gen Z Vietnamese student roasts.
   - Add `PROFANITY_FILTER_WORDS` and sanitizing function.

3. `src/components/Round1Host.tsx` (New):
   - 16:9 classroom projector view with 3 phases:
     * `ROAST_INPUT` / `PROMPT_BROADCAST`: Topic category badge, large prompt card (32px+), countdown timer, live "ĐÃ NỘP: X / Y" submission tracker with avatar grid, host controls ("Bắt Đầu Đối Đầu Ngay", "Gia Hạn +15s"). Automatic duel pairing (with bot roast fallback if < 2 submissions).
     * `DUEL_SHOWDOWN` & `VOTE_ACTIVE`: Side-by-side 1v1 comic duel cards (Card A vs Card B) with cyan/crimson styling, central jagged "VS" starburst with 15s voting timer, anonymous vote counter, and live Danmaku layer.
     * `VAR_REVEAL`: Referee whistle (`sound.playWhistleAlarm()`), caution stripes hazard banner, dramatic "CHECKING VAR..." radar/magnifier animation, author unmasking, animated percentage vote split bar, winner crowning (+1000 pts winner, +250 sympathy, +150 correct voters), crowd cheer (`sound.playApplause()`), confetti.
     * `ROUND_SUMMARY`: Leaderboard of Round 1 with transition button to Round 2 or Lobby.

4. `src/components/Round1Play.tsx` (New):
   - 1-finger touch mobile controller (100dvh):
     * `ROAST_INPUT`: 120-char textarea with color-coded counter, single-tap quick phrase chips, submit button with haptic feedback.
     * `VOTE_ACTIVE`: Big thumb-friendly Vote A / Vote B buttons with roast preview snippets (or gladiator banner if player is in the duel).
     * `VAR_REVEAL`: Personal verdict alert ("🎉 BẠN ĐÃ THẮNG TRẬN!", "+150 ĐIỂM CỬ TRI THÔNG THÁI", etc.).
     * Persistent Danmaku dock with quick emojis (`🍅`, `🧱`, `❤️`, `🤡`, `🔥`, `🎦`) and custom text input with 300ms cooldown.

5. `src/components/DevBotSimulator.tsx` (Enhancement):
   - Automated Round 1 bot behavior:
     * Staggered roast submissions between 4s and 22s during `ROAST_INPUT`.
     * Realistic weighted voting (55/45 or 70/30) over 2s to 12s during `VOTE_ACTIVE`.
     * Danmaku reaction bursts.

6. `src/app/host/page.tsx` & `src/app/play/page.tsx`:
   - Mount `<DanmakuCanvas />` and `<Round1Host />` in `src/app/host/page.tsx` when `gameState.status === 'ROUND_1'`.
   - Mount `<Round1Play />` in `src/app/play/page.tsx` when `gameState.status === 'ROUND_1'`.

7. `src/app/api/game/route.ts`:
   - Update `VOTE_ROAST` to cleanly handle vote switching between A and B without duplicate votes.

## Verification Requirements
- Run `npx tsc --noEmit` and confirm 0 errors.
- Run `npm run build` and confirm Next.js build succeeds with 0 errors.
- Run `npm test` and confirm all 62+ E2E tests pass 100%.

Write your detailed completion report to `handoff.md` in your working directory and notify parent (`45f106cf-224a-4102-aeee-b56815847bc0`).


## 2026-10-19T12:57:58Z
You are worker_m2_1.
Your working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m2_1
Project root: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Parent conversation ID: 45f106cf-224a-4102-aeee-b56815847bc0
Dispatch instructions: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m2_1\DISPATCH.md
Architectural blueprint: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m2_1\handoff.md
Master index: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md
Original request: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md
