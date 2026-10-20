# Dispatch: worker_m3_remediate

## Task Assignment: Milestone 3 — Server Defect & Idempotency Remediation

Challenger `challenger_m3_2` detected 2 defects in `src/app/api/game/route.ts` during Milestone 3 empirical stress testing:
1. **Crash Bug (Line 554-555)**:
   In `src/app/api/game/route.ts`:
   When `round2State` is updated via `HOST_UPDATE_STATE`, `playerResults` may be undefined.
   Line 555 `room.round2State.playerResults[playerId] = ...` causes unhandled `TypeError: Cannot set properties of undefined (setting '<playerId>')`.
   **Fix**: Add defensive guard before line 555:
   ```typescript
   if (!room.round2State.playerResults) room.round2State.playerResults = {};
   ```
2. **Scoring Idempotency Gap (Line 524)**:
   In `SUBMIT_FACT_OR_CAP`: If a client resends the packet or rapid duplicate requests arrive, points are added twice and lives decremented twice.
   **Fix**: Add idempotency check:
   ```typescript
   if (room.round2State.answers?.[playerId]) {
     return NextResponse.json({ success: true, timestamp, alreadySubmitted: true });
   }
   ```
3. **Verification**:
   - Run `npx tsx tests/suites/m3_mode2_challenger_stress.test.ts`
   - Run `npx tsx tests/suites/m3_fact_or_cap.test.ts`
   - Run `npm test`
   - Run `npm run build`
   Ensure all pass with 0 errors.

## Files Owned Exclusively
- `src/app/api/game/route.ts`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your changes to `changes.md` and handoff report to `handoff.md`.

## 2026-10-19T16:51:03Z
Apply remediation for Milestone 3 defects in src/app/api/game/route.ts.
Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m3_remediate
Read C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m3_remediate\DISPATCH.md and C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\challenger_m3_2\handoff.md.

Files you own exclusively:
- src/app/api/game/route.ts

Tasks:
1. Fix crash bug at line 554 by defensively initializing playerResults: `if (!room.round2State.playerResults) room.round2State.playerResults = {};`
2. Add idempotency guard at line 524 in SUBMIT_FACT_OR_CAP: `if (room.round2State.answers?.[playerId]) return NextResponse.json({ success: true, timestamp, alreadySubmitted: true });`
3. Run `npx tsx tests/suites/m3_mode2_challenger_stress.test.ts` and `npm run build` to confirm 100% pass and 0 errors.

