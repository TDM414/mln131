# Handoff Report: E2E Test Suite Analysis & Redesign Verification Plan

**Agent:** `explorer_test_e2e_plan`  
**Timestamp:** 2026-10-19T15:42:00Z  
**Recipient:** Orchestrator (`dcd6312c-918d-4ca5-957d-512b431b5686`)  
**Mission:** Analyze current test suite and produce E2E test plan for 4 redesigned game modes, speed-decay scoring, and Dev Bot simulator.

---

## 1. Observation

1. **Current Test Runner & Execution:**
   - In `package.json` line 10:
     ```json
     "test": "npx tsx scripts/run_e2e_tests.mjs"
     ```
   - Running `npm test` executes `scripts/run_e2e_tests.mjs`. Direct run confirmed:
     ```
     Total Suites: 6
     Total Tests: 68
     Passed Tests: 68
     Failed Tests: 0
     Total Time: 1714.26ms
     SUCCESS: ALL 68 E2E TESTS PASSED (100%)
     ```
2. **Current Test Suites Structure:**
   - `scripts/run_e2e_tests.mjs` lines 6-11 imports:
     - `runTier1FeatureTests` from `../tests/suites/tier1_features.mjs` (15 tests)
     - `runTier2BoundaryTests` from `../tests/suites/tier2_boundary.mjs` (16 tests)
     - `runTier3CrossFeatureTests` from `../tests/suites/tier3_cross_feature.mjs` (3 tests)
     - `runTier4RealWorldTests` from `../tests/suites/tier4_real_world.mjs` (4 tests)
     - `runTier5AdversarialTests` from `../tests/suites/tier5_adversarial.mjs` (7 tests)
     - `runAllStressTests` from `../tests/stress/m1_stress_harness.ts` (23 tests)
3. **Current In-Memory Game Test Engine:**
   - In `tests/lib/gameShowEngine.mjs`:
     - Lines 21-28: `r1` state implements `duels: []`, `submissions: new Map()`, `votes: new Map()`, `danmaku: []`.
     - Lines 163-186: `pairDuels()` pairs players into 1v1 anonymous duels.
     - Lines 270-315: `startRound2` and `submitMinigameResult` implement 4 mini-games (`CATCH_REPORT`, `SHAKE_OTP`, `DODGE_BRICKS`, `SPOT_DEEPFAKE`) with 3 lives and time-elapsed subtraction.
     - Lines 318-407: `startRound3` implements secret roles (`SEEDER` ~15% vs `NETIZEN`), `postDiscussion`, `castExpulsionVote`, and `resolveExpulsion`.
     - Lines 410-519: `startRound4` implements cards (`CARD_INK`, `CARD_HEIST`, `CARD_TROLL`, `CARD_BET_2X`, `CARD_SHIELD`), `wipeInk`, and `submitTriviaAnswer`.
4. **Current In-Browser Dev Bot Simulator:**
   - In `src/components/DevBotSimulator.tsx`:
     - Lines 129-226: Automates 1v1 duel voting for active duelgladiators (`sync.voteRoast(activeDuel.id, choice, botId)`).
     - Lines 228-267: Automates legacy micro-games with `sync.submitMinigameResult(isSuccess, reactionTime, botId)`.
     - Lines 269-293: Automates expulsion vote targeting nominated suspects (`R3_VOTE`).
     - Lines 295-322: Automates trivia answer (`sync.submitTrivia`).
5. **New Specification Directives (`ORIGINAL_REQUEST.md` 2026-10-19T15:28:48Z):**
   - Lines 102-106: Mode 1 replaces 1v1 duels with 50-player simultaneous submissions in 45s, followed by 30s reaction newsfeed with ❤️, 🍅, 🧱, and automated Top Trending announcement.
   - Lines 107-111: Mode 2 replaces shake/drag micro-games with 5s Fact or Cap reflex (2 giant mobile buttons: [🟢 FACT] and [🔴 CAP]) with bomb explosion on failure.
   - Lines 112-117: Mode 3 replaces secret seeder expulsion with Consensus Dilemma (A vs B moral dilemma, >50% majority bet, real-time Tug-of-War bar, +5000 points to majority betters).
   - Lines 118-121: Mode 4 features direct Hub launch button `[Thử Ngay Mode 4]`, sabotage cards, and speed-decay scoring.
   - Lines 122-126: Universal Speed-Decay Scoring: `Points = BasePoints * (RemainingTime / TotalTime)`.

---

## 2. Logic Chain

1. **Premise:** The existing test runner (`scripts/run_e2e_tests.mjs`) and test suites (`tests/suites/*.mjs`) assert behavior based on the initial version of the project (1v1 duels in R1, micro-games in R2, Seeder deduction in R3).
2. **Impact of Redesign:**
   - When the application code (`src/app/api/game/route.ts`, `src/components/Round1Host.tsx`, `Round2Host.tsx`, `Round3Host.tsx`, `HostLobby.tsx`, and `DevBotSimulator.tsx`) is updated to the new mechanics, running the old tests without updating them will cause false alarms or fail to assert the new requirements.
   - Mode 1 needs tests for simultaneous 50-player submissions and multi-reaction feed aggregation (`HEART`, `TOMATO`, `BRICK`) rather than 1v1 duels.
   - Mode 2 needs tests for 5-second ticking bomb countdown, binary FACT/CAP decisions, and bomb explosions rather than device shake sensors.
   - Mode 3 needs tests for ethical dilemma presentation, two-tier choice (stance + majority bet), Tug-of-War ratio calculation, and +5000 reward logic rather than seeder impostor detection.
   - Mode 4 needs verification of the direct launch button `[Thử Ngay Mode 4]` from Hub, speed-decay trivia scoring, and card interaction.
   - Speed-Decay scoring formula (`Math.round(BasePoints * RemainingTime / TotalTime)`) needs mathematical boundary testing across all 3 reflex/trivia modes.
   - Dev Bot Simulator needs automated verification ensuring that 15 virtual students can autonomously navigate all 4 redesigned modes.
3. **Synthesis:** Updating `tests/lib/gameShowEngine.mjs`, `tests/fixtures/mockData.mjs`, `tests/suites/tier1_features.mjs`, `tier2_boundary.mjs`, `tier3_cross_feature.mjs`, and `tests/stress/m1_stress_harness.ts` with the test scenarios defined in `test_plan.md` ensures full requirement verification and regression-free delivery.

---

## 3. Caveats

- **No Caveats on Specifications:** The requirements from `ORIGINAL_REQUEST.md` (2026-10-19T15:28:48Z) are explicit and unambiguous regarding the 4 new modes, speed decay, and Hub button.
- **Audio Context in Headless Environment:** The Web Audio API tests in Tier 4 verify interface contracts and guard against runtime exceptions when executed under Node.js where `window.AudioContext` is undefined. Live browser audio auditioning requires browser interaction.

---

## 4. Conclusion

- A comprehensive, production-ready test architecture and plan has been established and written to `.agents/teamwork/explorer_test_e2e_plan/test_plan.md`.
- The plan outlines:
  1. 16 Tier 1 Feature specifications covering the 4 new modes, speed decay, Hub direct launch, and Dev Bot simulator.
  2. 12 Tier 2 Boundary test cases covering timer edges (4999ms vs 5001ms), integer rounding, 50-50 consensus ties, and 0-score heists.
  3. 4 Tier 3 Cross-feature integration flows (Hub -> Mode 4 -> Return to Hub -> Mode 2).
  4. 4 Tier 4 Real-world classroom scale tests (50 concurrent mobile clients, reaction storm, delta polling).
  5. 7 Tier 5 Adversarial & security tests (XSS neutralization, spam throttling, counterfeit cards).
  6. 5 Tier 6 Live API route stress tests for new endpoint actions.
- The implementer can now systematically update `gameShowEngine.mjs`, `mockData.mjs`, `route.ts`, UI components, and test suites with zero guesswork.

---

## 5. Verification Method

To independently verify this analysis:
1. **Run Current Test Suite:**
   ```bash
   npm test
   ```
   *Expected:* 68 tests passing across 6 suites in ~1.7s.
2. **Inspect Master Test Plan:**
   - File: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_test_e2e_plan\test_plan.md`
   - Verify all 4 modes, speed decay, and Dev Bot simulator are fully covered with explicit assertions.
3. **Check Test Harness Dependencies:**
   - Inspect `scripts/run_e2e_tests.mjs` and `tests/lib/gameShowEngine.mjs` to confirm alignment with `test_plan.md`.
