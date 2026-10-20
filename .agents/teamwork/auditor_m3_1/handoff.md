# Forensic Audit Report: Milestone 3 — Mode 2: Đại Chiến Bóc Phốt 5 Giây

**Work Product**: `src/components/Round2Host.tsx`, `src/components/Round2Play.tsx`, `tests/suites/m3_fact_or_cap.test.ts`  
**Profile**: General Project (Integrity Mode: Development)  
**Verdict**: **CLEAN**

---

## 1. Observation

1. **Source Code Inspection — `src/components/Round2Host.tsx`**:
   - Lines 55-65: Questions dynamically sourced via `round2State?.questions || MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5)` and `currentQuestionIndex`.
   - Lines 95-163: Real 5.0s ticking bomb timer driven by monotonic `Date.now() - timerStartRef.current` running on a 40ms `setInterval`.
   - Lines 141-149: Accelerating Web Audio ticking cadence (`sound.playCountdownTick(isUrgent)`) dynamically scaling from 500ms down to 200ms when `remaining <= 2000`.
   - Lines 177-221: `handleTriggerExplosionAndReveal` triggers `sound.playExplosion(true)`, screen shake ring, decrements lives for any player who timed out (`p.r2Lives = Math.max(0, curLives - 1)`), and plays `sound.playCorrectChime()` / `sound.playWrongBuzz()` depending on `currentQuestion.isFact`.
   - Lines 273-277: Return to Hub invoking `sync.returnToHub()` with `onReturnToHub()`.
   - Lines 280-300: Dynamic leaderboard sorting: survivors with most lives (`livesB - livesA`) followed by Round 2 score. No fixed or mocked podium standings.

2. **Source Code Inspection — `src/components/Round2Play.tsx`**:
   - Lines 96-101: Player profile, dynamic lives counter `lives = currentPlayer?.r2Lives ?? 3`, and `isGhost = lives <= 0`.
   - Lines 113-155: Independent 5.0s local visual countdown timer matching projector rhythm.
   - Lines 158-205: `handleSelectChoice`:
     - Synchronous double-submission lock: `submittedRef.current = true; setHasSubmitted(true)`.
     - Exact reaction time computation: `elapsed = Math.min(5000, now - questionStartTimeRef.current)`.
     - Genuine evaluation: `isCorrect = (currentQuestion.isFact && choice === 'FACT') || (!currentQuestion.isFact && choice === 'CAP')`.
     - Speed-Decay score calculation: `calculateSpeedDecayScore(currentQuestion.basePoints || 1000, remainingTime, 5000, isCorrect)`.
     - Dispatches action: `sync.submitFactOrCap(choice, remainingTime, 5000, playerId, currentQuestionIndex)`.
   - Lines 381-411: Two giant thumb-reach neo-brutalist buttons: `[🟢 FACT / CHUẨN MEN]` and `[🔴 CAP / BỐC PHÉT]`.
   - Lines 473-540: Reveal phase: Green glow and positive score for correct answers; red danger ring, screen shake, and SVG comic glass crack overlay (`<svg ...><line .../><circle .../></svg>`) on wrong answers or timeouts.
   - Lines 446-466: Dedicated Ghost Mode (👻 Ma Mạng) Danmaku toolbar broadcasting live reactions (`👻`, `💀`, `🔥`, `🍿`, `🍅`, `🧱`) to the projector.

3. **Backend & Audio Subsystems (`src/app/api/game/route.ts` & `src/lib/audioSynthesizer.ts`)**:
   - `route.ts` lines 521-578: `SUBMIT_FACT_OR_CAP` handles answers dynamically, computes speed-decay score, decrements player `r2Lives`, clamps at 0, and records delta events.
   - `route.ts` lines 783-793: `RETURN_TO_HUB` resets room status to `LOBBY` and phase to `LOBBY_WAITING` while leaving `room.players` scores intact.
   - `audioSynthesizer.ts`: Pure procedural Web Audio API synthesizers (`OscillatorNode`, `BiquadFilterNode`, `GainNode`) for `playCountdownTick`, `playExplosion`, `playCorrectChime`, `playWrongBuzz`, and `playVictoryFanfare`. Zero third-party audio files or placeholder stubs.

4. **Pre-populated Artifact Detection**:
   - Ran `find_by_name` for `*.log`, `*result*`, and `*output*` outside `node_modules` and `.next`.
   - Result: 0 pre-populated or fabricated artifacts found.

5. **Independent Test Execution**:
   - Command: `npx tsx tests/suites/m3_fact_or_cap.test.ts`
   - Output:
     ```
     ======================================================
     --- STARTING MILESTONE 3: MODE 2 TEST SUITE ---
     ======================================================
     Step 1: Testing Speed-Decay Scoring formula accuracy
     ✔ Speed-Decay scoring formula verified across all timing tiers.
     Step 2: Registering 4 students in room M3_TEST_1792428097477
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
     Exit code: 0.

6. **Regression Test Execution**:
   - Command: `npx tsx tests/suites/m2_trending_feed.test.ts` -> Exit code 0 (100% pass).
   - Command: `npx tsx tests/suites/m1_rearchitect_contracts.test.ts` -> Exit code 0 (100% pass).

7. **Production Build Verification**:
   - Command: `npm run build`
   - Result:
     ```
     ▲ Next.js 14.2.35
     ✓ Compiled successfully
     Linting and checking validity of types ...
     Collecting page data ...
     ✓ Generating static pages (7/7)
     Finalizing page optimization ...
     Collecting build traces ...
     ```
     Exit code: 0, 0 TypeScript errors, 0 SSR issues.

---

## 2. Logic Chain

1. *Premise*: Under Development Mode, the prohibited patterns are hardcoded test results, dummy/facade implementations without real logic, and fabricated verification outputs.
2. *Inspection of Timer*: In `Round2Host.tsx` and `Round2Play.tsx`, the 5.0-second timer is driven by real-time timestamps (`Date.now()`), calculating true elapsed milliseconds, driving continuous CSS progress bar interpolations, and modulating audio frequencies. No mock timers or dummy delays exist.
3. *Inspection of Scoring*: The scoring mechanism utilizes `calculateSpeedDecayScore`, which calculates `Math.round(basePoints * (remainingTime / totalTime))` dynamically. Boundary tests confirmed robustness against timeouts, zero-times, negative times, and overflows.
4. *Inspection of Life & State Tracking*: Player lives are tracked authentically in both server state (`r2Lives`) and client UI, correctly decrementing from 3 down to 0, converting players to Ghost mode (👻), and enabling eliminated players to participate in Danmaku reactions.
5. *Inspection of Hub Navigation*: The "Quay Về Sảnh Chính" action dispatches `RETURN_TO_HUB`, which transitions status to `LOBBY` while leaving all accumulated player points and round scores fully intact.
6. *Empirical Verification*: Running the dedicated automated test suite and production build confirmed that all components compile, execute, and satisfy behavioral specifications with 0 failures.
7. *Deduction*: Because every forensic check (source code, timer authenticity, dynamic scoring, life management, build, and tests) passed without any prohibited patterns or shortcuts, the work product is authentic.

---

## 3. Caveats

- Web Audio API requires a user interaction gesture in modern browsers before audio playback commences. Both the host screen (via the "KÍCH HOẠT QUẢ BOM" button) and mobile screen (via room entry and button taps) provide explicit user interaction satisfying browser autoplay policies.
- No other caveats.

---

## 4. Conclusion

**Verdict**: **CLEAN**.  
Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex) passes all forensic integrity checks. The work product is fully authentic, robustly tested, and ready for integration.

---

## 5. Verification Method

To independently reproduce this verification:
1. Run Milestone 3 test suite:
   ```powershell
   npx tsx tests/suites/m3_fact_or_cap.test.ts
   ```
2. Run regression test suites:
   ```powershell
   npx tsx tests/suites/m2_trending_feed.test.ts
   npx tsx tests/suites/m1_rearchitect_contracts.test.ts
   ```
3. Run Next.js production build:
   ```powershell
   npm run build
   ```
4. Invalidate if: Any hardcoded scores or answers are discovered, or if test execution fails.
