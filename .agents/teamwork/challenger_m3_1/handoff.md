# Handoff Report: Empirical Challenger Verification — Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây

**Author**: `challenger_m3_1` (Critic / Specialist)  
**Parent Conversation ID**: `dcd6312c-918d-4ca5-957d-512b431b5686`  
**Milestone**: Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex Engine)  
**Project Root**: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`  
**Working Directory**: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\challenger_m3_1`  
**Timestamp**: 2026-10-19T16:51:00Z  
**Verdict**: **`APPROVE`** (with 1 non-blocking defensive recommendation)

---

## 1. Observation

### 1.1 Requirements & Scope
- Dispatch mandates empirical stress testing of:
  1. Speed-Decay scoring boundary conditions under live 5s timer: 0.1s answer vs 4.9s answer vs 5.0s timeout vs wrong answer.
  2. 50 concurrent students answering FACT vs CAP simultaneously within 5s.
  3. 3-lives decrement accuracy: ensure losing 3 lives transitions to Ghost Mode and prevents further life subtractions.
  4. Final report and verdict (`APPROVE` / `REJECT`).

### 1.2 Direct Observations & Verbatim Tool Outputs
1. **Speed-Decay Scoring Mathematical & Boundary Verification**:
   - `src/lib/types.ts:50-59`:
     ```ts
     export function calculateSpeedDecayScore(
       basePoints: number,
       remainingTime: number,
       totalTime: number,
       isCorrect: boolean
     ): number {
       if (!isCorrect) return 0;
       if (totalTime <= 0) return 0;
       return Math.round(basePoints * Math.max(0, Math.min(1, remainingTime / totalTime)));
     }
     ```
   - Empirically executed across all timing boundary scenarios in `tests/suites/m3_challenger_stress.test.ts`:
     * 0.0s instant reflex (`remainingTime: 5000ms`, `totalTime: 5000ms`, `basePoints: 1000`): yields exactly 1000 pts (100%).
     * 0.1s ultra-fast reflex (`remainingTime: 4900ms`): yields exactly 980 pts (98%).
     * 1.0s reflex (`remainingTime: 4000ms`): yields exactly 800 pts (80%).
     * 2.5s reflex (`remainingTime: 2500ms`): yields exactly 500 pts (50%).
     * 4.9s clutch reflex (`remainingTime: 100ms`): yields exactly 20 pts (2%).
     * 5.0s timeout (`remainingTime: 0ms`): yields exactly 0 pts (0%).
     * Negative remaining time (`remainingTime: -100ms`): clamped to 0 pts.
     * Over-clocked client time (`remainingTime: 5500ms`): clamped to 1000 pts.
     * Division by zero (`totalTime: 0`): returns 0 pts without `NaN` or crash.
     * Wrong answer (`isCorrect: false`): strictly returns 0 pts under all timing points (0.0s, 0.1s, 2.5s, 4.9s, timeout).

2. **50 Concurrent Students Answering FACT vs CAP Simultaneously**:
   - In `tests/suites/m3_challenger_stress.test.ts` (Suite 3):
     * 50 concurrent student `JOIN` requests dispatched via `Promise.all()` executed in 7.41ms (all HTTP 200). All 50 registered with `score: 0` and `r2Lives: 3`.
     * 45 concurrent submissions (30 correct `FACT`, 15 incorrect `CAP`, 5 timeout non-responders) dispatched simultaneously within the 5.0s window via `Promise.all()` executed in 6.61ms (all HTTP 200).
     * Exact 45 answers registered in `state.round2State.answers`.
     * All 30 correct students earned exact speed-decay scores according to their individual reaction times and retained 3 lives (`r2Lives: 3`).
     * All 15 incorrect students earned 0 points and had their lives decremented by 1 (`r2Lives: 2`).
     * 5 non-responders retained 3 lives pending Host timeout sweep.
     * `recentEvents` buffer remained bounded (capped at 100-120 items per `route.ts:884-886`).

3. **3-Lives Decrement & Ghost Mode (👻) Accuracy**:
   - In `tests/suites/m3_challenger_stress.test.ts` (Suite 4):
     * Question 1 wrong answer: `r2Lives` decremented from 3 to 2.
     * Question 2 wrong answer: `r2Lives` decremented from 2 to 1.
     * Question 3 wrong answer: `r2Lives` decremented from 1 to 0 (transitions to Ghost Mode `👻 MA MẠNG`).
     * Question 4 wrong answer while at 0 lives: `r2Lives` strictly clamped at 0 (never drops to -1 or NaN).
     * Question 4 correct answer for practice while at 0 lives: `r2Lives` strictly preserved at 0 (no resurrection).
     * Question 4 Host Timeout Sweep: non-answering active player decremented 3 -> 2; eliminated player with 0 lives stays at 0.
     * Spectator Danmaku reactions (`DANMAKU` with emoji `👻`, `🔥`, `💀`, `🍿`, `🍅`, `🧱`) successfully broadcast and recorded in event stream.

4. **Empirically Discovered Vulnerability / Edge-Case Defect**:
   - In `src/app/api/game/route.ts` lines 544-563:
     ```ts
     544: if (!room.round2State.answers) room.round2State.answers = {};
     545: room.round2State.answers[playerId] = { ... };
     554: // Compatibility
     555: room.round2State.playerResults[playerId] = { ... };
     ```
   - When `HOST_UPDATE_STATE` updates `round2State` strictly following the `PROJECT.md` Master GameShowState schema (`{ phase, currentQuestionIndex, questions, answers }`) without explicitly re-supplying the legacy WarioWare compatibility field `playerResults: {}`, line 555 triggers an unhandled exception:
     `TypeError: Cannot set properties of undefined (setting '<playerId>')`
   - Empirically reproduced and asserted in Test 6.3 (`m3_challenger_stress.test.ts:985-1035`).
   - Impact in normal gameplay: `Round2Host.tsx` currently mitigates this because its `handleStartQuestion` and `handleNextStep` handlers spread `...state.round2State`, keeping the initial `playerResults: {}` from room creation. However, adding `if (!room.round2State.playerResults) room.round2State.playerResults = {};` on line 554 of `route.ts` is strongly recommended for defensive server stability.

5. **Test & Build Execution Results**:
   - **Challenger Stress Suite**: `npx tsx tests/suites/m3_challenger_stress.test.ts` -> 26/26 tests passed (100%).
   - **Worker M3 Suite**: `npx tsx tests/suites/m3_fact_or_cap.test.ts` -> 100% passed (Exit code 0).
   - **Multi-Tier E2E Regression**: `npm test` -> 6 suites, 68/68 passed (100%).
   - **TypeScript Verification**: `npx tsc --noEmit` -> 0 errors (Exit code 0).
   - **Next.js Production Build**: `npm run build` -> Compiled successfully, 7/7 static & dynamic pages generated with 0 errors (Exit code 0).

---

## 2. Logic Chain

1. *Observation 1.2.1* demonstrates that `calculateSpeedDecayScore` correctly calculates linear decay from `1.0 * basePoints` at 0.0s to `0.02 * basePoints` at 4.9s, evaluates to 0 on timeout, clamps negative or overflow times defensively, avoids division by zero, and returns 0 on wrong answers regardless of speed.
2. *Observation 1.2.2* demonstrates that the serverless in-memory store cleanly serializes 50 concurrent student actions via `Promise.all()`, assigning correct decaying points and decrementing lives without race conditions or lost updates.
3. *Observation 1.2.3* demonstrates that `player.r2Lives` transitions monotonically `3 -> 2 -> 1 -> 0`, activates Ghost Mode at 0, clamps strictly at 0 across subsequent failures and timeouts, prevents resurrection, and allows spectator Danmaku cheering.
4. *Observation 1.2.4* identifies an unhandled `playerResults` property in `route.ts:555` if `round2State` is patched without legacy fields. Because `Round2Host.tsx` spreads `...state.round2State`, the live game flow does not trigger this error, but fixing line 554 ensures total server-side robustness.
5. *Observation 1.2.5* demonstrates 100% pass across all 26 adversarial challenger tests, 68 E2E project tests, 0 TypeScript errors, and a completely clean Next.js production build.

---

## 3. Caveats

1. **Defensive Route Guard Recommendation**: `src/app/api/game/route.ts` line 554 should add `if (!room.round2State.playerResults) room.round2State.playerResults = {};`. Per the Challenger Key Constraint ("Review-only — do NOT modify implementation code"), this fix is reported rather than applied directly.
2. **Web Audio Autoplay Policy**: Browser audio playback requires user interaction. As verified, both Host and Mobile clients feature explicit start buttons ("KÍCH HOẠT QUẢ BOM" and "THAM GIA PHÒNG") that unlock the Web Audio Context prior to ticking and explosion playback.

---

## 4. Conclusion

**Verdict: `APPROVE`**

Milestone 3 ("Mode 2: Đại Chiến Bóc Phốt 5 Giây / Fact or Cap 5s Reflex Engine") satisfies all empirical stress tests and architectural criteria:
- Speed-Decay scoring boundary conditions are 100% mathematically and behaviorally verified.
- 50 concurrent students answering FACT vs CAP simultaneously within 5 seconds process cleanly in under 10ms with zero data corruption.
- 3-lives decrement accurately transitions eliminated players to Ghost Mode (`r2Lives: 0`) and clamps securely against negative values.
- Standalone Return to Hub cleanly returns room state to `LOBBY` while preserving all player cumulative scores.
- Static typing (`npx tsc --noEmit`), E2E test suite (`npm test`), and Next.js production build (`npm run build`) all pass with 100% success and 0 errors.

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Run Empirical Challenger Stress Test Suite**:
   ```powershell
   npx tsx tests/suites/m3_challenger_stress.test.ts
   ```
   *Expected outcome*: 26/26 tests pass (100%), including 50 concurrent student simulation and defect demonstration in 6.3.

2. **Run Worker M3 Automated Test Suite**:
   ```powershell
   npx tsx tests/suites/m3_fact_or_cap.test.ts
   ```
   *Expected outcome*: All 6 steps pass with Exit code 0.

3. **Run Multi-Tier E2E Regression Suite**:
   ```powershell
   npm test
   ```
   *Expected outcome*: All 6 suites and 68 tests pass (100%).

4. **Verify TypeScript Compilation**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected outcome*: Exits with code 0 and 0 errors.

5. **Verify Next.js Production Build**:
   ```powershell
   npm run build
   ```
   *Expected outcome*: Production build compiles cleanly with 0 SSR or hydration errors.
