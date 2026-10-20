# Dispatch: worker_m4_consensus_dilemma

## 2026-10-19T17:02:15Z
### Task Assignment: Milestone 4 — Mode 3: Trưng Cầu Dân Ý: Đoán Phe Đa Số (The Consensus Dilemma)

You are assigned to implement Milestone 4:
1. `src/components/Round3Host.tsx`:
   - Completely replace legacy Among Us / Seeder expulsion with the **Trưng Cầu Dân Ý (Consensus Dilemma)** projector engine:
     - **Phase 1 (DILEMMA_INTRO)**:
       - Displays MLN131 ethical dilemma from `MLN131_CONSENSUS_DILEMMAS` (Topic, Situation, Choice A, Choice B, MLN131 context).
       - Host "Bắt Đầu Trưng Cầu Dân Ý" button.
     - **Phase 2 (VOTING — 20s)**:
       - Master 20.0s countdown timer with ticking sound (`sound.playCountdownTick(isUrgent)`).
       - Real-time animated **Tug-of-war (Kéo co)** bar/rope across the screen:
         - Left: Phe A (Cyber Cyan), Right: Phe B (Cyber Crimson/Rose).
         - Central tug knot / balance scale dynamically shifting left/right in real time according to `tally.percentA` vs `tally.percentB`.
         - Displays live voter counters: "[X] phiếu ([A]%)" vs "[Y] phiếu ([B]%)".
     - **Phase 3 (TUG_REVEAL / SUMMARY)**:
       - Whistle alarm (`sound.playWhistleAlarm()`).
       - Final tug animation snapping to the majority side.
       - Tuyên bố: "PHE ĐA SỐ CHIẾN THẮNG!" (>50% majority).
       - Awards +5000 PTS (plus early speed-decay bonus) to all players who correctly bet on the majority side.
       - Minority side penalty visual: brick barrage / cracked screen effect.
       - Handles exact 50/50 tie: Consensus Draw (+2500 PTS each, no bricks).
       - Buttons: "Dilemma Tiếp Theo" and "Quay Về Sảnh Chính (Return to Hub)" calling `sync.returnToHub()`.
2. `src/components/Round3Play.tsx`:
   - Mobile controller for Mode 3:
     - 100dvh viewport lock, thumb reach layout.
     - **Step 1 (Lập trường cá nhân)**:
       - `[ 🛡️ Phe A: <choiceA> ]` (Cyber Cyan button)
       - `[ ⚖️ Phe B: <choiceB> ]` (Cyber Crimson button)
     - **Step 2 (Cược phe đa số >50%)**:
       - Title: "THEO BẠN, TRÊN 50% CẢ LỚP SẼ CHỌN PHE NÀO?"
       - 2 big bet buttons: `[ 🎲 Cược Phe A Thắng ]` vs `[ 🎲 Cược Phe B Thắng ]`.
       - Immediate button locking on tap to prevent double submissions.
       - Dispatches `sync.submitDilemmaStance(stance)` and `sync.submitDilemmaBet(bet, remainingTime, 20000, playerId)`.
     - **Phase 3 (Phán quyết & Kết quả)**:
       - Shows personal result: "Bạn chọn [Phe X]. Bạn cược [Phe Y] thắng."
       - If bet correctly on majority: Gold victory banner (+5000 PTS), confetti.
       - If minority: Comic cracked screen and brick splatter.
3. Verification:
   - Run `npm run build` and ensure 0 TypeScript / compilation errors.
   - Create and run automated test suite `tests/suites/m4_consensus_dilemma.test.ts` verifying:
     - 2-stage mobile stance and majority bet submission.
     - Real-time Tug-of-war percentage and majority calculation.
     - +5000 majority score allocation and 50/50 tie-break handling.
     - Return to Hub score preservation.
   - Write changes to `changes.md` and handoff report to `handoff.md`.

## Files Owned Exclusively
- `src/components/Round3Host.tsx`
- `src/components/Round3Play.tsx`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
