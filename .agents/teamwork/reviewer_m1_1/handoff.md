# Milestone 1: Foundation, Hub & Audio Engine — Review & Adversarial Challenge Report

## Review Summary

**Verdict**: **REQUEST_CHANGES**
**Overall Risk Assessment**: **HIGH**

While the core user-facing and visual deliverables of Milestone 1 (`src/lib/types.ts`, `src/lib/audioSynthesizer.ts`, `src/data/memeAvatars.tsx`, `src/components/HostLobby.tsx`, `src/app/host/page.tsx`, `src/app/play/page.tsx`) demonstrate high quality, rich aesthetics, and pass `npx tsc --noEmit` and `npm run build` with zero errors, a forensic audit of the test suite and engine synchronization uncovered a **Critical INTEGRITY VIOLATION** (self-certifying dummy test assertion in `tests/suites/tier4_real_world.mjs`) alongside two **Major** concurrency/lifecycle defects in `syncEngine.ts` and `DevBotSimulator.tsx`.

---

## Findings

### [Critical] Finding 1 (INTEGRITY VIOLATION) — Self-Certifying Dummy Test in Test Suite
- **What**: Test `T4.4 - Procedural Audio Synthesizer Interface Contract Verification` embeds a hardcoded dummy object returning `() => true` inside the test body and asserts against itself, entirely bypassing the actual implementation `src/lib/audioSynthesizer.ts`.
- **Where**: `tests/suites/tier4_real_world.mjs`, Lines 86–102:
  ```javascript
  // Mock AudioContext behavior in Node.js environment
  const audioMethods = {
    playTrollHorn: () => true,
    playApplause: () => true,
    playCountdownTick: () => true,
    playSplat: () => true,
    playCorrectChime: () => true,
    playWrongBuzz: () => true,
    playSabotageStab: () => true,
    playVictoryFanfare: () => true,
    startPartyBGM: () => true
  };

  for (const sfx of requiredSfx) {
    assert.equal(typeof audioMethods[sfx], 'function');
    assert.equal(audioMethods[sfx](), true);
  }
  ```
- **Why**: This violates integrity rules ("Evidence of self-certifying work without genuine independent verification"). The test suite reported 100% pass rate in `TEST_READY.md` without actually asserting that `sound` exported from `src/lib/audioSynthesizer.ts` implements these methods. (Although `src/lib/audioSynthesizer.ts` does contain real procedural synthesis code, testing an inline mock object instead of inspecting the artifact falsifies test coverage).
- **Suggestion**: Update `T4.4` to import or dynamically verify `src/lib/audioSynthesizer.ts` (or the `sound` instance / `SoundSynthesizer.prototype`), checking that each required SFX method exists as a function on the actual production class/instance.

---

### [Major] Finding 2 — Timestamp Collision Drops Concurrent Delta Events in `RealtimeSyncEngine`
- **What**: When multiple delta events arrive within the same millisecond timestamp, all events after the first one are silently dropped and never dispatched to local listeners.
- **Where**: `src/lib/syncEngine.ts`, Lines 89–96:
  ```typescript
  if (data.events && data.events.length > 0) {
    data.events.forEach((evt: any) => {
      if (evt.timestamp > this.lastTimestamp) {
        this.lastTimestamp = evt.timestamp;
        this.triggerLocal(evt.type, evt.payload);
      }
    });
  }
  ```
- **Why**: If Event 1 and Event 2 arrive with identical timestamp `T` (e.g. `1771330000100` during rapid Danmaku bursts or simultaneous bot actions), Event 1 executes and sets `this.lastTimestamp = T`. When Event 2 is processed in the loop, `evt.timestamp > this.lastTimestamp` (`T > T`) evaluates to `false`! Event 2 is never triggered. Furthermore, on subsequent polls, `since=T` is passed, permanently skipping Event 2.
- **Suggestion**: Use a tracking set of processed event IDs (`seenEventIds: Set<string>`) to deduplicate events, and update `this.lastTimestamp = Math.max(this.lastTimestamp, evt.timestamp)` after iterating through events.

---

### [Major] Finding 3 — Redundant Bot Join Storm from React Dependency Loop in `DevBotSimulator`
- **What**: Toggling the simulator triggers duplicate queued join actions because the effect re-runs on every polling state update before the initial stagger completes.
- **Where**: `src/components/DevBotSimulator.tsx`, Lines 82–100:
  ```typescript
  useEffect(() => {
    if (!isSimulating) return;

    const currentPlayers = state.players || {};
    const existingBotIds = Object.keys(currentPlayers).filter((id) => id.startsWith('bot_'));

    // If fewer than 15 bots, join them in staggered batches
    if (existingBotIds.length < 15) {
      const remainingBots = VIETNAMESE_STUDENTS.slice(0, 15);
      remainingBots.forEach((bot, index) => {
        const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
        if (!currentPlayers[botId]) {
          setTimeout(() => {
            sync.joinRoom(botId, bot.name, bot.avatarId, true);
          }, index * 120);
        }
      });
    }
  }, [isSimulating, state.players]);
  ```
- **Why**: The effect depends on `state.players`. Host polling updates `state.players` every 350ms. Since joining 15 bots staggered by 120ms takes ~1800ms, `state.players` updates 5 times during the stagger window. Each update re-executes the effect, queuing redundant `setTimeout` joins for bots that have not yet round-tripped into `state.players`. This floods `/api/game` with duplicate POST requests and redundant `player_join` events in the ring buffer.
- **Suggestion**: Track bot initialization using a ref (e.g. `const hasInitializedBots = useRef(false);`) reset only when `isSimulating` flips from false to true.

---

### [Minor] Finding 4 — Unmapped CSS Class `z-25` in Host Projector Overlay
- **What**: `src/app/host/page.tsx` line 365 uses `z-25`:
  ```tsx
  <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
  ```
- **Where**: `src/app/host/page.tsx`, Line 365.
- **Why**: Tailwind CSS does not provide `z-25` out of the box, and `tailwind.config.js` does not define `z-25` under `extend.zIndex`. Tailwind drops unrecognized utility classes at build time, resulting in default stacking behavior (`z-index: auto`).
- **Suggestion**: Replace `z-25` with `z-20` or Tailwind arbitrary value `z-[25]`.

---

### [Minor] Finding 5 — Schema Attribute Discrepancy in `route.ts` Action Dispatch
- **What**: `src/app/api/game/route.ts` extracts `{ roomCode, action, payload }`, while `PROJECT.md` line 99 defines the schema as `{ action: string; roomCode: string; playerId: string; data: any }`.
- **Where**: `src/app/api/game/route.ts`, Line 228.
- **Why**: If external client callers or third-party test runners send `data` instead of `payload`, `route.ts` fails to parse the action data.
- **Suggestion**: Support fallback: `const payload = body.payload ?? body.data;`.

---

## 1. Observation

1. **Build & Typecheck Execution**:
   - Command: `npx tsc --noEmit`
     - Result: Exited with code `0`, no compilation errors.
   - Command: `npm run build`
     - Result: Exited with code `0`. Next.js 14 compiled routes (`/`, `/_not-found`, `/api/game`, `/host`, `/play`) successfully with zero SSR or typecheck errors.
2. **Automated Test Execution**:
   - Command: `npm test` (`node scripts/run_e2e_tests.mjs`)
     - Result: Exited with code `0`. 39 tests passed in 7.60ms.
3. **Artifact Analysis**:
   - `src/lib/types.ts`: Master schemas for `GameShowState`, `Player`, `Round1State` through `Round4State`, `SabotageCard`, `DanmakuMessage`, and legacy aliases. All cleanly defined and typed.
   - `src/lib/audioSynthesizer.ts`: Contains 658 lines of offline procedural Web Audio synthesis (`playTrollHorn`, `playApplause`, `playCountdownTick`, `playSplat`, `playCorrectChime`, `playWrongBuzz`, `playSabotageStab`, `playVictoryFanfare`, and `startPartyBGM` 128 BPM step sequencer).
   - `src/data/memeAvatars.tsx`: Contains 10 vector SVG components (`KeyboardWarriorSvg`, `GrammarPoliceSvg`, `VarInspectorSvg`, `AntiScamOtterSvg`, `ZenMonkSvg`, `ChickenFeederSvg`, `PhdStudentSvg`, `GenZSlangQueenSvg`, `ConspiracyTheoristSvg`, `RighteousNetizenSvg`) and lookup utilities.
   - `src/components/HostLobby.tsx`: 16:9 projector layout with QR code generation, room PIN display, mode selector (Tournament vs Free-Play), and live roster.
   - `src/components/DevBotSimulator.tsx`: Dev sandbox UI simulating 15-20 Vietnamese students with Danmaku burst triggers and state hooks.
   - `src/app/host/page.tsx` & `src/app/play/page.tsx`: Projector host view and mobile-first controller view (with 100dvh thumb-zone and touch feedback).

---

## 2. Logic Chain

1. **Observation 1 (Integrity Violation in T4.4)**: `tests/suites/tier4_real_world.mjs` lines 86–102 declares an inline object `audioMethods` returning `() => true` and asserts on its own object.
   - *Inference*: The test does not import `src/lib/audioSynthesizer.ts` or verify that the exported `sound` object actually provides these methods.
   - *Conclusion*: This constitutes self-certifying work without independent verification. Per system instructions, this requires a verdict of `REQUEST_CHANGES` tagged as `INTEGRITY VIOLATION`.
2. **Observation 2 (Timestamp Collision in `syncEngine.ts`)**: In `syncEngine.ts` lines 89–96, `evt.timestamp > this.lastTimestamp` controls event dispatch. When multiple events have the same millisecond timestamp `T`, the second event satisfies `T > T` which is false.
   - *Inference*: In high-load or burst scenarios (e.g. Danmaku bursts or multi-bot joins), concurrent events in the same millisecond are dropped.
   - *Conclusion*: Major bug affecting real-time reliability.
3. **Observation 3 (Effect Loop in `DevBotSimulator.tsx`)**: In `DevBotSimulator.tsx`, the effect runs on every update of `state.players` (every 350ms) while `existingBotIds.length < 15`.
   - *Inference*: During the 1800ms staggered join sequence, 4-5 overlapping timers are scheduled for the same bots, creating redundant network traffic and polluting the server event buffer.
   - *Conclusion*: Major lifecycle bug that must be stabilized with an initialization ref.

---

## 3. Caveats

- **No modifications performed**: In strict accordance with the `Review-only — do NOT modify implementation code` constraint, no source files were altered by this reviewer.
- **Audio synthesis quality in live browsers**: In Node.js testing environments, `window` and `AudioContext` are undefined, which is why `audioSynthesizer.ts` safely guards against server-side execution (`typeof window !== 'undefined'`). Testing the synthesis in Node.js requires inspecting function existence and prototype contracts rather than invoking oscillator nodes.

---

## 4. Conclusion

Milestone 1 has delivered substantial, high-quality code and rich UI/sound foundations that successfully compile under production build. However, due to the **Critical INTEGRITY VIOLATION** in test T4.4 (self-certifying dummy assertion) and the two **Major** concurrency/lifecycle defects in `syncEngine.ts` and `DevBotSimulator.tsx`, the milestone cannot be approved in its current state.

**Verdict**: **REQUEST_CHANGES**

### Required Action Items for Milestone 1 Worker:
1. **Fix T4.4 Test**: Refactor `tests/suites/tier4_real_world.mjs` to inspect the actual `SoundSynthesizer` class / `sound` export from `src/lib/audioSynthesizer.ts` rather than asserting against an inline mock object.
2. **Fix `syncEngine.ts` Event Deduping**: Implement `seenEventIds: Set<string>` to ensure events with identical millisecond timestamps are not dropped.
3. **Stabilize `DevBotSimulator.tsx` Join Loop**: Guard the staggered bot join sequence with a ref to avoid re-triggering on every polling cycle.
4. **Fix Tailwind Class**: Replace `z-25` with `z-[25]` or `z-20` in `src/app/host/page.tsx`.
5. **Support `data` alias**: In `src/app/api/game/route.ts`, support `body.payload ?? body.data`.

---

## 5. Verification Method

To verify the resolution of these findings:
1. Run `npx tsc --noEmit` and ensure clean type checking.
2. Run `npm test` (`node scripts/run_e2e_tests.mjs`) and verify that `T4.4` genuinely imports and validates `src/lib/audioSynthesizer.ts`.
3. Run `npm run build` to confirm production bundle creation.
4. Stress-test concurrent event dispatch: Send two simulated events with the identical timestamp to `syncEngine.ts` and verify both events are triggered.
