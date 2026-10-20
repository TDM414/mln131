# Milestone 1 Remediation Investigation & Action Plan Report

**Author**: `explorer_m1_2`  
**Working Directory**: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m1_2`  
**Parent Agent**: `45f106cf-224a-4102-aeee-b56815847bc0`  
**Target Milestone**: Milestone 1 (Foundation, Hub & Audio Engine Remediation)  
**Date**: 2026-10-19T12:22:00Z  

---

## 1. Observation

### 1.1 Direct Observation of Prohibited Pattern #4 (Self-Certifying Dummy Test)
In `tests/suites/tier4_real_world.mjs` (Lines 72–103), test scenario `T4.4` embeds a hardcoded mock object and tests against itself, entirely bypassing `src/lib/audioSynthesizer.ts`:
```javascript
72:   testCtx.test('T4.4 - Procedural Audio Synthesizer Interface Contract Verification', () => {
73:     const requiredSfx = [
74:       'playTrollHorn',
75:       'playApplause',
76:       'playCountdownTick',
77:       'playSplat',
78:       'playCorrectChime',
79:       'playWrongBuzz',
80:       'playSabotageStab',
81:       'playVictoryFanfare',
82:       'startPartyBGM'
83:     ];
84: 
85:     // Mock AudioContext behavior in Node.js environment
86:     const audioMethods = {
87:       playTrollHorn: () => true,
88:       playApplause: () => true,
89:       playCountdownTick: () => true,
90:       playSplat: () => true,
91:       playCorrectChime: () => true,
92:       playWrongBuzz: () => true,
93:       playSabotageStab: () => true,
94:       playVictoryFanfare: () => true,
95:       startPartyBGM: () => true
96:     };
97: 
98:     for (const sfx of requiredSfx) {
99:       assert.equal(typeof audioMethods[sfx], 'function');
100:      assert.equal(audioMethods[sfx](), true);
101:    }
102:  });
```
- **Evidence**: `audioMethods` is a local mock object defined within the test function. The test never imports `sound` or `SoundSynthesizer` from `src/lib/audioSynthesizer.ts`.
- **Contrast**: `src/lib/audioSynthesizer.ts` (658 lines) actually contains full Web Audio API procedural synthesis code and exports `export const sound = new SoundSynthesizer();`.

---

### 1.2 Direct Observation of Test Decoupling & Fixture Discrepancy
- In `tests/fixtures/mockData.mjs` (Lines 3–14), avatar IDs are defined as:
  `cu_vo`, `bo_cau`, `ca_map`, `khi_hacker`, `cao_seeder`, `tho_trend`, `gau_var`, `chuot_phim`, `vet_copy`, `ech_taychay`.
- In `src/data/memeAvatars.tsx` (Lines 430–507), the actual implemented avatars are:
  `keyboard_warrior`, `grammar_police`, `var_inspector`, `anti_scam_otter`, `zen_monk`, `chicken_feeder`, `phd_student`, `genz_slang_queen`, `conspiracy_theorist`, `righteous_netizen`.
- In `scripts/run_e2e_tests.mjs`, all 39 tests in `tier1` through `tier5` test an in-memory simulation class `tests/lib/gameShowEngine.mjs` without importing `src/app/api/game/route.ts` or `src/lib/syncEngine.ts`.

---

### 1.3 Direct Observation of Build & Typecheck Failures
1. **Command**: `npx tsc --noEmit`
   - **Exit Code**: `1`
   - **Verbatim Error**:
     ```
     tests/stress/m1_stress_harness.ts(28,60): error TS2345: Argument of type 'RequestInit' is not assignable to parameter of type 'import("C:/Users/duyma/.gemini/antigravity/scratch/democracy-raid-mln131/node_modules/next/dist/server/web/spec-extension/request").RequestInit'.
       Types of property 'signal' are incompatible.
         Type 'AbortSignal | null | undefined' is not assignable to type 'AbortSignal | undefined'.
           Type 'null' is not assignable to type 'AbortSignal | undefined'.
     ```
2. **Command**: `npm run build`
   - **Exit Code**: `1`
   - **Verbatim Error**:
     ```
     Failed to compile.
     ./tests/stress/m1_stress_harness.ts:28:60
     Type error: Argument of type 'RequestInit' is not assignable to parameter of type 'import(".../next/dist/server/web/spec-extension/request").RequestInit'.
     ```
   - **Root Cause**: `tests/stress/m1_stress_harness.ts:19` typed `init` with DOM `RequestInit`, whose `signal` allows `null`, whereas Next.js `NextRequest` constructor expects `AbortSignal | undefined`.

---

### 1.4 Direct Observation of Route Fragility under Malformed Payloads
1. **Command**: `npx tsx tests/stress/m1_stress_harness.ts`
   - **Exit Code**: `1`
   - **Summary**: `Total: 23 | Passed: 10 | Failed: 13`
   - **Failing Scenarios**:
     - `Missing body (empty)` -> `THREW_UNCAUGHT_EXCEPTION: Unexpected end of JSON input`
     - `Invalid JSON body syntax` -> `THREW_UNCAUGHT_EXCEPTION: Expected property name or '}' in JSON`
     - `JOIN with undefined payload` -> `THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'playerId' of 'payload' as it is undefined.`
     - `JOIN with null payload` -> `THREW_UNCAUGHT_EXCEPTION: Cannot destructure property 'playerId' of 'payload' as it is null.`
     - `JOIN with non-string numeric name` -> `THREW_UNCAUGHT_EXCEPTION: name.trim is not a function`
     - `SUBMIT_ROAST with undefined payload` -> `Cannot destructure property 'playerId' of 'payload'`
     - `VOTE_ROAST with undefined payload` -> `Cannot destructure property 'duelId' of 'payload'`
     - `MINIGAME_RESULT with undefined payload` -> `Cannot destructure property 'playerId' of 'payload'`
     - `VOTE_EXILE with undefined payload` -> `Cannot destructure property 'suspectPlayerId' of 'payload'`
     - `PLAY_CARD with undefined payload` -> `Cannot destructure property 'cardType' of 'payload'`
     - `WIPE_INK with undefined payload` -> `Cannot destructure property 'playerId' of 'payload'`
     - `SUBMIT_TRIVIA with undefined payload` -> `Cannot destructure property 'questionIndex' of 'payload'`
     - `HOST_UPDATE with undefined payload` -> `Cannot read properties of undefined (reading 'bossHp')`
2. **Code in `src/app/api/game/route.ts` (Lines 226–228)**:
   ```typescript
   export async function POST(req: NextRequest) {
     const body = await req.json();
     const { roomCode = 'MLN131', action, payload } = body;
   ```
   No `try / catch` around `req.json()`; no existence check on `payload` before destructuring.

---

### 1.5 Direct Observation of Timestamp Collision Invariant Violation
In `src/lib/syncEngine.ts` (Lines 89–96):
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
- When multiple events arrive with identical millisecond timestamps $T$, the first event sets `this.lastTimestamp = T`.
- For subsequent events in the same batch, `evt.timestamp > this.lastTimestamp` ($T > T$) evaluates to `false`.
- The subsequent events are never triggered locally and are permanently skipped.

---

### 1.6 Direct Observation of React Dependency Storm in `DevBotSimulator.tsx`
In `src/components/DevBotSimulator.tsx` (Lines 81–100):
```typescript
useEffect(() => {
  if (!isSimulating) return;

  const currentPlayers = state.players || {};
  const existingBotIds = Object.keys(currentPlayers).filter((id) => id.startsWith('bot_'));

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
- Host polls `/api/game` every 350ms, causing `state.players` to update 5 times during the 1800ms bot join window.
- Each state update re-runs the effect and schedules redundant timeouts, flooding the server with duplicate joins.

---

### 1.7 Minor Reviewer Observations
- `src/app/host/page.tsx:365`: Uses unrecognized Tailwind class `z-25` (defaults to `z-index: auto`).
- `src/app/api/game/route.ts:228`: Only looks for `body.payload`, while `PROJECT.md:99` specifies `{ action, roomCode, playerId, data }`.

---

## 2. Logic Chain

1. **Self-Certifying Test (Observation 1.1)**:
   - Test T4.4 checks an inline object literal that returns dummy values created inside the test file itself.
   - It provides zero verification that `src/lib/audioSynthesizer.ts` exports `sound` with working SFX methods.
   - Refactoring T4.4 to import `sound` from `src/lib/audioSynthesizer.ts` and testing method presence and safe execution validates the actual production code.

2. **Test Decoupling (Observation 1.2)**:
   - The test runner `scripts/run_e2e_tests.mjs` only executed against `gameShowEngine.mjs`.
   - Wiring `tests/stress/m1_stress_harness.ts` into the master test runner and aligning avatar IDs to `src/data/memeAvatars.tsx` ensures tests directly validate the real API routes and assets.

3. **Build & Typecheck Failure (Observation 1.3)**:
   - Next.js typecheck scans all `.ts` files, including `tests/stress/m1_stress_harness.ts`.
   - Fixing the `init` typing in `m1_stress_harness.ts:28` eliminates the single compilation error, restoring `npm run build` and `npx tsc --noEmit` to exit code 0.

4. **Route Fragility (Observation 1.4)**:
   - Unhandled exceptions in `route.ts` cause HTTP 500 crashes on missing/malformed payloads.
   - Wrapping `req.json()` in try/catch returning HTTP 400 and defensively extracting/validating `payload` parameters across all actions eliminates all 13 uncaught exceptions.

5. **Timestamp Collision (Observation 1.5)**:
   - Concurrent actions within the same millisecond have equal timestamps.
   - Adding a client-side `seenEventIds: Set<string>` and updating `lastTimestamp` to `Math.max` across the entire batch guarantees exact-once delivery for every concurrent event.

6. **React Dependency Storm (Observation 1.6)**:
   - Guarding the bot join sequence with `useRef(false)` and removing `state.players` from the dependency array prevents redundant join storms during 350ms polling cycles.

---

## 3. Caveats

- **No Source Code Modified**: Per the read-only explorer role and Hard Laws ("KHÔNG TỰ Ý SỬA CODE"), this agent made zero modifications to the source code or test files. Only reports and planning artifacts in `.agents/teamwork/explorer_m1_2/` were written.
- **Node.js Audio Context**: Web Audio API `AudioContext` is not present in pure Node.js environments. Testing `audioSynthesizer.ts` in Node.js validates interface contracts, method existence, and non-crashing defensive guards (`typeof window !== 'undefined'`).
- **No Circumvention**: The remediation plan directly fixes the root cause of every audit failure rather than disabling tests or bypassing typecheckers.

---

## 4. Conclusion & File-by-File Remediation Plan for worker_m1_2

Milestone 1 is currently in a recoverable state with solid underlying foundations. Below is the exact, file-by-file implementation plan for `worker_m1_2`.

---

### File 1: `tests/stress/m1_stress_harness.ts`
**Objective**: Fix TypeScript compilation error on line 28 so `npx tsc --noEmit` and `npm run build` pass cleanly.

**Changes**:
1. Line 19–29: Change `init: RequestInit` to `init: any`:
```typescript
function makePostRequest(body: any, rawBody?: string): NextRequest {
  const init: any = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };
  if (rawBody !== undefined) {
    init.body = rawBody;
  } else {
    init.body = JSON.stringify(body);
  }
  return new NextRequest('http://localhost:3000/api/game', init);
}
```
2. Verify line 223 retains `const bufferLen = data.events.length;` within scope.

---

### File 2: `src/app/api/game/route.ts`
**Objective**: Harden route handler against malformed JSON, missing bodies, null/undefined payloads, and non-string inputs; support `body.data` alias; prevent event drops on timestamp collision.

**Changes**:
1. Lines 197 (`GET` handler):
   Change:
   ```typescript
   const newEvents = room.recentEvents.filter((e) => e.timestamp >= since);
   ```
   (Using `>= since` allows clients with deduplication sets to receive all events occurring at the collision boundary).

2. Lines 226–236 (`POST` handler entry):
   Replace lines 226–229 with:
   ```typescript
   export async function POST(req: NextRequest) {
     let body: any;
     try {
       body = await req.json();
     } catch {
       return NextResponse.json(
         { success: false, error: 'Malformed or missing JSON payload' },
         { status: 400 }
       );
     }

     if (!body || typeof body !== 'object') {
       return NextResponse.json(
         { success: false, error: 'Request body must be a valid JSON object' },
         { status: 400 }
       );
     }

     const roomCode = typeof body.roomCode === 'string' && body.roomCode.trim() ? body.roomCode.trim() : 'MLN131';
     const action = typeof body.action === 'string' ? body.action : '';
     const rawPayload = body.payload !== undefined ? body.payload : body.data;
     const payload = (rawPayload && typeof rawPayload === 'object') ? rawPayload : {};

     const room = getOrCreateRoom(roomCode);
     room.lastActive = Date.now();

     const eventId = Math.random().toString(36).substring(2, 9);
     const timestamp = Date.now();
   ```

3. Action Handlers Hardening:
   - **`JOIN`** (Lines 237–267):
     ```typescript
     if (action === 'JOIN') {
       const { playerId, name, avatarId = 'keyboard_warrior', isBot = false } = payload;
       const cleanPlayerId = typeof playerId === 'string' && playerId.trim()
         ? playerId.trim()
         : (typeof playerId === 'number' ? String(playerId) : '');
       const cleanName = typeof name === 'string'
         ? name.trim()
         : (typeof name === 'number' ? String(name) : '');
       const cleanAvatar = typeof avatarId === 'string' && avatarId ? avatarId : 'keyboard_warrior';

       if (cleanPlayerId && cleanName) {
         if (!room.players[cleanPlayerId]) {
           room.players[cleanPlayerId] = {
             id: cleanPlayerId,
             name: cleanName,
             avatarId: cleanAvatar,
             score: 0,
             roundScores: {},
             connected: true,
             isBot: Boolean(isBot),
             lastActive: timestamp,
             streak: 0,
             r2Lives: 3,
           };
         } else {
           room.players[cleanPlayerId].name = cleanName;
           room.players[cleanPlayerId].avatarId = cleanAvatar;
           room.players[cleanPlayerId].connected = true;
           room.players[cleanPlayerId].lastActive = timestamp;
         }

         room.recentEvents.push({
           id: eventId,
           type: 'player_join',
           payload: room.players[cleanPlayerId],
           timestamp,
         });
       }
     }
     ```
   - **`SET_MODE`**:
     ```typescript
     else if (action === 'SET_MODE') {
       if (payload?.mode === 'TOURNAMENT' || payload?.mode === 'FREE_PLAY') {
         room.mode = payload.mode;
         room.recentEvents.push({
           id: eventId,
           type: 'mode_changed',
           payload: { mode: payload.mode },
           timestamp,
         });
       }
     }
     ```
   - **`SET_STATUS`**:
     ```typescript
     else if (action === 'SET_STATUS') {
       if (typeof payload?.status === 'string') {
         room.status = payload.status;
         room.recentEvents.push({
           id: eventId,
           type: 'status_changed',
           payload: { status: payload.status },
           timestamp,
         });
       }
     }
     ```
   - **`SUBMIT_ROAST`**:
     ```typescript
     else if (action === 'SUBMIT_ROAST') {
       const { playerId, text } = payload;
       if (playerId && text && typeof text === 'string') {
         room.round1State.submissions[playerId] = payload;
         room.recentEvents.push({
           id: eventId,
           type: 'roast_submitted',
           payload,
           timestamp,
         });
       }
     }
     ```
   - **`VOTE_ROAST`**:
     ```typescript
     else if (action === 'VOTE_ROAST') {
       const { duelId, choice, voterId } = payload;
       if (duelId && voterId) {
         const duel = room.round1State.duels.find((d) => d.id === duelId);
         if (duel) {
           if (choice === 'A' && !duel.votesA.includes(voterId)) {
             duel.votesA.push(voterId);
           } else if (choice === 'B' && !duel.votesB.includes(voterId)) {
             duel.votesB.push(voterId);
           }
         }
         room.recentEvents.push({
           id: eventId,
           type: 'vote_cast',
           payload,
           timestamp,
         });
       }
     }
     ```
   - **`MINIGAME_RESULT`**:
     ```typescript
     else if (action === 'MINIGAME_RESULT') {
       const { playerId, success, reactionTimeMs = 5000 } = payload;
       if (playerId && room.players[playerId]) {
         const isSuccess = Boolean(success);
         const currentLives = room.players[playerId].r2Lives ?? 3;
         const nextLives = isSuccess ? currentLives : Math.max(0, currentLives - 1);
         room.players[playerId].r2Lives = nextLives;

         if (isSuccess) {
           const bonus = Math.max(500, 2000 - (Number(reactionTimeMs) || 0));
           room.players[playerId].score += bonus;
           room.players[playerId].roundScores.ROUND_2 =
             (room.players[playerId].roundScores.ROUND_2 || 0) + bonus;
         }

         room.round2State.playerResults[playerId] = {
           success: isSuccess,
           reactionTimeMs: Number(reactionTimeMs) || 0,
           livesRemaining: nextLives,
         };
         room.recentEvents.push({
           id: eventId,
           type: 'minigame_done',
           payload,
           timestamp,
         });
       }
     }
     ```
   - **`VOTE_EXILE`**:
     ```typescript
     else if (action === 'VOTE_EXILE') {
       const { suspectPlayerId, voterId } = payload;
       if (voterId && suspectPlayerId) {
         room.round3State.votes[voterId] = suspectPlayerId;
         room.recentEvents.push({
           id: eventId,
           type: 'exile_voted',
           payload,
           timestamp,
         });
       }
     }
     ```
   - **`PLAY_CARD`**:
     ```typescript
     else if (action === 'PLAY_CARD') {
       const { cardType, targetPlayerId, fromPlayerId, fromPlayerName } = payload;
       if (cardType && fromPlayerId) {
         room.round4State.activeSabotages.push({
           id: eventId,
           fromPlayerId,
           fromPlayerName: fromPlayerName || 'Anonymous',
           targetPlayerId,
           cardType,
         });

         const target = room.players[targetPlayerId];
         if (target) {
           if (cardType === 'INK_SPLATTER') {
             target.r4Debuffs = {
               ...target.r4Debuffs,
               isBlindedByInk: true,
               inkWipesLeft: 6,
             };
           } else if (cardType === 'POINT_HEIST') {
             const stolen = Math.floor(target.score * 0.35);
             target.score = Math.max(0, target.score - stolen);
             const attacker = room.players[fromPlayerId];
             if (attacker) attacker.score += stolen;
           }
         }

         room.recentEvents.push({
           id: eventId,
           type: 'card_played',
           payload,
           timestamp,
         });
       }
     }
     ```
   - **`WIPE_INK`**:
     ```typescript
     else if (action === 'WIPE_INK') {
       const { playerId } = payload;
       if (playerId && room.players[playerId]) {
         const player = room.players[playerId];
         if (player && player.r4Debuffs?.inkWipesLeft) {
           player.r4Debuffs.inkWipesLeft -= 1;
           if (player.r4Debuffs.inkWipesLeft <= 0) {
             player.r4Debuffs.isBlindedByInk = false;
           }
         }
         room.recentEvents.push({
           id: eventId,
           type: 'ink_wiped',
           payload,
           timestamp,
         });
       }
     }
     ```
   - **`SUBMIT_TRIVIA`**:
     ```typescript
     else if (action === 'SUBMIT_TRIVIA') {
       const { questionIndex, optionIndex, timeMs, playerId } = payload;
       if (typeof questionIndex === 'number' && typeof optionIndex === 'number' && playerId && room.players[playerId]) {
         const player = room.players[playerId];
         const question = room.round4State.questions[questionIndex];
         if (question) {
           const isCorrect = optionIndex === question.correctAnswer;
           const multiplier = player.r4Debuffs?.multiplier || 1;
           const pts = isCorrect ? question.points * multiplier : 0;
           player.score += pts;
           player.roundScores.ROUND_4 = (player.roundScores.ROUND_4 || 0) + pts;

           room.round4State.playerAnswers[playerId] = {
             optionIndex,
             timeMs: Number(timeMs) || 0,
             isCorrect,
             pointsEarned: pts,
           };
         }
         room.recentEvents.push({
           id: eventId,
           type: 'trivia_submitted',
           payload,
           timestamp,
         });
       }
     }
     ```
   - **`HOST_UPDATE_STATE`**:
     ```typescript
     else if (action === 'HOST_UPDATE_STATE') {
       if (payload && typeof payload === 'object') {
         Object.assign(room, payload);
         room.recentEvents.push({
           id: eventId,
           type: 'state_patched',
           payload,
           timestamp,
         });
       }
     }
     ```
   - **`HOST_UPDATE`**:
     ```typescript
     else if (action === 'HOST_UPDATE') {
       if (typeof payload?.bossHp === 'number') room.bossHp = payload.bossHp;
       if (payload?.status) room.status = payload.status;
       if (typeof payload?.isStunned === 'boolean') room.isStunned = payload.isStunned;
       if (payload?.activeHazard !== undefined) room.activeHazard = payload.activeHazard;
       room.recentEvents.push({
         id: eventId,
         type: 'host_update',
         payload,
         timestamp,
       });
     }
     ```

---

### File 3: `src/lib/syncEngine.ts`
**Objective**: Fix timestamp collision invariant so events arriving in the same millisecond are never dropped.

**Changes**:
1. Class field addition:
   ```typescript
   export class RealtimeSyncEngine {
     private roomCode: string;
     private localChannel: BroadcastChannel | null = null;
     private lastTimestamp: number = 0;
     private pollingInterval: NodeJS.Timeout | null = null;
     private listeners: Map<string, Function[]> = new Map();
     private seenEventIds: Set<string> = new Set();
   ```
2. In `startPolling(isHost: boolean = false)`:
   Replace lines 89–96 with:
   ```typescript
   if (data.events && data.events.length > 0) {
     let maxTimestamp = this.lastTimestamp;
     data.events.forEach((evt: any) => {
       const eventId = evt.id || `${evt.timestamp}_${evt.type}`;
       if (!this.seenEventIds.has(eventId)) {
         this.seenEventIds.add(eventId);
         this.triggerLocal(evt.type, evt.payload);
       }
       if (typeof evt.timestamp === 'number' && evt.timestamp > maxTimestamp) {
         maxTimestamp = evt.timestamp;
       }
     });
     this.lastTimestamp = maxTimestamp;

     // Keep seenEventIds bounded to prevent memory growth
     if (this.seenEventIds.size > 1000) {
       const arr = Array.from(this.seenEventIds);
       this.seenEventIds = new Set(arr.slice(arr.length - 500));
     }
   }
   ```

---

### File 4: `src/components/DevBotSimulator.tsx`
**Objective**: Eliminate redundant bot join storm caused by React dependency on `state.players`.

**Changes**:
1. Add ref at top of component:
   ```typescript
   const hasInitializedBots = useRef(false);
   ```
2. Replace effect 1 (lines 82–100) with:
   ```typescript
   useEffect(() => {
     if (!isSimulating) {
       hasInitializedBots.current = false;
       return;
     }

     if (hasInitializedBots.current) return;
     hasInitializedBots.current = true;

     const currentPlayers = state.players || {};
     const remainingBots = VIETNAMESE_STUDENTS.slice(0, 15);
     const timeouts: NodeJS.Timeout[] = [];

     remainingBots.forEach((bot, index) => {
       const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
       if (!currentPlayers[botId]) {
         const t = setTimeout(() => {
           sync.joinRoom(botId, bot.name, bot.avatarId, true);
         }, index * 120);
         timeouts.push(t);
       }
     });

     return () => {
       timeouts.forEach(clearTimeout);
     };
   }, [isSimulating]);
   ```

---

### File 5: `tests/suites/tier4_real_world.mjs`
**Objective**: Fix Prohibited Pattern #4 by eliminating the inline dummy `audioMethods` object and genuinely testing `src/lib/audioSynthesizer.ts`.

**Changes**:
1. At top of `tests/suites/tier4_real_world.mjs`, import real `sound`:
   ```javascript
   import { sound } from '../../src/lib/audioSynthesizer.ts';
   ```
2. Replace test T4.4 (lines 72–103) with:
   ```javascript
   testCtx.test('T4.4 - Procedural Audio Synthesizer Interface Contract Verification', () => {
     // Verify required procedural SFX methods defined in PROJECT.md
     const requiredSfx = [
       'playTrollHorn',
       'playApplause',
       'playCountdownTick',
       'playSplat',
       'playCorrectChime',
       'playWrongBuzz',
       'playSabotageStab',
       'playVictoryFanfare',
       'startPartyBGM'
     ];

     assert.ok(sound, 'sound instance must be exported from audioSynthesizer.ts');
     for (const sfx of requiredSfx) {
       assert.equal(
         typeof sound[sfx],
         'function',
         `SoundSynthesizer must implement ${sfx}() method`
       );
     }

     // Verify safe execution in Node.js (AudioContext is undefined in Node, methods must safely guard without throwing)
     assert.doesNotThrow(() => {
       sound.playTrollHorn();
       sound.playApplause();
       sound.playCountdownTick();
       sound.playSplat();
       sound.playCorrectChime();
       sound.playWrongBuzz();
       sound.playSabotageStab();
       sound.playVictoryFanfare();
     });
   });
   ```

---

### File 6: `tests/fixtures/mockData.mjs` & `tests/suites/tier1_features.mjs` & `tests/lib/gameShowEngine.mjs`
**Objective**: Align test avatar fixtures to genuine avatar IDs in `src/data/memeAvatars.tsx`.

**Changes**:
1. In `tests/fixtures/mockData.mjs`:
   Replace lines 3–14 (`MOCK_AVATARS`) with:
   ```javascript
   export const MOCK_AVATARS = [
     { id: 'keyboard_warrior', name: 'Anh Hùng Bàn Phím', title: 'Chiến Thần Gõ Phím', color: '#EF233C', icon: '⌨️' },
     { id: 'grammar_police', name: 'Cảnh Sát Chính Tả', title: 'Soi Từng Dấu Phẩy', color: '#06D6A0', icon: '🔍' },
     { id: 'var_inspector', name: 'Thanh Tra Check VAR', title: 'Kính Lúp Công Lý', color: '#118AB2', icon: '🔎' },
     { id: 'anti_scam_otter', name: 'Rái Cá Chống Lừa Đảo', title: 'Tỉnh Táo Nhất Xóm', color: '#FFD166', icon: '🦦' },
     { id: 'zen_monk', name: 'Sư Phụ Tu Tâm', title: 'Tâm Bất Biến', color: '#7209B7', icon: '🧘' },
     { id: 'chicken_feeder', name: 'Seeder Lùa Gà', title: 'Chuyên Gia Thổi Giá', color: '#F72585', icon: '🐔' },
     { id: 'phd_student', name: 'Học Giả Bách Khoa', title: 'Luận Văn 300 Trang', color: '#3A0CA3', icon: '☕' },
     { id: 'genz_slang_queen', name: 'Chiến Thần Tóp Tóp', title: 'Nữ Hoàng Xu Hướng', color: '#4CC9F0', icon: '🧋' },
     { id: 'conspiracy_theorist', name: 'Thánh Thuyết Âm Mưu', title: 'Mọi Thứ Đều Được Sắp Đặt', color: '#4361EE', icon: '🛸' },
     { id: 'righteous_netizen', name: 'Dân Mạng Lương Thiện', title: 'Ngọn Hải Đăng Công Lý', color: '#FFB703', icon: '✨' },
   ];
   ```
2. In `tests/suites/tier1_features.mjs:28,32`:
   Replace `'cu_vo'` with `'keyboard_warrior'`.
3. In `tests/lib/gameShowEngine.mjs:91`:
   Replace default avatar `'cu_vo'` with `'keyboard_warrior'`.

---

### File 7: `scripts/run_e2e_tests.mjs` & `package.json`
**Objective**: Connect empirical route testing and enable TypeScript imports in the master test runner.

**Changes**:
1. In `package.json`:
   Update `"test"` script:
   ```json
   "test": "npx tsx scripts/run_e2e_tests.mjs"
   ```
2. In `scripts/run_e2e_tests.mjs`:
   Import and run stress tests:
   ```javascript
   import { runAllStressTests } from '../tests/stress/m1_stress_harness.ts';
   ```
   Execute within `runAll()`:
   ```javascript
   const stressResults = await runAllStressTests();
   if (stressResults.failed > 0) {
     this.failedTests += stressResults.failed;
   }
   ```
   This ensures `npm test` directly runs both unit/logic scenarios and live API route handler verification.

---

### File 8: `src/app/host/page.tsx`
**Objective**: Fix unmapped Tailwind class `z-25`.

**Change**:
- Line 365: Replace `z-25` with `z-[25]`:
  ```tsx
  <div className="absolute inset-0 pointer-events-none z-[25] overflow-hidden">
  ```

---

## 5. Verification Method

Once `worker_m1_2` applies the above changes, independently verify the remediation using these exact terminal commands:

1. **Verify TypeScript compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Output*: Exit code `0` with zero diagnostic errors.

2. **Verify Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Expected Output*: Exit code `0`, `Compiled successfully`, all 5 routes generated.

3. **Verify Empirical Stress & Robustness Suite**:
   ```bash
   npx tsx tests/stress/m1_stress_harness.ts
   ```
   *Expected Output*: Exit code `0`, `Total: 23 | Passed: 23 | Failed: 0`. All 13 malformed payload variations handled gracefully without unhandled exceptions.

4. **Verify Master E2E Test Suite**:
   ```bash
   npm test
   ```
   *Expected Output*: Exit code `0`, 100% pass rate. Test T4.4 genuinely verifies `src/lib/audioSynthesizer.ts` without mock objects.

5. **Verify No Integrity Violations**:
   - Inspect `tests/suites/tier4_real_world.mjs` lines 72–103: confirm `audioMethods` mock dictionary is completely gone.
   - Inspect `tests/fixtures/mockData.mjs`: confirm avatar IDs match `src/data/memeAvatars.tsx`.
