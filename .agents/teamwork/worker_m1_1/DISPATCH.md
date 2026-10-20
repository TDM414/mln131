## 2026-10-19T11:54:25Z
You are worker_m1_1.
Your working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m1_1
Project root: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Original Request: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md
Master Project Index: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md
Architectural Blueprint: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m1_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, and the Architectural Blueprint in explorer_m1_1\handoff.md before implementing.

Your scope is Milestone 1: "Foundation, Hub & Audio Engine".
Implement the following genuine code:
1. `src/lib/types.ts`: Master data models (`GameShowState`, `Player`, `Round1State` to `Round4State`, `SabotageCard`, `DanmakuMessage`, `DevBotConfig`, while retaining `QuizQuestion` compatibility).
2. `src/lib/audioSynthesizer.ts`: Implement all procedural Web Audio methods without external MP3 dependencies:
   - `playTrollHorn()` (detuned sawtooth brass blast)
   - `playApplause()` (crowd clapping noise synthesis)
   - `playCountdownTick(isUrgent)` (pitch-ascending woodblock impulse)
   - `playSplat()` (liquid comic squelch)
   - `playCorrectChime()` (harmonic 4-bell chime)
   - `playWrongBuzz()` (dissonant square-wave buzzer)
   - `playSabotageStab()` (cinematic diminished hit)
   - `playVictoryFanfare()` (triumphant fanfare)
   - `startPartyBGM()` / `stopPartyBGM()` (procedural 128 BPM chiptune funk loop with kick, snare, hihat, and bassline)
   - Retain laser, explosion, etc. methods for backwards compatibility.
3. `src/lib/syncEngine.ts` and `src/app/api/game/route.ts`:
   - Expand `RealtimeSyncEngine` with methods: `joinRoom`, `setMode`, `setGameStatus`, `setRoundPhase`, `sendDanmaku`, `submitRoast`, `voteRoast`, `submitMinigameResult`, `voteExile`, `playCard`, `wipeInk`, `submitTrivia`, `hostUpdateState`, `resetGame`.
   - Update `/api/game/route.ts` to maintain `GameShowState` keyed by room PIN `MLN131` with delta event ring buffer.
4. `src/data/memeAvatars.ts`:
   - Implement the 10 Netizen Persona SVG vector components: `keyboard_warrior`, `grammar_police`, `var_inspector`, `anti_scam_otter`, `zen_monk`, `chicken_feeder`, `phd_student`, `genz_slang_queen`, `conspiracy_theorist`, `righteous_netizen`.
   - Export helper functions: `NETIZEN_AVATARS`, `getAvatarById`, `getRandomAvatar`.
5. `src/components/HostLobby.tsx` & `src/components/DevBotSimulator.tsx`:
   - `HostLobby.tsx`: Neo-brutalist 16:9 projector layout, room PIN `MLN131`, QR code, Tournament vs Free-Play mode selector, start button, live student roster with animated avatar cards.
   - `DevBotSimulator.tsx`: Dev Sandbox loop simulating 15-20 virtual Vietnamese students (`Tuấn Anh`, `Khánh Linh`, `Minh Đức`, etc.) with automated joins, Danmaku bursts, and state hooks.
6. `src/app/host/page.tsx` & `src/app/play/page.tsx`:
   - `src/app/host/page.tsx`: Projector host mounting `HostLobby`, sound controls (Mute, Volume, BGM), Dev Sandbox drawer, and round switcher.
   - `src/app/play/page.tsx`: 1-finger touch mobile controller (100dvh, avatar selector, name input, room PIN join, live Danmaku reaction pad).
7. Run build verification (`npm run build` or `npx tsc --noEmit`) to verify zero compilation errors.
8. Document all completed changes and verification results in handoff.md in your working directory. Notify parent (45f106cf-224a-4102-aeee-b56815847bc0) when done.
