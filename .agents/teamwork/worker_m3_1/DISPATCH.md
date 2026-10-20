# DISPATCH: worker_m3_1 — Milestone 3 Implementation

## 2026-10-19T13:37:25Z

## Assignment
You are `worker_m3_1`.
Your working directory: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m3_1`
Project root: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`
Parent conversation ID: `45f106cf-224a-4102-aeee-b56815847bc0`

## Mandatory Documents to Read
1. `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md` (read both Initial Request and Follow-up for the Party Game Hub architecture)
2. `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md`
3. Architectural Blueprint: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m3_1\handoff.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Scope of Work — Milestone 3 ("Round 2: Chiến Binh 5 Giây Dị Hợm")
Implement the genuine, complete Round 2 WarioWare micro-game engine according to `explorer_m3_1/handoff.md`:

1. `src/lib/types.ts`:
   - Enhance `Round2Phase` to support `'INTRO' | 'PLAYING' | 'RESULT' | 'ROUND_OVER' | 'MICRO_INTRO' | 'MICRO_PLAYING' | 'MICRO_RESULT' | 'ROUND_SUMMARY'`.
   - Define concrete payloads: `CatchReportPayload`, `ShakeOtpPayload`, `DodgeBricksPayload`, `SpotDeepfakePayload`.
   - Update `MiniGameConfig` and `Round2State` (with `lives?: Record<string, number>`).

2. `src/components/Round2Host.tsx` (New Component):
   - 16:9 Projector view with WarioWare comic neo-brutalist styling.
   - Master 5.0-second countdown bar with accelerating tick audio (`sound.playCountdownTick(false)` initially, switching to `sound.playCountdownTick(true)` when remaining <= 2.0s).
   - Micro-game announcement cards:
     * CATCH_REPORT: "TÚM LẤY NÚT BÁO CÁO!"
     * SHAKE_OTP: "LẮC LẤY MÃ OTP!"
     * DODGE_BRICKS: "NÉ GẠCH ĐÁ DRAMA!"
     * SPOT_DEEPFAKE: "BÓC MẼ DEEPFAKE!"
   - Live 40-50 player survival grid displaying avatar SVGs, remaining lives (❤️❤️❤️ -> 💀), real-time pass/fail indicators.
   - Failures: comic explosion sound `sound.playExplosion()` and visual `💥` on eliminated/failing players.
   - Podium & summary screen celebrating survivors with victory fanfare `sound.playVictoryFanfare()`.
   - Prominent **"Quay Về Sảnh Chính (Return to Hub)"** button calling `onReturnToHub()` (transitioning to `LOBBY` with scores preserved).

3. `src/components/Round2Play.tsx` (New Component):
   - 100dvh 1-finger mobile controller hosting the 4 reflex micro-games:
     * Game 1: **Catch Report**: Evasive "Báo Cáo Vi Phạm" button jumping coordinates when tapped/approached + 3 decoy scam buttons. Tap real button to pass.
     * Game 2: **Shake for OTP**: `devicemotion` sensor shake detection + 10-tap mash fallback button with progress ring.
     * Game 3: **Dodge Drama Bricks**: 2D touch-drag canvas dodging falling toxic comments/bricks (`🧱`, `💬`, `🍅`, `⚠️`) for 5 seconds.
     * Game 4: **Spot Deepfake Glitch**: AI scam face/portrait with glitch hotspot; tap within target radius to expose deepfake.
   - 3-Heart Life Meter (`❤️❤️❤️`).
   - Spectator mode when `lives === 0` ("Bạn đã thành Ma Mạng 👻") with Danmaku cheering pad (`🔥`, `👏`, `👻`, `💀`, `🍿`, `🎦`).
   - Instant feedback: Green check + chime on pass; red screen shake + explosion + vibration `navigator.vibrate(200)` on failure.
   - Submits result via `sync.submitMinigameResult(success, reactionTime, playerId)`.

4. `src/components/DevBotSimulator.tsx`:
   - Automate Round 2 bot simulation: bots submit results during `PLAYING` phase with realistic reaction times (1.2s to 4.8s) and ~75% survival rate. Dead bots fire Danmaku cheers instead.

5. Integration into `HostLobby.tsx`, `src/app/host/page.tsx`, and `src/app/play/page.tsx`:
   - In `HostLobby.tsx`: Add direct launch card for Mode 2 ("Chiến Binh 5 Giây Dị Hợm").
   - In `src/app/host/page.tsx`: Mount `<Round2Host />` when `gameState.status === 'ROUND_2'` with return-to-hub handler.
   - In `src/app/play/page.tsx`: Mount `<Round2Play />` when `gameState.status === 'ROUND_2'`.

## Verification Requirements
- `npx tsc --noEmit` must report 0 errors.
- `npm run build` must compile successfully with 0 errors.
- `npm test` must pass all existing tests + any new tests.

Write your completion report in `handoff.md` in your working directory and notify parent (`45f106cf-224a-4102-aeee-b56815847bc0`).
