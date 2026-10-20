# Milestone 1 Handoff Report: Foundation, Contracts, Question Bank & Hub Quick-Launch

## 1. Observation
- Baseline build was verified via `npm run build`, initially passing with exit code 0.
- `src/lib/types.ts`:
  - Defined master scoring function `calculateSpeedDecayScore(basePoints, remainingTime, totalTime, isCorrect)`.
  - Added Mode 1 types: `FeedComment`, `TrendingPost`, `PromptItem`, `TrendingState`, `Round1Phase`.
  - Added Mode 2 types: `FactCapQuestion`, `FactCapAnswer`, `FactCapState`, `Round2Phase`.
  - Added Mode 3 types: `DilemmaItem`, `ConsensusDilemma`, `DilemmaTally`, `DilemmaState`, `Round3Phase`.
  - Added Mode 4 types: `TriviaState`, `Round4Phase`.
  - Maintained full backwards compatibility aliases and optional properties (`stances?`, `consensusBets?`, `tally?`) to avoid breaking existing components prior to Milestones 2-5.
- `src/data/questions.ts`:
  - Added `MLN131_FACT_OR_CAP_QUESTIONS` with 10 statements (`id`, `statement`, `isFact`, `explanation`, `category`, `basePoints: 1000`).
  - Added `MLN131_CONSENSUS_DILEMMAS` with 6 dilemmas (`id`, `title`, `topic`, `scenario`, `choiceA`, `choiceB`, `contextMLN131`).
  - Maintained `MLN131_ROAST_PROMPTS` and `MLN131_QUESTIONS`.
- `src/app/api/game/route.ts`:
  - Initial states updated in `createInitialRound1State()`, `createInitialRound2State()`, `createInitialRound3State()`, `createInitialRound4State()`.
  - Added handlers for `SUBMIT_FEED_COMMENT` / `SUBMIT_COMMENT`, `REACT_FEED_POST` / `REACT_FEED`, `SUBMIT_FACT_OR_CAP`, `SUBMIT_DILEMMA_STANCE`, `SUBMIT_DILEMMA_BET`, `RETURN_TO_HUB`, and speed decay in `SUBMIT_TRIVIA`.
- `src/lib/syncEngine.ts`:
  - Added dispatchers: `submitFeedComment()`, `reactFeedPost()`, `submitFactOrCap()`, `submitDilemmaStance()`, `submitDilemmaBet()`, `returnToHub()`.
- `src/components/HostLobby.tsx`:
  - Added prominent banner button: `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` with 1-click execution (`onSelectMode('FREE_PLAY')`, `onStartRound('ROUND_4')`).
  - Updated `roundsInfo` titles and descriptions for all 4 standalone modes.
- Build and test results:
  - `npm run build` completed with exit code 0, 0 TypeScript errors, all 7 pages generated cleanly.
  - `npx tsx tests/suites/m1_rearchitect_contracts.test.ts` completed with exit code 0 (6/6 tests passed).
  - `npm test` completed with exit code 0 (68/68 E2E tests passed).

## 2. Logic Chain
1. From the requirements in `DISPATCH.md` and `PROJECT.md`, the platform transitions from sequential rounds to 4 standalone modes with speed-decay scoring and a direct quick-launcher.
2. In `types.ts`, creating unified data models for `FeedComment`, `FactCapQuestion`, `DilemmaItem`, and `calculateSpeedDecayScore` establishes the single source of truth for all subsequent milestones (Milestones 2, 3, 4, 5).
3. In `questions.ts`, providing 10 Fact/Cap statements and 6 ethical dilemmas equips Mode 2 and Mode 3 with curriculum-grounded MLN131 content.
4. In `route.ts`, implementing the corresponding action handlers ensures both local tab BroadcastChannel and mobile delta polling clients can dispatch and synchronize actions without errors.
5. In `HostLobby.tsx`, placing the prominent Mode 4 quick-launcher banner ensures the Host can immediately test Mode 4 in Free-Play mode with 1 click.
6. Running both `npm run build`, `npm test`, and `m1_rearchitect_contracts.test.ts` proves that all contract changes are valid, fully functional, and non-regressive.

## 3. Caveats
- No caveats. All 5 exclusively owned files were modified within their exact scopes, maintaining backward compatibility for subsequent milestone workers.

## 4. Conclusion
Milestone 1 is complete. Foundation contracts, question banks, speed-decay scoring, API route action handlers, client dispatch methods, and HostLobby quick-launcher banner are fully verified and ready for downstream milestone workers (M2: `Round1Host`/`Round1Play`, M3: `Round2Host`/`Round2Play`, M4: `Round3Host`/`Round3Play`, M5: `Round4Host`/`Round4Play` & `DevBotSimulator`).

## 5. Verification Method
To independently verify Milestone 1:
1. Run `npx tsx tests/suites/m1_rearchitect_contracts.test.ts` — verifies speed-decay scoring, question banks, and all API route action handlers.
2. Run `npm test` — runs the full 6-tier E2E suite (68 tests).
3. Run `npm run build` — confirms Next.js 14 App Router production build and TypeScript compilation pass with 0 errors.
4. Inspect `src/components/HostLobby.tsx` — verify presence of `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` and updated descriptions for the 4 standalone modes.
