# Handoff Report: Milestone 4 — Mode 3: Trưng Cầu Dân Ý (The Consensus Dilemma)

## 1. Observation
- Legacy components `Round3Host.tsx` and `Round3Play.tsx` previously contained the Among Us / Seeder expulsion social deduction gameplay.
- Interface contracts in `src/lib/types.ts` defined:
  - `Round3State` with `phase`, `dilemma: DilemmaItem`, `stances: Record<string, 'A' | 'B'>`, `consensusBets: Record<string, 'A' | 'B'>`, `tally: DilemmaTally`, and `playerChoices`.
  - `MLN131_CONSENSUS_DILEMMAS` in `src/data/questions.ts` lines 417-472 contains 6 ethical dilemmas tailored to the MLN131 curriculum.
  - Client actions `sync.submitDilemmaStance(stance, playerId)` and `sync.submitDilemmaBet(predictedMajority, remainingTime, totalTime, playerId)` in `src/lib/syncEngine.ts` lines 301-323.
  - Server handlers for `SUBMIT_DILEMMA_STANCE`, `SUBMIT_DILEMMA_BET`, and `RETURN_TO_HUB` in `src/app/api/game/route.ts` lines 616-683 and 789-798.
  - Procedural sound synthesizer methods in `src/lib/audioSynthesizer.ts`: `playCountdownTick`, `playWhistleAlarm`, `playVictoryFanfare`, `playSplat`, `playApplause`, `playTrollHorn`.
- Execution of `npx tsx tests/suites/m4_consensus_dilemma.test.ts` returned:
  ```
  ======================================================
  ✔ ALL MILESTONE 4: MODE 3 AUTOMATED TESTS PASSED (100%)
  ======================================================
  ```
- Execution of `npm test` returned:
  ```
  SUCCESS: ALL 68 E2E TESTS PASSED (100%)
  ```
- Execution of `npm run build` returned:
  ```
  ✓ Compiled successfully
  ✓ Generating static pages (7/7)
  ```
  with zero TypeScript or SSR compilation errors.

## 2. Logic Chain
1. **Host Projector Engine (`src/components/Round3Host.tsx`)**:
   - `DILEMMA_INTRO`: Displays the ethical dilemma (Topic, Scenario, Choices A and B, MLN131 theoretical background) and provides navigation controls and a prominent "Bắt Đầu Trưng Cầu Dân Ý (20s)" button.
   - `VOTING`: Sets a 20.0s master countdown timer driving audio ticks (`playCountdownTick`). A full-screen horizontal Tug-of-war cyber rope calculates dynamic center offset:
     `knotLeftPercent = Math.max(15, Math.min(85, 50 + ((tally.percentB - tally.percentA) / 100) * 40))`
     shifting smoothly in real-time as votes arrive. Live counters "[X] phiếu ([A]%)" vs "[Y] phiếu ([B]%)" and player avatar chips update dynamically.
   - `TUG_REVEAL`: Automatically triggers when timer expires or all participants have submitted both stance and bet. Whistle alarm (`playWhistleAlarm()`) sounds immediately. The rope snaps to the majority side (>50%). Correct consensus betters receive +5000 PTS (plus early speed-decay bonus). The minority side receives a brick and tomato barrage with splat SFX (`playSplat()`). In case of an exact 50/50 tie, a Consensus Draw is declared, awarding +2500 PTS each without bricks.
   - Return to Hub: The "Quay Về Sảnh Chính (Return to Hub)" button calls `sync.returnToHub()` and `onReturnToHub()`, resetting game status to `LOBBY` while preserving all accumulated player scores.
2. **Mobile Controller (`src/components/Round3Play.tsx`)**:
   - Built with strict `100dvh` lock and thumb reach ergonomic design.
   - Step 1 (Lập trường cá nhân): Renders large touch buttons `[ 🛡️ Phe A: <choiceA> ]` (Cyber Cyan) vs `[ ⚖️ Phe B: <choiceB> ]` (Cyber Crimson). Tapping locks the stance, vibrates haptics, plays chime, dispatches `sync.submitDilemmaStance`, and advances to Step 2.
   - Step 2 (Cược phe đa số >50%): Renders "THEO BẠN, TRÊN 50% CẢ LỚP SẼ CHỌN PHE NÀO?" with 2 bet buttons `[ 🎲 Cược Phe A Thắng ]` vs `[ 🎲 Cược Phe B Thắng ]`. Tapping immediately locks the buttons to prevent double submission, records `remainingTime`, and dispatches `sync.submitDilemmaBet`.
   - Result Card: Shows personal verdict ("Bạn chọn [Phe X]. Bạn cược [Phe Y] thắng."). If correct: Gold victory banner (+5000 PTS), confetti burst, victory fanfare. If minority: Comic cracked screen overlay with SVG spiderweb cracks, splattered tomato and brick impacts. If 50/50: Consensus Draw (+2500 PTS).
3. **Automated Verification (`tests/suites/m4_consensus_dilemma.test.ts`)**:
   - Validates question bank completeness, multi-player registration, real-time percentage and majority determination, 2-stage mobile stance and bet submission, Speed-Decay consensus betting scoring, 50/50 tie-break handling, and Return to Hub score retention.

## 3. Caveats
- `Round3Host.tsx` and `Round3Play.tsx` are designed to operate both online via HTTP delta polling and locally via `BroadcastChannel`. In environments without browser Web Audio API support (such as headless Node test environments), audio synthesizers safely degrade to no-ops.
- Speed-Decay scoring scales linearly with remaining time within the 20s window: `Math.round(BasePoints * Math.max(0, Math.min(1, remainingTime / totalTime)))`.

## 4. Conclusion
Milestone 4: Mode 3 (Trưng Cầu Dân Ý: Đoán Phe Đa Số) is fully implemented and genuinely operational. Both `Round3Host.tsx` and `Round3Play.tsx` satisfy all specifications from the dispatch requirements. Production build passes with 0 errors (`npm run build`), all existing 68 E2E tests pass, and the automated Mode 3 test suite passes at 100%.

## 5. Verification Method
1. Run automated Mode 3 test suite:
   ```bash
   npx tsx tests/suites/m4_consensus_dilemma.test.ts
   ```
   Expected result: Exit code 0, 8/8 steps passed.
2. Run full project test runner:
   ```bash
   npm test
   ```
   Expected result: Exit code 0, 68/68 tests passed.
3. Run Next.js production build:
   ```bash
   npm run build
   ```
   Expected result: Exit code 0, 0 TypeScript/ESLint errors, 7/7 static pages compiled.
