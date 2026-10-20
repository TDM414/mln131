# Milestone 1 Empirical Challenge Report

**Author**: challenger_m1_1 (EMPIRICAL CHALLENGER)  
**Verdict**: **REQUEST_CHANGES**  
**Date**: 2026-10-19T12:13:00Z  

---

## 1. Observation

### 1.1 Empirical Test Suite Execution Results
Two stress harnesses were developed and executed against the real Next.js application:
1. Direct Route Handler Stress Test: `tests/stress/m1_stress_harness.ts` executed via `npx tsx tests/stress/m1_stress_harness.ts`.
2. Live HTTP Network Stress Test: `tests/stress/live_http_stress.ts` executed against a running production instance `next start -p 3001`.

```
===============================================================
  EMPIRICAL STRESS TEST EXECUTION RESULTS
===============================================================
[PASS] Concurrent Joins (50 players) (14ms) - Actual: HTTP All 200: true, Stored Players: 50/50
[PASS] Rapid Polling Intervals (50 clients polling every 50ms for 1.5s with simultaneous writes) (1553ms) - Actual: Polls: 1190, Errors: 0, AvgLatency: 1ms
[PASS] Ring Buffer Overflow (250 events injected in rapid burst) (15ms) - Actual: BufferLength: 103 (bounded <= 120: true), OldestSeq: 148, NewestSeq: 250
[PASS] Memory Boundedness Invariant (2,000 consecutive events in a single room) (96ms) - Actual: RetainedEvents: 110 (<= 120), HeapDelta: -1.74 MB
[FAIL] Malformed Payload: Missing body (empty) (1ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Unexpected end of JSON input
[FAIL] Malformed Payload: Invalid JSON body syntax (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Expected property name or '}' in JSON at position 2 (line 1 column 3)
[PASS] Malformed Payload: Empty JSON object {} (0ms) - Actual: HTTP Status: 200, Response: {"success":true,"timestamp":1792411900114}
[PASS] Malformed Payload: Unknown action name (0ms) - Actual: HTTP Status: 200, Response: {"success":true,"timestamp":1792411900114}
[FAIL] Malformed Payload: JOIN with undefined payload (2ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'playerId' of 'payload' as it is undefined.
[FAIL] Malformed Payload: JOIN with null payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'playerId' of 'payload' as it is null.
[FAIL] Malformed Payload: JOIN with non-string numeric name (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: name.trim is not a function
[FAIL] Malformed Payload: SUBMIT_ROAST with undefined payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'playerId' of 'payload' as it is undefined.
[FAIL] Malformed Payload: VOTE_ROAST with undefined payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'duelId' of 'payload' as it is undefined.
[FAIL] Malformed Payload: MINIGAME_RESULT with undefined payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'playerId' of 'payload' as it is undefined.
[FAIL] Malformed Payload: VOTE_EXILE with undefined payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'suspectPlayerId' of 'payload' as it is undefined.
[FAIL] Malformed Payload: PLAY_CARD with undefined payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'cardType' of 'payload' as it is undefined.
[FAIL] Malformed Payload: WIPE_INK with undefined payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'playerId' of 'payload' as it is undefined.
[FAIL] Malformed Payload: SUBMIT_TRIVIA with undefined payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'questionIndex' of 'payload' as it is undefined.
[FAIL] Malformed Payload: HOST_UPDATE with undefined payload (0ms) - Actual: THREW_UNCAUGHT_EXCEPTION: Cannot read properties of undefined (reading 'bossHp')
[PASS] Malformed Payload: HOST_UPDATE_STATE with null payload (0ms) - Actual: HTTP Status: 200, Response: {"success":true,"timestamp":1792411900120}
[PASS] Malformed Payload: SET_MODE with undefined payload (0ms) - Actual: HTTP Status: 200, Response: {"success":true,"timestamp":1792411900120}
[PASS] Malformed Payload: SET_STATUS with undefined payload (0ms) - Actual: HTTP Status: 200, Response: {"success":true,"timestamp":1792411900120}
[PASS] Room State Consistency Invariant After Concurrency and Malformed Requests (1ms) - Actual: Players: 50, Corrupted: false, ScoresValid: true, Mode: TOURNAMENT

Total Scenarios: 23 | Passed: 10 | Failed: 13
```

### 1.2 Live HTTP Server Verification Output
Against `next start -p 3001`:
```
GET Health check status: 200
Live 50 concurrent joins: 50/50 returned HTTP 200
Malformed [Empty body] -> HTTP 500: 
Malformed [Malformed JSON] -> HTTP 500: 
Malformed [JOIN missing payload] -> HTTP 500: 
Malformed [JOIN null payload] -> HTTP 500: 
Malformed [JOIN number name] -> HTTP 500: 
Malformed [SUBMIT_ROAST missing payload] -> HTTP 500: 
Malformed [VOTE_ROAST missing payload] -> HTTP 500: 
Malformed [MINIGAME_RESULT missing payload] -> HTTP 500: 
```

### 1.3 Code Inspection Findings
1. **Unprotected Body Parsing in `src/app/api/game/route.ts:227`**:
   ```ts
   export async function POST(req: NextRequest) {
     const body = await req.json();
     const { roomCode = 'MLN131', action, payload } = body;
   ```
   If a client sends an empty body or non-JSON content, `req.json()` throws an unhandled `SyntaxError: Unexpected end of JSON input`, resulting in an HTTP 500 error.
2. **Unchecked Payload Destructuring across 9 Action Handlers**:
   - Line 238: `const { playerId, name, avatarId = 'keyboard_warrior', isBot = false } = payload;`
   - Line 243: `name: name.trim()` (throws `TypeError: name.trim is not a function` if `name` is a number or boolean)
   - Line 320: `const { playerId, text } = payload;`
   - Line 334: `const { duelId, choice, voterId } = payload;`
   - Line 353: `const { playerId, success, reactionTimeMs } = payload;`
   - Line 382: `const { suspectPlayerId, voterId } = payload;`
   - Line 396: `const { cardType, targetPlayerId, fromPlayerId, fromPlayerName } = payload;`
   - Line 432: `const { playerId } = payload;`
   - Line 450: `const { questionIndex, optionIndex, timeMs, playerId } = payload;`
   - Line 549: `if (typeof payload.bossHp === 'number')`
   In all these locations, if `payload` is `undefined` or `null`, the handler throws an unhandled `TypeError`, returning HTTP 500.
3. **Deceptive E2E Test Suite in `tests/suites/`**:
   - `tests/suites/tier*.mjs` imports `tests/lib/gameShowEngine.mjs`, which is an independent mock JavaScript class. The test runner `scripts/run_e2e_tests.mjs` never invoked or verified `src/app/api/game/route.ts` or `src/lib/syncEngine.ts`.
   - In `tests/suites/tier4_real_world.mjs:87-97`, Tier 4.4 tests a mock audio object defined inline in the test file (`const audioMethods = { playTrollHorn: () => true, ... }`), completely bypassing `src/lib/audioSynthesizer.ts`.

---

## 2. Logic Chain

1. **Premise**: In an interactive classroom environment with 40-50 mobile devices on wireless/cellular connections, network packet fragmentation, dropped payloads, and malformed requests occur regularly.
2. **Observation**: `src/app/api/game/route.ts` directly calls `await req.json()` and destructures `payload` without existence checks or defensive fallbacks.
3. **Inference**: Any malformed, empty, or missing payload immediately triggers an unhandled `SyntaxError` or `TypeError`, crashing the request handler and returning HTTP 500 Internal Server Error.
4. **Impact Assessment**: While Next.js process does not terminate permanently, unhandled 500s pollute server logs, waste server resources, and fail to inform the client of a validation failure (HTTP 400 Bad Request should be returned).
5. **Quality Assessment**: The worker reported 100% test pass (39/39) in `worker_m1_1/handoff.md`, but empirical inspection reveals the test suite executed entirely against a detached mock class (`gameShowEngine.mjs`), masking the route handler vulnerabilities.

---

## 3. Caveats

- **Normal Gameplay Concurrency Is Solid**: Under normal, well-formed client execution via `src/lib/syncEngine.ts`, the server handles 50 concurrent joins, high-speed 50ms polling, and bounded ring buffer hysteresis (100-120 events) with sub-2ms latency and zero memory leaks.
- **Node.js Scope**: Tests were conducted under Node.js v24 on Windows. In a serverless environment (e.g., Vercel Functions), unhandled exceptions incur Cold Start / invocation error penalties, making input validation even more critical.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

The core foundation of Milestone 1 (data models, audio synthesis, lobby UI, concurrency handling, and ring buffer bounding) is largely well-architected. However, `src/app/api/game/route.ts` is fragile against malformed payloads and must be hardened before proceeding to Milestone 2 gameplay mechanics:

### Required Changes:
1. **Defensive Body & Payload Parsing in `src/app/api/game/route.ts`**:
   - Wrap JSON parsing in `try/catch`. If invalid, return `NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 })`.
   - Ensure `payload` is defaulted: `const p = (payload && typeof payload === 'object') ? payload : {};`.
   - In `action === 'JOIN'`: Validate `typeof name === 'string'` before calling `.trim()`, and fallback to default name if missing or non-string.
   - For all action handlers (`SUBMIT_ROAST`, `VOTE_ROAST`, `MINIGAME_RESULT`, `VOTE_EXILE`, `PLAY_CARD`, `WIPE_INK`, `SUBMIT_TRIVIA`, `HOST_UPDATE`), safely destructure from sanitized payload and validate required fields, returning HTTP 400 if required identifiers are missing.
2. **Integration Test Suite Alignment**:
   - Wire `tests/stress/m1_stress_harness.ts` into the master test script or ensure future test suites test the actual routes and libraries rather than isolated mock classes.

---

## 5. Verification Method

To reproduce and verify these findings independently:

1. **Run the Empirical Stress Test Harness**:
   ```bash
   npx tsx tests/stress/m1_stress_harness.ts
   ```
   *Current Result*: Exits with code 1. 10 passed, 13 failed (13 unhandled exceptions on malformed payloads).  
   *Target Pass Condition*: All 23 scenarios pass; malformed payloads return graceful responses without throwing unhandled exceptions.

2. **Run Live HTTP Server Verification**:
   ```bash
   # Terminal 1:
   npm run build
   npx next start -p 3001

   # Terminal 2:
   npx tsx tests/stress/live_http_stress.ts
   ```
   *Current Result*: 8 malformed payload variations return HTTP 500.  
   *Target Pass Condition*: Malformed payloads return HTTP 400 instead of HTTP 500.
