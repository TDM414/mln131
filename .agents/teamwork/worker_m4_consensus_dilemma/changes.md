# Changes: Milestone 4 — Mode 3: Trưng Cầu Dân Ý: Đoán Phe Đa Số (The Consensus Dilemma)

## Overview
Milestone 4 replaces the legacy social deduction / Seeder expulsion mode with **Trưng Cầu Dân Ý: Đoán Phe Đa Số (The Consensus Dilemma)**, an interactive, high-stakes socio-ethical tug-of-war game built around the MLN131 curriculum.

## 1. `src/components/Round3Host.tsx`
- **Phase 1: DILEMMA_INTRO**:
  - Displays curated MLN131 ethical dilemmas from `MLN131_CONSENSUS_DILEMMAS` (Topic, Scenario, Choice A, Choice B, MLN131 theoretical background).
  - Dilemma selector navigation for Host to preview or switch dilemmas.
  - Neo-brutalist "Bắt Đầu Trưng Cầu Dân Ý (20s)" button with `sound.playTrollHorn()`.
- **Phase 2: VOTING (20.0s)**:
  - 20.0s countdown master timer with progressive progress bar and synchronized audio ticking (`sound.playCountdownTick(isUrgent)`).
  - Real-time animated **Tug-of-war (Kéo co)** projector arena:
    - Left Bunker: Phe A (Cyber Cyan `#06D6A0`), displaying choice summary, live vote counter, and percentage.
    - Right Bunker: Phe B (Cyber Crimson `#EF233C`), displaying choice summary, live vote counter, and percentage.
    - Central Cyber Rope spanning horizontally with dynamic knot position `knotLeftPercent = 50 + offset * 0.7` bounded between 15% and 85%, oscillating and shifting dynamically as votes arrive in real time.
    - Live voter avatar chips updating beneath each team bunker.
    - Bot simulation quick action and early reveal trigger for Host convenience.
- **Phase 3: TUG_REVEAL & SUMMARY**:
  - Whistle alarm `sound.playWhistleAlarm()` immediately upon reveal.
  - Final tug animation snapping to the majority side (>50%).
  - Tuyên bố: "PHE ĐA SỐ CHIẾN THẮNG!" (>50% majority).
  - Awards +5000 PTS (plus early speed-decay bonus) to all players who correctly bet on the majority side.
  - Minority side penalty visual: brick barrage and tomato splat overlay (`sound.playSplat()`).
  - Handles exact 50/50 tie: Consensus Draw (+2,500 PTS to all participants, `sound.playApplause()`, no bricks).
  - Host action buttons: "Dilemma Tiếp Theo", "Quay Về Sảnh Chính (Return to Hub)" calling `sync.returnToHub()`, and "Vòng 4: Chơi Xấu".

## 2. `src/components/Round3Play.tsx`
- **Mobile Viewport & Styling**:
  - 100dvh viewport locking with thumb reach zones and Neo-brutalist dark cyber aesthetic.
- **Phase 1: DILEMMA_INTRO**:
  - Displays dilemma title, scenario summary, preview of Choice A vs Choice B, and waiting status.
- **Phase 2: VOTING (2-Stage Interactive Flow)**:
  - **Step 1: Lập trường cá nhân**:
    - Large tactile touch buttons: `[ 🛡️ Phe A: <choiceA> ]` (Cyan) vs `[ ⚖️ Phe B: <choiceB> ]` (Crimson).
    - Haptic feedback (`navigator.vibrate(30)`), sound chime (`sound.playCorrectChime()`).
    - Immediate button locking and seamless transition to Step 2.
    - Dispatches `sync.submitDilemmaStance(choice, playerId)`.
  - **Step 2: Cược phe đa số (>50%)**:
    - Title: "THEO BẠN, TRÊN 50% CẢ LỚP SẼ CHỌN PHE NÀO?"
    - 2 large bet buttons: `[ 🎲 Cược Phe A Thắng (>50%) ]` vs `[ 🎲 Cược Phe B Thắng (>50%) ]`.
    - Immediate locking on tap to prevent double submissions.
    - Dispatches `sync.submitDilemmaBet(bet, remainingTime, 20000, playerId)`.
    - Displays locked-in summary card and prompts player to watch projector rope.
- **Phase 3: TUG_REVEAL / SUMMARY**:
  - Shows personal verdict card: Stance chosen, Bet placed, Room majority result.
  - If bet correctly on majority: Gold victory banner (+5000 PTS), confetti burst, `sound.playVictoryFanfare()`.
  - If minority: Comic cracked screen overlay with broken glass lines, brick and tomato splatter, `sound.playSplat()`.
  - If 50/50 Draw: "🤝 HÒA ĐỒNG THUẬN 50/50! +2,500 PTS".
  - Always accessible bottom Danmaku reaction pad (🔥, 🍅, 🧱, ❤️, 👏, 🍿).

## 3. `tests/suites/m4_consensus_dilemma.test.ts`
- Comprehensive automated test suite validating:
  - Step 1: MLN131 Consensus Dilemma Question Bank (6 rich dilemmas).
  - Step 2: 6-student registration in room session.
  - Step 3: Mode 3 initialization & DILEMMA_INTRO phase.
  - Step 4: Real-time Tug-of-war dynamic percentage and majority calculation across 5 sequential vote submissions (100% -> 50% tie -> 60% majority).
  - Step 5: 2-stage mobile consensus betting with Speed-Decay tracking.
  - Step 6: Phase 3 TUG_REVEAL & majority score allocation (+5000 base + speed decay, minority receives 0).
  - Step 7: 50/50 tie-break handling (Consensus Draw: +2500 PTS to all participants).
  - Step 8: Return to Hub action with score preservation.
