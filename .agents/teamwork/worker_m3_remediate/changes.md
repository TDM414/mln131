# Changes: Milestone 3 Defect Remediation

## Target File: `src/app/api/game/route.ts`

### 1. Defensively Initialize `room.round2State.playerResults`
- **Location**: Line ~555 (in `SUBMIT_FACT_OR_CAP` action)
- **Problem**: When `HOST_UPDATE_STATE` updates `round2State` without explicitly passing the legacy `playerResults` dictionary (e.g., standard Mode 2 payloads containing `answers: {}`, `questions: [...]`), `room.round2State.playerResults` is `undefined`. Accessing `room.round2State.playerResults[playerId] = ...` threw an unhandled `TypeError: Cannot set properties of undefined (setting '<playerId>')`.
- **Solution**:
  ```typescript
  // Compatibility
  if (!room.round2State.playerResults) room.round2State.playerResults = {};
  room.round2State.playerResults[playerId] = { ... };
  ```

### 2. Add Scoring Idempotency Guard
- **Location**: Line ~524 (at entry of `SUBMIT_FACT_OR_CAP` action)
- **Problem**: Multiple rapid duplicate requests or retransmitted packets could award points multiple times (`player.score += pointsEarned`) and decrement lives multiple times (`curLives - 1`).
- **Solution**:
  ```typescript
  // Idempotency check: prevent duplicate submissions for the same question
  if (room.round2State.answers?.[playerId]) {
    return NextResponse.json({ success: true, timestamp, alreadySubmitted: true });
  }
  ```

## Test File: `tests/suites/m3_mode2_challenger_stress.test.ts`
- Updated Test 1.1 step name and assertions to verify that no `TypeError` occurs when `round2State` is updated without `playerResults`, logging `[VERIFIED FIX]: route.ts:555 defensive guard prevented TypeError crash (0 uncaught exceptions)`.
