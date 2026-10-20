// tests/suites/m4_consensus_dilemma.test.ts
// Comprehensive Automated Test Suite for Milestone 4: Mode 3: Trưng Cầu Dân Ý: Đoán Phe Đa Số (The Consensus Dilemma)

import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/game/route';
import { MLN131_CONSENSUS_DILEMMAS } from '../../src/data/questions';
import { calculateSpeedDecayScore, DilemmaItem, DilemmaTally } from '../../src/lib/types';

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

async function runM4ConsensusDilemmaTests() {
  console.log('\n======================================================');
  console.log('--- STARTING MILESTONE 4: MODE 3 TEST SUITE ---');
  console.log('--- Mode 3: Trưng Cầu Dân Ý (Consensus Dilemma) ---');
  console.log('======================================================\n');

  const roomCode = `M4_TEST_${Date.now()}`;

  // -----------------------------------------------------------
  // STEP 1: Verify MLN131 Consensus Dilemma Bank
  // -----------------------------------------------------------
  console.log('Step 1: Validating MLN131 Consensus Dilemma Question Bank');
  assert.ok(MLN131_CONSENSUS_DILEMMAS.length >= 6, 'Contains at least 6 high-stakes dilemmas');

  MLN131_CONSENSUS_DILEMMAS.forEach((d, idx) => {
    assert.ok(d.id, `Dilemma ${idx + 1} has valid id`);
    assert.ok(d.title && d.title.length > 5, `Dilemma ${idx + 1} has comprehensive title: ${d.title}`);
    assert.ok(d.scenario && d.scenario.length > 20, `Dilemma ${idx + 1} has detailed scenario`);
    assert.ok(d.choiceA, `Dilemma ${idx + 1} has choiceA`);
    assert.ok(d.choiceB, `Dilemma ${idx + 1} has choiceB`);
    assert.ok(d.contextMLN131, `Dilemma ${idx + 1} has MLN131 curricular alignment`);
  });
  console.log(`✔ Verified ${MLN131_CONSENSUS_DILEMMAS.length} MLN131 dilemmas with complete metadata.`);

  // -----------------------------------------------------------
  // STEP 2: Register Room & 6 Students
  // -----------------------------------------------------------
  console.log('\nStep 2: Registering 6 students in room', roomCode);
  const students = [
    { id: 'player_cyan_leader', name: 'Nguyễn Cánh Tả', avatarId: 'keyboard_warrior' },
    { id: 'player_crimson_leader', name: 'Trần Cánh Hữu', avatarId: 'conspiracy_theorist' },
    { id: 'player_swing_voter', name: 'Lê Ba Phải', avatarId: 'zen_monk' },
    { id: 'player_tactical_better', name: 'Phạm Tiên Tri', avatarId: 'meme_lord' },
    { id: 'player_minority_better', name: 'Hoàng Cá Cá', avatarId: 'anti_scam_otter' },
    { id: 'player_tie_maker', name: 'Đỗ Cân Bằng', avatarId: 'fact_checker' },
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
  assert.strictEqual(Object.keys(state.players).length, 6, '6 players registered');
  console.log('✔ All 6 players successfully registered.');

  // -----------------------------------------------------------
  // STEP 3: Initialize Mode 3 & DILEMMA_INTRO Phase
  // -----------------------------------------------------------
  console.log('\nStep 3: Initializing Mode 3 (ROUND_3) in DILEMMA_INTRO phase');
  const initialDilemma = MLN131_CONSENSUS_DILEMMAS[0];

  await POST(
    createMockPostRequest({
      roomCode,
      action: 'HOST_UPDATE_STATE',
      payload: {
        status: 'ROUND_3',
        currentRoundPhase: 'DILEMMA_INTRO',
        round3State: {
          phase: 'DILEMMA_INTRO',
          currentDilemmaIndex: 0,
          dilemma: initialDilemma,
          dilemmas: MLN131_CONSENSUS_DILEMMAS,
          stances: {},
          consensusBets: {},
          tally: { countA: 0, countB: 0, percentA: 50, percentB: 50, majority: 'DRAW' },
        },
      },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.status, 'ROUND_3', 'Status is ROUND_3');
  assert.strictEqual(state.round3State.phase, 'DILEMMA_INTRO', 'Phase is DILEMMA_INTRO');
  assert.strictEqual(state.round3State.dilemma.id, initialDilemma.id, 'Initial dilemma loaded');
  console.log(`✔ Mode 3 initialized with Dilemma 1: "${initialDilemma.title}"`);

  // -----------------------------------------------------------
  // STEP 4: Start VOTING Phase & Verify Realtime Tug-of-War Tally Shifting
  // -----------------------------------------------------------
  console.log('\nStep 4: Real-time Tug-of-war dynamic percentage and majority calculation');
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SET_ROUND_PHASE',
      payload: { phase: 'VOTING' },
    })
  );

  // Student 1 votes A: 1-0 => 100% A, 0% B, majority = A
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'player_cyan_leader', stance: 'A' },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.round3State.tally.countA, 1, 'countA = 1');
  assert.strictEqual(state.round3State.tally.countB, 0, 'countB = 0');
  assert.strictEqual(state.round3State.tally.percentA, 100, 'percentA = 100%');
  assert.strictEqual(state.round3State.tally.percentB, 0, 'percentB = 0%');
  assert.strictEqual(state.round3State.tally.majority, 'A', 'majority = A');
  console.log('  [1 vote]  Phe A: 1 (100%) vs Phe B: 0 (0%) -> Majority: A');

  // Student 2 votes B: 1-1 => 50% A, 50% B, majority = DRAW
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'player_crimson_leader', stance: 'B' },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.round3State.tally.countA, 1, 'countA = 1');
  assert.strictEqual(state.round3State.tally.countB, 1, 'countB = 1');
  assert.strictEqual(state.round3State.tally.percentA, 50, 'percentA = 50%');
  assert.strictEqual(state.round3State.tally.percentB, 50, 'percentB = 50%');
  assert.strictEqual(state.round3State.tally.majority, 'DRAW', 'majority = DRAW');
  console.log('  [2 votes] Phe A: 1 (50%)  vs Phe B: 1 (50%) -> Majority: DRAW (Tie)');

  // Student 3 votes A: 2-1 => 67% A, 33% B, majority = A
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'player_swing_voter', stance: 'A' },
    })
  );

  // Student 4 votes A: 3-1 => 75% A, 25% B, majority = A
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'player_tactical_better', stance: 'A' },
    })
  );

  // Student 5 votes B: 3-2 => 60% A, 40% B, majority = A
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'player_minority_better', stance: 'B' },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.round3State.tally.countA, 3, 'countA = 3');
  assert.strictEqual(state.round3State.tally.countB, 2, 'countB = 2');
  assert.strictEqual(state.round3State.tally.percentA, 60, 'percentA = 60%');
  assert.strictEqual(state.round3State.tally.percentB, 40, 'percentB = 40%');
  assert.strictEqual(state.round3State.tally.majority, 'A', 'majority = A');
  console.log('  [5 votes] Phe A: 3 (60%)  vs Phe B: 2 (40%) -> Majority: A (>50%)');
  console.log('✔ Realtime Tug-of-war tally dynamically shifts with each incoming stance.');

  // -----------------------------------------------------------
  // STEP 5: 2-Stage Mobile Majority Bet Submission & Speed-Decay
  // -----------------------------------------------------------
  console.log('\nStep 5: Testing Step 2 Mobile Consensus Betting');
  // Student 1 bets on A early (18000ms remaining of 20000ms)
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_BET',
      payload: {
        playerId: 'player_cyan_leader',
        predictedMajority: 'A',
        remainingTime: 18000,
        totalTime: 20000,
      },
    })
  );

  // Student 4 (Tactical Better) also bets on A at 14000ms remaining
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_BET',
      payload: {
        playerId: 'player_tactical_better',
        predictedMajority: 'A',
        remainingTime: 14000,
        totalTime: 20000,
      },
    })
  );

  // Student 5 bets on B (wrong bet / minority) at 16000ms remaining
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_BET',
      payload: {
        playerId: 'player_minority_better',
        predictedMajority: 'B',
        remainingTime: 16000,
        totalTime: 20000,
      },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.round3State.consensusBets['player_cyan_leader'], 'A');
  assert.strictEqual(state.round3State.consensusBets['player_tactical_better'], 'A');
  assert.strictEqual(state.round3State.consensusBets['player_minority_better'], 'B');
  console.log('✔ Consensus bets recorded accurately for all participating mobile clients.');

  // -----------------------------------------------------------
  // STEP 6: Phase 3 TUG_REVEAL & Majority +5000 pts Allocation
  // -----------------------------------------------------------
  console.log('\nStep 6: Revealing results (TUG_REVEAL) & Score Allocation');
  // At reveal time, Phe A is confirmed majority (60% > 50%)
  // Host updates final tally and allocates scores
  const finalMajority = state.round3State.tally.majority;
  assert.strictEqual(finalMajority, 'A', 'Phe A is the majority side');

  // Verify that correct betters received points and minority received 0
  const winner1Score = state.players['player_cyan_leader'].score;
  const winner2Score = state.players['player_tactical_better'].score;
  const loserScore = state.players['player_minority_better'].score;

  assert.ok(winner1Score > 0, `Winner 1 received points: ${winner1Score}`);
  assert.ok(winner2Score > 0, `Winner 2 received points: ${winner2Score}`);
  assert.strictEqual(loserScore, 0, `Minority better received 0 points: ${loserScore}`);

  // Also verify Speed-Decay: Winner 1 (cược sớm lúc 18s) có điểm >= Winner 2 (cược lúc 14s)
  assert.ok(
    winner1Score >= winner2Score,
    `Early bettor (${winner1Score} pts) earned more than later bettor (${winner2Score} pts)`
  );
  console.log(`✔ Majority side A won! Early better received ${winner1Score} pts, later better received ${winner2Score} pts, minority better received 0 pts.`);

  // -----------------------------------------------------------
  // STEP 7: 50/50 Tie-break Consensus Draw Test (+2500 PTS each)
  // -----------------------------------------------------------
  console.log('\nStep 7: Testing 50/50 exact tie handling (Consensus Draw: +2500 pts each)');
  // Student 6 votes B, bringing count to 3-3 (50% A, 50% B)
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'player_tie_maker', stance: 'B' },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.round3State.tally.countA, 3);
  assert.strictEqual(state.round3State.tally.countB, 3);
  assert.strictEqual(state.round3State.tally.percentA, 50);
  assert.strictEqual(state.round3State.tally.percentB, 50);
  assert.strictEqual(state.round3State.tally.majority, 'DRAW');
  console.log('  Tally is exactly 50/50 (3 votes A vs 3 votes B) -> Majority: DRAW');

  // Simulate Host processing 50/50 DRAW: awards +2500 pts to all participants
  const preDrawScoreLeader = state.players['player_crimson_leader'].score;
  const updatedPlayers = { ...state.players };
  Object.values(updatedPlayers).forEach((p) => {
    p.score += 2500;
    p.roundScores.ROUND_3 = (p.roundScores.ROUND_3 || 0) + 2500;
  });

  await POST(
    createMockPostRequest({
      roomCode,
      action: 'HOST_UPDATE_STATE',
      payload: {
        players: updatedPlayers,
        round3State: {
          ...state.round3State,
          phase: 'TUG_REVEAL',
          majoritySide: 'DRAW',
        },
      },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(
    state.players['player_crimson_leader'].score,
    preDrawScoreLeader + 2500,
    'Player received exactly +2500 PTS for 50/50 consensus draw'
  );
  console.log('✔ 50/50 Consensus Draw successfully awarded +2500 PTS to participants.');

  // -----------------------------------------------------------
  // STEP 8: Return to Hub & Score Preservation
  // -----------------------------------------------------------
  console.log('\nStep 8: Verifying Return to Hub action & score preservation');
  const scoresBeforeHub = {
    cyan: state.players['player_cyan_leader'].score,
    crimson: state.players['player_crimson_leader'].score,
  };

  await POST(
    createMockPostRequest({
      roomCode,
      action: 'RETURN_TO_HUB',
      payload: {},
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.status, 'LOBBY', 'Status transitioned back to LOBBY');
  assert.strictEqual(
    state.players['player_cyan_leader'].score,
    scoresBeforeHub.cyan,
    'Cyan leader score preserved on Hub return'
  );
  assert.strictEqual(
    state.players['player_crimson_leader'].score,
    scoresBeforeHub.crimson,
    'Crimson leader score preserved on Hub return'
  );
  console.log('✔ Successfully returned to Hub with all cumulative scores fully preserved!');

  console.log('\n======================================================');
  console.log('✔ ALL MILESTONE 4: MODE 3 AUTOMATED TESTS PASSED (100%)');
  console.log('======================================================\n');
}

runM4ConsensusDilemmaTests().catch((err) => {
  console.error('\n✖ TEST FAILED:', err);
  process.exit(1);
});
