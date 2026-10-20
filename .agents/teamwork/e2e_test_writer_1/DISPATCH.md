## 2026-10-19T11:49:12Z
Sender: 45f106cf-224a-4102-aeee-b56815847bc0
Priority: MESSAGE_PRIORITY_HIGH

You are e2e_test_writer_1.
Your working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\e2e_test_writer_1
Project root: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Original Request: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md
Master Project Index: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md

MANDATORY: Read C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md and C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md first.
You lead the E2E Testing Track:
1. Create `TEST_INFRA.md` at project root following the test methodology (Opaque-box, requirement-driven, 4 tiers: Tier 1 Feature Coverage, Tier 2 Boundary/Corner, Tier 3 Cross-Feature, Tier 4 Real-World Application Scenarios).
2. Design and implement a robust automated E2E test runner script (e.g. in `tests/e2e_suite.test.ts` or executable node runner `scripts/run_e2e_tests.mjs`) covering:
   - Hub, Tournament vs Free-Play mode switching, PIN and QR generation.
   - Round 1 (Cà Khịa duel, roast submission, voting, Danmaku barrage, VAR reveal).
   - Round 2 (5s WarioWare micro-games, countdown, lives and game over).
   - Round 3 (Seeder vs Netizen deduction, clues, discussion, expulsion).
   - Round 4 (Sabotage cards, ink wipe, point heist, 2x bet, trivia final, podium).
   - Dev Bot Simulator execution across all rounds.
3. Verify test runner execution and publish `TEST_READY.md` at project root once the full test suite and test runner are ready.
4. Write your handoff report to handoff.md in your working directory and notify parent (45f106cf-224a-4102-aeee-b56815847bc0).
