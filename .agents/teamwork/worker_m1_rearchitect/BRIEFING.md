# BRIEFING — 2026-10-19T15:47:00Z

## Mission
Implement Milestone 1: Master data models & Speed-Decay function, question banks for Fact/Cap & Dilemmas, API action handlers, sync engine dispatchers, and HostLobby quick-launch banner.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m1_rearchitect
- Original parent: dcd6312c-918d-4ca5-957d-512b431b5686
- Milestone: Milestone 1 — Foundation, Contracts, Question Bank & Hub Quick-Launch

## 🔒 Key Constraints
- Files owned exclusively: `src/lib/types.ts`, `src/data/questions.ts`, `src/app/api/game/route.ts`, `src/lib/syncEngine.ts`, `src/components/HostLobby.tsx`.
- Master speed decay formula: `calculateSpeedDecayScore(basePoints, remainingTime, totalTime, isCorrect)`. If not correct -> 0; else `Math.round(basePoints * Math.max(0, Math.min(1, remainingTime / totalTime)))`.
- Must maintain backwards compatibility for existing imports in Round 1-4 until those workers update them.
- Must preserve build validity: `npm run build` must pass cleanly with 0 TypeScript/SSR errors.
- Never hardcode or fake implementations. Genuine logic only.

## Current Parent
- Conversation ID: dcd6312c-918d-4ca5-957d-512b431b5686
- Updated: 2026-10-19T15:47:00Z

## Task Summary
- **What to build**: Master models for 4 modes in `types.ts`, `calculateSpeedDecayScore`, MLN131 Fact/Cap (8-10 items) and Dilemmas (5-6 items) in `questions.ts`, POST action handlers for all new actions in `route.ts`, client helper methods in `syncEngine.ts`, and prominent `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` launcher in `HostLobby.tsx`.
- **Success criteria**: All new interfaces exported, questions populated with high academic & Gen Z relevance, speed-decay scoring applied accurately, client sync methods available, host lobby launches Mode 4 Free-Play, `npm run build` succeeds with 0 errors.
- **Interface contracts**: `PROJECT.md` § Interface Contracts.
- **Code layout**: `PROJECT.md` § Code Layout.

## Change Tracker
- **Files modified**:
  - `src/lib/types.ts`: Master types for Modes 1-4, `calculateSpeedDecayScore`, phase enums, state aliases.
  - `src/data/questions.ts`: Added `MLN131_FACT_OR_CAP_QUESTIONS` (10 questions) and `MLN131_CONSENSUS_DILEMMAS` (6 ethical dilemmas).
  - `src/app/api/game/route.ts`: Updated initial round states, added handlers for `SUBMIT_FEED_COMMENT`, `REACT_FEED_POST`, `SUBMIT_FACT_OR_CAP`, `SUBMIT_DILEMMA_STANCE`, `SUBMIT_DILEMMA_BET`, `RETURN_TO_HUB`, and speed-decay scoring for `SUBMIT_TRIVIA`.
  - `src/lib/syncEngine.ts`: Added client dispatch methods for all 4 new modes and returnToHub.
  - `src/components/HostLobby.tsx`: Added prominent quick launcher `[🔥 Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm 👑]` and updated descriptions for all 4 standalone modes.
  - `tests/suites/m1_rearchitect_contracts.test.ts`: Added unit and contract verification suite.
- **Build status**: `npm run build` passed with exit code 0.
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (`npm run build` clean; `npm test` 68/68 passed; `m1_rearchitect_contracts.test.ts` 6/6 passed).
- **Lint status**: Clean (validity of types passed).
- **Tests added/modified**: `tests/suites/m1_rearchitect_contracts.test.ts` (covers speed-decay boundary math, question banks integrity, feed comment & reaction, fact/cap speed-decay, consensus stance & bet, return to hub).

## Loaded Skills
- None

## Key Decisions Made
- Keep backwards compatibility aliases and optional fields on `Round1State`, `Round2State`, `Round3State`, `Round4State` to prevent breaking existing components before their respective milestone rewrites.
- In `route.ts`, `REACT_FEED_POST` awards +100 score directly to comment author's total score and round 1 score while updating reaction tallies and recalculating top trending IDs.
- In `route.ts`, `SUBMIT_DILEMMA_STANCE` automatically computes real-time percentages (`percentA`, `percentB`, `majority`) to drive Tug-of-war visual state.
- In `HostLobby.tsx`, quick launch banner directly switches mode to `FREE_PLAY` and activates `ROUND_4`.

## Artifact Index
- `DISPATCH.md` — Assignment instructions
- `BRIEFING.md` — Persistent situational awareness
- `progress.md` — Liveness heartbeat and step tracking
- `plan.md` — Implementation plan
- `changes.md` — Summary of code changes
- `handoff.md` — Final 5-component handoff report
