# BRIEFING — 2026-10-19T16:37:00Z

## Mission
Implement Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex) for both Projector Host engine (Round2Host.tsx) and Mobile Controller (Round2Play.tsx) with speed-decay scoring, 3-lives tracking, 5-question progression, bomb audio effects, and automated verification tests.

## 🔒 My Identity
- Archetype: worker_m3_fact_or_cap
- Roles: implementer, qa, specialist
- Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m3_fact_or_cap
- Original parent: dcd6312c-918d-4ca5-957d-512b431b5686
- Milestone: Milestone 3 — Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)

## 🔒 Key Constraints
- Files owned exclusively: `src/components/Round2Host.tsx` and `src/components/Round2Play.tsx`.
- Follow strict Integrity Mandate: NO CHEATING, genuine logic, real state and behavior.
- Clean production build: `npm run build` exits 0 with 0 errors.
- Automated tests in `tests/suites/m3_fact_or_cap.test.ts`.
- Return to Hub functionality without session reset or losing player scores.

## Current Parent
- Conversation ID: dcd6312c-918d-4ca5-957d-512b431b5686
- Updated: 2026-10-19T16:37:00Z

## Task Summary
- **What to build**:
  - `Round2Host.tsx`: 5-question Fact or Cap projector engine, 5.0s ticking bomb timer with accelerating tick SFX, bomb explosion SFX, correct answer reveal with MLN131 theoretical explanation, 3 lives (❤️❤️❤️) tracking per player, and Return to Hub button.
  - `Round2Play.tsx`: Mobile controller with 2 giant touch buttons [🟢 FACT / CHUẨN] and [🔴 CAP / BỐC PHÉT], 5s visual countdown bar, 3 lives display, Speed-Decay scoring formula `1000 * remainingTime / 5.0`, immediate button disabling, visual feedback (green flash / cracked screen bomb shake), and Ghost mode 👻 for eliminated players.
  - Test suite `tests/suites/m3_fact_or_cap.test.ts`.
- **Success criteria**: 100% test pass, clean build, authentic reactive UI.
- **Interface contracts**: `PROJECT.md`, `src/lib/types.ts`.
- **Code layout**: `src/components/Round2Host.tsx`, `src/components/Round2Play.tsx`, `tests/suites/m3_fact_or_cap.test.ts`.

## Change Tracker
- **Files modified**:
  - `src/components/Round2Host.tsx`: Complete rewrite implementing Fact or Cap 5s projector engine, 5 questions, ticking bomb, explosion, MLN131 theoretical explanation, 3 lives tracking, and Return to Hub.
  - `src/components/Round2Play.tsx`: Complete rewrite implementing mobile controller, 2 giant touch buttons [FACT] and [CAP], speed-decay scoring, cracked screen feedback, and Ghost Mode 👻.
  - `tests/suites/m3_fact_or_cap.test.ts`: Automated test suite covering speed-decay formula, registration, 5-question cycle, life decrement, and return to hub.
- **Build status**: `npm run build` PASS (Exit Code 0, 0 errors).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: All tests in `tests/suites/m3_fact_or_cap.test.ts`, `tests/suites/m2_trending_feed.test.ts`, and `tests/suites/m1_rearchitect_contracts.test.ts` PASS 100%.
- **Lint status**: Clean.
- **Tests added/modified**: `tests/suites/m3_fact_or_cap.test.ts` (100% pass).

## Loaded Skills
- None explicitly assigned.

## Key Decisions Made
- Projector Host implementation:
  - 5-question progression using `MLN131_FACT_OR_CAP_QUESTIONS`.
  - Accelerating ticking Web Audio SFX (500ms -> 200ms) with animated glowing Bomb transition (Green -> Amber -> Flashing Red).
  - Explosion trigger on timeout or all active players answered.
  - Clear MLN131 curriculum theoretical rationale displayed during reveal.
  - 3-lives tracking with timeout/wrong-answer decrement.
  - Return to Hub preserving all room state and scores via `sync.returnToHub()`.
- Mobile Controller implementation:
  - 100dvh viewport locked, thumb reach optimized.
  - 2 giant neo-brutalist buttons: [🟢 FACT] and [🔴 CAP].
  - Immediate lock-in disabled state to avoid duplicate dispatch.
  - Speed-decay scoring: `1000 * remainingTime / 5000`.
  - Visual feedback: Green flash on correct, cracked screen SVG overlay + red danger vignette on error.
  - Ghost Mode 👻 with Danmaku reaction toolbar.

## Artifact Index
- `BRIEFING.md` — Agent working memory
- `progress.md` — Liveness heartbeat
- `changes.md` — Detailed modification log
- `handoff.md` — 5-component handoff report
