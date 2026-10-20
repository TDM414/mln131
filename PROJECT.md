# Project: NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition) — Rearchitected 4-Mode Platform

## Architecture
- **Framework**: Next.js 14 App Router (TypeScript, Tailwind CSS).
- **State & Realtime Sync Engine**: Dual-channel hybrid architecture:
  - L1: `BroadcastChannel` for immediate zero-latency local multi-tab sync.
  - L2: HTTP Delta Polling (`/api/game?room=...&since=...`) every 350ms (Host) / 700ms (Client), optimized for 40-50 mobile devices on local classroom LAN and Vercel serverless.
- **Audio Architecture**: Pure Web Audio API procedural synthesizer (`SoundSynthesizer`) generating 100% offline arcade and meme SFX (Troll airhorn, ticking countdown, bomb explosion, splat, correct/wrong chimes, fanfare, 128 BPM party loop).
- **Visual Identity**: Neo-brutalist party game aesthetic (3-4px solid borders, hard comic drop shadows, vibrant cyber palette: Cyber Yellow `#FFD166`, Cyan `#06D6A0`, Crimson `#EF233C`, Purple `#7209B7`), 16:9 classroom projector layout, and 1-finger touch mobile layout (100dvh, thumb zone, haptic feedback).
- **Party Game Hub (Non-linear Standalone Modes + Return-to-Hub)**:
  - Host lobby features a prominent direct action button `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` alongside 4 standalone mode selectors.
  - Mode 1: "Tường Bình Luận Triệu Like" (Trending Feed Wall - 45s comment + 30s live reactions + Top Trending còi vinh danh).
  - Mode 2: "Đại Chiến Bóc Phốt 5 Giây" (Fact or Cap 5s Reflex - 5.0s ticking bomb + 2 giant mobile buttons [🟢 FACT] vs [🔴 CAP]).
  - Mode 3: "Trưng Cầu Dân Ý: Đoán Phe Đa Số" (The Consensus Dilemma - Stance [A] vs [B] + >50% consensus bet + Realtime Tug-of-war rope).
  - Mode 4: "Đấu Trường Chơi Xấu Cướp Điểm" (Sabotage Trivia - Ink splatter, 50% heist, 2x bet, speed-decay trivia).
  - Mobile clients maintain persistent connections across mode transitions with zero re-scanning, zero PIN re-entry.
  - Every mode concludes with a podium screen and an explicit "Quay Về Sảnh Chính (Return to Hub)" button.
- **Universal Speed-Decay Scoring**:
  - Applied to Modes 2, 3, and 4: `Points = Math.round(BasePoints * (RemainingTime / TotalTime))`. Wrong answers yield 0 points.
- **Simulation Harness**: Dev Bot Simulator v2 running 15-20 virtual Vietnamese students with autonomous behavior across all 4 redesigned modes.

## Code Layout
- `src/lib/types.ts`: Master data models (GameShowState, Player, Mode 1 Feed, Mode 2 Fact/Cap, Mode 3 Dilemma, Mode 4 Sabotage, Speed-Decay helpers).
- `src/lib/syncEngine.ts`: Dual-channel synchronization engine with delta buffer and action dispatchers.
- `src/lib/audioSynthesizer.ts`: Web Audio procedural sound effects and BGM engine.
- `src/data/questions.ts`: MLN131 curriculum scenarios, statements, ethical dilemmas, and trivia bank.
- `src/data/memeAvatars.tsx`: 10 Netizen Persona SVG definitions and accessories.
- `src/app/api/game/route.ts`: In-memory room session and delta event buffer API supporting all 4 modes.
- `src/components/HostLobby.tsx`: Room setup, PIN, QR code, player roster, prominent [Thử Ngay Mode 4] button, and 4-mode launch hub.
- `src/components/DanmakuCanvas.tsx`: High-performance HTML5 Canvas 2D reaction particle engine.
- `src/components/Round1Host.tsx` & `src/components/Round1Play.tsx`: Mode 1 Trending Feed Wall (45s mass submit + 30s reaction newsfeed + Top Trending).
- `src/components/Round2Host.tsx` & `src/components/Round2Play.tsx`: Mode 2 Fact or Cap 5s Reflex (ticking bomb, 2 giant buttons, speed decay).
- `src/components/Round3Host.tsx` & `src/components/Round3Play.tsx`: Mode 3 Consensus Dilemma (Tug-of-war realtime bar, A/B stance + majority bet).
- `src/components/Round4Host.tsx` & `src/components/Round4Play.tsx`: Mode 4 Sabotage Trivia (ink splatter canvas, heist, 2x bet, speed decay).
- `src/components/GrandPodium.tsx`: Championship ceremony and meme awards.
- `src/components/DevBotSimulator.tsx`: Virtual student bot loop supporting all 4 new modes.
- `src/app/host/page.tsx`: Projector screen orchestrating hub and rounds.
- `src/app/play/page.tsx`: Mobile controller dynamically rendering active round views.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Master Data Models & Speed-Decay Formula | Master types for 4 modes, speed-decay helper `BasePoints * (RemainingTime / TotalTime)` | M1 | Survey |
| 2 | MLN131 Rich Question & Dilemma Bank | Statements for Fact/Cap, ethical dilemmas for Mode 3, prompt bank for Mode 1 & 4 | M1 | Survey |
| 3 | Hub Prominent [Thử Ngay Mode 4] Launcher | Prominent banner button on Hub lobby to instantly launch Mode 4 standalone | M1 | Survey |
| 4 | Delta Sync & Multi-Mode API Handlers | API route supporting all actions for 4 modes, delta event broadcasting & state queries | M1 | Survey |
| 5 | Mode 1: 45s Mass Comment Submission | 50 concurrent students submit comments/roasts on MLN131 prompt in 45s simultaneously | M2 | Survey |
| 6 | Mode 1: 30s Newsfeed Reaction Barrage | Scrollable social media newsfeed on mobile with ❤️, 🍅, 🧱 instant reactions | M2 | Survey |
| 7 | Mode 1: Projector Top Trending & Airhorn | Auto-ranks top interacted comments, animated reveal with troll airhorn SFX and podium | M2 | Survey |
| 8 | Mode 2: 5.0s Universal Bomb Countdown | Synchronized 5s bomb timer on projector with accelerating Web Audio tick SFX | M3 | Survey |
| 9 | Mode 2: Mobile Giant FACT / CAP Controls | 2 giant thumb touch buttons [🟢 FACT / CHUẨN] and [🔴 CAP / BỐC PHÉT] with 0 sensor lag | M3 | Survey |
| 10 | Mode 2: Speed-Decay Scoring & Bomb Explosion | Score scales with remaining time, wrong answer or timeout triggers comic explosion | M3 | Survey |
| 11 | Mode 3: Ethical Dilemma Presentation | Projector displays high-stakes MLN131 digital governance/ethics dilemmas | M4 | Survey |
| 12 | Mode 3: Two-Tier Mobile Stance & Bet | Mobile player (1) selects personal stance [A] vs [B], (2) bets on >50% consensus choice | M4 | Survey |
| 13 | Mode 3: Realtime Tug-of-War Projector Visual | Dynamic rope/bar pulling animation reflecting live room consensus percentages | M4 | Survey |
| 14 | Mode 3: Majority +5000 Pts & Minority Brick Barrage | Majority betters gain +5000 pts; minority side receives Danmaku brick splatter | M4 | Survey |
| 15 | Mode 4: Sabotage Card System | Interactive ink splatter, 50% point heist, double-or-nothing bet, and shield cards | M5 | Survey |
| 16 | Mode 4: Speed-Decay Situational Trivia | MLN131 trivia questions scored with time-decay formula and card modifiers | M5 | Survey |
| 17 | Dev Bot Simulator v2 for All 4 Modes | 15-20 autonomous bots submitting comments, reacting to feed, answering 5s, pulling tug-of-war | M5 | Survey |
| 18 | E2E Test Suite (Tiers 1-5) & Build Verification | 100% test pass on updated test suite and clean `npm run build` with 0 errors | M6 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Foundation, Contracts, Question Bank & Hub Quick-Launch | `types.ts`, `questions.ts`, `/api/game/route.ts`, `syncEngine.ts`, prominent [Thử Ngay Mode 4] button on `HostLobby.tsx` | none | DONE |
| 2 | Mode 1: Tường Bình Luận Triệu Like | `Round1Host.tsx`, `Round1Play.tsx`, Danmaku feed reactions, Top Trending ranking algorithm & sound | M1 | DONE |
| 3 | Mode 2: Đại Chiến Bóc Phốt 5 Giây | `Round2Host.tsx`, `Round2Play.tsx`, 5s ticking bomb, 2 giant buttons [FACT] / [CAP], speed-decay scoring | M1 | DONE |
| 4 | Mode 3: Trưng Cầu Dân Ý (Consensus Dilemma) | `Round3Host.tsx`, `Round3Play.tsx`, ethical dilemmas, A/B stance + >50% bet, realtime Tug-of-war bar | M1 | IN_PROGRESS |
| 5 | Mode 4: Sabotage Trivia & Dev Bot Simulator v2 | `Round4Host.tsx`, `Round4Play.tsx`, cards, ink wipe, speed-decay trivia, `DevBotSimulator.tsx` across all 4 modes | M1 | PLANNED |
| 6 | E2E Integration, 100% Test Pass & Forensic Audit | Update test suites in `tests/`, pass 100% of test suite, `npm run build` clean, Forensic Auditor verification | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts

### Master GameShowState (`src/lib/types.ts`)
- `status`: `'LOBBY' | 'ROUND_1' | 'ROUND_2' | 'ROUND_3' | 'ROUND_4' | 'PODIUM'`
- `round1State`:
  - `phase`: `'PROMPT' | 'SUBMITTING' | 'FEED_REACTION' | 'TOP_TRENDING'`
  - `prompt`: `PromptItem`
  - `comments`: `Record<string, FeedComment>` where `FeedComment = { id, authorId, authorName, text, reactions: { heart: number, tomato: number, brick: number }, score: number }`
- `round2State`:
  - `phase`: `'COUNTDOWN' | 'QUESTION' | 'REVEAL' | 'SUMMARY'`
  - `currentQuestionIndex`: number
  - `questions`: `FactCapQuestion[]` where `FactCapQuestion = { id, statement, isFact: boolean, explanation: string, basePoints: number }`
  - `answers`: `Record<string, { choice: 'FACT' | 'CAP', timestamp: number, remainingTime: number, isCorrect: boolean, score: number }>`
- `round3State`:
  - `phase`: `'DILEMMA_INTRO' | 'VOTING' | 'TUG_REVEAL' | 'SUMMARY'`
  - `dilemma`: `DilemmaItem = { id, title, scenario, choiceA: string, choiceB: string }`
  - `stances`: `Record<string, 'A' | 'B'>`
  - `consensusBets`: `Record<string, 'A' | 'B'>`
  - `tally`: `{ countA: number, countB: number, percentA: number, percentB: number, majority: 'A' | 'B' | 'DRAW' }`
- `round4State`:
  - `phase`: `'CARD_PICK' | 'QUESTION' | 'REVEAL' | 'SUMMARY'`
  - `trivia`: `TriviaQuestion`
  - `activeCards`: `Record<string, SabotageCard>`
- `calculateSpeedDecayScore(basePoints: number, remainingTime: number, totalTime: number, isCorrect: boolean): number`:
  - `if (!isCorrect) return 0;`
  - `return Math.round(basePoints * Math.max(0, Math.min(1, remainingTime / totalTime)));`
