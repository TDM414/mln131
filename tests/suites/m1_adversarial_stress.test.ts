// tests/suites/m1_adversarial_stress.test.ts
// Adversarial Edge-Case & Stress-Testing Suite for Milestone 1

import assert from 'node:assert';
import { calculateSpeedDecayScore } from '../../src/lib/types';
import { POST, GET } from '../../src/app/api/game/route';
import { NextRequest } from 'next/server';

function createMockPostRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createMockGetRequest(room: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/game?room=${room}&since=0`, {
    method: 'GET',
  });
}

async function runAdversarialStressTests() {
  console.log('\n=== ADVERSARIAL STRESS & FAILURE MODE TESTS (M1) ===');

  // Edge case 1: calculateSpeedDecayScore extreme values
  console.log('1. Stress-testing calculateSpeedDecayScore extreme parameters');
  assert.strictEqual(calculateSpeedDecayScore(1000, 0, 5000, true), 0, 'Exact zero remaining time');
  assert.strictEqual(calculateSpeedDecayScore(1000, -9999, 5000, true), 0, 'Negative remaining time');
  assert.strictEqual(calculateSpeedDecayScore(1000, 999999, 5000, true), 1000, 'Super large remaining time clamped to basePoints');
  assert.strictEqual(calculateSpeedDecayScore(1000, 2500, 0, true), 0, 'Zero totalTime handles division safely');
  assert.strictEqual(calculateSpeedDecayScore(1000, 2500, -5000, true), 0, 'Negative totalTime handles division safely');
  assert.strictEqual(calculateSpeedDecayScore(1000, 2500, 5000, false), 0, 'Wrong answer yields 0 regardless of time');
  assert.strictEqual(calculateSpeedDecayScore(0, 2500, 5000, true), 0, 'Zero basePoints yields 0');
  console.log('✔ calculateSpeedDecayScore passed all extreme boundary tests.');

  // Edge case 2: Mode 1 Profanity Sanitization & 120-char clamping in API
  console.log('2. Mode 1: Profanity sanitization and string length clamp');
  const room = 'ADV_ROOM_M1';
  await POST(createMockPostRequest({
    roomCode: room,
    action: 'JOIN',
    payload: { playerId: 'spammer', name: 'Troll User' },
  }));

  const superLongProfaneText = 'đm cái đồ lừa đảo này '.repeat(10);
  await POST(createMockPostRequest({
    roomCode: room,
    action: 'SUBMIT_FEED_COMMENT',
    payload: { playerId: 'spammer', text: superLongProfaneText },
  }));

  const rawLongText = 'Không gian mạng cần kỷ cương và pháp luật và trách nhiệm công dân '.repeat(5);
  await POST(createMockPostRequest({
    roomCode: room,
    action: 'SUBMIT_FEED_COMMENT',
    payload: { playerId: 'spammer2', text: rawLongText },
  }));

  let res = await GET(createMockGetRequest(room));
  let data = await res.json();
  const comments = Object.values(data.state.round1State.comments || {}) as any[];
  const profaneComment = comments.find((c) => c.authorId === 'spammer');
  const normalComment = comments.find((c) => c.authorId === 'spammer2');

  assert(normalComment && normalComment.text.length <= 120, 'Raw text clamped to 120 characters');
  assert(profaneComment && profaneComment.text.includes('[VAR đã che 🎦]'), 'Profanity replaced with VAR tag');
  console.log('✔ Profanity masked and comment length clamped.');

  // Edge case 3: Mode 1 Top Trending Ranking & Ties
  console.log('3. Mode 1: Top 5 Trending Ranking with multiple comments');
  for (let i = 1; i <= 8; i++) {
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FEED_COMMENT',
      payload: { playerId: `bot_${i}`, text: `Bình luận số ${i}` },
    }));
  }

  res = await GET(createMockGetRequest(room));
  data = await res.json();
  const allComments = Object.values(data.state.round1State.comments || {}) as any[];
  const targetComment = allComments[1];

  // Give 5 hearts to targetComment
  for (let i = 0; i < 5; i++) {
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'REACT_FEED_POST',
      payload: { postId: targetComment.id, reactionType: 'heart', voterId: `voter_${i}` },
    }));
  }

  res = await GET(createMockGetRequest(room));
  data = await res.json();
  assert.strictEqual(data.state.round1State.trendingTopIds[0], targetComment.id, 'Most reacted comment is #1 Trending');
  assert(data.state.round1State.trendingTopIds.length <= 5, 'Trending capped at 5 posts');
  console.log('✔ Top Trending properly ranks and caps at 5 posts.');

  // Edge case 4: Mode 2 Death and Lives Underflow Prevention
  console.log('4. Mode 2: Lives underflow prevention on repeated wrong answers');
  await POST(createMockPostRequest({
    roomCode: room,
    action: 'JOIN',
    payload: { playerId: 'victim', name: 'Victim Player' },
  }));

  // Answer wrong 4 times (starts with 3 lives)
  for (let i = 0; i < 4; i++) {
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        choice: 'CAP', // Question 1 is Fact = false (statement: freedom is absolute), wait: Q1 isFact = false! So choice 'FACT' is wrong!
        reactionTimeMs: 1000,
        playerId: 'victim',
        questionIndex: 0, // isFact = false. So choice 'FACT' is wrong!
      },
    }));
    // Note: choice 'CAP' for isFact=false is actually CORRECT! Let's submit wrong choice: 'FACT'
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        choice: 'FACT', // Wrong answer!
        reactionTimeMs: 1000,
        playerId: 'victim',
        questionIndex: 0,
      },
    }));
  }

  res = await GET(createMockGetRequest(room));
  data = await res.json();
  assert.strictEqual(data.state.players.victim.r2Lives, 0, 'Lives capped at 0, no negative underflow');
  console.log('✔ Mode 2 lives underflow prevention verified (r2Lives === 0).');

  // Edge case 5: Mode 3 Stance Switching & Realtime Consensus Tally
  console.log('5. Mode 3: Stance flipping and Tug-of-war percentage invariant');
  await POST(createMockPostRequest({
    roomCode: room,
    action: 'JOIN',
    payload: { playerId: 'voter1', name: 'Voter 1' },
  }));
  await POST(createMockPostRequest({
    roomCode: room,
    action: 'JOIN',
    payload: { playerId: 'voter2', name: 'Voter 2' },
  }));

  // Both choose A
  await POST(createMockPostRequest({ roomCode: room, action: 'SUBMIT_DILEMMA_STANCE', payload: { playerId: 'voter1', stance: 'A' } }));
  await POST(createMockPostRequest({ roomCode: room, action: 'SUBMIT_DILEMMA_STANCE', payload: { playerId: 'voter2', stance: 'A' } }));

  res = await GET(createMockGetRequest(room));
  data = await res.json();
  assert.strictEqual(data.state.round3State.tally.countA, 2);
  assert.strictEqual(data.state.round3State.tally.percentA, 100);
  assert.strictEqual(data.state.round3State.tally.majority, 'A');

  // Voter 2 changes mind from A to B
  await POST(createMockPostRequest({ roomCode: room, action: 'SUBMIT_DILEMMA_STANCE', payload: { playerId: 'voter2', stance: 'B' } }));

  res = await GET(createMockGetRequest(room));
  data = await res.json();
  assert.strictEqual(data.state.round3State.tally.countA, 1);
  assert.strictEqual(data.state.round3State.tally.countB, 1);
  assert.strictEqual(data.state.round3State.tally.percentA, 50);
  assert.strictEqual(data.state.round3State.tally.percentB, 50);
  assert.strictEqual(data.state.round3State.tally.majority, 'DRAW');
  console.log('✔ Stance switching dynamically recomputed tally and DRAW majority.');

  // Edge case 6: RETURN_TO_HUB Preserves Player Scores
  console.log('6. RETURN_TO_HUB score preservation');
  await POST(createMockPostRequest({
    roomCode: room,
    action: 'HOST_UPDATE_STATE',
    payload: {
      status: 'ROUND_3',
      players: {
        ...data.state.players,
        voter1: {
          ...data.state.players.voter1,
          score: 7500,
        },
      },
    },
  }));
  await POST(createMockPostRequest({
    roomCode: room,
    action: 'RETURN_TO_HUB',
    payload: {},
  }));

  res = await GET(createMockGetRequest(room));
  data = await res.json();
  assert.strictEqual(data.state.status, 'LOBBY');
  assert.strictEqual(data.state.currentRoundPhase, 'LOBBY_WAITING');
  assert.strictEqual(data.state.players.voter1.score, 7500, 'Score is preserved on RETURN_TO_HUB');
  console.log('✔ RETURN_TO_HUB preserved player scores while returning status to LOBBY.');

  console.log('\n=== ALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS ===\n');
}

runAdversarialStressTests().catch((err) => {
  console.error('Adversarial test failure:', err);
  process.exit(1);
});
