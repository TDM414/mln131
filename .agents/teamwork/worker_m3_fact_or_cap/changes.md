# Milestone 3 Changes: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)

## Overview
Replaced legacy WarioWare mini-games (shake/drag) with the **Đại Chiến Bóc Phốt 5 Giây** (Fact or Cap 5s Reflex) projector engine and mobile controller.

## Detailed File Modifications

### 1. `src/components/Round2Host.tsx` (Projector Host Engine)
- **Question Cycle**: Integrates 5 statements from `MLN131_FACT_OR_CAP_QUESTIONS`.
- **Universal 5.0s Ticking Bomb**:
  - Dynamically shifts color and pulse intensity: Emerald Green (>2.5s) ➔ Amber (1.0s - 2.5s) ➔ Flashing Crimson Red (<1.0s).
  - Accelerating Web Audio ticking sound (`sound.playCountdownTick(isUrgent)`).
  - Ticking transitions from 500ms intervals down to 200ms intervals when urgent.
  - Bomb explosion trigger on timer expiration or all players answering (`sound.playExplosion(true)`).
  - Screen shake keyframe reaction on explosion.
- **Answer Reveal Phase**:
  - Large animated badges: `[🟢 FACT / CHUẨN MEN]` or `[🔴 CAP / BỐC PHÉT]`.
  - Sound effects: `sound.playCorrectChime()` on FACT, `sound.playWrongBuzz()` on CAP.
  - Prominent 1-line MLN131 theoretical explanation box grounding the statement in socialist democracy and cyber-law.
  - Question outcomes grid: Top speed survivors, reaction times, speed-decay points, and 3-lives status overview.
- **3-Lives Tracking (❤️❤️❤️)**:
  - Tracks lives per player.
  - Decrements 1 life on wrong answer or timeout.
  - Marks players with 0 lives as Ma Mạng 👻.
- **Final Round Summary & Hub Navigation**:
  - Confetti celebration and victory fanfare (`sound.playVictoryFanfare()`).
  - Top 3 Survivors Podium, Vua Phản Xạ (fastest reflex), and room-wide leaderboard.
  - Prominent neo-brutalist button `[QUAY VỀ SẢNH CHÍNH (RETURN TO HUB)]` calling `sync.returnToHub()` and preserving room state/scores.
  - `[TIẾP TỤC SANG VÒNG 3]` button to advance to Round 3.

### 2. `src/components/Round2Play.tsx` (Mobile Controller)
- **Viewport & Ergonomics**:
  - `100dvh` viewport locked, thumb-reach optimized layout.
  - Player profile, score, and 3-lives health meter (`❤️❤️❤️`, `❤️❤️🖤`, `❤️🖤🖤`, `👻 MA MẠNG`).
- **Active 5.0s Reflex Mode**:
  - Visual 5.0-second countdown bar with smooth CSS width interpolation and color transitions.
  - Statement snippet for student context.
  - 2 giant touch buttons occupying full thumb zone:
    - `[🟢 FACT / CHUẨN MEN]` (Emerald-500 neo-brutalist card, `ShieldCheck` icon).
    - `[🔴 CAP / BỐC PHÉT]` (Rose-500 neo-brutalist card, `AlertTriangle` icon).
  - Immediate lock-in disabled state on first tap to prevent double submissions.
  - Dispatches `sync.submitFactOrCap(choice, remainingTime, 5000, playerId, currentQuestionIndex)`.
  - Haptic feedback (`navigator.vibrate(50)`) and punch tap SFX.
- **Answer Reveal Feedback**:
  - Green flash and victory badge on correct answer with recorded reaction time and points earned.
  - Cracked screen SVG overlay, screen shake, and bomb explosion feedback on wrong answer/timeout with life decrement notice.
  - MLN131 curriculum theoretical rationale displayed on mobile screen for immediate student reinforcement.
- **Ghost Mode (👻 Ma Mạng)**:
  - Activated when remaining lives reach 0.
  - Allows eliminated students to practice voting without affecting scores.
  - Dedicated Danmaku cheer & troll toolbar (`👻`, `💀`, `🔥`, `🍿`, `🍅`, `🧱`) broadcasting realtime comments to projector.

### 3. `tests/suites/m3_fact_or_cap.test.ts` (Automated Test Suite)
- **Speed-Decay Formula Verification**: Validated formula `calculateSpeedDecayScore(1000, remainingTime, 5000, isCorrect)` across 7 timing tiers and boundary cases.
- **Room Registration & 3-Lives Init**: Verified all students initialize with `r2Lives: 3`.
- **5-Question Cycle**: Verified questions 1 through 5 step sequentially.
- **Scoring & Decrement Logic**: Verified correct answers earn points scaled by reaction speed, wrong answers decrement lives from 3 -> 2 -> 1 -> 0 (Ghost mode).
- **Return to Hub Verification**: Verified `RETURN_TO_HUB` restores lobby status while keeping player scores 100% intact.
