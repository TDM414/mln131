# E2E Test Architecture & Verification Plan
## NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition) - 4 Redesigned Game Modes

**Document Version:** 2.0  
**Target Milestone:** Full Game Redesign (2026-10-19T15:28:48Z Specification)  
**Author:** Explorer Agent (`explorer_test_e2e_plan`)  
**Status:** Approved for Implementation Planning  

---

## 1. Executive Summary & Existing Test Suite Audit

An exhaustive audit of the test architecture in `democracy-raid-mln131` was conducted. The current test suite runs via:
```bash
npm test # -> npx tsx scripts/run_e2e_tests.mjs
```
The test harness currently executes **68 tests across 6 Tiers** with a 100% pass rate in ~1.7 seconds.

### Test Asset Inventory
| File Path | Role | Current Status |
|-----------|------|----------------|
| `scripts/run_e2e_tests.mjs` | Master test runner with colored terminal dashboard and high-resolution timing. | Fully operational, aggregates Tiers 1-6. |
| `tests/lib/gameShowEngine.mjs` | Opaque-box game state machine simulating server state transitions. | Implements **legacy** 1v1 Quiplash duels, WarioWare micro-games, and Seeder deduction. Needs refactoring for the 4 new modes. |
| `tests/fixtures/mockData.mjs` | Static test fixtures (avatars, prompts, micro-games, cards). | Contains obsolete R2 micro-game and R3 clue fixtures. Needs MLN131 Dilemmas and Fact/Cap statement banks. |
| `tests/suites/tier1_features.mjs` | Tier 1 Feature specifications (15 tests). | Asserts legacy 1v1 duels (T1.4-T1.6), legacy micro-games (T1.7-T1.8), and Seeder deduction (T1.9-T1.10). |
| `tests/suites/tier2_boundary.mjs` | Tier 2 Boundary & Corner cases (16 tests). | Asserts 120-char clamp, 5s timeout, duel ties, and heist math. Needs speed-decay and consensus tie tests. |
| `tests/suites/tier3_cross_feature.mjs` | Tier 3 Integration tests (3 tests). | Asserts linear tournament cascade (R1 -> R2 -> R3 -> R4). Needs independent mode transitions and "Return to Hub". |
| `tests/suites/tier4_real_world.mjs` | Tier 4 Concurrency & Network tests (4 tests). | 50-client delta polling benchmark (<50ms), disconnect/reconnect catch-up, buffer bounds, Web Audio API contract. |
| `tests/suites/tier5_adversarial.mjs` | Tier 5 Chaos & Security hardening (7 tests). | XSS sanitization, duplicate vote blocking, illegal out-of-phase actions, counterfeit cards, shield deflection. |
| `tests/stress/m1_stress_harness.ts` | Tier 6 Live API route stress harness (23 tests). | Tests `/api/game` under 50 concurrent joins, rapid polling, ring buffer overflow, and malformed payload injection. |
| `src/components/DevBotSimulator.tsx` | In-browser autonomous bot simulator (15-20 bots). | Configured for legacy 1v1 duels, micro-games, and expulsion voting. Needs full rewrite for the 4 new modes. |

---

## 2. Gap Analysis vs Authoritative Redesign Specification (2026-10-19T15:28:48Z)

| Functional Area | Current Implementation in Tests & Code | Authoritative Requirement in ORIGINAL_REQUEST.md | Test Gaps & Required Changes |
|-----------------|-----------------------------------------|--------------------------------------------------|------------------------------|
| **Hub & Mode Selection** | `TOURNAMENT` (linear R1->R4) vs `FREE_PLAY` mode select; standard round launch buttons. | Independent Party Game Hub with 4 independent Game Modes. Prominent **`[Thử Ngay Mode 4]`** direct launch button on Hub. Players stay connected when returning to Hub. | Add tests for Mode 4 direct launch, room return to Hub, player state persistence without re-join. |
| **Mode 1: Trending Feed Wall** | 1v1 Quiplash duels (`duels`, `pairDuels`, `voteRoast` between A & B). High latency (~25 duel rounds for 50 players). | **"Tường Bình Luận Triệu Like"**: 50 students simultaneously submit comments in 45s; 30s reaction phase where all students browse feed and react with ❤️, 🍅, 🧱; Top Trending ranking displayed on projector with SFX. Total duration: 1.5 - 2 mins. | Replace 1v1 duel tests with simultaneous 50-player submission, reaction event stream (`FEED_REACTION`), reaction tallies, and Top Trending sorting. |
| **Mode 2: Fact or Cap 5s** | 4 micro-games (Catch Report, Shake OTP, Dodge Bricks, Spot Deepfake) requiring device tilt/shake and dragging. | **"Đại Chiến Bóc Phốt 5 Giây"**: Eliminates tilt/shake. Projector flashes 5 explosive statements about MLN131 with 5s ticking bomb. Mobile has only **2 giant buttons**: `[🟢 FACT / CHUẨN]` and `[🔴 CAP / BỐC PHÉT]`. Wrong answer triggers bomb explosion. | Replace micro-game tests with 5s binary Fact/Cap submission, bomb timer expiration, wrong answer explosion, and life/score penalty. |
| **Mode 3: The Consensus Dilemma** | Among Us Social Deduction: secret Seeder role assignment (~10%), clue inspection, discussion shoutbox, expulsion voting. | **"Trưng Cầu Dân Ý: Đoán Phe Đa Số"**: No secret impostors, no blaming classmates. MLN131 ethical dilemmas. Players (1) choose stance [A] vs [B], and (2) bet on whether >50% of the class will pick [A] or [B]. Projector shows real-time Tug-of-War bar. Correct majority bet earns +5000 pts; minority gets bricked. | Replace secret role & expulsion tests with dilemma presentation, A/B stance + majority bet submission, Tug-of-War real-time ratio, and +5000 consensus reward math. |
| **Mode 4: Sabotage Trivia** | Sabotage card draft + trivia. | **"Đấu Trường Chơi Xấu Cướp Điểm"**: Direct Hub launch button `[Thử Ngay Mode 4]`, high-stakes MLN131 trivia with Speed-Decay scoring and sabotage cards (Ink, Heist, 2x Bet, Shield). | Verify direct launch from Hub, Speed-Decay trivia scoring, ink wipe threshold, point heist (50% floor), and shield deflection. |
| **Speed-Decay Scoring Engine** | Hardcoded static formulas (e.g. `(5000 - timeMs)/5` or flat 1000 pts). | **Universal Speed-Decay Scoring**: `Points = Math.round(BasePoints * (RemainingTime / TotalTime))`. 100% in first second, tapering down to 80%, 60%, 40%... 0 pts on timeout or wrong answer. | Create dedicated unit & integration test suite verifying speed decay across Mode 2, Mode 3, and Mode 4. |
| **Dev Bot Simulator** | Bots vote in 1v1 duels, play 4 old micro-games, vote to expel seeder. | Bots must automatically simulate: (1) submitting roasts & reacting with ❤️/🍅/🧱 in Mode 1; (2) rapid Fact/Cap choices (0.5s-4.5s) in Mode 2; (3) choosing A/B and betting majority in Mode 3; (4) answering trivia with decay and playing cards in Mode 4. | Update bot test fixtures and simulator headless execution tests across all 4 redesigned modes. |

---

## 3. Comprehensive Multi-Tier Test Plan

### Tier 1: Core Feature Verification (16 Scenarios)

#### T1.1 - Hub Initialization & Direct Launch Button [Thử Ngay Mode 4]
- **Objective:** Verify room creation, default state, and immediate availability of Mode 4 direct launch.
- **Assertion:**
  - Room status begins at `LOBBY`.
  - Mode 4 direct launch button action triggers status `ROUND_4` and phase `SABOTAGE_DRAFT` without requiring intermediate rounds.
  - Return to Hub action resets status to `LOBBY` while keeping all player connections intact.

#### T1.2 - Player Joining & 10 Vietnamese Netizen Personas
- **Objective:** Verify 50 concurrent students can join with unique Vietnamese Netizen avatars.
- **Assertion:** Player records contain `id`, sanitized `name`, valid `avatarId`, `score = 0`, and active connection timestamp.

#### T1.3 - Mode 1: Simultaneous 50-Player Roast Submission (45s Window)
- **Objective:** Verify all 50 students can submit comments simultaneously within the 45s window without pairing into duels.
- **Assertion:**
  - `engine.startMode1TrendingFeed(promptIndex)` sets status to `ROUND_1` and phase to `SUBMISSION_WINDOW`.
  - 50 distinct players submit roasts; all 50 roasts stored in feed collection.
  - Input clamped to 120 chars and HTML-sanitized.

#### T1.4 - Mode 1: 30s Interactive Reaction Feed Wall (❤️, 🍅, 🧱)
- **Objective:** Verify simultaneous reaction broadcasting on the newsfeed.
- **Assertion:**
  - Transition to phase `REACTION_WINDOW`.
  - Multiple players emit reactions (`HEART`, `TOMATO`, `BRICK`) targeting different posts.
  - Reaction counters increment atomically per post.

#### T1.5 - Mode 1: Top Trending Calculation & Leaderboard Scoring
- **Objective:** Verify algorithmic ranking of posts based on engagement score and score distribution.
- **Assertion:**
  - `EngagementScore = (Hearts * 3) + (Bricks * 2) + (Tomatoes * 1)`.
  - Top 3 trending posts highlighted; authors awarded tiered bonus points (+3000, +2000, +1000).
  - Projector event `TRENDING_ANNOUNCED` emitted with fanfare SFX payload.

#### T1.6 - Mode 2: 5.0s Bomb Countdown Timer & Statement Broadcast
- **Objective:** Verify 5-second ticking bomb timer engine and MLN131 statement display.
- **Assertion:**
  - `engine.startMode2FactOrCap(statementIndex)` initializes 5000ms countdown timer.
  - Active statement loaded with metadata (`id`, `statement`, `isFact`, `explanation`).

#### T1.7 - Mode 2: Binary FACT vs CAP Submission & Bomb Explosion Invariant
- **Objective:** Verify mobile input strictly accepts only 2 choices: `FACT` or `CAP`.
- **Assertion:**
  - Valid choices `'FACT'` and `'CAP'` accepted; invalid choices rejected.
  - Incorrect answer emits `BOMB_EXPLODED` event, awards 0 points, and decrements player life or flags explosion.

#### T1.8 - Mode 2: Speed-Decay Scoring Formula on Fact/Cap
- **Objective:** Validate mathematical precision of speed-decay points.
- **Assertion:**
  - Base points: 2000.
  - Correct answer at 500ms elapsed: `2000 * (4500 / 5000) = 1800 points`.
  - Correct answer at 2500ms elapsed: `2000 * (2500 / 5000) = 1000 points`.
  - Correct answer at 4500ms elapsed: `2000 * (500 / 5000) = 200 points`.
  - Answer after 5000ms: 0 points (overtime failure).

#### T1.9 - Mode 3: MLN131 Consensus Dilemma Presentation (A vs B)
- **Objective:** Verify presentation of profound digital democracy ethical dilemma without secret seeder roles.
- **Assertion:**
  - `engine.startMode3Consensus(dilemmaIndex)` sets phase to `DILEMMA_DELIBERATION`.
  - Dilemma loaded with options `Option A` and `Option B` (e.g. "Quyền riêng tư tuyệt đối" vs "Giám sát an ninh số").

#### T1.10 - Mode 3: Two-Tier Player Decision (Stance [A/B] + Majority Bet [A/B])
- **Objective:** Verify player can choose personal conviction AND bet on the collective majority.
- **Assertion:**
  - Submission payload `{ playerId, stance: 'A'|'B', majorityBet: 'A'|'B' }` recorded.
  - Duplicate submissions from same player update stance/bet before phase ends.

#### T1.11 - Mode 3: Real-Time Tug-of-War Bar Synchronization
- **Objective:** Verify real-time percentage split between Option A and Option B across 50 players.
- **Assertion:**
  - If 35 players choose A and 15 choose B: `PercentA = 70%`, `PercentB = 30%`.
  - Emits `TUG_OF_WAR_UPDATE` event with normalized percentages summing to 100%.

#### T1.12 - Mode 3: Consensus Dilemma Resolution & Majority Reward (+5000 pts)
- **Objective:** Verify reward distribution for correct majority prediction.
- **Assertion:**
  - Majority determined (> 50%).
  - All players whose `majorityBet` matches the winning side receive +5000 points.
  - Players on minority side receive brick/tomato animation trigger.

#### T1.13 - Mode 4: Sabotage Cards (Ink, Heist 50%, 2x Bet, Cyber Shield)
- **Objective:** Verify card mechanics in the high-stakes final.
- **Assertion:**
  - Point Heist transfers exactly 50% of target score floored to integer.
  - Cyber Shield deflects incoming attack, consuming shield while preserving target points.
  - Ink Splatter imposes 7 touch wipes before unblocking screen.

#### T1.14 - Mode 4: High-Stakes MLN131 Trivia with Speed-Decay & 2x Multiplier
- **Objective:** Verify trivia resolution under speed-decay scoring combined with 2x Bet card.
- **Assertion:**
  - Correct answer with 2x Bet receives `2 * BasePoints * (Remaining / Total)`.
  - Incorrect answer with 2x Bet receives -500 penalty.

#### T1.15 - Dev Bot Simulator Full 4-Mode Autonomous Loop
- **Objective:** Verify 15 Dev Bots autonomously participate in all 4 new modes without manual intervention.
- **Assertion:**
  - Mode 1: 15 bots submit roasts and cast reactions.
  - Mode 2: 15 bots submit FACT/CAP before 5s timeout.
  - Mode 3: 15 bots submit stance & majority bet.
  - Mode 4: 15 bots answer trivia and play cards.

#### T1.16 - Return to Hub & Podium Flow
- **Objective:** Verify seamless transition between modes and grand champion podium.
- **Assertion:**
  - Host can trigger `RETURN_TO_HUB` after any mode; all 50 players return to Hub with updated scores.
  - Podium ranks Top 1, Top 2, Top 3 players accurately.

---

### Tier 2: Boundary & Corner Cases (12 Scenarios)

| Test ID | Test Scenario | Expected Outcome |
|---------|---------------|------------------|
| **T2.1** | Mode 1: Empty or whitespace-only comment submission | Falls back to default witty netizen text (`"Ủa alo? Không biết nói gì luôn!"`). |
| **T2.2** | Mode 1: Exactly 120-char comment vs 250-char comment | Exactly clamped to 120 chars; zero overflow. |
| **T2.3** | Mode 1: Zero reactions received on a comment | Safely scored at 0 engagement; no NaN or crash in ranking. |
| **T2.4** | Mode 2: Exact 5.00s Timer Boundary (4999ms vs 5001ms) | 4999ms marked valid and receives speed-decay points; 5001ms marked overtime and fails. |
| **T2.5** | Mode 2: Speed-Decay score rounding | Integer floor/round invariant; zero float points in player score. |
| **T2.6** | Mode 3: Exact 50-50 Split in Tug-of-War (e.g. 25 vs 25) | Handled gracefully: neither side reaches strictly >50%; bonus points split or consolation awarded. |
| **T2.7** | Mode 3: 100% Unanimous Consensus (50 vs 0) | Tug-of-war reaches 100%; all 50 players who bet correctly receive +5000 pts. |
| **T2.8** | Mode 3: Solo Player Room (1 player test mode) | 1 player chooses A and bets A -> 100% majority -> correctly awarded +5000 pts. |
| **T2.9** | Mode 4: Odd-numbered score 50% Heist (e.g. 1575 pts) | Stolen = `Math.floor(1575 * 0.5) = 787 pts`. Target remains at 788 pts. Total points conserved. |
| **T2.10** | Mode 4: Heist against 0-point player | Stolen = 0 pts; target score remains 0; no negative score balance. |
| **T2.11** | Mode 4: Rapid multi-touch ink wipe (7 wipes in <500ms) | Counter decrements monotonically from 7 to 0; screen unblocks cleanly. |
| **T2.12** | Direct Mode 4 launch with 0 players in room | Host button disabled or safely shows waiting state without crashing. |

---

### Tier 3: Cross-Feature Integration (4 Scenarios)

| Test ID | Test Scenario | Key Verification |
|---------|---------------|------------------|
| **T3.1** | **Independent Mode Navigation Flow** | Host launches Mode 4 directly from Hub -> plays round -> clicks "Return to Hub" -> launches Mode 2 -> plays round -> verifies player list and cumulative scores persist. |
| **T3.2** | **Mobile Reconnect Across Modes** | Mobile player connected during Mode 1 drops connection; Host switches to Mode 3; player reconnects with `since` timestamp and immediately receives Mode 3 state and dilemma without needing to re-enter room PIN. |
| **T3.3** | **Dev Bot & Human Player Coexistence in Mode 1 & Mode 3** | 1 human + 15 Dev Bots: human roast appears in newsfeed alongside 15 bot roasts; bots react to human roast; human votes in Mode 3 Tug-of-War and shifts the bar by 1/16th. |
| **T3.4** | **Speed-Decay Leaderboard Shakeup** | Two players with identical correct answers in Mode 2 and Mode 4 have distinct rank placement purely based on response latency (e.g. 800ms vs 3200ms). |

---

### Tier 4: Real-World Classroom Concurrency & Scale (4 Scenarios)

| Test ID | Test Scenario | Benchmark Target |
|---------|---------------|------------------|
| **T4.1** | **50 Simultaneous Mobile Submissions in Mode 1** | 50 clients post roasts within a 2-second burst window. API processes all 50 with sub-50ms average latency and 0 packet loss. |
| **T4.2** | **High-Frequency Reaction Danmaku Storm** | 50 clients sending 3 reactions per second for 10 seconds (1,500 total reaction events). Delta ring buffer stays strictly bounded (<= 120 events) and memory heap delta remains negligible. |
| **T4.3** | **Tug-of-War Real-Time Sync Under Delta Polling** | 50 clients polling every 500ms while 50 votes stream in. Tug-of-war ratio converges smoothly to final split on all clients. |
| **T4.4** | **Web Audio SFX Trigger Contracts for New Modes** | Verify audio synthesizer implements and safely executes SFX for: `playBombTick()`, `playBombExplosion()`, `playTugOfWarCreak()`, `playTrendingFanfare()`, `playReactionPop()`. |

---

### Tier 5: Adversarial, Chaos & Security Hardening (7 Scenarios)

| Test ID | Test Scenario | Security Invariant |
|---------|---------------|-------------------|
| **T5.1** | **XSS & Malicious Payload Neutralization in Trending Feed** | `<script>alert('xss')</script>` or `<img src=x onerror=...>` in roast text or reaction metadata stripped or HTML-escaped. |
| **T5.2** | **Out-of-Phase Action Rejection** | Submitting Fact/Cap choice after 5.0s bomb exploded or submitting Mode 1 reaction before reaction window opens is rejected with HTTP 400. |
| **T5.3** | **Reaction Spam Throttling** | Client attempting to flood >20 reactions per second from a single player ID is rate-limited or clamped. |
| **T5.4** | **Tampered Response Time in Speed-Decay Payload** | Client sending negative response time (`timeMs = -500`) or spoofed future timestamp is sanitized to server-measured elapsed time. |
| **T5.5** | **Double Majority Bet Injection in Mode 3** | Client sending multiple competing bets (`majorityBet: 'A'` then `'B'`) updates the bet cleanly without duplicating vote weights in the total count. |
| **T5.6** | **Counterfeit Card Play in Mode 4** | Playing `CARD_HEIST` without having it in dealt hand throws error and yields 0 stolen points. |
| **T5.7** | **Concurrent Heist Attacks on Shielded Player** | Two players attack a shielded player simultaneously: first attack is deflected and breaks shield; second attack succeeds on now-unshielded player. |

---

### Tier 6: Live API Route (`/api/game`) Empirical Stress (5 New Scenarios)

| Test ID | Scenario Name | Request Payload | Expected Response |
|---------|---------------|-----------------|-------------------|
| **T6.1** | Direct Launch Mode 4 via API | `POST { roomCode: "MLN131", action: "DIRECT_LAUNCH_MODE4" }` | HTTP 200, status updated to `ROUND_4`, event `direct_mode4_launched`. |
| **T6.2** | Mode 1 Reaction Broadcast | `POST { roomCode: "MLN131", action: "FEED_REACTION", payload: { postId, reactionType: "TOMATO", voterId } }` | HTTP 200, reaction tallied, event `feed_reacted`. |
| **T6.3** | Mode 2 Fact/Cap Submission | `POST { roomCode: "MLN131", action: "SUBMIT_FACT_CAP", payload: { playerId, choice: "FACT", timeMs: 1200 } }` | HTTP 200, score updated via speed decay, event `fact_cap_recorded`. |
| **T6.4** | Mode 3 Consensus Dilemma Vote | `POST { roomCode: "MLN131", action: "SUBMIT_CONSENSUS", payload: { playerId, stance: "A", majorityBet: "A" } }` | HTTP 200, tug-of-war ratio updated, event `consensus_voted`. |
| **T6.5** | Return to Hub Reset | `POST { roomCode: "MLN131", action: "RETURN_TO_HUB" }` | HTTP 200, status `LOBBY`, players preserved with scores, event `returned_to_hub`. |

---

## 4. Test Infrastructure Modifications Required

To implement this plan without regressions, the following specific files in the test infrastructure must be upgraded:

### 1. `tests/lib/gameShowEngine.mjs`
- **Add State Structures:**
  - `this.mode1 = { prompt: null, feed: Map<string, Post>, reactions: Map<string, Reactions> }`
  - `this.mode2 = { statement: null, answers: Map<string, Answer>, timer: 5000 }`
  - `this.mode3 = { dilemma: null, votes: Map<string, Vote>, tugRatio: { A: 50, B: 50 } }`
- **Add Methods:**
  - `startMode1TrendingFeed(promptIndex)`
  - `submitRoastToFeed(playerId, text)`
  - `reactToPost(playerId, postId, reactionType)`
  - `calculateTopTrending()`
  - `startMode2FactOrCap(statementIndex)`
  - `submitFactOrCap(playerId, choice, responseTimeMs)`
  - `calculateSpeedDecay(basePoints, responseTimeMs, totalTimeMs)`
  - `startMode3Consensus(dilemmaIndex)`
  - `submitConsensusVote(playerId, stance, majorityBet)`
  - `resolveConsensus()`
  - `launchMode4Directly()`
  - `returnToHub()`

### 2. `tests/fixtures/mockData.mjs`
- **Add:**
  - `MOCK_FACT_OR_CAP_STATEMENTS`: 5 curated MLN131 statements with `isFact: boolean` and explanations.
  - `MOCK_CONSENSUS_DILEMMAS`: 3 MLN131 dilemmas with Option A and Option B.
  - `MOCK_FEED_REACTIONS`: `['HEART', 'TOMATO', 'BRICK']`.

### 3. `tests/suites/tier1_features.mjs`
- Update T1.4 through T1.10 to call the new engine methods and assert the 4 new mode mechanics and speed decay.

### 4. `tests/suites/tier2_boundary.mjs`
- Add tests for 0ms, 4999ms, 5001ms boundary timings in speed decay.
- Add tests for 50-50 Tug-of-War tie and 100% consensus in Mode 3.

### 5. `tests/suites/tier3_cross_feature.mjs`
- Test Hub -> Mode 4 direct launch -> Return to Hub -> Mode 2 -> Return to Hub sequence.

### 6. `tests/stress/m1_stress_harness.ts`
- Add empirical test scenarios for `FEED_REACTION`, `SUBMIT_FACT_CAP`, `SUBMIT_CONSENSUS`, and `RETURN_TO_HUB`.

---

## 5. Implementation & Verification Roadmap for Workers

1. **Step 1: Test Infrastructure Alignment (Engine & Fixtures)**
   - Update `tests/fixtures/mockData.mjs` with new dilemmas and Fact/Cap items.
   - Update `tests/lib/gameShowEngine.mjs` to support all 4 redesigned modes and speed-decay math.
2. **Step 2: API Route Contracts (`src/app/api/game/route.ts`)**
   - Add action handlers for `FEED_REACTION`, `SUBMIT_FACT_CAP`, `SUBMIT_CONSENSUS`, `DIRECT_LAUNCH_MODE4`, `RETURN_TO_HUB`.
3. **Step 3: Test Suite Updates (`tests/suites/*.mjs`)**
   - Update Tiers 1-5 to run against new engine and API route actions.
   - Execute `npm test` after each tier to guarantee zero regressions.
4. **Step 4: DevBotSimulator Verification**
   - Update `src/components/DevBotSimulator.tsx` to simulate all 4 modes.
   - Verify 15-bot simulation runs flawlessly.
5. **Step 5: Final Certification**
   - Execute full test suite `npm test` (all 6 tiers passing 100%).
   - Verify `npm run build` exits 0 with 0 TypeScript/SSR errors.
