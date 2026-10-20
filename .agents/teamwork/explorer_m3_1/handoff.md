# Architectural Blueprint & Handoff Report: Milestone 3 — "Round 2: Chiến Binh 5 Giây Dị Hợm"

**Author**: `explorer_m3_1`  
**Target Milestone**: Milestone 3 (WarioWare 5s Reflex Micro-Game Engine)  
**Parent Agent**: `45f106cf-224a-4102-aeee-b56815847bc0`  
**Timestamp**: 2026-10-19T13:36:00Z  

---

## 1. Observation

### 1.1 Existing Codebase & Architecture
- **Master Project Rules & Architecture**:
  - `ORIGINAL_REQUEST.md` (lines 27-29, 65-81): Mandates Round 2 as "Chiến Binh 5 Giây Dị Hợm" (WarioWare / Dumb Ways to Die style) with at least 4 micro-games (Tóm nút Report, Lắc OTP, Né gạch đá drama, Soi điểm ảnh Deepfake) with intense 5-second countdown, comic explosion effects on failure, 3 lives, and standalone mode selection in the Party Game Hub with an explicit "Quay Về Sảnh Chính (Return to Hub)" button preserving cumulative scores.
  - `PROJECT.md` (lines 54-60, 79): Milestone 3 covers features 18-24 (Universal 5s timer, 4 micro-games, 3 lives, explosion feedback, Dev Bot simulation).
  - Framework: Next.js 14 App Router (TypeScript, Tailwind CSS, Lucide icons, Canvas Confetti).
  - Sync architecture: Dual-channel hybrid (`BroadcastChannel` for 0ms local tabs + HTTP delta polling `/api/game` at 350ms for Host and 700ms for Mobile clients).

### 1.2 Status of Relevant Files in `src/`
- **`src/lib/types.ts`** (lines 94-132, 268):
  - Currently contains basic definitions:
    ```ts
    export type Round2Phase = 'MICRO_INTRO' | 'MICRO_PLAYING' | 'MICRO_RESULT' | 'ROUND_SUMMARY';
    export type MiniGameType = 'CATCH_REPORT' | 'SHAKE_OTP' | 'DODGE_BRICKS' | 'SPOT_DEEPFAKE';
    export interface MiniGameConfig {
      type: MiniGameType;
      title: string;
      instruction: string;
      timeLimitSec: number;
      data?: any;
    }
    export interface Round2State {
      phase: Round2Phase;
      currentGameIndex: number;
      activeGame: MiniGameConfig;
      gamesList: MiniGameConfig[];
      survivorIds: string[];
      playerResults: Record<string, { success: boolean; reactionTimeMs: number; livesRemaining: number; }>;
    }
    ```
  - Player interface (line 36) has `r2Lives?: number` (default 3 lives).
  - Lacks concrete payload typing for each of the 4 micro-games and unified alias for stage phases (`'INTRO' | 'PLAYING' | 'RESULT' | 'ROUND_OVER'`).

- **`src/app/api/game/route.ts`** (lines 39-78, 374-402, 519-534):
  - Lines 39-78: `createInitialRound2State()` generates initial list of 4 games (`CATCH_REPORT`, `SHAKE_OTP`, `DODGE_BRICKS`, `SPOT_DEEPFAKE`).
  - Lines 374-402: Handles `action === 'MINIGAME_RESULT'`:
    - Reads `{ playerId, success, reactionTimeMs }`.
    - Updates player's `r2Lives` (decrements on fail: `nextLives = isSuccess ? currentLives : Math.max(0, currentLives - 1)`).
    - Calculates bonus score on success: `bonus = Math.max(500, 2000 - reactionTimeMs)`.
    - Updates `room.round2State.playerResults[playerId]` and emits `minigame_done` event.
  - Lines 298-307: `action === 'SET_STATUS'` updates `room.status` and emits `status_changed` **without** resetting player scores or round scores.

- **`src/lib/syncEngine.ts`** (lines 206-212):
  - Provides `sync.submitMinigameResult(success, reactionTimeMs, playerId)` which sends `MINIGAME_RESULT` over BroadcastChannel and HTTP POST.
  - Provides `sync.setGameStatus(status)` and `sync.hostUpdateState(patch)`.

- **`src/lib/audioSynthesizer.ts`** (lines 143-167, 222-281, 328-366, 533-554):
  - `sound.playCountdownTick(isUrgent)`: Ascending woodblock/sawtooth tick.
  - `sound.playExplosion(heavy)`: Punchy low-frequency triangle boom for comic failures.
  - `sound.playWrongBuzz()`: Dissonant buzzer.
  - `sound.playCorrectChime()`: 4-bell harmonic chime.
  - `sound.playVictoryFanfare()`: Brass fanfare.
  - `sound.playSplat()`: Squishy tomato / brick hit sound.

- **`src/app/host/page.tsx`** (lines 390-431):
  - Currently contains a placeholder for `status === 'ROUND_2'` with static text and mock countdown.
  - Needs to mount the real `<Round2Host />`.

- **`src/app/play/page.tsx`** (lines 366-405):
  - Currently renders `Round1Play` when `status === 'ROUND_1'`, but falls back to a generic waiting card when `status === 'ROUND_2'`.
  - Needs to mount `<Round2Play />`.

- **`src/components/DevBotSimulator.tsx`** (lines 227-251):
  - Has a basic Round 2 simulation block:
    ```tsx
    if (phase === 'MICRO_PLAYING') {
      VIETNAMESE_STUDENTS.forEach((bot) => {
        const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
        const isSuccess = Math.random() < 0.78;
        const reactionTime = Math.floor(Math.random() * 2800 + 1200);
        setTimeout(() => { sync.submitMinigameResult(isSuccess, reactionTime, botId); }, reactionTime);
      });
    }
    ```
  - Needs enhancement to support both `'PLAYING'` and `'MICRO_PLAYING'`, handle eliminated bot logic, and respect speed profile.

- **Test Suite Verification**:
  - `npm test` executed cleanly: **65/65 passed (100%)**.
  - `npx tsc --noEmit` executed cleanly: **0 errors**.

---

## 2. Logic Chain

1. **Phase Machine Alignment**:
   - The original request and dispatch specify four distinct stages for each 5-second micro-game:
     - `INTRO`: Comic announcement title card (2.5s) stating the game's urgent directive ("TÚM LẤY NÚT BÁO CÁO!", "LẮC LẤY MÃ OTP!", "NÉ GẠCH ĐÁ DRAMA!", "BÓC MẼ DEEPFAKE!").
     - `PLAYING`: 5.0-second countdown with accelerating ticks, active student interaction, live survival grid.
     - `RESULT`: 3.0s outcome reveal showing pass/fail badges, comic explosions on losing players, life decrements.
     - `ROUND_OVER`: End-of-round survival podium after all 4 games finish (or when all players eliminated), celebrating survivors with 3 lives and displaying "Quay Về Sảnh Chính".
   - Supporting union type in `src/lib/types.ts`:
     `export type Round2Phase = 'INTRO' | 'PLAYING' | 'RESULT' | 'ROUND_OVER' | 'MICRO_INTRO' | 'MICRO_PLAYING' | 'MICRO_RESULT' | 'ROUND_SUMMARY';` preserves 100% backward compatibility with `route.ts` and existing tests.

2. **Host Projector View Design (`Round2Host.tsx`)**:
   - **16:9 Viewport**: Uses standard classroom projector aspect ratio with Neo-Brutalist visual tokens (4px black borders, hard drop shadows, cyber yellow/emerald/crimson palette).
   - **Master 5.0-Second Timer**: Managed by the Host via `requestAnimationFrame` or 100ms interval for precision; renders a smooth countdown progress bar that transitions from Cyber Cyan (`#06D6A0`) to Cyber Yellow (`#FFD166`) to pulsing Crimson (`#EF233C`) under 1.5s.
   - **Accelerating Audio Ticks**: `sound.playCountdownTick(false)` every second initially, switching to `sound.playCountdownTick(true)` every 250ms when `remaining <= 2.0s`.
   - **Live 40-50 Player Survival Grid**: Displays every player's avatar SVG, name, bot badge, 3-life hearts (`❤️❤️❤️` -> `💀`), and real-time pass/fail status badge.
   - **Failures & Explosions**: When a player fails, trigger `sound.playExplosion()` and a CSS comic explosion pop `💥` on their card. If a player reaches 0 lives, they switch to `💀 ĐÃ BỊ LOẠI (CỔ VŨ)`.
   - **Navigation & Hub Return**: Top bar and summary screen feature a prominent **"Quay Về Sảnh Chính (Return to Hub)"** button calling `sync.setGameStatus('LOBBY')` which retains all player scores.

3. **Mobile Controller Design (`Round2Play.tsx`)**:
   - **100dvh 1-Finger Ergonomics**: Mobile viewport locked, thumb-zone optimized.
   - **3-Heart Life Meter**: Top header displays current remaining lives (default 3).
   - **Spectator / Cheer Mode**: When `lives === 0`, screen transitions to Spectator mode ("Bạn đã thành Ma Mạng 👻"), providing a Danmaku cheer reaction pad so eliminated students stay engaged.
   - **Micro-Game Implementations**:
     - **Game 1: Catch Report**: Phishing card with moving "Báo Cáo Vi Phạm" button jumping coordinates `(x%, y%)` every 600-800ms, plus 3 decoy buttons ("Nhận thưởng 50tr", "Đóng", "Chia sẻ"). Tapping the real button passes; tapping a decoy fails.
     - **Game 2: Shake for OTP**: Listens to `window.DeviceMotion` with an acceleration threshold > 15 m/s² for 5 shakes, AND provides an on-screen **"HOẶC CHẠM LIÊN TỤC 10 LẦN"** button with a live tap-counter progress ring as a robust fallback.
     - **Game 3: Dodge Drama Bricks**: 2D touch-drag canvas / container where the student drags their avatar horizontally at bottom to dodge falling toxic comments / bricks (`🧱`, `💬`, `🍅`, `⚠️`) for 5 seconds.
     - **Game 4: Spot Deepfake Glitch**: Deepfake AI scammer portrait with a visible anomaly (e.g. 6 fingers / distorted ear / cyber glitch). Touch listener checks if tap distance to glitch hotspot `(x, y)` is within target radius.
   - **Haptic & Audio Feedback**: Vibration `navigator.vibrate([100, 50, 100])` on failure; green check + `sound.playCorrectChime()` on pass.
   - **Realtime Sync**: Submits immediately via `sync.submitMinigameResult(success, reactionTimeMs, playerId)`.

4. **Bot Simulation (`DevBotSimulator.tsx`)**:
   - Bots simulate responses during `PLAYING` phase with randomized reaction times between 1.2s and 4.8s.
   - Success probability is calibrated to ~75% (customizable by speed profile: FAST 85%, REALISTIC 75%, CHAOTIC 60%).
   - Eliminated bots (`r2Lives <= 0`) are excluded from submitting results and instead fire Danmaku cheer emojis.

---

## 3. Caveats

1. **Browser Sensor Permissions (DeviceMotion on iOS 13+)**:
   - iOS Safari requires explicit user permission via `DeviceMotionEvent.requestPermission()` before receiving accelerometer events. If permission is denied or running on desktop/Android without motion, the **10-Tap Mash Fallback** ensures 100% gameplay availability without blocking or erroring.
2. **Web Audio Autoplay Policy**:
   - Web Audio context requires an initial user interaction (click/touch) before playing procedural audio. The Host page already implements an interaction overlay / click-to-start pattern, and sound methods safely check `this.ctx.state === 'suspended' && this.ctx.resume()`.
3. **Timer Drift across Devices**:
   - In classroom projection games, local timers on mobile devices can have minor millisecond drift. The mobile micro-game runs its local 5.0-second countdown independently and submits elapsed reaction time to the server. The Host projector's master countdown drives the authoritative phase progression.

---

## 4. Conclusion & Complete Implementation Blueprint

### File 1: `src/lib/types.ts`
Enhance Round 2 types with explicit payloads and unified phase types:

```typescript
// ==========================================
// 4. Round 2: Chiến Binh 5 Giây Dị Hợm (WarioWare-style)
// ==========================================
export type Round2Phase =
  | 'INTRO'
  | 'PLAYING'
  | 'RESULT'
  | 'ROUND_OVER'
  | 'MICRO_INTRO'
  | 'MICRO_PLAYING'
  | 'MICRO_RESULT'
  | 'ROUND_SUMMARY';

export type MiniGameType =
  | 'CATCH_REPORT'
  | 'SHAKE_OTP'
  | 'DODGE_BRICKS'
  | 'SPOT_DEEPFAKE';

export interface CatchReportPayload {
  postAuthor: string;
  postContent: string;
  decoys: string[];
}

export interface ShakeOtpPayload {
  otpCode: string;
  targetShakes: number;
  targetTaps: number;
}

export interface DodgeBricksPayload {
  hazardTypes: Array<{ icon: string; label: string; speed: number }>;
  spawnRateMs: number;
}

export interface SpotDeepfakePayload {
  glitchLabel: string;
  glitchHint: string;
  hotspot: { x: number; y: number; radius: number }; // normalized percent (0-100)
}

export interface MiniGameConfig {
  id?: string;
  type: MiniGameType;
  title: string;
  instruction: string;
  timeLimitSec: number;
  data?: CatchReportPayload | ShakeOtpPayload | DodgeBricksPayload | SpotDeepfakePayload | any;
}

export interface Round2State {
  phase: Round2Phase;
  currentGameIndex: number;
  activeGame: MiniGameConfig;
  gamesList: MiniGameConfig[];
  survivorIds: string[];
  lives?: Record<string, number>; // playerId -> remaining lives (0 to 3)
  playerResults: Record<
    string,
    {
      success: boolean;
      reactionTimeMs: number;
      livesRemaining: number;
    }
  >;
}
```

---

### File 2: `src/components/Round2Host.tsx` (New Component)
Full blueprint for the 16:9 Projector View:
- **Props**:
  ```typescript
  interface Round2HostProps {
    state: GameShowState;
    onReturnToHub: () => void;
    onAdvanceToRound3?: () => void;
  }
  ```
- **Internal State & Constants**:
  - `4 Pre-configured Micro-Games`:
    1. `CATCH_REPORT`: Title "TÚM LẤY NÚT BÁO CÁO!", Directive "Nút Report đang trốn chạy giữa rừng tin giả! Bấm trúng trước khi hết 5 giây!", Icon "🛑"
    2. `SHAKE_OTP`: Title "LẮC LẤY MÃ OTP!", Directive "Kẻ gian đang hack tài khoản! Lắc mạnh điện thoại hoặc bấm 10 lần để lấy OTP!", Icon "⚡"
    3. `DODGE_BRICKS`: Title "NÉ GẠCH ĐÁ DRAMA!", Directive "Bão comment toxic và gạch đá đang rơi! Kéo nhân vật né hết trong 5 giây!", Icon "🧱"
    4. `SPOT_DEEPFAKE`: Title "BÓC MẼ DEEPFAKE!", Directive "Ảnh video call lừa đảo AI có điểm dị thường! Chạm vào điểm lỗi ngay!", Icon "👁️"
  - `phase`: `'INTRO'` (2.5s) -> `'PLAYING'` (5.0s) -> `'RESULT'` (3.5s) -> Next Game -> `'ROUND_OVER'`.
  - `timerSec`: Remaining seconds (5.0 -> 0.0), decremented via interval (50ms).
  - Audio triggers on ticks:
    ```typescript
    if (timerSec <= 2.0 && timerSec > 0) {
      sound.playCountdownTick(true); // Urgent saw wave
    } else if (timerSec > 2.0 && Math.floor(timerSec * 10) % 10 === 0) {
      sound.playCountdownTick(false);
    }
    ```
- **Phase 1: INTRO Stage Render**:
  - Dramatic full-screen comic banner with vibrating title, game directive, cartoon icon, and 3-2-1 countdown ring.
- **Phase 2: PLAYING Stage Render**:
  - Top master countdown bar: width `${(timerSec / 5) * 100}%`, color transitioning from green to yellow to red.
  - Center: Micro-game preview simulation display.
  - Bottom: Live 40-50 player survival grid.
    - Each player box renders Avatar SVG, Name, Bot badge, 3 Hearts `❤️❤️❤️`.
    - Live pass indicators:
      - Submitted and success: Green border, checkmark, "+X pts".
      - Failed or eliminated: Flashing red, explosion indicator.
- **Phase 3: RESULT Stage Render**:
  - Sound: `sound.playExplosion()` for students who lost a life.
  - Reveals total survivors vs eliminated in this micro-game.
  - Buttons: "Tiếp Tục Game Tiếp Theo" or auto-advances after 3.5s.
- **Phase 4: ROUND_OVER Stage (Grand Survival Podium)**:
  - Victory fanfare: `sound.playVictoryFanfare()`.
  - Confetti blast: `confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })`.
  - Survival Hall of Fame: Lists players who survived with 3/3 lives intact ("Chiến Thần Bất Tử 5 Giây").
  - Leaderboard: Ranked by `roundScores.ROUND_2` and cumulative total.
  - Buttons:
    - **"Quay Về Sảnh Chính (Return to Hub)"** (`onReturnToHub`) -> calls `sync.setGameStatus('LOBBY')` with scores preserved.
    - "Chơi Lại Vòng 2" -> restarts Round 2 with fresh lives.
    - "Sang Vòng 3: Vạch Mặt Seeder" -> `onAdvanceToRound3()`.

---

### File 3: `src/components/Round2Play.tsx` (New Component)
Full blueprint for the 100dvh Mobile Controller:
- **Props**:
  ```typescript
  interface Round2PlayProps {
    state: Partial<GameShowState>;
    playerId: string;
    playerName: string;
    avatarId: string;
  }
  ```
- **Header**:
  - Player info, room code, remaining lives (3 hearts: `❤️❤️❤️` -> `❤️🤍🤍` -> `💀`).
- **Spectator Mode (When `lives === 0`)**:
  - Renders Ghost / Spectator screen: "BẠN ĐÃ HẾT MẠNG VÀ THÀNH MA MẠNG 👻".
  - Renders 6-button Danmaku cheering pad (`🔥`, `👏`, `👻`, `💀`, `🍿`, `🎦`) so eliminated students can actively cheer and spam reactions to the projector.
- **Sub-Game 1: CATCH_REPORT**:
  - Phishing post container:
    - Fake scam text: "Tài khoản Zalo nhận 50.000.000đ từ Quỹ Hỗ Trợ Sinh Viên!".
    - Real "BÁO CÁO VI PHẠM (REPORT)" button that moves to a new `(top%, left%)` whenever tapped or approached, with random evasive animation.
    - 3 decoy buttons: "NHẬN TIỀN NGAY 💸", "ĐÓNG QUẢNG CÁO ❌", "CHIA SẺ CHO BẠN BÈ 👥".
    - Clicking real button: triggers pass `handleSubmitResult(true)`. Clicking decoy: triggers fail `handleSubmitResult(false)`.
- **Sub-Game 2: SHAKE_OTP**:
  - Headline: "LẮC ĐIỆN THOẠI LẤY MÃ OTP 2FA!".
  - Hook into `devicemotion`:
    ```typescript
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + (acc.z || 0)**2);
      if (mag > 18 && Date.now() - lastShake.current > 250) {
        lastShake.current = Date.now();
        setShakeCount(prev => prev + 1);
        if ('vibrate' in navigator) navigator.vibrate(20);
      }
    };
    ```
  - Tap-Mash Fallback:
    - Giant circular mash button: "HOẶC CHẠM LIÊN TỤC 10 LẦN!".
    - Shows progress ring: `taps / 10`.
    - When `shakes >= 5 || taps >= 10`: Success! Unlocks OTP "892-131" and passes.
- **Sub-Game 3: DODGE_BRICKS**:
  - Container arena with touch-drag controller.
  - Student avatar moves with touch horizontally: `avatarX = touch.clientX`.
  - 4 falling hazards spawn from top with random X positions:
    - `🧱 Gạch toxic`, `💬 Comment rác`, `🍅 Cà chua`, `⚠️ Tin lừa đảo`.
  - Game loop checks collision between avatar rect and falling hazard rects.
  - If collision occurs: `sound.playSplat()`, `handleSubmitResult(false)`.
  - If survives 5.0 seconds without hit: `handleSubmitResult(true)`.
- **Sub-Game 4: SPOT_DEEPFAKE**:
  - Visual AI portrait card: Scammer holding an ID card with an anomalous 6th finger or glitch scanline.
  - Target hotspot: `x: 72%, y: 64%, radius: 18%`.
  - Touch handler calculates distance from touch point to hotspot:
    ```typescript
    const dist = Math.hypot(touchX - targetX, touchY - targetY);
    if (dist <= radius) {
      // Correct!
      setFoundGlitch(true);
      handleSubmitResult(true);
    }
    ```
- **Pass/Fail Feedback Overlays**:
  - Green checkmark + chime on pass.
  - Red screen shake + explosion + `navigator.vibrate(200)` on failure.
  - Dispatches `sync.submitMinigameResult(success, reactionTime, playerId)`.

---

### File 4: `src/components/DevBotSimulator.tsx`
Update Round 2 bot simulation block:
```typescript
// 4. ROUND 2: 5S MICRO-GAMES AUTOMATION
useEffect(() => {
  if (!isSimulating || state.status !== 'ROUND_2') return;

  const phase = state.round2State?.phase;
  const gameIdx = state.round2State?.currentGameIndex ?? 0;

  // Trigger when in active playing phase
  if (phase === 'MICRO_PLAYING' || phase === 'PLAYING') {
    const key = `r2_game_${gameIdx}`;
    if (!simulatedMiniGameTrack.current[key]) {
      simulatedMiniGameTrack.current[key] = true;

      VIETNAMESE_STUDENTS.forEach((bot) => {
        const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
        const botPlayer = state.players?.[botId];
        
        // Skip bots that are already eliminated
        if (botPlayer && botPlayer.r2Lives !== undefined && botPlayer.r2Lives <= 0) {
          // Dead bot fires random cheer Danmaku instead
          setTimeout(() => {
            sync.sendDanmaku('👻', 'Cố lên anh em ơi!', bot.name, bot.avatarId);
          }, Math.random() * 3000 + 1000);
          return;
        }

        // Survival probability: 75% realistic, 85% fast, 60% chaotic
        const successRate = speedProfile === 'FAST' ? 0.85 : speedProfile === 'CHAOTIC' ? 0.60 : 0.75;
        const isSuccess = Math.random() < successRate;

        // Reaction delay between 1.2s and 4.8s
        const reactionTime = Math.floor(Math.random() * 3600 + 1200);

        setTimeout(() => {
          sync.submitMinigameResult(isSuccess, reactionTime, botId);
        }, reactionTime);
      });
    }
  }
}, [isSimulating, state.status, state.round2State, state.players, speedProfile]);
```

---

### File 5: Integration (`HostLobby.tsx`, `host/page.tsx`, `play/page.tsx`)
1. **`src/app/host/page.tsx`**:
   - Import `Round2Host from '../../components/Round2Host';`
   - Replace lines 390-432 with:
     ```tsx
     {gameState.status === 'ROUND_2' && (
       <Round2Host
         state={gameState}
         onReturnToHub={handleResetGame}
         onAdvanceToRound3={() => handleStartRound('ROUND_3')}
       />
     )}
     ```
2. **`src/app/play/page.tsx`**:
   - Import `Round2Play from '../../components/Round2Play';`
   - In dynamic view section:
     ```tsx
     {gameState.status === 'ROUND_1' ? (
       <Round1Play state={gameState} playerId={playerId} playerName={playerName} avatarId={selectedAvatarId} />
     ) : gameState.status === 'ROUND_2' ? (
       <Round2Play state={gameState} playerId={playerId} playerName={playerName} avatarId={selectedAvatarId} />
     ) : (
       /* Default lobby & round 3/4 placeholder */
     )}
     ```

---

## 5. Verification Method

To independently verify the implementation:

1. **Static Typecheck**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected outcome*: Exits with code 0 and zero TypeScript errors across all interfaces and components.

2. **Master Automated Test Suite**:
   ```powershell
   npm test
   ```
   *Expected outcome*: All existing test suites (Tiers 1-6) pass 100%.

3. **Round 2 Invariant Verification Tests**:
   Verify the following invariants in `tests/suites/`:
   - All 4 micro-games (`CATCH_REPORT`, `SHAKE_OTP`, `DODGE_BRICKS`, `SPOT_DEEPFAKE`) initialize properly with 5000ms duration and 3 player lives.
   - Faster response yields higher bonus points: `Math.max(500, 2000 - reactionTimeMs)`.
   - Player life decrements on failure and hits elimination at 0 lives without crashing.
   - Returning to Hub (`SET_STATUS: 'LOBBY'`) preserves cumulative scores.
   - DeviceMotion fallback tap-mash succeeds at 10 taps.

4. **Invalidation Conditions**:
   - Any compile failure or missing import.
   - Timer failing to count down or tick.
   - Eliminated players continuing to play after 0 lives.
   - Return-to-Hub clearing player points when transitioning back to `LOBBY`.
