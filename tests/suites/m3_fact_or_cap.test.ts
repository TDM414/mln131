// tests/suites/m3_fact_or_cap.test.ts
// Comprehensive Automated Test Suite for Milestone 3: Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)

import assert from 'node:assert';
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

function createMockGetRequest(room: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/game?room=${encodeURIComponent(room)}&since=0`,
    {
      method: 'GET',
    }
  );
}

async function runM3FactOrCapTests() {
  console.log('\n======================================================');
  console.log('--- STARTING MILESTONE 3: MODE 2 TEST SUITE ---');
  console.log('======================================================\n');

  const roomCode = `M3_TEST_${Date.now()}`;

  // -----------------------------------------------------------
  // STEP 1: Verify Mathematical Speed-Decay Scoring Engine
  // -----------------------------------------------------------
  console.log('Step 1: Testing Speed-Decay Scoring formula accuracy');
  // Formula: Math.round(BasePoints * (RemainingTime / TotalTime))
  // Base 1000, Total 5000ms:
  assert.strictEqual(calculateSpeedDecayScore(1000, 5000, 5000, true), 1000, 'Instant 0.0s reflex = 1000 pts (100%)');
  assert.strictEqual(calculateSpeedDecayScore(1000, 4500, 5000, true), 900, '0.5s reflex (4500ms remaining) = 900 pts (90%)');
  assert.strictEqual(calculateSpeedDecayScore(1000, 4000, 5000, true), 800, '1.0s reflex (4000ms remaining) = 800 pts (80%)');
  assert.strictEqual(calculateSpeedDecayScore(1000, 3000, 5000, true), 600, '2.0s reflex (3000ms remaining) = 600 pts (60%)');
  assert.strictEqual(calculateSpeedDecayScore(1000, 1500, 5000, true), 300, '3.5s reflex (1500ms remaining) = 300 pts (30%)');
  assert.strictEqual(calculateSpeedDecayScore(1000, 500, 5000, true), 100, '4.5s reflex (500ms remaining) = 100 pts (10%)');
  assert.strictEqual(calculateSpeedDecayScore(1000, 0, 5000, true), 0, 'Timeout 0ms remaining = 0 pts');

  // Wrong answer always produces 0 points regardless of remaining time
  assert.strictEqual(calculateSpeedDecayScore(1000, 4800, 5000, false), 0, 'Fast wrong answer yields 0 pts');
  assert.strictEqual(calculateSpeedDecayScore(1000, 2000, 5000, false), 0, 'Wrong answer yields 0 pts');

  // Boundary conditions
  assert.strictEqual(calculateSpeedDecayScore(1000, -500, 5000, true), 0, 'Negative remaining time yields 0 pts');
  assert.strictEqual(calculateSpeedDecayScore(1000, 6000, 5000, true), 1000, 'Remaining time capped at total time');
  assert.strictEqual(calculateSpeedDecayScore(1000, 2500, 0, true), 0, 'Total time 0 yields 0 pts');
  console.log('✔ Speed-Decay scoring formula verified across all timing tiers.');

  // -----------------------------------------------------------
  // STEP 2: Room Registration & 3-Lives Initialization
  // -----------------------------------------------------------
  console.log('\nStep 2: Registering 4 students in room', roomCode);
  const students = [
    { id: 'player_reflex_king', name: 'Nguyễn Tốc Độ', avatarId: 'keyboard_warrior' },
    { id: 'player_slow_steady', name: 'Trần Cẩn Thận', avatarId: 'zen_monk' },
    { id: 'player_cap_lover', name: 'Lê Thích Bóc Phét', avatarId: 'conspiracy_theorist' },
    { id: 'player_eliminated', name: 'Phạm Bay Màu', avatarId: 'anti_scam_otter' },
  ];

  for (const stu of students) {
    const res = await POST(
      createMockPostRequest({
        roomCode,
        action: 'JOIN',
        payload: {
          playerId: stu.id,
          name: stu.name,
          avatarId: stu.avatarId,
        },
      })
    );
    assert.strictEqual(res.status, 200, `Student ${stu.name} registered`);
  }

  let getRes = await GET(createMockGetRequest(roomCode));
  let state = await getRes.json();
  assert.strictEqual(Object.keys(state.players).length, 4, '4 players registered');

  // Verify all 4 players start with 3 lives (❤️❤️❤️)
  for (const stu of students) {
    assert.strictEqual(state.players[stu.id].r2Lives, 3, `Player ${stu.name} initialized with 3 lives`);
  }
  console.log('✔ All 4 players initialized with 3 lives (❤️❤️❤️).');

  // -----------------------------------------------------------
  // STEP 3: Mode 2 Initialization & Question Bank Validation
  // -----------------------------------------------------------
  console.log('\nStep 3: Initializing ROUND_2 with 5 questions');
  const fiveQuestions = MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5);
  assert.strictEqual(fiveQuestions.length, 5, '5 curated questions available');

  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SET_STATUS',
      payload: { status: 'ROUND_2' },
    })
  );

  await POST(
    createMockPostRequest({
      roomCode,
      action: 'HOST_UPDATE_STATE',
      payload: {
        round2State: {
          phase: 'QUESTION_ACTIVE',
          currentQuestionIndex: 0,
          questions: fiveQuestions,
          answers: {},
          currentGameIndex: 0,
          activeGame: {
            type: 'CATCH_REPORT',
            title: 'Mode 2 Reflex',
            instruction: 'Fact or Cap',
            timeLimitSec: 5,
          },
          gamesList: [],
          survivorIds: students.map((s) => s.id),
          playerResults: {},
        },
      },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.status, 'ROUND_2', 'Game status is ROUND_2');
  assert.strictEqual(state.round2State.currentQuestionIndex, 0, 'Current question is index 0');
  console.log('✔ Mode 2 initialized with Question 1:', fiveQuestions[0].statement.slice(0, 50) + '...');

  // -----------------------------------------------------------
  // STEP 4: Question 1 Submissions & Speed Decay Calculations
  // -----------------------------------------------------------
  console.log('\nStep 4: Submitting Question 1 answers');
  const q1 = fiveQuestions[0]; // isFact: false (CAP)
  assert.strictEqual(q1.isFact, false, 'Question 1 is CAP (isFact = false)');

  // Student 1: Chooses CAP (CORRECT) after 1.0s (4000ms remaining)
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        choice: 'CAP',
        remainingTime: 4000,
        totalTime: 5000,
        playerId: 'player_reflex_king',
        questionIndex: 0,
      },
    })
  );

  // Student 2: Chooses CAP (CORRECT) after 3.5s (1500ms remaining)
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        choice: 'CAP',
        remainingTime: 1500,
        totalTime: 5000,
        playerId: 'player_slow_steady',
        questionIndex: 0,
      },
    })
  );

  // Student 3: Chooses FACT (WRONG) after 0.8s (4200ms remaining)
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        choice: 'FACT',
        remainingTime: 4200,
        totalTime: 5000,
        playerId: 'player_cap_lover',
        questionIndex: 0,
      },
    })
  );

  // Student 4: Chooses FACT (WRONG)
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        choice: 'FACT',
        remainingTime: 2000,
        totalTime: 5000,
        playerId: 'player_eliminated',
        questionIndex: 0,
      },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();

  // Validate Student 1 (Correct, 4000ms left -> 800 pts, 3 lives preserved)
  const p1 = state.players['player_reflex_king'];
  assert.strictEqual(p1.score, 800, 'Student 1 earned 800 points via speed-decay (4000/5000 * 1000)');
  assert.strictEqual(p1.roundScores.ROUND_2, 800, 'Round 2 score matches');
  assert.strictEqual(p1.r2Lives, 3, 'Student 1 preserved 3 lives');

  // Validate Student 2 (Correct, 1500ms left -> 300 pts, 3 lives preserved)
  const p2 = state.players['player_slow_steady'];
  assert.strictEqual(p2.score, 300, 'Student 2 earned 300 points via speed-decay (1500/5000 * 1000)');
  assert.strictEqual(p2.r2Lives, 3, 'Student 2 preserved 3 lives');

  // Validate Student 3 (Wrong answer -> 0 pts, lost 1 life: 3 -> 2)
  const p3 = state.players['player_cap_lover'];
  assert.strictEqual(p3.score, 0, 'Student 3 earned 0 points for wrong answer');
  assert.strictEqual(p3.r2Lives, 2, 'Student 3 lost 1 life (3 -> 2)');

  // Validate Student 4 (Wrong answer -> lost 1 life: 3 -> 2)
  const p4 = state.players['player_eliminated'];
  assert.strictEqual(p4.r2Lives, 2, 'Student 4 lost 1 life (3 -> 2)');
  console.log('✔ Question 1 scoring and life decrement validated.');

  // -----------------------------------------------------------
  // STEP 5: 5-Question Progression & 3-Life Decrement to Ghost Mode
  // -----------------------------------------------------------
  console.log('\nStep 5: Testing multi-question progression across all 5 questions');

  for (let qIdx = 1; qIdx < 5; qIdx++) {
    const q = fiveQuestions[qIdx];
    console.log(`  Advancing to Question ${qIdx + 1} / 5 (isFact: ${q.isFact})`);

    await POST(
      createMockPostRequest({
        roomCode,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round2State: {
            ...state.round2State,
            currentQuestionIndex: qIdx,
            phase: 'QUESTION_ACTIVE',
            answers: {},
          },
        },
      })
    );

    // Student 1 answers correctly every question
    const correctChoice = q.isFact ? 'FACT' : 'CAP';
    await POST(
      createMockPostRequest({
        roomCode,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: correctChoice,
          remainingTime: 3500,
          totalTime: 5000,
          playerId: 'player_reflex_king',
          questionIndex: qIdx,
        },
      })
    );

    // Student 4 answers incorrectly every question to test elimination to 0 lives
    const wrongChoice = q.isFact ? 'CAP' : 'FACT';
    await POST(
      createMockPostRequest({
        roomCode,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          choice: wrongChoice,
          remainingTime: 3000,
          totalTime: 5000,
          playerId: 'player_eliminated',
          questionIndex: qIdx,
        },
      })
    );
  }

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();

  // Student 1 answered all 5 correctly -> 3 lives preserved, high score
  const finalP1 = state.players['player_reflex_king'];
  assert.strictEqual(finalP1.r2Lives, 3, 'Student 1 survived all 5 questions with 3/3 lives');
  assert.ok(finalP1.score >= 3500, `Student 1 accumulated high score: ${finalP1.score}`);

  // Student 4 answered wrong on Q1 (life 2), Q2 (life 1), Q3 (life 0 -> Ghost), Q4 (clamped 0), Q5 (clamped 0)
  const finalP4 = state.players['player_eliminated'];
  assert.strictEqual(finalP4.r2Lives, 0, 'Student 4 lost all lives and is now a Ghost (r2Lives === 0)');
  console.log('✔ Multi-question progression completed. Student 4 successfully transitioned to Ghost Mode 👻.');

  // -----------------------------------------------------------
  // STEP 6: Standalone Return to Hub Functionality
  // -----------------------------------------------------------
  console.log('\nStep 6: Verifying Return to Hub action');
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'RETURN_TO_HUB',
      payload: {},
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();

  assert.strictEqual(state.status, 'LOBBY', 'Room status returned to LOBBY');
  assert.strictEqual(state.currentRoundPhase, 'LOBBY_WAITING', 'Phase returned to LOBBY_WAITING');

  // Verify all player scores are intact after returning to Hub
  assert.strictEqual(state.players['player_reflex_king'].score, finalP1.score, 'Player score preserved after returning to Hub');
  assert.strictEqual(state.players['player_slow_steady'].score, 300, 'Player 2 score preserved');
  console.log('✔ Successfully returned to Hub with player scores intact!');

  console.log('\n======================================================');
  console.log('✔ ALL MILESTONE 3: MODE 2 AUTOMATED TESTS PASSED (100%)');
  console.log('======================================================\n');
}

runM3FactOrCapTests().catch((err) => {
  console.error('\n❌ Milestone 3 test suite failed:', err);
  process.exit(1);
});
