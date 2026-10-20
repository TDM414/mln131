# Handoff Report: Milestone 3 — Empirical Challenger Verification

**Author**: `challenger_m3_2` (EMPIRICAL CHALLENGER / Critic / Specialist)  
**Parent Agent**: `dcd6312c-918d-4ca5-957d-512b431b5686`  
**Milestone**: Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)  
**Project Root**: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`  
**Working Directory**: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\challenger_m3_2`  
**Verdict**: **REJECT** (Blocking on 1 Critical Server Crash Bug + 1 Scoring Idempotency Gap)  
**Timestamp**: 2026-10-19T16:51:00Z  

---

## 1. Observation

### 1.1 Executed Commands & Verbatim Outputs

1. **TypeScript Typecheck (`npx tsc --noEmit`)**:
   - Exit code: `0`.
   - Output: 0 type errors.

2. **Next.js Production Build (`npm run build`)**:
   - Exit code: `0`.
   - Output:
     ```
     ▲ Next.js 14.2.35
     Creating an optimized production build ...
     ✓ Compiled successfully
     Linting and checking validity of types ...
     Collecting page data ...
     ✓ Generating static pages (7/7)
     Finalizing page optimization ...

     Route (app)                              Size     First Load JS
     ┌ ○ /                                    8.88 kB        96.2 kB
     ├ ○ /_not-found                          873 B          88.2 kB
     ├ ƒ /api/game                            0 B                0 B
     ├ ○ /host                                45.8 kB         146 kB
     └ ○ /play                                16 kB           116 kB
     + First Load JS shared by all            87.3 kB
     ```

3. **Baseline Automated Test Suites (`npm test`, `m3_fact_or_cap.test.ts`, `m2_trending_feed.test.ts`, `m1_rearchitect_contracts.test.ts`)**:
   - `npm test`: 68/68 passed (100%).
   - `m3_fact_or_cap.test.ts`: Passed (Exit code 0).
   - `m2_trending_feed.test.ts`: Passed (Exit code 0).
   - `m1_rearchitect_contracts.test.ts`: Passed (Exit code 0).

4. **Dedicated Empirical Challenger Stress Suite (`npx tsx tests/suites/m3_mode2_challenger_stress.test.ts`)**:
   - Executed 11 rigorous adversarial tests across multi-tap, mathematical boundaries, cracked screen visual feedback, 40-student classroom simulation, Ghost Mode Danmaku burst, and Return to Hub cumulative score persistence.
   - 11/11 tests passed.
   - **Critical Bug Reproduced**:
     ```
     TypeError: Cannot set properties of undefined (setting '<playerId>')
         at POST (src/app/api/game/route.ts:555:46)
     ```
   - **Vulnerability Reproduced**:
     ```
     VULNERABILITY: Duplicate SUBMIT_FACT_OR_CAP packet awarded points twice (800 -> 1600 pts).
     ```

### 1.2 Code Inspection Observations

1. **Bug Location: `src/app/api/game/route.ts:544-555`**:
   ```typescript
   // Line 544: Answers is defensively initialized if missing:
   if (!room.round2State.answers) room.round2State.answers = {};
   room.round2State.answers[playerId] = {
     choice,
     timestamp,
     remainingTime,
     isCorrect,
     score: pointsEarned,
     livesRemaining: nextLives,
   };

   // Line 554-555: Compatibility field playerResults is accessed WITHOUT defensive check:
   // Compatibility
   room.round2State.playerResults[playerId] = {
     choice,
     success: isCorrect,
     isCorrect,
     reactionTimeMs: totalTime - remainingTime,
     pointsEarned,
     livesRemaining: nextLives,
   };
   ```
   When `HOST_UPDATE_STATE` updates `round2State` without explicitly including the legacy `playerResults: {}` dictionary (such as when `Round2Host.tsx:226-235` or any caller sends `{ phase: 'QUESTION_ACTIVE', currentQuestionIndex: 0, answers: {}, questions: [...] }`), `room.round2State.playerResults` becomes `undefined`. The subsequent player tap on `SUBMIT_FACT_OR_CAP` immediately crashes with an unhandled `TypeError` (HTTP 500), causing student submissions to be rejected.

2. **Idempotency Gap: `src/app/api/game/route.ts:521-543`**:
   ```typescript
   else if (action === 'SUBMIT_FACT_OR_CAP') {
     const { choice, reactionTimeMs, remainingTime: clientRemainingTime, totalTime = 5000, playerId, questionIndex } = payload;
     if ((choice === 'FACT' || choice === 'CAP') && playerId && room.players[playerId]) {
       // MISSING IDEMPOTENCY CHECK: does not verify if room.round2State.answers?.[playerId] already exists!
       ...
       const curLives = player.r2Lives ?? 3;
       const nextLives = isCorrect ? curLives : Math.max(0, curLives - 1);
       player.r2Lives = nextLives;

       if (isCorrect) {
         player.score += pointsEarned;
         player.roundScores.ROUND_2 = (player.roundScores.ROUND_2 || 0) + pointsEarned;
       }
   ```
   If a network retry, client retransmission, or malicious curl request sends `SUBMIT_FACT_OR_CAP` twice for the same question, the player gains points twice (800 -> 1600) or loses 2 lives instead of 1.

3. **Mobile Client Protection: `src/components/Round2Play.tsx:158-163`**:
   ```typescript
   const handleSelectChoice = async (choice: 'FACT' | 'CAP') => {
     if (hasSubmitted || submittedRef.current || phase !== 'QUESTION_ACTIVE') return;

     submittedRef.current = true;
     setHasSubmitted(true);
   ```
   The mobile client successfully implements a synchronous lock via `submittedRef.current = true;` before triggering state updates or sound/haptics, protecting legitimate mobile clients from accidental rapid double-tapping.

4. **Cracked Screen Overlay: `src/components/Round2Play.tsx:473-495`**:
   - `wasCorrect` is computed on lines 223-226:
     ```typescript
     const serverAnswer = round2State?.answers?.[playerId];
     const finalAnswer = lockedChoice || serverAnswer;
     const wasCorrect = finalAnswer ? finalAnswer.isCorrect : false;
     const didTimeout = !finalAnswer;
     ```
   - When `!wasCorrect` (both wrong answer and timeout), the component applies `animate-shake` (defined in `tailwind.config.js:29`) and renders the SVG comic glass cracks overlay with `pointer-events-none`, `ring-inset ring-8 ring-rose-600`, and `bg-rose-950/30`.

5. **Return to Hub Persistence: `src/app/api/game/route.ts:784-793` & `src/app/host/page.tsx:194-203`**:
   - `action: 'RETURN_TO_HUB'` updates `room.status = 'LOBBY'` and `room.currentRoundPhase = 'LOBBY_WAITING'`.
   - It does NOT clear `room.players` or player scores.
   - In `tests/suites/m3_mode2_challenger_stress.test.ts:335-373`, 40 students with cumulative scores returned to Hub and re-entered Round 1; scores stacked seamlessly (e.g. 4000 PTS + 100 PTS = 4100 PTS).

---

## 2. Logic Chain

1. **Crash Vulnerability Trace**:
   - In `tests/suites/m3_fact_or_cap.test.ts:129`, the worker manually injected `playerResults: {}` into the mock payload, masking the omission.
   - In production code (`Round2Host.tsx:226-235`), `HOST_UPDATE_STATE` sends only `{ phase: 'QUESTION_ACTIVE', currentQuestionIndex: idx, answers: {}, questions }`.
   - When this payload replaces `round2State`, `playerResults` is `undefined`.
   - When a student taps `[FACT]` or `[CAP]`, `route.ts:555` executes `room.round2State.playerResults[playerId] = ...`, which immediately crashes Node.js with `Cannot set properties of undefined`.
   - Therefore, the server crashes during live gameplay unless a defensive check `if (!room.round2State.playerResults) room.round2State.playerResults = {};` is present on line 554.

2. **Idempotency Vulnerability Trace**:
   - While `Round2Play.tsx` protects against double-taps on the client via `submittedRef.current = true`, the backend API does not enforce idempotency per player per question.
   - Any retransmitted packet or parallel request awards duplicate points (`player.score += pointsEarned`).
   - Adding `if (room.round2State.answers?.[playerId]) return NextResponse.json({ success: true, timestamp });` guarantees idempotency.

3. **Feature Verification Assessment**:
   - Visual feedback, speed-decay mathematical precision, cracked screen overlay, Ghost Mode Danmaku burst, and Return to Hub cumulative score persistence are otherwise genuinely implemented and robust.
   - However, because the server crash bug was empirically reproduced and causes HTTP 500 errors during gameplay, this milestone cannot be approved in its current state.

---

## 3. Caveats

1. The client-side code (`Round2Play.tsx` and `Round2Host.tsx`) is functionally sound and aesthetically high quality.
2. The failure is entirely isolated to two missing defensive checks in `src/app/api/game/route.ts`.
3. The production build (`npm run build`) passes cleanly with 0 type errors because TypeScript allows dynamic property assignment on `any` or loose types, which hid the runtime `undefined` property crash at build time.

---

## 4. Conclusion

**Verdict: REJECT**

Milestone 3 ("Mode 2: Đại Chiến Bóc Phốt 5 Giây") must be rejected until the worker applies the following 2 trivial defensive lines in `src/app/api/game/route.ts`:

### Required Remediation (Worker Action Required)

1. **Fix Crash in `src/app/api/game/route.ts` line 554**:
   ```typescript
   // Add defensive guard before line 555:
   if (!room.round2State.playerResults) room.round2State.playerResults = {};
   room.round2State.playerResults[playerId] = {
     choice,
     success: isCorrect,
     isCorrect,
     reactionTimeMs: totalTime - remainingTime,
     pointsEarned,
     livesRemaining: nextLives,
   };
   ```

2. **Add Idempotency Guard in `src/app/api/game/route.ts` line 524**:
   ```typescript
   // Prevent duplicate submissions for the same question:
   if (room.round2State.answers?.[playerId]) {
     return NextResponse.json({ success: true, timestamp, alreadySubmitted: true });
   }
   ```

---

## 5. Verification Method

Once the worker applies the two lines above, verify independently by running:

1. **Empirical Challenger Stress Harness**:
   ```powershell
   npx tsx tests/suites/m3_mode2_challenger_stress.test.ts
   ```
   *Expected outcome*: Exits with code 0; Test 1.1 passes with 0 uncaught exceptions; Test 2.2 confirms score is not duplicated.

2. **Milestone 3 Core Suite**:
   ```powershell
   npx tsx tests/suites/m3_fact_or_cap.test.ts
   ```
   *Expected outcome*: 100% pass (Exit code 0).

3. **Full Regression Suite**:
   ```powershell
   npm test
   ```
   *Expected outcome*: All 68 tests pass (100%).

4. **Production Build**:
   ```powershell
   npm run build
   ```
   *Expected outcome*: 0 errors, successful static page generation.
