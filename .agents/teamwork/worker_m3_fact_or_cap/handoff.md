# Handoff Report: Milestone 3 — Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)

## 1. Observation
- `src/components/Round2Host.tsx`:
  - Previously contained legacy WarioWare mini-game implementations (shake OTP, catch report, dodge bricks, spot deepfake).
  - Completely rewritten to the **Đại Chiến Bóc Phốt 5 Giây** projector engine:
    - Cycles through 5 statements from `MLN131_FACT_OR_CAP_QUESTIONS`.
    - Universal 5.0s ticking bomb timer with color transition (Green ➔ Amber ➔ Red pulse), accelerating ticks via `sound.playCountdownTick(isUrgent)`, and bomb explosion on timeout or when all active players answer (`sound.playExplosion(true)`).
    - Reveal phase displaying `[🟢 FACT / CHUẨN MEN]` or `[🔴 CAP / BỐC PHÉT]`, 1-line MLN131 curriculum theoretical rationale, top speed responders, and 3-lives status overview.
    - 3-lives tracking (❤️❤️❤️) with decrement on wrong answers or timeout, transitioning players with 0 lives into Ma Mạng 👻.
    - Final round podium with Top 3 Survivors, Vua Phản Xạ, and prominent "Quay Về Sảnh Chính (Return to Hub)" button invoking `sync.returnToHub()`.
- `src/components/Round2Play.tsx`:
  - Completely rewritten to mobile controller:
    - Viewport locked at 100dvh with thumb-zone ergonomics.
    - Live 3-lives health meter (`❤️❤️❤️`, `❤️❤️🖤`, `❤️🖤🖤`, `👻 MA MẠNG`).
    - Visual 5.0-second countdown bar.
    - Two giant neo-brutalist buttons: `[🟢 FACT / CHUẨN MEN]` (emerald) and `[🔴 CAP / BỐC PHÉT]` (rose).
    - Immediate disabled state on first tap to prevent double submissions.
    - Speed-Decay points calculation and dispatch via `sync.submitFactOrCap(choice, remainingTime, 5000, playerId, currentQuestionIndex)`.
    - Visual feedback on reveal: Green glow for correct answer, cracked screen SVG overlay with red danger vignette and screen shake for wrong answer or timeout.
    - Ghost Mode (👻) enabling eliminated players to participate in voting practice and broadcast Danmaku reactions.
- Production Build:
  - `npm run build` executed and passed with exit code 0, 0 TypeScript errors, generating all static and dynamic routes.
- Automated Tests:
  - Created `tests/suites/m3_fact_or_cap.test.ts` covering Speed-Decay scoring formula, player registration, 3-lives initialization, 5-question progression, life decrement, ghost mode transition, and return-to-hub persistence.
  - Executed `npx tsx tests/suites/m3_fact_or_cap.test.ts` with 100% pass (Exit Code 0).
  - Regression check: `npx tsx tests/suites/m2_trending_feed.test.ts` and `npx tsx tests/suites/m1_rearchitect_contracts.test.ts` both passed 100% (Exit Code 0).

## 2. Logic Chain
1. *Observation*: Requirements in `ORIGINAL_REQUEST.md` (R2, R5) and `DISPATCH.md` required replacing WarioWare mechanics with a 5-question Fact or Cap 5s reflex format, 2 giant touch buttons, 3 lives tracking, and speed-decay scoring.
2. *Deduction*: `Round2Host.tsx` needs to manage the 5.0s ticking bomb countdown, accelerate ticks as time elapses, trigger explosion, reveal MLN131 theoretical explanation, display survivor leaderboard, and provide a return to hub button.
3. *Deduction*: `Round2Play.tsx` must render 2 giant touch targets (`[🟢 FACT]` and `[🔴 CAP]`), lock inputs upon touch, calculate `remainingTime` and `calculateSpeedDecayScore`, display cracked screen on wrong answers, and transition to Ghost Mode upon losing all 3 lives.
4. *Validation*: Building the application with Next.js (`npm run build`) verifies that all TypeScript types, React hook usages, and Next.js App Router static generations compile cleanly.
5. *Verification*: Automated test suite `tests/suites/m3_fact_or_cap.test.ts` exercises the full lifecycle from multi-student registration to 5-question progression, speed-decay scoring, life loss, ghost transition, and hub return, validating correctness under automated assertions.

## 3. Caveats
- Browser Web Audio API requires user gesture to start playing sound. Both host and client interfaces already have initial interactive tap points (e.g. "KÍCH HOẠT QUẢ BOM" on host, and joining room / tapping options on mobile) that satisfy this policy.
- Bot simulation for Mode 2 in `DevBotSimulator.tsx` is scheduled for Milestone 5 as defined in `PROJECT.md`. The Mode 2 components implemented in this milestone are fully compatible with both real human players and bot sync events.

## 4. Conclusion
Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex) is completely implemented, verified, and ready for integration. All acceptance criteria and dispatch requirements are 100% fulfilled.

## 5. Verification Method
Run the following commands in the workspace root:
1. `npm run build` — Confirms 0 TypeScript errors and successful production build.
2. `npx tsx tests/suites/m3_fact_or_cap.test.ts` — Runs the dedicated Milestone 3 automated test suite.
3. `npx tsx tests/suites/m2_trending_feed.test.ts` — Verifies Milestone 2 regression safety.
4. `npx tsx tests/suites/m1_rearchitect_contracts.test.ts` — Verifies Milestone 1 contract safety.
