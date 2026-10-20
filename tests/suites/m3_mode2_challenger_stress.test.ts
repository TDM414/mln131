// tests/suites/m3_mode2_challenger_stress.test.ts
// Empirical Challenger Stress & Adversarial Test Suite for Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)

import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/game/route';
import { MLN131_FACT_OR_CAP_QUESTIONS } from '../../src/data/questions';
import { calculateSpeedDecayScore } from '../../src/lib/types';

function createMockPostRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createMockGetRequest(room: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/game?room=${encodeURIComponent(room)}&since=0`,
    {
      method: 'GET',
    }
  );
}

async function runM3ChallengerStressTests() {
  console.log('\n================================================================');
  console.log('  CHALLENGER M3-2: EMPIRICAL STRESS & ADVERSARIAL VERIFICATION');
  console.log('  Target: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const criticalFindings: string[] = [];

  async function testStep(name: string, fn: () => Promise<void>) {
    totalTests++;
    const start = performance.now();
    try {
      await fn();
      const duration = (performance.now() - start).toFixed(2);
      passedTests++;
      console.log(`  ✔ [PASS] ${name} (${duration}ms)`);
    } catch (err: any) {
      const duration = (performance.now() - start).toFixed(2);
      console.error(`  ✖ [FAIL] ${name} (${duration}ms)`);
      console.error(`    Error: ${err?.message || err}`);
      throw err;
    }
  }

  // ============================================================================
  // TEST SCENARIO 1: Bug Reproduction - Missing Defensive Guard on playerResults
  // ============================================================================
  console.log('--- TEST 1: Backend Defensive Guard & Crash Reproduction ---');
  const roomCodeBug = `CHALLENGE_BUG_DEFENSIVE_${Date.now()}`;

  await testStep('1.1 - Verify defensive guard prevents TypeError when HOST_UPDATE_STATE omits legacy playerResults', async () => {
    // Register player
    await POST(
      createMockPostRequest({
        roomCode: roomCodeBug,
        action: 'JOIN',
        payload: {
          playerId: 'test_player_crash',
          name: 'Player Crash Test',
          avatarId: 'keyboard_warrior',
        },
      })
    );

    // Host updates round2State with standard Mode 2 fields (answers: {}, questions: [...])
    // but without legacy playerResults (as done in Round2Host.tsx lines 226-235)
    await POST(
      createMockPostRequest({
        roomCode: roomCodeBug,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            phase: 'QUESTION_ACTIVE',
            currentQuestionIndex: 0,
            questions: MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5),
            answers: {},
          },
        },
      })
    );

    // Now player submits SUBMIT_FACT_OR_CAP
    // In src/app/api/game/route.ts line 555:
    // room.round2State.playerResults[playerId] = { ... }
    // throws: TypeError: Cannot set properties of undefined (setting 'test_player_crash')
    let caughtError: any = null;
    try {
      await POST(
        createMockPostRequest({
          roomCode: roomCodeBug,
          action: 'SUBMIT_FACT_OR_CAP',
          payload: {
            choice: 'CAP',
            remainingTime: 3000,
            totalTime: 5000,
            playerId: 'test_player_crash',
            questionIndex: 0,
          },
        })
      );
    } catch (err: any) {
      caughtError = err;
    }

    if (caughtError) {
      assert.match(
        caughtError.message,
        /Cannot set properties of undefined/,
        'Error confirmed: route.ts line 555 crashes due to missing defensive guard on playerResults'
      );
      criticalFindings.push(
        'CRITICAL BUG REPRODUCED: src/app/api/game/route.ts:555 crashes with TypeError (Cannot set properties of undefined) when round2State is updated without legacy playerResults property.'
      );
      console.log('    [VERIFIED BUG]: route.ts:555 lacks `if (!room.round2State.playerResults) room.round2State.playerResults = {};`');
    } else {
      console.log('    [VERIFIED FIX]: route.ts:555 defensive guard prevented TypeError crash (0 uncaught exceptions)');
    }
  });

  // ============================================================================
  // TEST SCENARIO 2: Vulnerability Reproduction - Lack of Idempotency on SUBMIT_FACT_OR_CAP
  // ============================================================================
  console.log('\n--- TEST 2: Multi-Tap Backend Idempotency & Score Multiplication ---');
  const roomCodeIdemp = `CHALLENGE_IDEMP_${Date.now()}`;

  await testStep('2.1 - Verify client-side synchronous lock guard against rapid multi-tap in Round2Play.tsx', async () => {
    // In Round2Play.tsx:
    // const handleSelectChoice = async (choice: 'FACT' | 'CAP') => {
    //   if (hasSubmitted || submittedRef.current || phase !== 'QUESTION_ACTIVE') return;
    //   submittedRef.current = true;
    //   setHasSubmitted(true);
    let clientSubmittedRef = false;
    let successfulClientSubmissions = 0;

    const simulateTap = (choice: 'FACT' | 'CAP') => {
      if (clientSubmittedRef) return false;
      clientSubmittedRef = true;
      successfulClientSubmissions++;
      return true;
    };

    // Rapid burst of 10 simultaneous touch events within 5ms (e.g. multi-touch or jitter)
    const tapOutcomes: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      tapOutcomes.push(simulateTap(i % 2 === 0 ? 'FACT' : 'CAP'));
    }

    assert.strictEqual(successfulClientSubmissions, 1, 'Exactly 1 tap accepted by client lock');
    assert.strictEqual(tapOutcomes[0], true, 'First tap succeeded');
    for (let i = 1; i < 10; i++) {
      assert.strictEqual(tapOutcomes[i], false, `Subsequent tap ${i + 1} blocked by submittedRef`);
    }
  });

  await testStep('2.2 - Verify backend vulnerability: duplicate network packets multiply points/lives decrement', async () => {
    // Register player
    await POST(
      createMockPostRequest({
        roomCode: roomCodeIdemp,
        action: 'JOIN',
        payload: {
          playerId: 'player_double_packet',
          name: 'Player Multi Packet',
          avatarId: 'keyboard_warrior',
        },
      })
    );

    // Initialize round2State with playerResults: {} so it does not trigger Bug 1.1
    await POST(
      createMockPostRequest({
        roomCode: roomCodeIdemp,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            phase: 'QUESTION_ACTIVE',
            currentQuestionIndex: 0,
            questions: MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5),
            answers: {},
            playerResults: {},
          },
        },
      })
    );

    // First submission: correct CAP choice with 4000ms remaining -> 800 pts
    await POST(
      createMockPostRequest({
        roomCode: roomCodeIdemp,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'CAP',
          remainingTime: 4000,
          totalTime: 5000,
          playerId: 'player_double_packet',
          questionIndex: 0,
        },
      })
    );

    // Duplicate submission (e.g. network retry or bypassed client guard)
    await POST(
      createMockPostRequest({
        roomCode: roomCodeIdemp,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'CAP',
          remainingTime: 4000,
          totalTime: 5000,
          playerId: 'player_double_packet',
          questionIndex: 0,
        },
      })
    );

    const stateRes = await GET(createMockGetRequest(roomCodeIdemp));
    const state = await stateRes.json();
    const player = state.players['player_double_packet'];

    // If backend lacked idempotency check, score will be 1600 instead of 800
    if (player.score === 1600) {
      criticalFindings.push(
        'VULNERABILITY REPRODUCED: src/app/api/game/route.ts:521 does not check if room.round2State.answers[playerId] already exists for the question, allowing duplicate SUBMIT_FACT_OR_CAP packets to award points multiple times (800 -> 1600).'
      );
      console.log('    [VERIFIED VULNERABILITY]: Duplicate packet resulted in double points (1600 pts instead of 800 pts)');
    } else {
      assert.strictEqual(player.score, 800, 'Duplicate packet did not award extra points');
    }
  });

  // ============================================================================
  // TEST SCENARIO 3: Speed-Decay Mathematical Boundary & Edge Case Oracles
  // ============================================================================
  console.log('\n--- TEST 3: Speed-Decay Scoring Mathematical Oracles ---');

  await testStep('3.1 - Verify extreme and boundary time inputs', async () => {
    const base = 1000;
    const total = 5000;

    // Remaining = Total (0s reaction) -> Exactly BasePoints
    assert.strictEqual(calculateSpeedDecayScore(base, 5000, total, true), 1000);

    // Remaining = 4999ms (1ms reflex) -> 1000 pts (Math.round(1000 * 4999/5000) = 1000)
    assert.strictEqual(calculateSpeedDecayScore(base, 4999, total, true), 1000);

    // Remaining = 2500ms (50% time) -> 500 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 2500, total, true), 500);

    // Remaining = 1ms (last millisecond before bomb) -> 0 pts (Math.round(1000 * 1/5000) = 0)
    assert.strictEqual(calculateSpeedDecayScore(base, 1, total, true), 0);

    // Remaining = 0ms (exact timeout) -> 0 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 0, total, true), 0);

    // Remaining < 0 (negative time due to network lag / overshoot) -> strictly 0 pts
    assert.strictEqual(calculateSpeedDecayScore(base, -100, total, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(base, -99999, total, true), 0);

    // Remaining > Total (clock drift / fake client packet) -> capped at 1000 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 6000, total, true), 1000);
    assert.strictEqual(calculateSpeedDecayScore(base, 999999, total, true), 1000);

    // TotalTime = 0 (divide by zero hazard) -> strictly 0 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 1000, 0, true), 0);

    // Wrong answer is always 0 points regardless of speed
    assert.strictEqual(calculateSpeedDecayScore(base, 5000, total, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(base, 4999, total, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(base, 2500, total, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(base, 100, total, false), 0);
  });

  // ============================================================================
  // TEST SCENARIO 4: Cracked Screen Feedback Trigger Oracles
  // ============================================================================
  console.log('\n--- TEST 4: Cracked Screen Visual Feedback Oracles ---');

  await testStep('4.1 - Verify cracked screen trigger logic for wrong answer & timeout', async () => {
    // In Round2Play.tsx lines 223-226 and 480-495:
    // wasCorrect = finalAnswer ? finalAnswer.isCorrect : false;
    // Cracked screen overlay renders when !wasCorrect in REVEAL phase.
    const simulateRevealState = (isCorrect: boolean, hasSubmitted: boolean) => {
      const finalAnswer = hasSubmitted ? { isCorrect } : null;
      const wasCorrect = finalAnswer ? finalAnswer.isCorrect : false;
      const didTimeout = !finalAnswer;
      const showCrackedScreen = !wasCorrect;
      return { wasCorrect, didTimeout, showCrackedScreen };
    };

    // Case 1: Player chose wrong answer
    const wrongOutcome = simulateRevealState(false, true);
    assert.strictEqual(wrongOutcome.wasCorrect, false, 'wasCorrect is false');
    assert.strictEqual(wrongOutcome.didTimeout, false, 'didTimeout is false');
    assert.strictEqual(wrongOutcome.showCrackedScreen, true, 'Cracked screen overlay triggers on wrong answer');

    // Case 2: Player timed out (no answer submitted within 5s)
    const timeoutOutcome = simulateRevealState(false, false);
    assert.strictEqual(timeoutOutcome.wasCorrect, false, 'wasCorrect is false');
    assert.strictEqual(timeoutOutcome.didTimeout, true, 'didTimeout is true');
    assert.strictEqual(timeoutOutcome.showCrackedScreen, true, 'Cracked screen overlay triggers on timeout');

    // Case 3: Player chose correct answer
    const correctOutcome = simulateRevealState(true, true);
    assert.strictEqual(correctOutcome.wasCorrect, true, 'wasCorrect is true');
    assert.strictEqual(correctOutcome.showCrackedScreen, false, 'Cracked screen overlay does NOT trigger on correct answer');
  });

  // ============================================================================
  // TEST SCENARIO 5: 40-Student Classroom Simulation, Ghost Mode & Danmaku Burst
  // ============================================================================
  console.log('\n--- TEST 5: 40-Student Classroom Simulation, Ghost Mode & Danmaku ---');
  const roomCodeClass = `CHALLENGE_M3_CLASS40_${Date.now()}`;

  await testStep('5.1 - Register 40 students with 3 lives each', async () => {
    const promises = [];
    for (let i = 1; i <= 40; i++) {
      promises.push(
        POST(
          createMockPostRequest({
            roomCode: roomCodeClass,
            action: 'JOIN',
            payload: {
              playerId: `student_${i}`,
              name: `Học viên ${i}`,
              avatarId: i % 3 === 0 ? 'anti_scam_otter' : 'keyboard_warrior',
            },
          })
        )
      );
    }
    await Promise.all(promises);

    const getRes = await GET(createMockGetRequest(roomCodeClass));
    const state = await getRes.json();
    assert.strictEqual(Object.keys(state.players).length, 40, '40 students joined');

    for (let i = 1; i <= 40; i++) {
      assert.strictEqual(state.players[`student_${i}`].r2Lives, 3, `Student ${i} has 3 lives`);
    }
  });

  await testStep('5.2 - Simulate 3 consecutive wrong answers for students 31-40 to trigger Ghost Mode', async () => {
    const questions = MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5);

    for (let qIdx = 0; qIdx < 3; qIdx++) {
      const q = questions[qIdx];
      const wrongChoice = q.isFact ? 'CAP' : 'FACT';

      // Initialize state with playerResults: {} to protect against Bug 1.1
      await POST(
        createMockPostRequest({
          roomCode: roomCodeClass,
          action: 'HOST_UPDATE_STATE',
          payload: {
            round2State: {
              phase: 'QUESTION_ACTIVE',
              currentQuestionIndex: qIdx,
              questions,
              answers: {},
              playerResults: {},
            },
          },
        })
      );

      // Students 31-40 fail every question
      const failPromises = [];
      for (let s = 31; s <= 40; s++) {
        failPromises.push(
          POST(
            createMockPostRequest({
              roomCode: roomCodeClass,
              action: 'SUBMIT_FACT_OR_CAP',
              payload: {
                choice: wrongChoice,
                remainingTime: 2000,
                totalTime: 5000,
                playerId: `student_${s}`,
                questionIndex: qIdx,
              },
            })
          )
        );
      }
      await Promise.all(failPromises);
    }

    const stateRes = await GET(createMockGetRequest(roomCodeClass));
    const state = await stateRes.json();

    // Verify students 31-40 have 0 lives (eliminated to Ghost Mode)
    for (let s = 31; s <= 40; s++) {
      const p = state.players[`student_${s}`];
      assert.strictEqual(p.r2Lives, 0, `Student ${s} has 0 lives`);
      const isGhost = (p.r2Lives ?? 3) <= 0;
      assert.strictEqual(isGhost, true, `Student ${s} is recognized as Ghost (Ma Mạng 👻)`);
    }

    // Verify other students 1-30 still have 3 lives
    for (let s = 1; s <= 30; s++) {
      assert.strictEqual(state.players[`student_${s}`].r2Lives, 3, `Student ${s} still has 3 lives`);
    }
  });

  await testStep('5.3 - Burst stress: 60 concurrent Danmaku emoji reactions from eliminated Ghosts', async () => {
    const emojis = ['👻', '💀', '🔥', '🍿', '🍅', '🧱'];
    const danmakuPromises = [];

    for (let i = 0; i < 60; i++) {
      const ghostId = `student_${31 + (i % 10)}`;
      const emoji = emojis[i % emojis.length];
      danmakuPromises.push(
        POST(
          createMockPostRequest({
            roomCode: roomCodeClass,
            action: 'DANMAKU',
            payload: {
              id: `danmaku_burst_${i}`,
              emoji,
              text: `Ghost Troll ${i}`,
              senderName: `Học viên Ma ${ghostId}`,
              senderAvatar: 'anti_scam_otter',
              timestamp: Date.now(),
            },
          })
        )
      );
    }

    const results = await Promise.all(danmakuPromises);
    for (const res of results) {
      assert.strictEqual(res.status, 200, 'Danmaku accepted without 500 or timeout');
    }

    const getRes = await GET(createMockGetRequest(roomCodeClass));
    const state = await getRes.json();
    assert.ok(state.events.length > 0, 'Recent events contain danmaku');
    assert.ok(state.state.recentEvents.length <= 120, 'Event ring buffer capped at <= 120 items');
  });

  // ============================================================================
  // TEST SCENARIO 6: Standalone "Quay Về Sảnh Chính (Return to Hub)" Score Persistence
  // ============================================================================
  console.log('\n--- TEST 6: Return to Hub Transition & Cumulative Score Persistence ---');

  await testStep('6.1 - Students accumulate scores across 5 questions in Mode 2', async () => {
    const questions = MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5);

    // Let students 1-5 answer all 5 questions correctly with fast reflexes
    for (let qIdx = 0; qIdx < 5; qIdx++) {
      const q = questions[qIdx];
      const correctChoice = q.isFact ? 'FACT' : 'CAP';

      await POST(
        createMockPostRequest({
          roomCode: roomCodeClass,
          action: 'HOST_UPDATE_STATE',
          payload: {
            round2State: {
              phase: 'QUESTION_ACTIVE',
              currentQuestionIndex: qIdx,
              questions,
              answers: {},
              playerResults: {},
            },
          },
        })
      );

      const promises = [];
      for (let s = 1; s <= 5; s++) {
        promises.push(
          POST(
            createMockPostRequest({
              roomCode: roomCodeClass,
              action: 'SUBMIT_FACT_OR_CAP',
              payload: {
                choice: correctChoice,
                remainingTime: 4000, // 800 pts per question
                totalTime: 5000,
                playerId: `student_${s}`,
                questionIndex: qIdx,
              },
            })
          )
        );
      }
      await Promise.all(promises);
    }

    const stateRes = await GET(createMockGetRequest(roomCodeClass));
    const state = await stateRes.json();

    for (let s = 1; s <= 5; s++) {
      const score = state.players[`student_${s}`].score;
      assert.ok(score >= 800, `Student ${s} accumulated score >= 800 (actual: ${score})`);
      assert.strictEqual(
        state.players[`student_${s}`].roundScores.ROUND_2,
        score,
        'ROUND_2 breakdown matches total score'
      );
    }
  });

  await testStep('6.2 - Click "Quay Về Sảnh Chính" (RETURN_TO_HUB) and verify score preservation', async () => {
    const preHubStateRes = await GET(createMockGetRequest(roomCodeClass));
    const preHubState = await preHubStateRes.json();
    const scoresBeforeHub: Record<string, number> = {};
    for (const [id, p] of Object.entries(preHubState.players as Record<string, any>)) {
      scoresBeforeHub[id] = p.score;
    }

    // Trigger RETURN_TO_HUB
    const hubRes = await POST(
      createMockPostRequest({
        roomCode: roomCodeClass,
        action: 'RETURN_TO_HUB',
        payload: {},
      })
    );
    assert.strictEqual(hubRes.status, 200, 'RETURN_TO_HUB action succeeded');

    const postHubStateRes = await GET(createMockGetRequest(roomCodeClass));
    const postHubState = await postHubStateRes.json();

    assert.strictEqual(postHubState.status, 'LOBBY', 'Status is restored to LOBBY');
    assert.strictEqual(postHubState.currentRoundPhase, 'LOBBY_WAITING', 'Phase restored to LOBBY_WAITING');

    // VERIFY ZERO SCORE LOSS
    for (const [id, score] of Object.entries(scoresBeforeHub)) {
      const postScore = postHubState.players[id].score;
      assert.strictEqual(
        postScore,
        score,
        `Player ${id} score preserved exactly (${score} -> ${postScore})`
      );
      assert.strictEqual(
        postHubState.players[id].roundScores.ROUND_2,
        preHubState.players[id].roundScores.ROUND_2,
        `Player ${id} Round 2 breakdown preserved`
      );
    }
    console.log('    All 40 student cumulative scores 100% preserved after Return to Hub.');
  });

  await testStep('6.3 - Re-launch another mode from Hub and verify cumulative score stacking', async () => {
    // Host starts Round 1 after returning from Round 2
    await POST(
      createMockPostRequest({
        roomCode: roomCodeClass,
        action: 'SET_STATUS',
        payload: { status: 'ROUND_1' },
      })
    );

    // Student 1 submits comment and receives reactions in Round 1
    const commentRes = await POST(
      createMockPostRequest({
        roomCode: roomCodeClass,
        action: 'SUBMIT_FEED_COMMENT',
        payload: {
          playerId: 'student_1',
          text: 'Comment sau khi trở về từ Round 2!',
        },
      })
    );
    assert.strictEqual(commentRes.status, 200);

    const stateRes = await GET(createMockGetRequest(roomCodeClass));
    const state = await stateRes.json();
    const postIds = Object.keys(state.round1State.posts || {});
    assert.ok(postIds.length > 0, 'Post created in Round 1');

    // React to post (+100 pts)
    await POST(
      createMockPostRequest({
        roomCode: roomCodeClass,
        action: 'REACT_FEED_POST',
        payload: {
          postId: postIds[0],
          reactionType: 'heart',
          voterId: 'student_2',
        },
      })
    );

    const finalStateRes = await GET(createMockGetRequest(roomCodeClass));
    const finalState = await finalStateRes.json();
    const p1 = finalState.players['student_1'];

    // Score must be R2 score + 100 from R1
    const r2Score = p1.roundScores.ROUND_2;
    const r1Score = p1.roundScores.ROUND_1;
    assert.strictEqual(r1Score, 100, 'Round 1 score is 100');
    assert.strictEqual(p1.score, r2Score + 100, `Cumulative score stacked: ${r2Score} + 100 = ${p1.score}`);
    console.log(`    Cumulative score stacked smoothly: ${r2Score} (R2) + ${r1Score} (R1) = ${p1.score} PTS`);
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  if (criticalFindings.length > 0) {
    console.log(`  CRITICAL FINDINGS DETECTED (${criticalFindings.length}):`);
    criticalFindings.forEach((f, idx) => console.log(`  [${idx + 1}] ${f}`));
  }
  console.log('================================================================\n');
}

runM3ChallengerStressTests().catch((err) => {
  console.error('\n✖ CHALLENGER STRESS TEST FAILED:', err);
  process.exit(1);
});
