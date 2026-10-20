// tests/suites/m3_challenger_stress.test.ts
// EMPIRICAL CHALLENGER STRESS & ADVERSARIAL TEST SUITE
// Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex Engine)

import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/game/route';
import { MLN131_FACT_OR_CAP_QUESTIONS } from '../../src/data/questions';
import { calculateSpeedDecayScore, FactCapQuestion } from '../../src/lib/types';

function createMockPostRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createMockGetRequest(room: string, since = 0): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/game?room=${encodeURIComponent(room)}&since=${since}`,
    { method: 'GET' }
  );
}

async function runM3ChallengerSuite() {
  console.log('\n================================================================');
  console.log('  CHALLENGER M3-1: EMPIRICAL STRESS & ADVERSARIAL VERIFICATION');
  console.log('  Target: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

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
  // SUITE 1: Speed-Decay Scoring Mathematical & Boundary Conditions
  // ============================================================================
  console.log('--- SUITE 1: Speed-Decay Scoring Mathematical & Boundary Conditions ---');

  await testStep('1.1 - Speed-Decay: Exact reflex time points (0.0s, 0.1s, 1.0s, 2.5s, 4.9s, 5.0s)', async () => {
    const base = 1000;
    const total = 5000;

    // 0.0s instant reflex (remaining = 5000ms) -> 100% = 1000 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 5000, total, true), 1000);

    // 0.1s super-fast reflex (remaining = 4900ms) -> 98% = 980 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 4900, total, true), 980);

    // 1.0s normal reflex (remaining = 4000ms) -> 80% = 800 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 4000, total, true), 800);

    // 2.5s halfway reflex (remaining = 2500ms) -> 50% = 500 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 2500, total, true), 500);

    // 4.9s clutch reflex (remaining = 100ms) -> 2% = 20 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 100, total, true), 20);

    // 5.0s exact timeout (remaining = 0ms) -> 0% = 0 pts
    assert.strictEqual(calculateSpeedDecayScore(base, 0, total, true), 0);
  });

  await testStep('1.2 - Speed-Decay: Wrong answer invariant under all timing conditions', async () => {
    const base = 1000;
    const total = 5000;

    assert.strictEqual(calculateSpeedDecayScore(base, 5000, total, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(base, 4900, total, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(base, 2500, total, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(base, 100, total, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(base, 0, total, false), 0);
  });

  await testStep('1.3 - Speed-Decay: Boundary & defensive checks (negative time, lag, overflow, zero total)', async () => {
    // Negative remaining time (client lagged past timeout)
    assert.strictEqual(calculateSpeedDecayScore(1000, -1, 5000, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, -2500, 5000, true), 0);

    // Over-clocked client remaining time (e.g. 5200ms > 5000ms)
    assert.strictEqual(calculateSpeedDecayScore(1000, 5200, 5000, true), 1000);
    assert.strictEqual(calculateSpeedDecayScore(1000, 99999, 5000, true), 1000);

    // Zero or negative totalTime (prevent Division by Zero / NaN)
    assert.strictEqual(calculateSpeedDecayScore(1000, 2500, 0, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, 2500, -100, true), 0);

    // High base points (Mode 4 Sabotage: 10000 base pts)
    assert.strictEqual(calculateSpeedDecayScore(10000, 4900, 5000, true), 9800);
    assert.strictEqual(calculateSpeedDecayScore(10000, 100, 5000, true), 200);

    // Zero base points
    assert.strictEqual(calculateSpeedDecayScore(0, 4900, 5000, true), 0);
  });

  // ============================================================================
  // SUITE 2: Live Server API Answering Boundary Conditions
  // ============================================================================
  console.log('\n--- SUITE 2: Live Server API Answering Boundary Conditions ---');

  const roomCodeBoundary = `CHALLENGE_M3_BOUNDARY_${Date.now()}`;

  await testStep('2.1 - Setup room & register boundary test students', async () => {
    const students = [
      { id: 'stu_superfast', name: 'Siêu Tốc Độ 0.1s', avatarId: 'keyboard_warrior' },
      { id: 'stu_lastsecond', name: 'Phút Chót 4.9s', avatarId: 'zen_monk' },
      { id: 'stu_timeout', name: 'Hết Giờ 5.0s', avatarId: 'conspiracy_theorist' },
      { id: 'stu_wrongfast', name: 'Nhanh Ẩu Sai', avatarId: 'anti_scam_otter' },
      { id: 'stu_reaction_fallback', name: 'Fallback ReactionMs', avatarId: 'keyboard_warrior' },
    ];

    for (const stu of students) {
      const res = await POST(
        createMockPostRequest({
          roomCode: roomCodeBoundary,
          action: 'JOIN',
          payload: { playerId: stu.id, name: stu.name, avatarId: stu.avatarId },
        })
      );
      assert.strictEqual(res.status, 200);
    }

    // Set room to ROUND_2, currentQuestionIndex: 0
    // In MLN131_FACT_OR_CAP_QUESTIONS[0]: isFact = false (CAP)
    await POST(
      createMockPostRequest({
        roomCode: roomCodeBoundary,
        action: 'SET_STATUS',
        payload: { status: 'ROUND_2' },
      })
    );

    await POST(
      createMockPostRequest({
        roomCode: roomCodeBoundary,
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

    const getRes = await GET(createMockGetRequest(roomCodeBoundary));
    const state = await getRes.json();
    assert.strictEqual(state.status, 'ROUND_2');
    assert.strictEqual(Object.keys(state.players).length, 5);
  });

  await testStep('2.2 - Live API: 0.1s reflex (4900ms remaining, CAP = CORRECT)', async () => {
    const res = await POST(
      createMockPostRequest({
        roomCode: roomCodeBoundary,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'CAP',
          remainingTime: 4900,
          totalTime: 5000,
          playerId: 'stu_superfast',
          questionIndex: 0,
        },
      })
    );
    assert.strictEqual(res.status, 200);

    const getRes = await GET(createMockGetRequest(roomCodeBoundary));
    const state = await getRes.json();

    const p = state.players['stu_superfast'];
    assert.strictEqual(p.score, 980, '0.1s reflex awards exactly 980 points');
    assert.strictEqual(p.roundScores.ROUND_2, 980);
    assert.strictEqual(p.r2Lives, 3, 'Lives preserved at 3');

    const ans = state.round2State.answers['stu_superfast'];
    assert.strictEqual(ans.isCorrect, true);
    assert.strictEqual(ans.score, 980);
    assert.strictEqual(ans.remainingTime, 4900);
  });

  await testStep('2.3 - Live API: 4.9s clutch reflex (100ms remaining, CAP = CORRECT)', async () => {
    const res = await POST(
      createMockPostRequest({
        roomCode: roomCodeBoundary,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'CAP',
          remainingTime: 100,
          totalTime: 5000,
          playerId: 'stu_lastsecond',
          questionIndex: 0,
        },
      })
    );
    assert.strictEqual(res.status, 200);

    const getRes = await GET(createMockGetRequest(roomCodeBoundary));
    const state = await getRes.json();

    const p = state.players['stu_lastsecond'];
    assert.strictEqual(p.score, 20, '4.9s reflex awards exactly 20 points');
    assert.strictEqual(p.r2Lives, 3, 'Lives preserved at 3');
  });

  await testStep('2.4 - Live API: 5.0s timeout (0ms remaining, CAP = CORRECT choice but timed out)', async () => {
    const res = await POST(
      createMockPostRequest({
        roomCode: roomCodeBoundary,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'CAP',
          remainingTime: 0,
          totalTime: 5000,
          playerId: 'stu_timeout',
          questionIndex: 0,
        },
      })
    );
    assert.strictEqual(res.status, 200);

    const getRes = await GET(createMockGetRequest(roomCodeBoundary));
    const state = await getRes.json();

    const p = state.players['stu_timeout'];
    assert.strictEqual(p.score, 0, 'Timeout yields 0 points even if choice was correct');
  });

  await testStep('2.5 - Live API: Fast wrong answer (4900ms remaining, FACT = WRONG)', async () => {
    const res = await POST(
      createMockPostRequest({
        roomCode: roomCodeBoundary,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'FACT', // Wrong for Q0
          remainingTime: 4900,
          totalTime: 5000,
          playerId: 'stu_wrongfast',
          questionIndex: 0,
        },
      })
    );
    assert.strictEqual(res.status, 200);

    const getRes = await GET(createMockGetRequest(roomCodeBoundary));
    const state = await getRes.json();

    const p = state.players['stu_wrongfast'];
    assert.strictEqual(p.score, 0, 'Wrong answer yields 0 points');
    assert.strictEqual(p.r2Lives, 2, 'Wrong answer decrements life from 3 to 2');
  });

  await testStep('2.6 - Live API: Fallback when remainingTime omitted, calculated from reactionTimeMs', async () => {
    // 1500ms reaction time -> 3500ms remaining -> 700 pts
    const res = await POST(
      createMockPostRequest({
        roomCode: roomCodeBoundary,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'CAP',
          reactionTimeMs: 1500,
          totalTime: 5000,
          playerId: 'stu_reaction_fallback',
          questionIndex: 0,
        },
      })
    );
    assert.strictEqual(res.status, 200);

    const getRes = await GET(createMockGetRequest(roomCodeBoundary));
    const state = await getRes.json();

    const p = state.players['stu_reaction_fallback'];
    assert.strictEqual(p.score, 700, 'ReactionTime fallback correctly calculated 700 pts (3500/5000 * 1000)');
  });

  // ============================================================================
  // SUITE 3: 50 Concurrent Students Answering FACT vs CAP Simultaneously
  // ============================================================================
  console.log('\n--- SUITE 3: 50 Concurrent Students Answering FACT vs CAP Simultaneously ---');

  const roomCode50 = `CHALLENGE_M3_50STUDENTS_${Date.now()}`;

  await testStep('3.1 - Register 50 concurrent students via Promise.all()', async () => {
    const start = performance.now();
    const joinPromises = [];

    for (let i = 1; i <= 50; i++) {
      const studentId = `student_concurrent_${i}`;
      const studentName = `Chiến Sĩ Dân Mạng #${i}`;
      const avatarId = i % 2 === 0 ? 'keyboard_warrior' : 'anti_scam_otter';

      joinPromises.push(
        POST(
          createMockPostRequest({
            roomCode: roomCode50,
            action: 'JOIN',
            payload: {
              playerId: studentId,
              name: studentName,
              avatarId,
              isBot: i > 40, // 10 bots, 40 humans
            },
          })
        )
      );
    }

    const responses = await Promise.all(joinPromises);
    const duration = (performance.now() - start).toFixed(2);
    console.log(`    -> 50 concurrent JOIN requests processed in ${duration}ms`);

    for (const res of responses) {
      assert.strictEqual(res.status, 200);
    }

    const getRes = await GET(createMockGetRequest(roomCode50));
    const state = await getRes.json();
    assert.strictEqual(Object.keys(state.players).length, 50, 'All 50 students registered');

    // Verify all 50 students start with 3 lives
    for (let i = 1; i <= 50; i++) {
      const p = state.players[`student_concurrent_${i}`];
      assert.ok(p, `Player student_concurrent_${i} exists`);
      assert.strictEqual(p.r2Lives, 3, `Player ${i} starts with 3 lives`);
      assert.strictEqual(p.score, 0, `Player ${i} starts with 0 score`);
    }
  });

  await testStep('3.2 - Initialize ROUND_2 for 50-student room', async () => {
    await POST(
      createMockPostRequest({
        roomCode: roomCode50,
        action: 'SET_STATUS',
        payload: { status: 'ROUND_2' },
      })
    );

    await POST(
      createMockPostRequest({
        roomCode: roomCode50,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            phase: 'QUESTION_ACTIVE',
            currentQuestionIndex: 1, // Question 1: check statement
            questions: MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5),
            answers: {},
            playerResults: {},
          },
        },
      })
    );

    const getRes = await GET(createMockGetRequest(roomCode50));
    const state = await getRes.json();
    assert.strictEqual(state.status, 'ROUND_2');
    assert.strictEqual(state.round2State.currentQuestionIndex, 1);
  });

  await testStep('3.3 - 50 concurrent students answering FACT vs CAP simultaneously within 5s', async () => {
    // Question 1 in bank: Let's check isFact
    const q1 = MLN131_FACT_OR_CAP_QUESTIONS[1];
    const correctChoice = q1.isFact ? 'FACT' : 'CAP';
    const wrongChoice = q1.isFact ? 'CAP' : 'FACT';

    console.log(`    -> Question 1: "${q1.statement.slice(0, 40)}..." (Answer: ${correctChoice})`);

    const submitPromises = [];
    const expectedOutcomes: Record<string, { choice: string; isCorrect: boolean; remaining: number }> = {};

    const burstStart = performance.now();

    for (let i = 1; i <= 50; i++) {
      const studentId = `student_concurrent_${i}`;

      // Distribution:
      // i = 1..30: Answer CORRECT with varying reflex speeds
      // i = 31..45: Answer WRONG with varying reflex speeds
      // i = 46..50: Inactive / Timeout (will not submit)
      if (i <= 30) {
        // Fast reflex: remaining time between 4800ms and 1500ms
        const remainingTime = Math.max(500, Math.round(5000 - (i * 110)));
        expectedOutcomes[studentId] = { choice: correctChoice, isCorrect: true, remaining: remainingTime };

        submitPromises.push(
          POST(
            createMockPostRequest({
              roomCode: roomCode50,
              action: 'SUBMIT_FACT_OR_CAP',
              payload: {
                choice: correctChoice,
                remainingTime,
                totalTime: 5000,
                playerId: studentId,
                questionIndex: 1,
              },
            })
          )
        );
      } else if (i <= 45) {
        // Wrong choice
        const remainingTime = Math.max(500, Math.round(5000 - ((i - 30) * 200)));
        expectedOutcomes[studentId] = { choice: wrongChoice, isCorrect: false, remaining: remainingTime };

        submitPromises.push(
          POST(
            createMockPostRequest({
              roomCode: roomCode50,
              action: 'SUBMIT_FACT_OR_CAP',
              payload: {
                choice: wrongChoice,
                remainingTime,
                totalTime: 5000,
                playerId: studentId,
                questionIndex: 1,
              },
            })
          )
        );
      }
      // i = 46..50 do not submit
    }

    const responses = await Promise.all(submitPromises);
    const burstDuration = (performance.now() - burstStart).toFixed(2);
    console.log(`    -> 45 concurrent submissions completed in ${burstDuration}ms (all HTTP 200)`);

    for (const res of responses) {
      assert.strictEqual(res.status, 200);
    }

    // Verify Server State
    const getRes = await GET(createMockGetRequest(roomCode50));
    const state = await getRes.json();

    assert.strictEqual(Object.keys(state.round2State.answers).length, 45, 'Exactly 45 answers registered');

    // Validate 30 Correct Players
    for (let i = 1; i <= 30; i++) {
      const studentId = `student_concurrent_${i}`;
      const p = state.players[studentId];
      const ans = state.round2State.answers[studentId];
      const exp = expectedOutcomes[studentId];

      const expectedPoints = calculateSpeedDecayScore(q1.basePoints || 1000, exp.remaining, 5000, true);

      assert.strictEqual(ans.isCorrect, true, `Player ${i} answer marked correct`);
      assert.strictEqual(ans.score, expectedPoints, `Player ${i} answer score matches speed-decay`);
      assert.strictEqual(p.score, expectedPoints, `Player ${i} cumulative score matches`);
      assert.strictEqual(p.r2Lives, 3, `Player ${i} preserved 3 lives`);
    }

    // Validate 15 Wrong Players
    for (let i = 31; i <= 45; i++) {
      const studentId = `student_concurrent_${i}`;
      const p = state.players[studentId];
      const ans = state.round2State.answers[studentId];

      assert.strictEqual(ans.isCorrect, false, `Player ${i} answer marked wrong`);
      assert.strictEqual(ans.score, 0, `Player ${i} score is 0`);
      assert.strictEqual(p.score, 0, `Player ${i} cumulative score is 0`);
      assert.strictEqual(p.r2Lives, 2, `Player ${i} lost 1 life: 3 -> 2`);
    }

    // Validate 5 Non-Answering Players (still 3 lives until Host timeout sweep)
    for (let i = 46; i <= 50; i++) {
      const studentId = `student_concurrent_${i}`;
      const p = state.players[studentId];
      assert.strictEqual(state.round2State.answers[studentId], undefined, `Player ${i} did not answer`);
      assert.strictEqual(p.r2Lives, 3, `Player ${i} lives intact before timeout sweep`);
    }
  });

  // ============================================================================
  // SUITE 4: 3-Lives Decrement Accuracy, Ghost Mode Transition & Clamping
  // ============================================================================
  console.log('\n--- SUITE 4: 3-Lives Decrement Accuracy, Ghost Mode Transition & Clamping ---');

  const roomCodeLives = `CHALLENGE_M3_LIVES_${Date.now()}`;

  await testStep('4.1 - Setup room with 3 test players for life-decrement testing', async () => {
    const players = [
      { id: 'player_survivor', name: 'Chiến Thần Bất Tử', avatarId: 'zen_monk' },
      { id: 'player_eliminated', name: 'Người Bay Màu', avatarId: 'conspiracy_theorist' },
      { id: 'player_timeout_victim', name: 'Nạn Nhân Ngủ Quên', avatarId: 'anti_scam_otter' },
    ];

    for (const p of players) {
      await POST(
        createMockPostRequest({
          roomCode: roomCodeLives,
          action: 'JOIN',
          payload: { playerId: p.id, name: p.name, avatarId: p.avatarId },
        })
      );
    }

    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'SET_STATUS',
        payload: { status: 'ROUND_2' },
      })
    );

    const getRes = await GET(createMockGetRequest(roomCodeLives));
    const state = await getRes.json();
    assert.strictEqual(state.players['player_survivor'].r2Lives, 3);
    assert.strictEqual(state.players['player_eliminated'].r2Lives, 3);
    assert.strictEqual(state.players['player_timeout_victim'].r2Lives, 3);
  });

  await testStep('4.2 - Life loss 1: Wrong answer decrements 3 -> 2', async () => {
    // Q0: isFact = false (CAP)
    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'FACT', // WRONG
          remainingTime: 3000,
          totalTime: 5000,
          playerId: 'player_eliminated',
          questionIndex: 0,
        },
      })
    );

    const getRes = await GET(createMockGetRequest(roomCodeLives));
    const state = await getRes.json();
    assert.strictEqual(state.players['player_eliminated'].r2Lives, 2, 'Life decremented to 2');
  });

  await testStep('4.3 - Life loss 2: Wrong answer decrements 2 -> 1', async () => {
    // Q1: Advance question
    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            phase: 'QUESTION_ACTIVE',
            currentQuestionIndex: 1,
            questions: MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5),
            answers: {},
            playerResults: {},
          },
        },
      })
    );

    const q1 = MLN131_FACT_OR_CAP_QUESTIONS[1];
    const wrongChoice = q1.isFact ? 'CAP' : 'FACT';

    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: wrongChoice, // WRONG
          remainingTime: 2500,
          totalTime: 5000,
          playerId: 'player_eliminated',
          questionIndex: 1,
        },
      })
    );

    const getRes = await GET(createMockGetRequest(roomCodeLives));
    const state = await getRes.json();
    assert.strictEqual(state.players['player_eliminated'].r2Lives, 1, 'Life decremented to 1');
  });

  await testStep('4.4 - Life loss 3: Wrong answer decrements 1 -> 0 (Enters Ghost Mode 👻)', async () => {
    // Q2: Advance question
    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            phase: 'QUESTION_ACTIVE',
            currentQuestionIndex: 2,
            questions: MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5),
            answers: {},
            playerResults: {},
          },
        },
      })
    );

    const q2 = MLN131_FACT_OR_CAP_QUESTIONS[2];
    const wrongChoice = q2.isFact ? 'CAP' : 'FACT';

    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: wrongChoice, // WRONG
          remainingTime: 2000,
          totalTime: 5000,
          playerId: 'player_eliminated',
          questionIndex: 2,
        },
      })
    );

    const getRes = await GET(createMockGetRequest(roomCodeLives));
    const state = await getRes.json();
    assert.strictEqual(state.players['player_eliminated'].r2Lives, 0, 'Player has 0 lives remaining');
  });

  await testStep('4.5 - Ghost Mode Clamping: Further wrong answers must NOT drop lives below 0', async () => {
    // Q3: Advance question
    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            phase: 'QUESTION_ACTIVE',
            currentQuestionIndex: 3,
            questions: MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5),
            answers: {},
            playerResults: {},
          },
        },
      })
    );

    const q3 = MLN131_FACT_OR_CAP_QUESTIONS[3];
    const wrongChoice = q3.isFact ? 'CAP' : 'FACT';

    // Player with 0 lives submits another wrong answer
    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: wrongChoice,
          remainingTime: 1000,
          totalTime: 5000,
          playerId: 'player_eliminated',
          questionIndex: 3,
        },
      })
    );

    const getRes = await GET(createMockGetRequest(roomCodeLives));
    const state = await getRes.json();
    assert.strictEqual(state.players['player_eliminated'].r2Lives, 0, 'Lives strictly clamped at 0 (never -1)');
  });

  await testStep('4.6 - Ghost Mode Practice: Answering correct while at 0 lives does NOT resurrect player', async () => {
    // Q4: Advance question
    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            phase: 'QUESTION_ACTIVE',
            currentQuestionIndex: 4,
            questions: MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5),
            answers: {},
            playerResults: {},
          },
        },
      })
    );

    const q4 = MLN131_FACT_OR_CAP_QUESTIONS[4];
    const correctChoice = q4.isFact ? 'FACT' : 'CAP';

    // Player with 0 lives submits correct answer for practice
    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: correctChoice,
          remainingTime: 3500,
          totalTime: 5000,
          playerId: 'player_eliminated',
          questionIndex: 4,
        },
      })
    );

    const getRes = await GET(createMockGetRequest(roomCodeLives));
    const state = await getRes.json();
    assert.strictEqual(state.players['player_eliminated'].r2Lives, 0, 'Ghost remains at 0 lives (no resurrection)');
  });

  await testStep('4.7 - Host Timeout Sweep: Penalizes non-answering players, preserves 0-life clamp', async () => {
    // In Q4, player_timeout_victim did not submit
    // Simulate Host's timeout sweep logic from Round2Host.tsx lines 189-197
    const getResBefore = await GET(createMockGetRequest(roomCodeLives));
    const stateBefore = await getResBefore.json();

    const currentAnswers = stateBefore.round2State?.answers || {};
    const updatedPlayers = { ...stateBefore.players };

    Object.values(updatedPlayers).forEach((p: any) => {
      if (!currentAnswers[p.id]) {
        const curLives = p.r2Lives ?? 3;
        if (curLives > 0) {
          p.r2Lives = Math.max(0, curLives - 1);
        }
      }
    });

    // Update state via HOST_UPDATE_STATE
    await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'HOST_UPDATE_STATE',
        payload: {
          players: updatedPlayers,
          round2State: {
            ...stateBefore.round2State,
            phase: 'REVEAL',
            playerResults: {},
          },
        },
      })
    );

    const getResAfter = await GET(createMockGetRequest(roomCodeLives));
    const stateAfter = await getResAfter.json();

    // player_timeout_victim should lose 1 life (3 -> 2)
    assert.strictEqual(stateAfter.players['player_timeout_victim'].r2Lives, 2, 'Non-answering player lost 1 life on timeout sweep');

    // player_eliminated was already at 0 lives, must stay at 0
    assert.strictEqual(stateAfter.players['player_eliminated'].r2Lives, 0, 'Already eliminated player stays at 0 lives');
  });

  await testStep('4.8 - Ghost Danmaku cheering functionality', async () => {
    const res = await POST(
      createMockPostRequest({
        roomCode: roomCodeLives,
        action: 'DANMAKU',
        payload: {
          emoji: '👻',
          label: 'Hù ma',
          playerName: 'Người Bay Màu',
          avatarId: 'conspiracy_theorist',
        },
      })
    );
    assert.strictEqual(res.status, 200);

    const getRes = await GET(createMockGetRequest(roomCodeLives));
    const state = await getRes.json();
    const danmakuEvent = state.events.find((e: any) => e.type === 'danmaku' && e.payload?.emoji === '👻');
    assert.ok(danmakuEvent, 'Danmaku ghost reaction successfully recorded in event stream');
  });

  // ============================================================================
  // SUITE 5: Full 5-Question Progression, Leaderboard & Standalone Return to Hub
  // ============================================================================
  console.log('\n--- SUITE 5: Full 5-Question Progression, Leaderboard & Standalone Return to Hub ---');

  const roomCodeFull = `CHALLENGE_M3_FULL_GAME_${Date.now()}`;

  await testStep('5.1 - Full 5-Question tournament run with 6 players', async () => {
    const players = [
      { id: 'p_ace', name: 'Cao Thủ 100%', avatarId: 'keyboard_warrior', accuracy: 1.0, speed: 4500 },
      { id: 'p_pro', name: 'Giỏi 80%', avatarId: 'zen_monk', accuracy: 0.8, speed: 3500 },
      { id: 'p_mid', name: 'Trung Bình 60%', avatarId: 'anti_scam_otter', accuracy: 0.6, speed: 2500 },
      { id: 'p_luck', name: 'Ăn May 40%', avatarId: 'conspiracy_theorist', accuracy: 0.4, speed: 1500 },
      { id: 'p_die', name: 'Toang Sớm 0%', avatarId: 'meme_doge', accuracy: 0.0, speed: 2000 },
      { id: 'p_afk', name: 'Treo Máy AFK', avatarId: 'meme_cat', accuracy: 0.0, speed: 0 },
    ];

    for (const p of players) {
      await POST(
        createMockPostRequest({
          roomCode: roomCodeFull,
          action: 'JOIN',
          payload: { playerId: p.id, name: p.name, avatarId: p.avatarId },
        })
      );
    }

    await POST(
      createMockPostRequest({
        roomCode: roomCodeFull,
        action: 'SET_STATUS',
        payload: { status: 'ROUND_2' },
      })
    );

    const questions = MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5);

    // Play all 5 questions
    for (let qIdx = 0; qIdx < 5; qIdx++) {
      const q = questions[qIdx];
      const correctChoice = q.isFact ? 'FACT' : 'CAP';
      const wrongChoice = q.isFact ? 'CAP' : 'FACT';

      // Start question
      await POST(
        createMockPostRequest({
          roomCode: roomCodeFull,
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

      // Submissions
      for (const p of players) {
        if (p.id === 'p_afk') continue; // AFK does not submit

        const isCorrectThisRound =
          p.id === 'p_ace' ? true :
          p.id === 'p_die' ? false :
          Math.random() < p.accuracy;

        const choice = isCorrectThisRound ? correctChoice : wrongChoice;

        await POST(
          createMockPostRequest({
            roomCode: roomCodeFull,
            action: 'SUBMIT_FACT_OR_CAP',
            payload: {
              choice,
              remainingTime: p.speed,
              totalTime: 5000,
              playerId: p.id,
              questionIndex: qIdx,
            },
          })
        );
      }

      // Host Timeout Sweep for AFK player
      const getRes = await GET(createMockGetRequest(roomCodeFull));
      const state = await getRes.json();
      const updatedPlayers = { ...state.players };

      Object.values(updatedPlayers).forEach((player: any) => {
        if (!state.round2State.answers[player.id]) {
          const curLives = player.r2Lives ?? 3;
          if (curLives > 0) {
            player.r2Lives = Math.max(0, curLives - 1);
          }
        }
      });

      await POST(
        createMockPostRequest({
          roomCode: roomCodeFull,
          action: 'HOST_UPDATE_STATE',
          payload: {
            players: updatedPlayers,
            round2State: {
              ...state.round2State,
              phase: 'REVEAL',
              playerResults: {},
            },
          },
        })
      );
    }

    const finalRes = await GET(createMockGetRequest(roomCodeFull));
    const finalState = await finalRes.json();

    // Verify Ace player
    const ace = finalState.players['p_ace'];
    assert.strictEqual(ace.r2Lives, 3, 'Ace survived all 5 rounds with 3 lives');
    assert.ok(ace.score > 4000, `Ace accumulated high score: ${ace.score}`);

    // Verify Die player (answered wrong every question -> lost 3 lives in first 3 questions, clamped at 0)
    const die = finalState.players['p_die'];
    assert.strictEqual(die.r2Lives, 0, 'Die player lost all lives and is at 0');
    assert.strictEqual(die.score, 0, 'Die player has 0 points');

    // Verify AFK player (timed out every question -> lost 3 lives, clamped at 0)
    const afk = finalState.players['p_afk'];
    assert.strictEqual(afk.r2Lives, 0, 'AFK player lost all lives on timeout sweeps');
    assert.strictEqual(afk.score, 0);
  });

  await testStep('5.2 - Leaderboard ranking algorithm (Lives desc, then Score desc)', async () => {
    const getRes = await GET(createMockGetRequest(roomCodeFull));
    const state = await getRes.json();
    const playersList: any[] = Object.values(state.players);

    // Replicate Round2Host.tsx mode2Leaderboard sort logic
    const leaderboard = [...playersList].sort((a: any, b: any) => {
      const livesA = a.r2Lives ?? 3;
      const livesB = b.r2Lives ?? 3;
      if (livesB !== livesA) return livesB - livesA;
      const scoreA = a.roundScores?.ROUND_2 || 0;
      const scoreB = b.roundScores?.ROUND_2 || 0;
      return scoreB - scoreA;
    });

    const topPlayer: any = leaderboard[0];
    const bottomPlayer: any = leaderboard[leaderboard.length - 1];
    assert.strictEqual(topPlayer.id, 'p_ace', 'Ace player is #1 on podium');
    assert.strictEqual(topPlayer.r2Lives, 3);
    assert.ok(bottomPlayer.r2Lives <= 0, 'Bottom player has 0 lives');
  });

  await testStep('5.3 - Standalone Return to Hub preserves all scores and resets status to LOBBY', async () => {
    const getResBefore = await GET(createMockGetRequest(roomCodeFull));
    const stateBefore = await getResBefore.json();
    const aceScoreBefore = stateBefore.players['p_ace'].score;

    // Call RETURN_TO_HUB
    const res = await POST(
      createMockPostRequest({
        roomCode: roomCodeFull,
        action: 'RETURN_TO_HUB',
        payload: {},
      })
    );
    assert.strictEqual(res.status, 200);

    const getResAfter = await GET(createMockGetRequest(roomCodeFull));
    const stateAfter = await getResAfter.json();

    assert.strictEqual(stateAfter.status, 'LOBBY', 'Room status returned to LOBBY');
    assert.strictEqual(stateAfter.currentRoundPhase, 'LOBBY_WAITING', 'Phase returned to LOBBY_WAITING');
    assert.strictEqual(stateAfter.players['p_ace'].score, aceScoreBefore, 'Ace score preserved');
    assert.strictEqual(Object.keys(stateAfter.players).length, 6, 'All 6 players remain connected in Hub');
  });

  // ============================================================================
  // SUITE 6: Adversarial Payload Injection & Vulnerability Verification
  // ============================================================================
  console.log('\n--- SUITE 6: Adversarial Payload Injection & Vulnerability Verification ---');

  const roomCodeChaos = `CHALLENGE_M3_CHAOS_${Date.now()}`;

  await testStep('6.1 - Handle invalid or malformed action payloads gracefully', async () => {
    // 1. Missing action
    let res = await POST(createMockPostRequest({ roomCode: roomCodeChaos }));
    assert.strictEqual(res.status, 200);

    // 2. Non-existent player answering
    res = await POST(
      createMockPostRequest({
        roomCode: roomCodeChaos,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'FACT',
          remainingTime: 3000,
          playerId: 'non_existent_player_xyz',
        },
      })
    );
    assert.strictEqual(res.status, 200);

    // 3. Invalid choice string
    res = await POST(
      createMockPostRequest({
        roomCode: roomCodeChaos,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: 'NOT_FACT_NOR_CAP',
          remainingTime: 3000,
          playerId: 'some_player',
        },
      })
    );
    assert.strictEqual(res.status, 200);

    // 4. Malformed JSON body
    res = await POST(
      new NextRequest('http://localhost:3000/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'NOT_VALID_JSON{{{',
      })
    );
    assert.strictEqual(res.status, 400);
  });

  await testStep('6.2 - Concurrent GET polling stress while submitting answers', async () => {
    // Setup player
    await POST(
      createMockPostRequest({
        roomCode: roomCodeChaos,
        action: 'JOIN',
        payload: { playerId: 'chaos_king', name: 'Vua Hỗn Loạn', avatarId: 'keyboard_warrior' },
      })
    );

    // Interleave 20 GET polls and 5 POST actions simultaneously
    const tasks = [];
    for (let i = 0; i < 20; i++) {
      tasks.push(GET(createMockGetRequest(roomCodeChaos, i * 100)));
    }
    for (let i = 0; i < 5; i++) {
      tasks.push(
        POST(
          createMockPostRequest({
            roomCode: roomCodeChaos,
            action: 'DANMAKU',
            payload: { emoji: '🔥', label: 'Stress test', playerName: 'Chaos', avatarId: 'keyboard_warrior' },
          })
        )
      );
    }

    const results = await Promise.all(tasks);
    for (const r of results) {
      assert.strictEqual(r.status, 200);
    }
  });

  await testStep('6.3 - EMPIRICAL DEFECT DEMONSTRATION: Missing guard on route.ts:555 for playerResults', async () => {
    const roomCodeDefect = `DEFECT_TEST_${Date.now()}`;
    await POST(
      createMockPostRequest({
        roomCode: roomCodeDefect,
        action: 'JOIN',
        payload: { playerId: 'p_test', name: 'Test Player', avatarId: 'keyboard_warrior' },
      })
    );

    // Host updates round2State strictly per PROJECT.md interface contract (no legacy playerResults)
    await POST(
      createMockPostRequest({
        roomCode: roomCodeDefect,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            phase: 'QUESTION_ACTIVE',
            currentQuestionIndex: 0,
            questions: MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5),
            answers: {},
            // Notice: playerResults is intentionally omitted as it is not in PROJECT.md contract
          },
        },
      })
    );

    // Player attempts to submit answer -> triggers TypeError at route.ts:555
    let caughtError: any = null;
    try {
      await POST(
        createMockPostRequest({
          roomCode: roomCodeDefect,
          action: 'SUBMIT_FACT_OR_CAP',
          payload: {
            choice: 'CAP',
            remainingTime: 3000,
            playerId: 'p_test',
            questionIndex: 0,
          },
        })
      );
    } catch (err: any) {
      caughtError = err;
    }

    assert.ok(caughtError !== null, 'Confirmed: route.ts:555 throws unhandled TypeError when playerResults is undefined');
    assert.match(
      caughtError.message,
      /Cannot set properties of undefined/i,
      'Error message matches expected TypeError on undefined playerResults'
    );
    console.log('    -> EMPIRICALLY CONFIRMED DEFECT: route.ts line 555 lacks `if (!room.round2State.playerResults) room.round2State.playerResults = {};` guard!');
  });

  console.log('\n================================================================');
  console.log(`  EMPIRICAL CHALLENGER VERIFICATION COMPLETE: ALL ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('================================================================\n');
}

runM3ChallengerSuite().catch((err) => {
  console.error('\n❌ CHALLENGER M3 TEST FAILED:', err);
  process.exit(1);
});
