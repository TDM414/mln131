# HANDOFF REPORT — CODEBASE & ARCHITECTURE SURVEY
**Agent:** explorer_survey_code  
**Project:** NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)  
**Root Path:** `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`  
**Date:** 2026-10-19T11:45:00Z  

---

## 1. Observation

### 1.1 Project Configuration & Dependencies
- **`package.json`** (`C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\package.json` lines 11–29):
  - Next.js: `^14.2.15` (App Router)
  - React / React-DOM: `^18.3.1`
  - UI & Animation: `canvas-confetti` (^1.9.3), `lucide-react` (^0.453.0), `qrcode` (^1.5.4)
  - Tooling: `tailwindcss` (^3.4.14), `postcss` (^8.4.47), `typescript` (^5.6.3), `autoprefixer` (^10.4.20)
  - Note: No WebSocket, Socket.io, or external database package is installed.
- **`tsconfig.json`** (`tsconfig.json` lines 20–22):
  - Path alias configured: `@/*` maps to `./src/*`. Strict mode enabled.
- **`tailwind.config.js`** (`tailwind.config.js` lines 10–43):
  - Custom palette `cyber` (`dark: #0b0f19`, `card: #131b2e`, `border: #1e293b`, `red: #ef233c`, `crimson: #d90429`, `gold: #ffd166`, `yellow: #ffb703`, `cyan: #06d6a0`, `blue: #118ab2`, `purple: #7209b7`).
  - Keyframe animations: `shake` and `glow`.
- **`next.config.mjs`** (`next.config.mjs` lines 1–6):
  - `reactStrictMode: false`.
- **Build verification**:
  - Command: `npm run build`
  - Output: Compiled successfully in Next.js 14.2.35 with 0 errors. Prerendered routes: `/`, `/_not-found`, `/api/game`, `/host`, `/play`.

### 1.2 Existing Files in `src/`
There are 13 code files in `src/`:
1. `src/app/layout.tsx` & `src/app/globals.css`: Dark cyberpunk background with custom glow utilities.
2. `src/app/page.tsx`: Landing page introducing "Democracy Raid", links to `/host` and `/play`, and previews the 6 minion types.
3. `src/app/host/page.tsx`: Host projector screen (614 lines).
4. `src/app/play/page.tsx`: Mobile client screen (413 lines).
5. `src/app/api/game/route.ts`: In-memory room session and polling endpoint (165 lines).
6. `src/components/ArenaCanvas.tsx`: HTML5 Canvas 2D engine rendering boss, minions, projectiles, and damage popups (349 lines).
7. `src/components/GachaModal.tsx`: Gacha reward dialog for spawned minions (95 lines).
8. `src/lib/types.ts`: TypeScript interfaces for boss raid, units, and projectiles (119 lines).
9. `src/lib/unitTypes.ts`: Definitions for 6 boss-raid minion classes (109 lines).
10. `src/lib/syncEngine.ts`: Dual-channel synchronization engine combining `BroadcastChannel` and HTTP polling (182 lines).
11. `src/lib/audioSynthesizer.ts`: Web Audio API sound synthesizer with procedural arcade SFX (216 lines).
12. `src/data/questions.ts`: 15 multiple-choice questions on MLN131 topics (200 lines).
13. `README.md`: Documents the initial "Democracy Raid: Boss Raid" concept.

### 1.3 Disconnect with `ORIGINAL_REQUEST.md`
- `ORIGINAL_REQUEST.md` mandates **"NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)"**:
  - 4 Game Show Tournament rounds:
    1. Vòng 1: "Đại Hội Cà Khịa & Check VAR" (Jackbox / Quiplash text battle + 1v1 voting + Danmaku reactions).
    2. Vòng 2: "Chiến Binh 5 Giây Dị Hợm" (WarioWare mini-games: Runaway Report button, Shake OTP, Dodge bricks, Spot deepfake).
    3. Vòng 3: "Vạch Mặt Seeder & Check VAR" (Among Us / Social deduction: 45 Netizens vs 5 Seeders, clues, debate, vote elimination).
    4. Vòng 4: "Đại Chiến Lật Kèo & Cướp Điểm" (Sabotage Trivia with action cards: Ink splat, steal 50%, redirect question, x2 bet).
  - Mode selection: Full Tournament or individual Free-play round selection.
  - Tone & Visuals: Gen Z meme comedy, bright cartoon graphics, hilarious soundboard.
- The existing codebase currently implements an entirely different game mode: **"Democracy Raid" (Single Boss Raid 1,000,000 HP with 6 minion classes and multiple-choice trivia)**.

### 1.4 Dev Bot Simulator Status
- `src/app/host/page.tsx` (lines 147–179, 329–442) contains a functional Dev Sandbox toolbar with a Bot Simulator:
  - Generates 15 virtual students (`Tuấn Anh`, `Khánh Linh`, `Minh Đức`, etc.).
  - Simulates unit summoning, whistle alerts, and tap frenzy.
  - Provides quick test buttons: Toggle Bots, Trigger Whistle Hazard, Skip to Phase 3, Reset Boss HP.
- However, this simulator is wired strictly to the Boss Raid mechanics. It does not support prompt generation, 1v1 voting, 5-second mini-games, social deduction voting, or sabotage card actions.

---

## 2. Logic Chain

1. **Observation 1.1 & 1.2**: Next.js 14 App Router, TypeScript, and TailwindCSS are set up and build with 0 errors (`npm run build`). `BroadcastChannel` + `/api/game` polling (`syncEngine.ts`) provides a zero-setup, serverless-friendly communication mechanism that functions across browser tabs and mobile devices on Vercel without requiring external WebSocket servers.
2. **Observation 1.3**: The user's specification (`ORIGINAL_REQUEST.md`) is NOT a Boss Raid game. It requires a complete 4-round Game Show ("Netizen Party") with Jackbox-style text battles (Round 1), WarioWare 5s reflexes (Round 2), Among Us social deduction (Round 3), and Sabotage card trivia (Round 4), selectable via a Game Show Hub (Tournament vs Free-play).
3. **Observation 1.4**: While the game loops in `src/app/host/page.tsx` and `src/app/play/page.tsx` are tailored to Boss Raid, the underlying architectural primitives:
   - Polling / Event-driven state sync (`syncEngine.ts` and `/api/game/route.ts`)
   - Web Audio API procedural sound engine (`audioSynthesizer.ts`)
   - Dev Bot Simulator architecture (interval-driven virtual players in host with test toolbar)
   - QR code generation and mobile responsive layout
   are all highly robust, functional, and directly reusable as the foundation for "Netizen Party".
4. **Conclusion**: The codebase needs an architectural refactor and expansion:
   - Retain and expand `syncEngine.ts`, `api/game/route.ts`, and `audioSynthesizer.ts`.
   - Update `types.ts` to model the 4 Game Show rounds, tournament state, player roles, and sabotage cards.
   - Design and build the Game Show Hub (Tournament / Free-play picker).
   - Implement the 4 round engines for both Host and Mobile clients.
   - Upgrade the Dev Bot Simulator to simulate all 4 rounds.

---

## 3. Caveats

- **State Persistence**: The current server API (`src/app/api/game/route.ts`) maintains an in-memory `rooms` dictionary. On Vercel serverless functions, state survives within the same execution instance and cold starts reinitialize to default state. This works well for single classroom sessions, but multi-instance scaling on Vercel edge/serverless requires clients to poll consistently or host to serve as state coordinator.
- **Audio Autoplay Policy**: Browsers block Web Audio API until the first user interaction (click/touch). The existing `initCtx()` method handles this correctly on button clicks.
- **Mobile Device Motion API**: Round 2 requires "Lắc điện thoại lấy OTP" (DeviceMotionEvent). On modern iOS Safari, `DeviceMotionEvent.requestPermission()` requires HTTPS and explicit user consent. A fallback button ("Lắc ảo / Tap nhanh") must be provided for browsers without accelerometer permissions.

---

## 4. Conclusion

### Summary of System Status
| Component | Existing Status | Action Needed for Netizen Party |
|---|---|---|
| **Build & Toolchain** | Working (`next 14`, TS, Tailwind) | Keep, verified |
| **Realtime Sync** | Working (BroadcastChannel + `/api/game` polling) | Expand action handlers for 4 rounds & tournament |
| **Audio Synthesizer** | Working (Web Audio API arcade sounds) | Add meme sfx (buzzer, troll horn, applause, countdown) |
| **Question Data** | 15 MLN131 MCQs in `data/questions.ts` | Adapt scenarios into prompts, deduction clues, and final cards |
| **Host Interface** | Boss Raid Canvas Arena | Refactor into Game Show Projector (Hub, Rounds 1–4, Danmaku, Podium) |
| **Mobile Interface** | Boss Raid MCQ Quiz & Tap Frenzy | Refactor into Multi-round Controller (roast input, 5s games, deduction vote, cards) |
| **Dev Bot Simulator**| Exists for Boss Raid (15 bots) | Redesign for 4-round simulation (submitting roasts, voting, mini-game bot scores, deduction) |

---

## 5. Verification Method

To verify these findings independently:
1. Run `npm run build` inside `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131`:
   ```bash
   cd C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
   npm run build
   ```
   *Expected result:* Exits with code 0, 7 routes compiled successfully.
2. Inspect `ORIGINAL_REQUEST.md` vs `src/app/host/page.tsx` and `src/app/play/page.tsx`:
   *Confirm:* `ORIGINAL_REQUEST.md` requests 4 Game Show rounds (Jackbox, WarioWare, Among Us, Sabotage Trivia), while existing code implements Boss Raid.
3. Inspect `src/app/api/game/route.ts` lines 84–156:
   *Confirm:* Supported actions are strictly `JOIN`, `SUMMON`, `WHISTLE`, `TAP`, `HOST_UPDATE`.
