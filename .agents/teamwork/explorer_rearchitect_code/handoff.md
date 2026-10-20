# Handoff Report: Codebase Investigation & Rearchitecture Blueprint
**From:** `explorer_rearchitect_code`  
**To:** Orchestrator (`dcd6312c-918d-4ca5-957d-512b431b5686`) / Implementer  
**Timestamp:** 2026-10-19T15:42:00Z  
**Type:** Soft Handoff (Investigation Complete ➔ Ready for Implementation Planning & Code Writing)

---

## 1. Observation
1. **Codebase Baseline Health**:
   Ran `npm run build` at working directory `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`. Command exited cleanly with Code 0:
   ```
   ✓ Compiled successfully
   Linting and checking validity of types ...
   Route (app)
   ┌ ○ /                                    8.88 kB        96.2 kB
   ├ ○ /_not-found                          873 B          88.2 kB
   ├ ƒ /api/game                            0 B                0 B
   ├ ○ /host                                46.1 kB         144 kB
   └ ○ /play                                16 kB           114 kB
   ```
2. **Existing Game Modes in `src/`**:
   - `src/components/Round1Host.tsx` (811 lines) & `Round1Play.tsx` (427 lines): Uses a 1v1 duel system (`DuelPair` lines 74-84 in `types.ts`). With 50 students, this creates up to 25 sequential voting showdowns taking >20 minutes.
   - `src/components/Round2Host.tsx` (1049 lines) & `Round2Play.tsx` (823 lines): Uses 4 WarioWare mini-games (`CATCH_REPORT`, `SHAKE_OTP`, `DODGE_BRICKS`, `SPOT_DEEPFAKE`) requiring device shaking (`devicemotion` listener lines 220-256 in `Round2Play.tsx`) and canvas dragging.
   - `src/components/Round3Host.tsx` (437 lines) & `Round3Play.tsx` (192 lines): Implements an Among Us style social deduction game where 3 real players in the classroom are nominated onto a hot seat as suspects (lines 72-91 in `Round3Host.tsx`).
   - `src/components/Round4Host.tsx` (324 lines) & `Round4Play.tsx` (272 lines): Implements Sabotage Trivia with card attacks (`INK_SPLATTER`, `POINT_HEIST`, `DOUBLE_OR_NOTHING`). Scoring currently uses fixed points rather than Speed-Decay.
   - `src/components/HostLobby.tsx` (325 lines): Has mode switcher between Tournament and Free-Play, but Mode 4 is only one small card among four, lacking the prominent [Thử Ngay Mode 4] direct action button requested by the user.
   - `src/components/DevBotSimulator.tsx` (445 lines): Automates 15 Vietnamese bot students, but simulates the old Quiplash 1v1 duels (lines 130-226) and WarioWare mini-games (lines 228-268).
3. **Core Data Structures & Routing**:
   - `src/lib/types.ts`: Master state `GameShowState` (lines 283-302) with sub-states `round1State`, `round2State`, `round3State`, `round4State`.
   - `src/app/api/game/route.ts`: In-memory room cache `rooms: Record<string, RoomSession>` (line 26) with GET state polling and POST actions (lines 214-598).
   - `src/lib/syncEngine.ts`: Dual-channel broadcast (BroadcastChannel + HTTP delta poll every 350ms for host, 700ms for mobile).
   - `src/lib/audioSynthesizer.ts`: Complete procedural Web Audio API synthesizer with Troll Airhorn, Applause, Countdown Tick, Splat, Correct Chime, Explosion, Sabotage Stab, and 128 BPM Party BGM loop.

---

## 2. Logic Chain
1. *From Observation 1*: The build is 100% clean and stable, meaning there are no legacy build-breaking bugs to fix first; the rearchitecture can proceed directly with feature refactoring.
2. *From Observation 2 & User Directive (2026-10-19T15:28:48Z)*:
   - For Mode 1: Moving from 25 sequential 1v1 duels to a 2-phase simultaneous Trending Feed Wall (45s text submission ➔ 30s social feed like/reaction barrage ➔ Top Trending reveal) reduces round duration from ~20 minutes to under 2 minutes for 50 students, maintaining maximum excitement.
   - For Mode 2: Replacing shake sensors and canvas dragging with a rapid-fire 5-second "Fact or Cap" reflex bomb and 2 giant mobile buttons (`[🟢 FACT / CHUẨN]` vs `[🔴 CAP / BỐC PHÉT]`) eliminates hardware incompatibilities and ensures equal responsiveness for all devices.
   - For Mode 3: Replacing classmate expulsion with "Trưng Cầu Dân Ý (Consensus Dilemma)" resolves student hesitation in unfamiliar classrooms. Players pick their stance and bet whether >50% of the room will agree with them, while the projector renders a realtime Tug-of-war pulling animation.
   - For Mode 4: Adding a prominent banner button `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` directly on `HostLobby.tsx` enables the host to launch Mode 4 immediately without navigating sub-menus.
   - For Scoring: Implementing `Points = BasePoints * (RemainingTime / TotalTime)` across Modes 2, 3, and 4 rewards fast reflexes and adds competitive tension.
   - For DevBotSimulator: Updating the 15 simulated bots to support submitting comments, liking feed posts, answering Fact/Cap in 5s, pulling tug-of-war, and playing sabotage cards enables thorough single-developer testing.

---

## 3. Caveats
- Real mobile browsers (especially iOS Safari) can suspend timers or background tabs if users switch away. The local timer in mobile components must re-synchronize with server timestamps when regaining focus.
- 50 simultaneous users rapidly tapping ❤️/🍅/🧱 reactions could potentially flood the network if not throttled; a 100ms client debounce is recommended during the feed phase.
- Audio playback requires at least one initial user interaction (`onClick` or `onTouchStart`) to unlock the browser `AudioContext`.

---

## 4. Conclusion
The codebase is clean, well-architected, and fully prepared for the 4-mode rearchitecture. All required audio effects and synchronization channels are already in place. The complete plan, data models, and step-by-step file roadmap are documented in `.agents/teamwork/explorer_rearchitect_code/analysis.md`. The implementation can be executed systematically across 4 distinct phases without breaking existing application build integrity.

---

## 5. Verification Method
1. **Build Verification**:
   ```powershell
   cd C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
   npm run build
   ```
   Must exit with code 0 and 0 TypeScript / SSR warnings.
2. **Runtime Verification**:
   - Start development server: `npm run dev`
   - Open Host screen: `http://localhost:3000/host`
   - Open Mobile Controller: `http://localhost:3000/play?room=MLN131`
   - Click "Test Dev" to activate 15 bots.
   - Verify Mode 1: All bots submit comments and react to feed posts; Top Trending card animates to top.
   - Verify Mode 2: 5-second ticking bomb counts down; tapping FACT/CAP scores via Speed-Decay.
   - Verify Mode 3: Tug-of-war bar pulls dynamically in realtime as bots vote; majority side wins +5000 pts.
   - Verify Mode 4: Directly clickable from Hub; sabotage cards (ink splatter, heist) execute properly.
   - Verify "Quay Về Sảnh Chính (Return to Hub)" works across all 4 modes, preserving all players and scores.

---

## 6. Remaining Work (Concrete Next Steps for Implementer)
1. **Phase 1: Contracts & Data**: Update `src/lib/types.ts`, `src/data/questions.ts`, `src/app/api/game/route.ts`, and `src/lib/syncEngine.ts`.
2. **Phase 2: Mode 1 & Mode 2**: Refactor `Round1Host.tsx`, `Round1Play.tsx`, `Round2Host.tsx`, `Round2Play.tsx`.
3. **Phase 3: Mode 3, Mode 4 & Hub**: Refactor `Round3Host.tsx`, `Round3Play.tsx`, `Round4Host.tsx`, `Round4Play.tsx`, and add the prominent Mode 4 button in `HostLobby.tsx`.
4. **Phase 4: DevBot Simulator & Verification**: Update `DevBotSimulator.tsx` and run full build verification (`npm run build`).
