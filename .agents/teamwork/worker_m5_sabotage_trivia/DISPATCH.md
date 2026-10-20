# DISPATCH — worker_m5_sabotage_trivia

## 2026-10-20T00:12:00Z

- Role: Mode 4 Sabotage Trivia & Dev Bot Simulator v2 Implementer
- Archetype: teamwork_preview_worker
- Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m5_sabotage_trivia
- Files owned exclusively:
  - `src/components/Round4Host.tsx`
  - `src/components/Round4Play.tsx`
  - `src/components/DevBotSimulator.tsx`
  - `tests/suites/m5_sabotage_trivia.test.ts`
- Scope & Requirements:
  1. `Round4Host.tsx`: Projector display for Mode 4 ("Đấu Trường Chơi Xấu Cướp Điểm").
     - 4-phase flow: CARD_PICK (players select sabotage cards) -> QUESTION (MLN131 trivia with Speed-Decay timer) -> REVEAL (correct answer, card effects resolution, points scored/stolen) -> SUMMARY (leaderboard + Return to Hub button).
     - Full audio synthesizer integration: countdown ticks, card activation whoosh/zap, buzzer for correct/wrong, fanfare.
  2. `Round4Play.tsx`: 100dvh mobile controller for Mode 4.
     - Card selection UI (Ink Splatter 🦑, 50% Point Heist 🥷, Double-or-Nothing 2X 🎲, Shield 🛡️).
     - Interactive ink splatter canvas: when attacked with Ink Splatter, an opaque black ink overlay covers the screen that the player MUST swipe/rub with their finger to reveal the question and answer buttons!
     - 4 multiple choice options with universal Speed-Decay scoring: `calculateSpeedDecayScore(basePoints, remainingTime, totalTime, isCorrect)`.
  3. `DevBotSimulator.tsx`: Complete autonomous simulation harness.
     - Simulates 15-20 virtual Vietnamese student bots (e.g. "Lan Anh (Học Bá)", "Đức Bo", "Trang Xeko", "Bảo Búa", "Minh Cà Khịa", etc.).
     - Automatically interacts across ALL 4 modes:
       * Mode 1: Generates humorous MLN131 comments during SUBMITTING and sends emoji reactions (❤️, 🍅, 🧱) during FEED_REACTION.
       * Mode 2: Answers [FACT] or [CAP] with realistic 0.8s - 3.8s reaction latency, keeping 3 lives tracked.
       * Mode 3: Submits A/B stances and majority consensus bets with realistic distributed choices.
       * Mode 4: Selects sabotage cards, targets rivals, rubs ink, and answers trivia.
     - Toggleable floating dev panel on host screen to inject/pause bots anytime during testing.
  4. Production build: `npm run build` exits 0 with 0 errors.
  5. Test suite: `tests/suites/m5_sabotage_trivia.test.ts` with 100% pass.
