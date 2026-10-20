# E2E Test Infra: NETIZEN PARTY (MLN131 Edition) — 4-Mode Platform

## Test Philosophy
- Requirement-driven, opaque-box, cross-platform party game testing.
- Verifies simultaneous 50-player classroom throughput, speed-decay mathematical invariants, direct Hub launch mechanisms, and bot simulation.

## Feature Inventory Mapping
| # | Feature | Requirement | Tier 1 | Tier 2 | Tier 3 |
|---|---------|-------------|:------:|:------:|:------:|
| 1 | Types & Speed-Decay | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 2 | Question & Dilemma Bank | ORIGINAL_REQUEST §R1-R4 | 5 | 5 | ✓ |
| 3 | Hub [Thử Ngay Mode 4] | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 4 | Delta API Multi-Mode Handlers | ORIGINAL_REQUEST §R1-R5 | 5 | 5 | ✓ |
| 5 | Mode 1: 45s Mass Submit | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | Mode 1: 30s Newsfeed Reactions | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 7 | Mode 1: Top Trending & Airhorn | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 8 | Mode 2: 5s Universal Bomb Timer | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Mode 2: Giant FACT / CAP Controls | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | Mode 2: Speed-Decay & Explosion | ORIGINAL_REQUEST §R2, §R5 | 5 | 5 | ✓ |
| 11 | Mode 3: Dilemma Presentation | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 12 | Mode 3: Stance Choice & Consensus Bet | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 13 | Mode 3: Tug-of-War Realtime Bar | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 14 | Mode 3: Majority +5000 & Minority Bricks | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 15 | Mode 4: Sabotage Card System | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 16 | Mode 4: Speed-Decay Trivia Final | ORIGINAL_REQUEST §R4, §R5 | 5 | 5 | ✓ |
| 17 | Dev Bot Simulator v2 All 4 Modes | Acceptance Criteria | 5 | 5 | ✓ |
| 18 | E2E Integration & 0 Build Errors | Acceptance Criteria | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: `npm test` (`npx tsx scripts/run_e2e_tests.mjs`).
- Suites:
  - `tests/suites/tier1_features.mjs`: Core feature coverage across all 4 modes.
  - `tests/suites/tier2_boundary.mjs`: Timing edges, 0ms, 4999ms vs 5001ms, 50/50 ties, extreme inputs.
  - `tests/suites/tier3_cross_feature.mjs`: Hub -> Mode 4 -> Return to Hub -> Mode 2 persistent sessions.
  - `tests/suites/tier4_real_world.mjs`: 50 concurrent students simulated classroom load.
  - `tests/suites/tier5_adversarial.mjs`: Security, sanitization, tampering prevention.
  - `tests/stress/m1_stress_harness.ts`: API route delta buffer stress and concurrency.
