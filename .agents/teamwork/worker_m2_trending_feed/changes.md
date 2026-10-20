# Changes: Milestone 2 — Mode 1: Tường Bình Luận Triệu Like (Trending Feed Wall)

## Overview
Replaced the legacy 1v1 Quiplash dueling mechanism with the high-energy 3-phase **Tường Bình Luận Triệu Like (Trending Feed Wall)** for both Projector (Host) and Mobile (Play) screens.

---

## 1. `src/components/Round1Host.tsx`
- **Replaced 1v1 duels with 3-phase Projector Engine**:
  - **Phase 1: PROMPT / SUBMITTING (45s)**:
    - Displays MLN131 satirical prompt (`category`, `situation`, `context`) with Neo-Brutalist card styling.
    - Master countdown clock (45s) with procedural Web Audio ticking sounds (`sound.playCountdownTick(isUrgent)`).
    - Real-time submission counter: "ĐÃ CÓ [X]/[N] BÌNH LUẬN LÊN TƯỜNG" with animated progress bar and player avatar indicators.
    - Host skip button ("Chuyển Sang Lướt Feed") and extend button (+15s).
    - Automatic seeding fallback with realistic comments from `VIETNAMESE_ROAST_BANK` if fewer than 2 comments exist when advancing to reactions.
  - **Phase 2: FEED_REACTION (30s)**:
    - Renders live Newsfeed wall (grid of student comment cards).
    - Displays each student's Netizen persona SVG avatar, author name, persona title, and comment text.
    - Live counters on each card: ❤️ Tim (`likes`), 🍅 Cà chua (`tomatoes`), 🧱 Gạch (`bricks`), and total reaction score.
    - 30s countdown clock with accelerating tick and audio splat/pop on incoming reactions.
    - Host skip button to reveal Top Trending immediately.
  - **Phase 3: TOP_TRENDING / REVEAL**:
    - Auto-ranks all comments by total reaction sum (`heart + tomato + brick`).
    - Highlights Top 1 (🥇 Gold spotlight card with crown badge, +3,000 pts), Top 2 (🥈 Silver card, +2,000 pts), Top 3 (🥉 Bronze card, +1,500 pts), and honorable mentions (#4, #5).
    - Fires Troll Airhorn (`sound.playTrollHorn()`), Victory Fanfare (`sound.playVictoryFanfare()`), and Confetti blast.
    - Awards placement bonus points (+3000, +2000, +1500) directly to player records in game state.
    - Action controls: "Chơi Lại Mode 1 (Đổi Đề)", "Sang Mode 2: Bóc Phốt 5s", and "Quay Về Sảnh Chính (Return to Hub)".

---

## 2. `src/components/Round1Play.tsx`
- **Replaced 1v1 duel voting with Mobile Controller Engine**:
  - **Phase 1: PROMPT / SUBMITTING**:
    - Compact scenario card with MLN131 category and situation.
    - 100-character textarea with live character counter (`[X]/100`).
    - Quick trend chips carousel for 1-tap insertion with haptic vibrate (20ms).
    - Big CTA button: `[ 🚀 BẮN LÊN TƯỜNG BÌNH LUẬN ]`.
    - Upon submission, transitions to success state showing the submitted text, author persona, waiting prompt, and 6 quick Danmaku reaction buttons (`🔥`, `🍅`, `🧱`, `❤️`, `🤡`, `🚀`) to react on the projector while waiting.
  - **Phase 2: FEED_REACTION**:
    - Vertical scrollable social newsfeed.
    - Highlights player's own post with cyber-cyan border and live incoming reaction counters.
    - For all other student posts: 3 GIANT TOUCH TARGET BUTTONS (`[ ❤️ Tim ]`, `[ 🍅 Cà Chua ]`, `[ 🧱 Gạch ]`) with 25ms haptic vibration, 100ms client debounce, audio feedback, and active state glow.
    - Realtime dispatch of `sync.reactFeedPost(postId, reactionType, playerId)`.
  - **Phase 3: TOP_TRENDING / SUMMARY**:
    - Personal score card showing:
      - Breakdown of received reactions (`[X] ❤️`, `[Y] 🍅`, `[Z] 🧱`).
      - Player's ranking in the classroom feed.
      - Total points earned calculation (+Placement bonus + Reaction points).
    - Top 1 Quán Quân banner preview.
    - Danmaku celebration bar and waiting indicator.

---

## 3. `tests/suites/m2_trending_feed.test.ts`
- Created comprehensive automated test suite testing:
  1. Room creation and registration of 5 students.
  2. Mode 1 initialization (`status: ROUND_1`, `phase: PROMPT`, prompt bank loading).
  3. Concurrent multi-comment submission with Vietnamese text & character limits.
  4. Phase transition to `FEED_REACTION`.
  5. Live reaction barrage aggregation across ❤️, 🍅, 🧱 and real-time +100/reaction score updates.
  6. Auto-ranking of Top Trending comments in descending order.
  7. Phase transition to `TOP_TRENDING` and podium score calculation (+3000, +2000, +1500).
  8. Return to Hub (`RETURN_TO_HUB`) and verification of score preservation.
