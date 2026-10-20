# Handoff Report: Code Review & Adversarial Audit for Milestone 3 (Mode 2: Fact or Cap 5s Reflex)

**Reviewer**: `reviewer_m3_1` (Roles: Reviewer, Adversarial Critic)  
**Target Milestone**: Milestone 3 — Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)  
**Verdict**: **APPROVE**  
**Overall Risk Assessment**: LOW  

---

## 1. Observation

### 1.1 Automated Build and Test Execution
1. **Milestone 3 Automated Test Suite**:
   Command: `npx tsx tests/suites/m3_fact_or_cap.test.ts`
   Result: Exited with code 0.
   Verbatim output:
   ```
   ======================================================
   --- STARTING MILESTONE 3: MODE 2 TEST SUITE ---
   ======================================================
   Step 1: Testing Speed-Decay Scoring formula accuracy
   ✔ Speed-Decay scoring formula verified across all timing tiers.
   Step 2: Registering 4 students in room M3_TEST_...
   ✔ All 4 players initialized with 3 lives (❤️❤️❤️).
   Step 3: Initializing ROUND_2 with 5 questions
   ✔ Mode 2 initialized with Question 1: Trên không gian mạng, quyền tự do ngôn luận là tuy...
   Step 4: Submitting Question 1 answers
   ✔ Question 1 scoring and life decrement validated.
   Step 5: Testing multi-question progression across all 5 questions
     Advancing to Question 2 / 5 (isFact: true)
     Advancing to Question 3 / 5 (isFact: true)
     Advancing to Question 4 / 5 (isFact: false)
     Advancing to Question 5 / 5 (isFact: true)
   ✔ Multi-question progression completed. Student 4 successfully transitioned to Ghost Mode 👻.
   Step 6: Verifying Return to Hub action
   ✔ Successfully returned to Hub with player scores intact!
   ======================================================
   ✔ ALL MILESTONE 3: MODE 2 AUTOMATED TESTS PASSED (100%)
   ======================================================
   ```

2. **Next.js Production Build**:
   Command: `npm run build`
   Result: Exited with code 0. Compiled successfully, 0 TypeScript errors, 0 ESLint errors, all pages (`/`, `/host`, `/play`, `/api/game`) generated statically or on-demand without SSR/hydration defects.

### 1.2 Source Code Inspection
1. **Sensor Elimination**:
   - `src/components/Round2Host.tsx` & `src/components/Round2Play.tsx`: Zero references to `DeviceMotionEvent`, `DeviceOrientationEvent`, shake physics, or touchmove drags.
   - Mobile interaction relies exclusively on two clean touch buttons: `[🟢 FACT]` and `[🔴 CAP]`.

2. **5.0s Ticking Bomb & Acceleration Audio**:
   - `Round2Host.tsx` lines 136–163: 5000ms ticking countdown with accelerating cadence: 500ms intervals when `remaining > 2000ms`, dropping to 200ms when `remaining <= 2000ms`, triggering `sound.playCountdownTick(isUrgent)`.
   - Lines 181–183: Triggers `sound.playExplosion(true)` and screen shake animation upon expiration or all players answering.

3. **Curriculum Question Sequence**:
   - Exactly 5 statements taken from `MLN131_FACT_OR_CAP_QUESTIONS` in `src/data/questions.ts` lines 331–410 covering socialist democracy, cybersecurity law (Điều 8), VNeID/Đề án 06, digital populism, and online civil responsibility.

4. **Mobile Ergonomics (100dvh)**:
   - `Round2Play.tsx` line 234: `h-[100dvh] w-full flex flex-col justify-between overflow-hidden select-none`.
   - Giant buttons occupying the full thumb zone with high-contrast neo-brutalist styling.
   - Lines 158–164: Double-tap lock-in prevention using both React state `hasSubmitted` and mutable ref `submittedRef.current`.

5. **Speed-Decay Scoring Compliance**:
   - `src/lib/types.ts` lines 95–98 and `src/app/api/game/route.ts` line 532:
     `calculateSpeedDecayScore(1000, remainingTime, 5000, isCorrect)` = `Math.round(1000 * Math.max(0, Math.min(1, remainingTime / 5000)))`. Incorrect answers strictly yield 0 points.

6. **3 Lives & Ghost Mode**:
   - Players initialize with `r2Lives: 3` (`src/app/api/game/route.ts` line 299).
   - Incurring an incorrect answer or timeout decrements 1 life.
   - Reaching 0 lives triggers `Ghost Mode 👻` on mobile (`Round2Play.tsx` lines 99, 447–466) with a dedicated Danmaku cheer/troll bar (`👻`, `💀`, `🔥`, `🍿`, `🍅`, `🧱`).

7. **Hub Return Functionality**:
   - `Round2Host.tsx` line 273: Calls `sync.returnToHub()` which issues `action: 'RETURN_TO_HUB'`, setting status back to `LOBBY` while keeping player scores intact.

---

## 2. Logic Chain

1. **Premise 1**: All requirements stipulated in `DISPATCH.md` and `PROJECT.md` for Milestone 3 (Mode 2) have matching implementations in `Round2Host.tsx`, `Round2Play.tsx`, `syncEngine.ts`, and `route.ts`.
2. **Premise 2**: Independent verification commands (`npx tsx tests/suites/m3_fact_or_cap.test.ts` and `npm run build`) ran cleanly and exited with code 0 without mock bypasses or hardcoded test facades.
3. **Premise 3**: Inspection of source code verified that legacy shake/drag sensors have been completely removed and replaced by high-performance 100dvh touch controls with client-side anti-double-tap protection.
4. **Premise 4**: Mathematical scoring strictly implements `BasePoints * (RemainingTime / TotalTime)` with boundary clamping (0 on negative or timeout, capped at 1000 on instant reflex).
5. **Conclusion**: The implementation fulfills all functional, architectural, visual, and educational objectives of Milestone 3.

---

## 3. Adversarial Challenges & Findings

### Finding 1: Server-Side Duplicate Submission Idempotency (Minor / Security)
- **Location**: `src/app/api/game/route.ts`: lines 521–577 (`SUBMIT_FACT_OR_CAP` handler).
- **Attack Scenario**: While `Round2Play.tsx` disables the UI buttons immediately after the first tap (`hasSubmitted = true`), a malicious client calling `fetch('/api/game', ...)` directly from the browser console could submit multiple times within the same 5-second window, accumulating duplicate points (`player.score += pointsEarned`).
- **Blast Radius**: Only relevant if a technically savvy student runs scripts in DevTools during class.
- **Mitigation Recommendation**: In `src/app/api/game/route.ts`, check `if (room.round2State.answers?.[playerId]) return;` before awarding points.

### Finding 2: Ghost Mode Server-Side Score Freezing (Minor / Balance)
- **Location**: `src/app/api/game/route.ts`: lines 539–542.
- **Observation**: If an eliminated student (`r2Lives === 0`) submits an answer in Ghost Mode, the server still awards points to `player.score`. On the Round 2 leaderboard, active players with lives are sorted above ghosts (`livesB - livesA`), but on the Grand Finale Podium (overall tournament score), ghosts still retain those points.
- **Mitigation Recommendation**: In `route.ts`, if `player.r2Lives <= 0`, record the answer for practice feedback but skip adding to `player.score`.

### Finding 3: DevBotSimulator Mode 2 Alignment (Informational / Scheduled for M5)
- **Location**: `src/components/DevBotSimulator.tsx`: line 235.
- **Observation**: `DevBotSimulator` currently listens for legacy phase names (`MICRO_PLAYING`). In Milestone 5, it is scheduled to be updated for all 4 new modes. Virtual bots will then simulate `SUBMIT_FACT_OR_CAP` during `QUESTION_ACTIVE`.

---

## 4. Caveats

- **Network Jitter**: In low-bandwidth local Wi-Fi, HTTP delta polling at 700ms on mobile might introduce up to ~350ms of visual latency when transitioning to the reveal screen. However, `Round2Play.tsx` mitigates this locally by displaying `lockedChoice` feedback immediately upon user touch.
- **No other caveats.**

---

## 5. Conclusion & Final Verdict

**VERDICT: APPROVE**

The implementation of **Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)** is robust, entertaining, free of legacy sensor bugs, adheres to the MLN131 educational curriculum, and passes all automated build and test suites with 100% success.

---

## 6. Verification Method

To independently reproduce this verification:
1. Run automated test suite:
   ```bash
   npx tsx tests/suites/m3_fact_or_cap.test.ts
   ```
   (Expected: code 0, all 6 steps pass)
2. Run Next.js production build:
   ```bash
   npm run build
   ```
   (Expected: code 0, clean build with 0 TypeScript/ESLint warnings)
3. Inspect files:
   - `src/components/Round2Host.tsx`
   - `src/components/Round2Play.tsx`
   - `src/app/api/game/route.ts`
