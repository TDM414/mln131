# Changes Summary: Milestone 1 — Foundation, Contracts, Question Bank & Hub Quick-Launch

## Files Modified

### 1. `src/lib/types.ts`
- **Master Speed-Decay Scoring Engine**:
  - Exported `calculateSpeedDecayScore(basePoints: number, remainingTime: number, totalTime: number, isCorrect: boolean): number`.
  - Implements genuine formula: returns `0` if `!isCorrect` or `totalTime <= 0`, else `Math.round(basePoints * Math.max(0, Math.min(1, remainingTime / totalTime)))`.
- **Mode 1 (Trending Feed Wall)**:
  - Added `FeedComment` (`id`, `authorId`, `authorName`, `avatarId`, `text`, `reactions: { heart, tomato, brick }`, `score`).
  - Added `TrendingPost` (`id`, `playerId`, `playerName`, `avatarId`, `text`, `likes`, `tomatoes`, `bricks`, `totalReactions`).
  - Added `PromptItem` alias for `RoastPrompt`.
  - Expanded `Round1Phase` with `'PROMPT' | 'SUBMITTING' | 'COMMENT_INPUT' | 'FEED_REACTION' | 'TOP_TRENDING' | 'TRENDING_REVEAL'`.
  - Updated `Round1State` with `prompt`, `comments`, `posts`, `trendingTopIds` while keeping `submissions`, `duels` for compatibility.
  - Added alias `TrendingState = Round1State`.
- **Mode 2 (Fact or Cap 5s Reflex)**:
  - Added `FactCapQuestion` / `FactOrCapQuestion` (`id`, `statement`, `isFact: boolean`, `explanation`, `category`, `basePoints: number`).
  - Added `FactCapAnswer` (`choice: 'FACT' | 'CAP'`, `timestamp`, `remainingTime`, `isCorrect`, `score`, `livesRemaining`).
  - Expanded `Round2Phase` with `'COUNTDOWN' | 'QUESTION' | 'QUESTION_ACTIVE' | 'QUESTION_RESULT' | 'REVEAL' | 'SUMMARY'`.
  - Updated `Round2State` with `questions`, `answers` while retaining `gamesList`, `playerResults` compatibility.
  - Added alias `FactCapState = Round2State`.
- **Mode 3 (Consensus Dilemma Trưng Cầu Dân Ý)**:
  - Added `DilemmaItem` / `ConsensusDilemma` (`id`, `title`, `topic`, `scenario`, `choiceA`, `choiceB`, `contextMLN131`).
  - Added `DilemmaTally` (`countA`, `countB`, `percentA`, `percentB`, `majority: 'A' | 'B' | 'DRAW'`).
  - Expanded `Round3Phase` with `'DILEMMA_INTRO' | 'VOTING' | 'VOTE_AND_BET' | 'TUG_REVEAL' | 'TUG_OF_WAR_REVEAL' | 'SUMMARY'`.
  - Updated `Round3State` with `dilemma`, `dilemmas`, `stances`, `consensusBets`, `tally`, while retaining `clues`, `votes` compatibility.
  - Added alias `DilemmaState = Round3State`.
- **Mode 4 (Sabotage Trivia)**:
  - Expanded `Round4Phase` with `'CARD_PICK' | 'QUESTION' | 'REVEAL' | 'SUMMARY'`.
  - Updated `Round4State` with `trivia`, `activeCards`.
  - Added alias `TriviaState = Round4State`.

### 2. `src/data/questions.ts`
- Added `MLN131_FACT_OR_CAP_QUESTIONS`: 10 curated statements on socialist democracy, rule of law, Decree 15/2020/ND-CP, Project 06 (VNeID), digital community teams, algorithm biases, and citizen reflection apps.
- Added `MLN131_CONSENSUS_DILEMMAS`: 6 high-stakes ethical dilemmas exploring digital security vs personal privacy, mandatory identification vs anonymity, algorithmic regulation vs market autonomy, livestreamed governance vs expert deliberative democracy, educational deepfakes vs dignity protection, and platform pre-emptive takedowns vs due process.
- Maintained existing `MLN131_ROAST_PROMPTS`, `MLN131_QUESTIONS`, `ROAST_QUICK_CHIPS`, `VIETNAMESE_ROAST_BANK`, and profanity filter.

### 3. `src/app/api/game/route.ts`
- Updated initial round states (`createInitialRound1State`, `createInitialRound2State`, `createInitialRound3State`, `createInitialRound4State`) to populate all new fields (`comments`, `posts`, `questions`, `answers`, `dilemma`, `stances`, `consensusBets`, `tally`, `trivia`).
- Added POST action handlers:
  - `SUBMIT_FEED_COMMENT` & `SUBMIT_COMMENT`: sanitized comment submission into `comments`, `posts`, and `submissions`.
  - `REACT_FEED_POST` & `REACT_FEED`: recorded reactions (❤️, 🍅, 🧱), awarded +100 pts to author score, dynamically recomputed top 5 `trendingTopIds`.
  - `SUBMIT_FACT_OR_CAP`: verified answer correctness, scored via `calculateSpeedDecayScore`, decremented lives on error, recorded detailed answer metadata.
  - `SUBMIT_DILEMMA_STANCE`: recorded personal A/B stance, automatically recalculated real-time Tug-of-war tally (`countA`, `countB`, `percentA`, `percentB`, `majority`).
  - `SUBMIT_DILEMMA_BET`: recorded prediction on majority, computed speed-decay points for winning prediction.
  - `RETURN_TO_HUB`: smoothly transitioned game status back to `LOBBY` with `currentRoundPhase = 'LOBBY_WAITING'`.
  - `SUBMIT_TRIVIA`: upgraded scoring to compute speed decay (`BasePoints * (RemainingTime / TotalTime) * Multiplier`).

### 4. `src/lib/syncEngine.ts`
- Added client helper dispatch methods:
  - `submitFeedComment(text, playerId, playerName, avatarId)`
  - `reactFeedPost(postId, reactionType, voterId)`
  - `submitFactOrCap(choice, remainingTime, totalTime, playerId, questionIndex)`
  - `submitDilemmaStance(stance, playerId)`
  - `submitDilemmaBet(predictedMajority, remainingTime, totalTime, playerId)`
  - `returnToHub()`

### 5. `src/components/HostLobby.tsx`
- Added prominent quick-launcher banner at the top of the lobby:
  `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` with cyber neon styling, glowing drop shadow, active translate animation, and direct 1-click execution (`onSelectMode('FREE_PLAY')`, `onStartRound('ROUND_4')`).
- Updated `roundsInfo` for all 4 standalone modes:
  - Vòng 1: TƯỜNG BÌNH LUẬN TRIỆU LIKE (Trending Feed Wall)
  - Vòng 2: ĐẠI CHIẾN BÓC PHỐT 5 GIÂY (Fact or Cap 5s Reflex)
  - Vòng 3: TRƯNG CẦU DÂN Ý: ĐOÁN PHE ĐA SỐ (The Consensus Dilemma)
  - Vòng 4: ĐẤU TRƯỜNG CHƠI XẤU CƯỚP ĐIỂM (Sabotage Trivia Final)

### 6. `tests/suites/m1_rearchitect_contracts.test.ts`
- Created automated test suite covering speed-decay formula edge cases, question bank schemas, Mode 1 feed comment and reaction, Mode 2 fact/cap speed decay, Mode 3 consensus stance & bet, and return to hub.
