# Dispatch: worker_m2_trending_feed

## Task Assignment: Milestone 2 — Mode 1: Tường Bình Luận Triệu Like (Trending Feed Wall)

You are assigned to implement Milestone 2:
1. `src/components/Round1Host.tsx`:
   - Replace legacy 1v1 duel showdown with the 3-phase **Tường Bình Luận Triệu Like** projector engine:
     - **Phase 1 (PROMPT / SUBMITTING — 45s)**:
       - Displays MLN131 satirical drama prompt (`prompt.title`, `prompt.context`, `prompt.question`) with neo-brutalist styling.
       - Master countdown timer (45.0s) with ticking sound (`sound.playCountdownTick()`).
       - Live submission tally counter: "ĐÃ CÓ [X]/[N] BÌNH LUẬN LÊN TƯỜNG" with pulse animation.
       - Host control to advance immediately to reaction phase if everyone submitted early.
     - **Phase 2 (FEED_REACTION — 30s)**:
       - Displays live Newsfeed wall (grid or 2-column masonry) of all student comments.
       - Each post shows the author's Netizen persona avatar, name, and comment text.
       - Realtime reaction counters on each card (❤️ Tim, 🍅 Cà chua, 🧱 Gạch) with floating mini reaction particles.
       - 30s countdown timer with accelerating audio tick.
     - **Phase 3 (TOP_TRENDING / SUMMARY)**:
       - Ranks all submitted comments by total reaction score.
       - Top 3 (or Top 5) comments dramatically zoom in and take the spotlight with glowing cyber borders, medal badges (🥇 Top 1 Trending, 🥈 Top 2, 🥉 Top 3).
       - Fires `sound.playTrollHorn()` (Airhorn) and `sound.playVictoryFanfare()`.
       - Confetti or Danmaku celebration particles.
       - Displays point awards (+3000 for #1, +2000 for #2, +1500 for #3, +100 per reaction received).
       - Action buttons: "Chơi Lại Mode 1" and "Quay Về Sảnh Chính (Return to Hub)" calling `sync.returnToHub()`.
2. `src/components/Round1Play.tsx`:
   - Replace legacy 1v1 duel voting with the mobile controller for Mode 1:
     - **Phase 1 (SUBMITTING)**:
       - Clean mobile thumb-zone layout (100dvh).
       - Displays prompt scenario in a compact card.
       - 100-character text area with live character counter.
       - Quick trend chips for 1-tap insertion (e.g. "Ủa alo?", "Lùa gà trắng trợn!", "Check VAR ngay!", "Dân biết dân bàn nha").
       - Big "Bắn Lên Tường Bình Luận 🚀" submit button.
       - After submission, shows "Đã lên sóng thành công! Hãy chuẩn bị lướt feed và thả reaction...".
     - **Phase 2 (FEED_REACTION)**:
       - Vertical scrollable feed of all submitted comments (except own comment or highlighting own comment).
       - Each card has 3 giant touch target buttons:
         - `[ ❤️ Tim ]`
         - `[ 🍅 Cà Chua ]`
         - `[ 🧱 Gạch ]`
       - Instant haptic feedback (or visual press effect) and 100ms client debounce.
       - Dispatches `sync.reactFeedPost(commentId, reactionType)`.
     - **Phase 3 (TOP_TRENDING)**:
       - Displays personal score summary: "Bình luận của bạn nhận được [X] ❤️, [Y] 🍅, [Z] 🧱! Thưởng: +[PTS] điểm".
       - Shows who took the #1 Trending crown.
3. Check integration with `src/app/host/page.tsx` and `src/app/play/page.tsx`.

## Files Owned Exclusively
- `src/components/Round1Host.tsx`
- `src/components/Round1Play.tsx`

## Mandatory Reference Documents
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\ORIGINAL_REQUEST.md` (Update 2026-10-19T15:28:48Z, lines 102-106)
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md`
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_rearchitect_code\analysis.md` (Section 3.1)

## Verification Requirements
- Run `npm run build` to verify 0 TypeScript / compilation errors.
- Create a verification test script (e.g. `tests/suites/m2_trending_feed.test.ts`) verifying:
  - Phase transitions: PROMPT -> SUBMITTING -> FEED_REACTION -> TOP_TRENDING -> HUB.
  - Multi-comment submission and reaction aggregation.
  - Correct ranking calculation for Top 1, Top 2, Top 3.
- Document build and test outputs in `changes.md` and `handoff.md` in `.agents/teamwork/worker_m2_trending_feed/`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-10-19T16:08:57Z
Implement Milestone 2: Mode 1: Tường Bình Luận Triệu Like (Trending Feed Wall).
Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m2_trending_feed
Read ORIGINAL_REQUEST.md, PROJECT.md, analysis.md, and DISPATCH.md.
Rewrite Round1Host.tsx & Round1Play.tsx. Verify npm run build. Create tests/suites/m2_trending_feed.test.ts.
