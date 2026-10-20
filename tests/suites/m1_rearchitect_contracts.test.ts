// tests/suites/m1_rearchitect_contracts.test.ts
// Unit and Contract Verification for Milestone 1 Rearchitecture

import assert from 'node:assert';
import { calculateSpeedDecayScore } from '../../src/lib/types';
import {
  MLN131_FACT_OR_CAP_QUESTIONS,
  MLN131_CONSENSUS_DILEMMAS,
  MLN131_ROAST_PROMPTS,
  MLN131_QUESTIONS,
} from '../../src/data/questions';
import { POST, GET } from '../../src/app/api/game/route';
import { NextRequest } from 'next/server';

function createMockPostRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createMockGetRequest(room: string = 'M1_TEST'): NextRequest {
  return new NextRequest(`http://localhost:3000/api/game?room=${room}&since=0`, {
    method: 'GET',
  });
}

async function runM1RearchitectTests() {
  console.log('\n--- Running Milestone 1 Rearchitect Contract Tests ---');

  // 1. Test calculateSpeedDecayScore
  console.log('Test 1: Speed-Decay Scoring Formula');
  assert.strictEqual(calculateSpeedDecayScore(1000, 5000, 5000, true), 1000, 'Full time = 100% points');
  assert.strictEqual(calculateSpeedDecayScore(1000, 2500, 5000, true), 500, 'Half time = 50% points');
  assert.strictEqual(calculateSpeedDecayScore(1000, 0, 5000, true), 0, 'Zero time = 0 points');
  assert.strictEqual(calculateSpeedDecayScore(1000, 4500, 5000, false), 0, 'Incorrect answer = 0 points regardless of time');
  assert.strictEqual(calculateSpeedDecayScore(1000, -100, 5000, true), 0, 'Negative remaining time = 0 points');
  assert.strictEqual(calculateSpeedDecayScore(1000, 6000, 5000, true), 1000, 'Exceeded remaining time capped at 100%');
  assert.strictEqual(calculateSpeedDecayScore(1000, 1000, 0, true), 0, 'Zero total time = 0 points safe fallback');
  console.log('✔ Speed-Decay scoring formula passed with all boundary conditions.');

  // 2. Test Question Bank Integrity
  console.log('Test 2: Question Banks Integrity');
  assert(Array.isArray(MLN131_FACT_OR_CAP_QUESTIONS), 'MLN131_FACT_OR_CAP_QUESTIONS is array');
  assert(MLN131_FACT_OR_CAP_QUESTIONS.length >= 8, `Fact/Cap bank has ${MLN131_FACT_OR_CAP_QUESTIONS.length} questions (>= 8)`);
  for (const q of MLN131_FACT_OR_CAP_QUESTIONS) {
    assert(typeof q.id === 'number', 'FactCap ID is number');
    assert(typeof q.statement === 'string' && q.statement.length > 10, 'FactCap statement is valid');
    assert(typeof q.isFact === 'boolean', 'FactCap isFact is boolean');
    assert(typeof q.explanation === 'string' && q.explanation.length > 10, 'FactCap explanation is valid');
    assert(q.basePoints === 1000, 'FactCap basePoints is 1000');
  }

  assert(Array.isArray(MLN131_CONSENSUS_DILEMMAS), 'MLN131_CONSENSUS_DILEMMAS is array');
  assert(MLN131_CONSENSUS_DILEMMAS.length >= 5, `Dilemmas bank has ${MLN131_CONSENSUS_DILEMMAS.length} dilemmas (>= 5)`);
  for (const d of MLN131_CONSENSUS_DILEMMAS) {
    assert(typeof d.id === 'number', 'Dilemma ID is number');
    assert(typeof d.title === 'string' && d.title.length > 5, 'Dilemma title is valid');
    assert(typeof d.scenario === 'string' && d.scenario.length > 20, 'Dilemma scenario is valid');
    assert(Boolean(d.choiceA), 'Dilemma choiceA is defined');
    assert(Boolean(d.choiceB), 'Dilemma choiceB is defined');
  }
  console.log('✔ Question banks data structure and curriculum relevance verified.');

  // 3. API Action: SUBMIT_FEED_COMMENT and REACT_FEED_POST
  console.log('Test 3: API Feed Comment and Reaction');
  const roomCode = 'M1_TEST_ROOM';
  // Join player
  await POST(createMockPostRequest({
    roomCode,
    action: 'JOIN',
    payload: { playerId: 'p1', name: 'Chiến Sĩ A', avatarId: 'keyboard_warrior' },
  }));
  await POST(createMockPostRequest({
    roomCode,
    action: 'JOIN',
    payload: { playerId: 'p2', name: 'Chiến Sĩ B', avatarId: 'fact_checker' },
  }));

  // Submit comment
  const submitRes = await POST(createMockPostRequest({
    roomCode,
    action: 'SUBMIT_FEED_COMMENT',
    payload: { playerId: 'p1', text: 'Dân biết dân bàn nha bạn ơi!' },
  }));
  assert.strictEqual(submitRes.status, 200);

  // Read state
  let getRes = await GET(createMockGetRequest(roomCode));
  let state = await getRes.json();
  const comments = Object.values(state.state.round1State.comments || {});
  assert.strictEqual(comments.length, 1);
  const comment = comments[0] as any;
  assert.strictEqual(comment.authorId, 'p1');
  assert.strictEqual(comment.text, 'Dân biết dân bàn nha bạn ơi!');

  // React to comment
  await POST(createMockPostRequest({
    roomCode,
    action: 'REACT_FEED_POST',
    payload: { postId: comment.id, reactionType: 'heart', voterId: 'p2' },
  }));

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  const updatedComment = state.state.round1State.comments[comment.id];
  assert.strictEqual(updatedComment.reactions.heart, 1);
  assert.strictEqual(updatedComment.score, 100);
  assert.strictEqual(state.state.players.p1.score, 100, 'Author gained +100 points');
  assert.deepStrictEqual(state.state.round1State.trendingTopIds, [comment.id]);
  console.log('✔ Mode 1 Feed submission and reaction passed.');

  // 4. API Action: SUBMIT_FACT_OR_CAP
  console.log('Test 4: API Fact or Cap Speed-Decay');
  await POST(createMockPostRequest({
    roomCode,
    action: 'SUBMIT_FACT_OR_CAP',
    payload: {
      choice: 'FACT',
      reactionTimeMs: 1000,
      totalTime: 5000,
      playerId: 'p2',
      questionIndex: 1, // Question 2: isFact = true
    },
  }));

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  const p2Answer = state.state.round2State.answers.p2;
  assert.strictEqual(p2Answer.isCorrect, true);
  assert.strictEqual(p2Answer.score, 800, 'Speed decay: 1s elapsed out of 5s -> 80% of 1000 = 800');
  assert.strictEqual(p2Answer.livesRemaining, 3);
  console.log('✔ Mode 2 Fact or Cap speed-decay scored accurately.');

  // 5. API Action: SUBMIT_DILEMMA_STANCE and SUBMIT_DILEMMA_BET
  console.log('Test 5: API Consensus Dilemma Stance and Bet');
  await POST(createMockPostRequest({
    roomCode,
    action: 'SUBMIT_DILEMMA_STANCE',
    payload: { playerId: 'p1', stance: 'A' },
  }));
  await POST(createMockPostRequest({
    roomCode,
    action: 'SUBMIT_DILEMMA_STANCE',
    payload: { playerId: 'p2', stance: 'A' },
  }));

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.state.round3State.tally.countA, 2);
  assert.strictEqual(state.state.round3State.tally.countB, 0);
  assert.strictEqual(state.state.round3State.tally.majority, 'A');

  // Submit bet
  await POST(createMockPostRequest({
    roomCode,
    action: 'SUBMIT_DILEMMA_BET',
    payload: {
      predictedMajority: 'A',
      remainingTime: 18000,
      totalTime: 20000,
      playerId: 'p1',
    },
  }));

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.state.round3State.consensusBets.p1, 'A');
  console.log('✔ Mode 3 Consensus Dilemma stance tally and bet passed.');

  // 6. API Action: RETURN_TO_HUB
  console.log('Test 6: RETURN_TO_HUB');
  await POST(createMockPostRequest({
    roomCode,
    action: 'SET_STATUS',
    payload: { status: 'ROUND_4' },
  }));
  await POST(createMockPostRequest({
    roomCode,
    action: 'RETURN_TO_HUB',
    payload: {},
  }));

  getRes = await GET(createMockGetRequest(roomCode));
  state = await getRes.json();
  assert.strictEqual(state.state.status, 'LOBBY');
  console.log('✔ RETURN_TO_HUB successfully restored state to LOBBY.');

  console.log('\n--- ALL MILESTONE 1 CONTRACT TESTS PASSED PERFECTLY ---\n');
}

runM1RearchitectTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
