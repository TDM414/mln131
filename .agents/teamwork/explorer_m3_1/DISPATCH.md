# DISPATCH: explorer_m3_1 — Milestone 3 Architectural Blueprint

## Assignment
You are `explorer_m3_1`.
Your working directory: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m3_1`
Project root: `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`
Parent conversation ID: `45f106cf-224a-4102-aeee-b56815847bc0`

## Mandatory Documents to Read
1. `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md` (read both Initial Request and Follow-up for the Party Game Hub architecture)
2. `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md`
3. Milestone 1 and 2 implementations in `src/` (especially `src/lib/types.ts`, `src/lib/syncEngine.ts`, `src/lib/audioSynthesizer.ts`, `src/components/Round1Host.tsx`, `src/components/Round1Play.tsx`, `src/components/HostLobby.tsx`, `src/components/DevBotSimulator.tsx`).

## Scope of Investigation — Milestone 3 ("Round 2: Chiến Binh 5 Giây Dị Hợm")
Investigate and design a comprehensive, file-by-file implementation blueprint for:
1. `src/lib/types.ts`:
   - Inspect existing `Round2State` and micro-game types. Define micro-game identifiers: `'CATCH_REPORT' | 'SHAKE_OTP' | 'DODGE_BRICKS' | 'SPOT_DEEPFAKE'`.
   - Define micro-game payload structures, player life tracking (`lives: Record<string, number>`, default 3), and micro-game stage status (`'INTRO' | 'PLAYING' | 'RESULT' | 'ROUND_OVER'`).
2. `src/components/Round2Host.tsx` (New Component):
   - 16:9 Projector view for classroom display.
   - Master 5.0-second countdown bar with urgent audio ticks (`sound.playCountdownTick(isUrgent)`).
   - Micro-game announcement card with retro WarioWare comic urgency ("TÚM LẤY NÚT BÁO CÁO!", "LẮC LẤY MÃ OTP!", "NÉ GẠCH ĐÁ DRAMA!", "BÓC MẼ DEEPFAKE!").
   - Live 40-50 player survival grid displaying avatar SVGs, remaining lives (❤️❤️❤️ -> 💀), and real-time pass/fail indicators.
   - Dramatic explosion animation & meme SFX (`sound.playExplosion()`, `sound.playWrongBuzz()`) when students lose lives.
   - Victory fanfare (`sound.playVictoryFanfare()`) and Round 2 podium/leaderboard.
   - Prominent **"Quay Về Sảnh Chính (Return to Hub)"** button returning to `LOBBY` with scores preserved.
3. `src/components/Round2Play.tsx` (New Component):
   - 100dvh 1-finger mobile controller hosting the 4 micro-games:
     * Game 1: **Catch Report**: Phishing social media post with an evasive, moving "Báo Cáo Vi Phạm" button and decoy buttons. Tap real button to pass.
     * Game 2: **Shake for OTP**: DeviceMotion shake detection with high-speed tap-mash fallback (10 rapid taps on mobile screen) to generate 2FA OTP.
     * Game 3: **Dodge Drama Bricks**: 2D touch-drag canvas dodging falling toxic comments / bricks for 5 seconds.
     * Game 4: **Spot Deepfake Glitch**: AI scam image with anomalous glitch hotspot. Tap within target radius to expose deepfake.
   - Micro-game outcome feedback (Pass: Green check + chime; Fail: Comic meme explosion + vibration `navigator.vibrate(200)`).
   - Survival life counter (3 hearts).
4. `src/components/DevBotSimulator.tsx`:
   - Automate Round 2 bot behavior: bots simulate micro-game completion with randomized reaction times (1.2s to 4.8s) and authentic ~75% survival probability per micro-game.
5. Integration into `src/components/HostLobby.tsx`, `src/app/host/page.tsx`, and `src/app/play/page.tsx`:
   - In `HostLobby.tsx`: Add direct launch card for Mode 2 ("Chiến Binh 5 Giây Dị Hợm").
   - In `src/app/host/page.tsx` & `src/app/play/page.tsx`: Mount Round 2 host and mobile views when `status === 'ROUND_2'`.
6. Testing & verification strategy:
   - TypeScript checks, build checks, and new tests in `tests/suites/` for Mode 2 invariants.

Produce a detailed, file-by-file architectural blueprint in `handoff.md` in your working directory and notify parent (`45f106cf-224a-4102-aeee-b56815847bc0`).
