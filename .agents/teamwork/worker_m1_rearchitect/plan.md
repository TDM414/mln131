# Implementation Plan: Milestone 1 — Foundation, Contracts, Question Bank & Hub Quick-Launch

## 1. Goal & Objectives
Set up the single source of truth for the re-architected 4 standalone game modes of "NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)".
Provide full TypeScript interfaces, master speed-decay scoring function, expanded question & dilemma banks, robust in-memory serverless API route handlers, realtime client dispatch methods, and the prominent Mode 4 quick-launcher banner in HostLobby.

## 2. Target Files & Detailed Changes

### File 1: `src/lib/types.ts`
- Add master speed-decay scoring function:
  ```ts
  export function calculateSpeedDecayScore(
    basePoints: number,
    remainingTime: number,
    totalTime: number,
    isCorrect: boolean
  ): number {
    if (!isCorrect) return 0;
    return Math.round(basePoints * Math.max(0, Math.min(1, remainingTime / totalTime)));
  }
  ```
- Define Mode 1: Trending Feed Wall:
  - `FeedComment` / `TrendingPost`
  - `PromptItem`
  - `TrendingState` (and enhance `Round1State` with `phase: 'PROMPT' | 'SUBMITTING' | 'FEED_REACTION' | 'TOP_TRENDING' | Round1Phase`, `comments: Record<string, FeedComment>`, `trendingTopIds: string[]`, backwards compatible with `submissions`, `duels`, `prompts`)
- Define Mode 2: Fact or Cap 5s Reflex:
  - `FactCapQuestion` / `FactOrCapQuestion`
  - `FactCapAnswer`
  - Enhance `Round2State` with `phase`, `questions: FactCapQuestion[]`, `answers: Record<string, FactCapAnswer>`
- Define Mode 3: Consensus Dilemma Trưng Cầu Dân Ý:
  - `DilemmaItem` / `ConsensusDilemma`
  - `DilemmaState` / enhance `Round3State` with `dilemma`, `dilemmas`, `stances: Record<string, 'A' | 'B'>`, `consensusBets: Record<string, 'A' | 'B'>`, `tally: { countA, countB, percentA, percentB, majority: 'A' | 'B' | 'DRAW' }`
- Define Mode 4: Sabotage Trivia:
  - `TriviaQuestion`
  - `SabotageCard`
  - Enhance `Round4State` with `phase: 'CARD_PICK' | 'QUESTION' | 'REVEAL' | 'SUMMARY' | Round4Phase`, `trivia?: TriviaQuestion`, `activeCards?: Record<string, SabotageCard>`
- Export all aliases for smooth interoperability across workers.

### File 2: `src/data/questions.ts`
- Export `MLN131_FACT_OR_CAP_QUESTIONS`: 10 rich questions on MLN131 & digital democracy (an ninh mạng, tin giả, tự do có kỷ cương, Đề án 06, bóc mẽ seeder lừa đảo, quyền làm chủ số).
  Format: `{ id, statement, isFact: boolean, explanation: string, basePoints: 1000 }`.
- Export `MLN131_CONSENSUS_DILEMMAS`: 6 ethical dilemmas on digital governance.
  Format: `{ id, title, scenario, choiceA: string, choiceB: string, contextMLN131?: string }`.
- Maintain `MLN131_ROAST_PROMPTS` and `MLN131_QUESTIONS`.

### File 3: `src/app/api/game/route.ts`
- Implement action handlers in `POST`:
  - `SUBMIT_FEED_COMMENT` & `SUBMIT_COMMENT`
  - `REACT_FEED_POST` & `REACT_FEED` (+100 pts per reaction to comment author, tracks reaction tallies: heart, tomato, brick)
  - `SUBMIT_FACT_OR_CAP` (validates choice, uses `calculateSpeedDecayScore`, decrements lives on incorrect, handles Ghost Mode)
  - `SUBMIT_DILEMMA_STANCE` (records player's personal A/B stance)
  - `SUBMIT_DILEMMA_BET` (records player's bet on majority, recalculates realtime tally: countA, countB, percentA, percentB, majority)
  - `RETURN_TO_HUB` (resets status to `LOBBY`, preserves connected players)
  - Ensure existing `PLAY_CARD`, `WIPE_INK`, `SUBMIT_TRIVIA` leverage `calculateSpeedDecayScore`.

### File 4: `src/lib/syncEngine.ts`
- Add typed dispatch methods:
  - `submitFeedComment(text, playerId, playerName, avatarId)`
  - `reactFeedPost(postId, reactionType: 'heart' | 'tomato' | 'brick', voterId)`
  - `submitFactOrCap(choice: 'FACT' | 'CAP', remainingTime: number, totalTime: number, playerId: string)`
  - `submitDilemmaStance(stance: 'A' | 'B', playerId: string)`
  - `submitDilemmaBet(predictedMajority: 'A' | 'B', remainingTime: number, totalTime: number, playerId: string)`
  - `returnToHub()`

### File 5: `src/components/HostLobby.tsx`
- Add prominent top banner button:
  `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` with cyber neon styling, glowing effect, and direct 1-click launch.
- Update `roundsInfo` titles and descriptions for the 4 standalone modes:
  1. "VÒNG 1: TƯỜNG BÌNH LUẬN TRIỆU LIKE" (Trending Feed Wall)
  2. "VÒNG 2: ĐẠI CHIẾN BÓC PHỐT 5 GIÂY" (Fact or Cap 5s Reflex)
  3. "VÒNG 3: TRƯNG CẦU DÂN Ý: ĐOÁN PHE ĐA SỐ" (The Consensus Dilemma)
  4. "VÒNG 4: ĐẤU TRƯỜNG CHƠI XẤU CƯỚP ĐIỂM" (Sabotage Trivia)

## 3. Verification Plan
- Build check: `npm run build` must compile Next.js 14 App Router with 0 TypeScript/SSR errors.
- Unit check: Verify speed-decay scoring function with boundary conditions (100% time left, 50%, 0%, incorrect answer).
- Contract check: Verify all required exported symbols exist and match `PROJECT.md` contracts.
