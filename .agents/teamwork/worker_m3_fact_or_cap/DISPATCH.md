# Dispatch: worker_m3_fact_or_cap

## Task Assignment: Milestone 3 — Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)

You are assigned to implement Milestone 3:
1. `src/components/Round2Host.tsx`:
   - Replace legacy WarioWare mini-games (shake/drag) with the **Đại Chiến Bóc Phốt 5 Giây** projector engine:
     - Cycle through 5 statements from `MLN131_FACT_OR_CAP_QUESTIONS`.
     - 5.0-second universal ticking bomb timer:
       - Displays large glowing Bomb icon that transitions from green -> yellow -> flashing red.
       - Accelerating ticking audio SFX (`sound.playCountdownTick(true)`).
       - When timer reaches 0 or all players answer: plays bomb explosion (`sound.playExplosion()`).
     - Answer Reveal Phase:
       - Highlights correct answer: `[🟢 FACT / CHUẨN]` or `[🔴 CAP / BỐC PHÉT]`.
       - Displays 1-line MLN131 curriculum theoretical explanation.
       - Shows who survived, who lost a life, and top speed scores.
     - 3-Lives Tracking:
       - Tracks ❤️❤️❤️ for each participant.
       - Wrong answers or timeouts decrement 1 life.
       - 0 lives marks player as Ma Mạng 👻.
     - Final Round Summary:
       - Displays top survivors, most reflexive player, and "Quay Về Sảnh Chính (Return to Hub)" calling `sync.returnToHub()`.
2. `src/components/Round2Play.tsx`:
   - Mobile controller for Mode 2:
     - 100dvh viewport locked, thumb reach optimized.
     - Current remaining lives indicator (❤️❤️❤️).
     - 5.0-second visual countdown bar.
     - 2 giant touch target buttons:
       - `[ 🟢 FACT / CHUẨN MEN ]` (emerald/cyan neo-brutalist card)
       - `[ 🔴 CAP / BỐC PHÉT ]` (crimson/rose neo-brutalist card)
     - Dispatches `sync.submitFactOrCap(choice, reactionTimeMs, isCorrect, score)` using `calculateSpeedDecayScore(1000, remainingTime, 5.0, isCorrect)`.
     - Immediate disabled state after tapping to prevent duplicate score accumulation.
     - Visual feedback: Green flash on correct, cracked screen / bomb shake on wrong.
     - Ghost mode 👻 if 0 lives left.

## Files Owned Exclusively
- `src/components/Round2Host.tsx`
- `src/components/Round2Play.tsx`

## Mandatory Reference Documents
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\ORIGINAL_REQUEST.md` (Update 2026-10-19T15:28:48Z, lines 107-111, 122-126)
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md`
- `C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_rearchitect_code\analysis.md` (Section 3.2)

## Verification Requirements
- Verify `npm run build` exits with code 0 and 0 TypeScript errors.
- Create automated test suite `tests/suites/m3_fact_or_cap.test.ts` verifying:
  - 5-question progression.
  - 2-button FACT vs CAP submission.
  - Speed-decay scoring formula accuracy (`1000 * remaining / 5.0`).
  - 3-life decrement on wrong answer and ghost mode transition.
  - Return to Hub functionality.
- Write `changes.md` and `handoff.md` in `.agents/teamwork/worker_m3_fact_or_cap/`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
