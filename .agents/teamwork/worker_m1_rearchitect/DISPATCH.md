# Dispatch: worker_m1_rearchitect

## 2026-10-19T15:43:36Z

## Task Assignment: Milestone 1 — Foundation, Contracts, Question Bank & Hub Quick-Launch

You are assigned to implement Milestone 1:
1. `src/lib/types.ts`:
   - Define data models for:
     - Mode 1: Trending Feed Wall (`TrendingPost` / `FeedComment`, `TrendingState`, phase: `'PROMPT' | 'SUBMITTING' | 'FEED_REACTION' | 'TOP_TRENDING'`).
     - Mode 2: Fact or Cap 5s (`FactCapQuestion`, `FactCapAnswer`, phase: `'COUNTDOWN' | 'QUESTION' | 'REVEAL' | 'SUMMARY'`).
     - Mode 3: Consensus Dilemma Trưng Cầu Dân Ý (`DilemmaItem`, `DilemmaState`, phase: `'DILEMMA_INTRO' | 'VOTING' | 'TUG_REVEAL' | 'SUMMARY'`, `stances: Record<string, 'A' | 'B'>`, `consensusBets: Record<string, 'A' | 'B'>`, `tally: { countA, countB, percentA, percentB, majority }`).
     - Mode 4: Sabotage Trivia (`SabotageCard`, `TriviaState`, phase: `'CARD_PICK' | 'QUESTION' | 'REVEAL' | 'SUMMARY'`).
   - Add master Speed-Decay scoring function:
     `calculateSpeedDecayScore(basePoints: number, remainingTime: number, totalTime: number, isCorrect: boolean): number`
     Formula: `if (!isCorrect) return 0; return Math.round(basePoints * Math.max(0, Math.min(1, remainingTime / totalTime)));`
   - Keep existing types needed for RoomSession, Player, Audio, Danmaku.
2. `src/data/questions.ts`:
   - Add `MLN131_FACT_OR_CAP_QUESTIONS`: 8-10 high quality statements regarding Dân chủ XHCN & truyền thông số with `id`, `statement`, `isFact: boolean`, `explanation`, `basePoints: 1000`.
   - Add `MLN131_CONSENSUS_DILEMMAS`: 5-6 ethical dilemmas on digital governance, cybersecurity vs privacy, free speech vs responsibility, algorithms vs citizen ethics. Each with `id`, `title`, `scenario`, `choiceA: string`, `choiceB: string`.
   - Maintain and enhance `MLN131_ROAST_PROMPTS` for Mode 1 and `MLN131_QUESTIONS` for Mode 4.
3. `src/app/api/game/route.ts`:
   - Support action handlers:
     - `SUBMIT_FEED_COMMENT` / `SUBMIT_COMMENT`: adds student comment to feed.
     - `REACT_FEED_POST` / `REACT_FEED`: adds reaction (❤️, 🍅, 🧱) with score increment (+100 per reaction).
     - `SUBMIT_FACT_OR_CAP`: records FACT / CAP answer, computes speed-decay score, tracks lives.
     - `SUBMIT_DILEMMA_STANCE`: records A or B stance.
     - `SUBMIT_DILEMMA_BET`: records prediction on >50% majority.
     - `PLAY_CARD`, `SUBMIT_TRIVIA`, `RETURN_TO_HUB`.
4. `src/lib/syncEngine.ts`:
   - Add client helper dispatchers for the new actions.
5. `src/components/HostLobby.tsx`:
   - Add prominent banner button at top of lobby: `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]`.
   - Update the 4 mode cards with the new titles and descriptions:
     - Mode 1: Tường Bình Luận Triệu Like (Trending Feed Wall)
     - Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)
     - Mode 3: Trưng Cầu Dân Ý: Đoán Phe Đa Số (The Consensus Dilemma)
     - Mode 4: Đấu Trường Chơi Xấu Cướp Điểm (Sabotage Trivia)
   - Ensure clicking [Thử Ngay Mode 4] directly starts Mode 4 in Free-Play mode.

## Files Owned Exclusively
- `src/lib/types.ts`
- `src/data/questions.ts`
- `src/app/api/game/route.ts`
- `src/lib/syncEngine.ts`
- `src/components/HostLobby.tsx`

## Mandatory Reference Documents
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md`
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_rearchitect_code\analysis.md`

## Verification Requirements
Run `npm run build` and ensure 0 TypeScript / compilation errors.
Write your changes to `changes.md` and handoff report to `handoff.md` in `.agents/teamwork/worker_m1_rearchitect/`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
