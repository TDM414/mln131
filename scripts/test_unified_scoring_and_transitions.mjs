// Test Suite: Unified Scoring Matrix and Sticky Transitions
import { POST, GET } from '../src/app/api/game/route.ts';

function createMockRequest(body) {
  return {
    url: 'http://localhost:3000/api/game?room=TEST_UNIFIED',
    json: async () => body,
  };
}

function createMockGetRequest() {
  return {
    url: 'http://localhost:3000/api/game?room=TEST_UNIFIED',
  };
}

async function runTests() {
  console.log('--- STARTING UNIFIED SCORING & TRANSITION TESTS ---');

  // 1. Reset Game
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'RESET_GAME' }));

  // 2. Join 5 players
  for (let i = 1; i <= 5; i++) {
    await POST(createMockRequest({
      roomCode: 'TEST_UNIFIED',
      action: 'JOIN',
      payload: {
        playerId: `p${i}`,
        name: `Student ${i}`,
        avatarId: 'keyboard_warrior',
      },
    }));
  }

  // 3. Verify Vòng 1 Reactions
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SET_STATUS', payload: { status: 'ROUND_1' } }));
  await POST(createMockRequest({
    roomCode: 'TEST_UNIFIED',
    action: 'SUBMIT_FEED_COMMENT',
    payload: { playerId: 'p1', text: 'Bình luận cực gắt về dân chủ số MLN131', promptIndex: 0 },
  }));

  // Add reactions to p1's comment
  const getRes1 = await (await GET(createMockGetRequest())).json();
  const commentId = Object.keys(getRes1.round1State.comments)[0];

  for (let r = 0; r < 5; r++) {
    await POST(createMockRequest({
      roomCode: 'TEST_UNIFIED',
      action: 'REACT_FEED_POST',
      payload: { postId: commentId, reactionType: 'heart', voterId: `p${(r % 5) + 1}` },
    }));
  }

  const getRes2 = await (await GET(createMockGetRequest())).json();
  const p1AfterV1 = getRes2.players['p1'];
  if (p1AfterV1.roundScores.ROUND_1 !== 500) {
    throw new Error(`Expected p1 Round 1 score to be 500, got ${p1AfterV1.roundScores.ROUND_1}`);
  }
  console.log('✔ Vòng 1 Reactions scoring verified: +500 PTS');

  // 4. Test HOST_UPDATE_STATE safe merge (Host awards Top 1 +3000)
  await POST(createMockRequest({
    roomCode: 'TEST_UNIFIED',
    action: 'HOST_UPDATE_STATE',
    payload: {
      players: {
        p1: {
          ...p1AfterV1,
          score: p1AfterV1.score + 3000,
          roundScores: {
            ...p1AfterV1.roundScores,
            ROUND_1: (p1AfterV1.roundScores.ROUND_1 || 0) + 3000,
          },
        },
      },
    },
  }));

  const getRes3 = await (await GET(createMockGetRequest())).json();
  if (getRes3.players['p1'].score !== 3500 || getRes3.players['p1'].roundScores.ROUND_1 !== 3500) {
    throw new Error(`Expected p1 score 3500, got ${getRes3.players['p1'].score}`);
  }
  console.log('✔ Vòng 1 Top Trending rank bonus verified: +3,500 PTS total');

  // 5. Test Vòng 2 (Bóc Phốt 10s Reflex)
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SET_STATUS', payload: { status: 'ROUND_2' } }));
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SET_ROUND_PHASE', payload: { phase: 'QUESTION_ACTIVE' } }));

  // p1 answers correct quickly (Question 0 is CAP: isFact is false)
  await POST(createMockRequest({
    roomCode: 'TEST_UNIFIED',
    action: 'SUBMIT_FACT_OR_CAP',
    payload: {
      choice: 'CAP',
      remainingTime: 8000,
      totalTime: 10000,
      playerId: 'p1',
      questionIndex: 0,
    },
  }));

  // Trigger REVEAL phase (p2, p3, p4, p5 timed out and should lose 1 life)
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SET_ROUND_PHASE', payload: { phase: 'REVEAL' } }));

  const getRes4 = await (await GET(createMockGetRequest())).json();
  if (getRes4.players['p1'].r2Lives !== 3) {
    throw new Error(`Expected p1 lives 3, got ${getRes4.players['p1'].r2Lives}`);
  }
  if (getRes4.players['p2'].r2Lives !== 2) {
    throw new Error(`Expected p2 lives 2 after timeout, got ${getRes4.players['p2'].r2Lives}`);
  }
  console.log('✔ Vòng 2 Timeout life penalty verified (p2 lives dropped from 3 to 2)');

  // Advance to ROUND_SUMMARY -> awards surviving lives bonus
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SET_ROUND_PHASE', payload: { phase: 'ROUND_SUMMARY' } }));

  const getRes5 = await (await GET(createMockGetRequest())).json();
  // p1 has 3 lives -> +1500 bonus
  // p2 has 2 lives -> +1000 bonus
  if (getRes5.players['p1'].roundScores.ROUND_2 < 2000) {
    throw new Error(`Expected p1 R2 score >= 2000 (answer + 1500 bonus), got ${getRes5.players['p1'].roundScores.ROUND_2}`);
  }
  if (getRes5.players['p2'].roundScores.ROUND_2 !== 1000) {
    throw new Error(`Expected p2 R2 score 1000 (1000 bonus for 2 lives), got ${getRes5.players['p2'].roundScores.ROUND_2}`);
  }
  console.log('✔ Vòng 2 Surviving lives bonus verified (+1500 for 3 lives, +1000 for 2 lives)');

  // 6. Test Vòng 3 Consensus Dilemma
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SET_STATUS', payload: { status: 'ROUND_3' } }));
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SET_ROUND_PHASE', payload: { phase: 'VOTING' } }));
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SUBMIT_DILEMMA_STANCE', payload: { stance: 'A', playerId: 'p1' } }));
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SUBMIT_DILEMMA_STANCE', payload: { stance: 'A', playerId: 'p2' } }));
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SUBMIT_DILEMMA_STANCE', payload: { stance: 'B', playerId: 'p3' } }));
  // Majority is A
  await POST(createMockRequest({
    roomCode: 'TEST_UNIFIED',
    action: 'SUBMIT_DILEMMA_BET',
    payload: { bet: 'A', remainingTime: 18000, totalTime: 20000, playerId: 'p1' },
  }));

  const getRes6 = await (await GET(createMockGetRequest())).json();
  if (!getRes6.players['p1'].roundScores.ROUND_3 || getRes6.players['p1'].roundScores.ROUND_3 <= 0) {
    throw new Error(`Expected p1 R3 score > 0 for winning bet, got ${getRes6.players['p1'].roundScores.ROUND_3}`);
  }
  console.log(`✔ Vòng 3 Consensus bet score verified: +${getRes6.players['p1'].roundScores.ROUND_3} PTS`);

  // 7. Test Vòng 4 Trivia & Sabotage
  await POST(createMockRequest({ roomCode: 'TEST_UNIFIED', action: 'SET_STATUS', payload: { status: 'ROUND_4' } }));
  await POST(createMockRequest({
    roomCode: 'TEST_UNIFIED',
    action: 'SUBMIT_TRIVIA',
    payload: { questionIndex: 0, optionIndex: 1, timeMs: 2000, playerId: 'p1' },
  }));

  const getRes7 = await (await GET(createMockGetRequest())).json();
  if (!getRes7.players['p1'].roundScores.ROUND_4 || getRes7.players['p1'].roundScores.ROUND_4 <= 0) {
    throw new Error(`Expected p1 R4 score > 0, got ${getRes7.players['p1'].roundScores.ROUND_4}`);
  }
  console.log(`✔ Vòng 4 Sabotage Trivia score verified: +${getRes7.players['p1'].roundScores.ROUND_4} PTS`);

  // 8. Cumulative Score Invariant
  const finalP1 = getRes7.players['p1'];
  const r1 = finalP1.roundScores.ROUND_1 || 0;
  const r2 = finalP1.roundScores.ROUND_2 || 0;
  const r3 = finalP1.roundScores.ROUND_3 || 0;
  const r4 = finalP1.roundScores.ROUND_4 || 0;
  const expectedTotal = r1 + r2 + r3 + r4;

  if (finalP1.score !== expectedTotal) {
    throw new Error(`Cumulative score mismatch! score=${finalP1.score}, sum=${expectedTotal}`);
  }
  console.log(`✔ Cumulative Scoreboard Matrix Invariant holds: Total = ${finalP1.score} (V1: ${r1} + V2: ${r2} + V3: ${r3} + V4: ${r4})`);

  console.log('\n ALL UNIFIED SCORING & TRANSITION TESTS PASSED SUCCESSFULLY! \n');
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
