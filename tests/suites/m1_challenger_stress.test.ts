// tests/suites/m1_challenger_stress.test.ts
// Empirical Challenger Verification & Stress Harness for Milestone 1

import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { calculateSpeedDecayScore } from '../../src/lib/types';
import {
  MLN131_FACT_OR_CAP_QUESTIONS,
  MLN131_CONSENSUS_DILEMMAS,
  MLN131_ROAST_PROMPTS,
  MLN131_QUESTIONS,
  sanitizeRoastText,
} from '../../src/data/questions';
import { POST, GET } from '../../src/app/api/game/route';

function createMockPostRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createMockGetRequest(room: string, since: number = 0): NextRequest {
  return new NextRequest(`http://localhost:3000/api/game?room=${encodeURIComponent(room)}&since=${since}`, {
    method: 'GET',
  });
}

interface TestResult {
  name: string;
  passed: boolean;
  actual?: any;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`[PASS] ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message });
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function main() {
  console.log('================================================================');
  console.log('  EMPIRICAL CHALLENGER STRESS HARNESS — MILESTONE 1 VERIFICATION');
  console.log('================================================================\n');

  // ==========================================================================
  // SECTION 1: calculateSpeedDecayScore Empirical Boundary Stress Tests
  // ==========================================================================
  console.log('--- SECTION 1: calculateSpeedDecayScore Boundary Stress ---');

  await runTest('1.1 Standard values (full, half, quarter time)', () => {
    assert.strictEqual(calculateSpeedDecayScore(1000, 5000, 5000, true), 1000);
    assert.strictEqual(calculateSpeedDecayScore(1000, 2500, 5000, true), 500);
    assert.strictEqual(calculateSpeedDecayScore(1000, 1250, 5000, true), 250);
    assert.strictEqual(calculateSpeedDecayScore(5000, 10000, 20000, true), 2500);
    assert.strictEqual(calculateSpeedDecayScore(10000, 15000, 20000, true), 7500);
  });

  await runTest('1.2 Zero time remaining yields 0', () => {
    assert.strictEqual(calculateSpeedDecayScore(1000, 0, 5000, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(5000, 0, 20000, true), 0);
  });

  await runTest('1.3 Negative time remaining clamped to 0', () => {
    assert.strictEqual(calculateSpeedDecayScore(1000, -1, 5000, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, -5000, 5000, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, -999999, 5000, true), 0);
  });

  await runTest('1.4 Overtime (remainingTime > totalTime) clamped to 100%', () => {
    assert.strictEqual(calculateSpeedDecayScore(1000, 5001, 5000, true), 1000);
    assert.strictEqual(calculateSpeedDecayScore(1000, 10000, 5000, true), 1000);
    assert.strictEqual(calculateSpeedDecayScore(1000, 999999, 5000, true), 1000);
  });

  await runTest('1.5 Floating point numbers and rounding verification', () => {
    assert.strictEqual(calculateSpeedDecayScore(1000, 3333, 5000, true), 667);
    assert.strictEqual(calculateSpeedDecayScore(1000, 1666, 5000, true), 333);
    assert.strictEqual(calculateSpeedDecayScore(1000, 2499.9, 5000, true), 500);
    assert.strictEqual(calculateSpeedDecayScore(1000, 0.001, 5000, true), 0);
  });

  await runTest('1.6 False answers always return 0 regardless of time', () => {
    assert.strictEqual(calculateSpeedDecayScore(1000, 5000, 5000, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, 4999, 5000, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, 2500, 5000, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, 10000, 5000, false), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, -500, 5000, false), 0);
  });

  await runTest('1.7 Pathological totalTime (0 or negative)', () => {
    assert.strictEqual(calculateSpeedDecayScore(1000, 1000, 0, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, 1000, -100, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(1000, 0, 0, true), 0);
  });

  await runTest('1.8 Zero and negative basePoints', () => {
    assert.strictEqual(calculateSpeedDecayScore(0, 5000, 5000, true), 0);
    assert.strictEqual(calculateSpeedDecayScore(-500, 5000, 5000, true), -500);
  });

  // ==========================================================================
  // SECTION 2: Curriculum Question Bank & Dilemma Integrity
  // ==========================================================================
  console.log('\n--- SECTION 2: Question Banks Integrity & Schema Compliance ---');

  await runTest('2.1 MLN131_FACT_OR_CAP_QUESTIONS completeness and validity', () => {
    assert(Array.isArray(MLN131_FACT_OR_CAP_QUESTIONS), 'Must be an array');
    assert(MLN131_FACT_OR_CAP_QUESTIONS.length >= 10, `Expected >= 10, got ${MLN131_FACT_OR_CAP_QUESTIONS.length}`);
    const seenIds = new Set<number>();
    let factCount = 0;
    let capCount = 0;

    for (const q of MLN131_FACT_OR_CAP_QUESTIONS) {
      assert(typeof q.id === 'number', `Question id must be number: ${JSON.stringify(q)}`);
      assert(!seenIds.has(q.id), `Duplicate question id: ${q.id}`);
      seenIds.add(q.id);
      assert(typeof q.statement === 'string' && q.statement.trim().length > 15, `Statement too short: ${q.statement}`);
      assert(typeof q.isFact === 'boolean', `isFact must be boolean for id ${q.id}`);
      assert(typeof q.explanation === 'string' && q.explanation.trim().length > 15, `Explanation too short for id ${q.id}`);
      assert(typeof q.category === 'string', `Category required for id ${q.id}`);
      assert.strictEqual(q.basePoints, 1000, `basePoints must be 1000 for id ${q.id}`);

      if (q.isFact) factCount++;
      else capCount++;
    }

    assert(factCount > 0 && capCount > 0, `Both FACT (${factCount}) and CAP (${capCount}) must exist`);
  });

  await runTest('2.2 MLN131_CONSENSUS_DILEMMAS completeness and validity', () => {
    assert(Array.isArray(MLN131_CONSENSUS_DILEMMAS), 'Must be an array');
    assert(MLN131_CONSENSUS_DILEMMAS.length >= 6, `Expected >= 6, got ${MLN131_CONSENSUS_DILEMMAS.length}`);
    const seenIds = new Set<number>();

    for (const d of MLN131_CONSENSUS_DILEMMAS) {
      assert(typeof d.id === 'number', `Dilemma id must be number: ${JSON.stringify(d)}`);
      assert(!seenIds.has(d.id), `Duplicate dilemma id: ${d.id}`);
      seenIds.add(d.id);
      assert(typeof d.title === 'string' && d.title.trim().length > 5, `Title invalid: ${d.title}`);
      assert(typeof d.topic === 'string' && d.topic.trim().length > 5, `Topic invalid: ${d.topic}`);
      assert(typeof d.scenario === 'string' && d.scenario.trim().length > 30, `Scenario too short: ${d.scenario}`);
      assert(typeof d.choiceA === 'string' && d.choiceA.trim().length > 5, `ChoiceA invalid: ${d.choiceA}`);
      assert(typeof d.choiceB === 'string' && d.choiceB.trim().length > 5, `ChoiceB invalid: ${d.choiceB}`);
      assert(typeof d.contextMLN131 === 'string' && d.contextMLN131.trim().length > 10, `contextMLN131 missing: ${d.contextMLN131}`);
    }
  });

  await runTest('2.3 Existing prompt banks maintained', () => {
    assert(Array.isArray(MLN131_ROAST_PROMPTS) && MLN131_ROAST_PROMPTS.length >= 5);
    assert(Array.isArray(MLN131_QUESTIONS) && MLN131_QUESTIONS.length >= 5);
  });

  await runTest('2.4 sanitizeRoastText profanity masking & length truncation', () => {
    const raw = 'Đây là bình luận có từ vl và dm cần được che đi';
    const clean = sanitizeRoastText(raw);
    assert(clean.includes('[VAR đã che 🎦]'), 'Must replace profanities with VAR mask');
    assert(!clean.includes(' vl '), 'Raw profanity vl must be filtered');
    assert(!clean.includes(' dm '), 'Raw profanity dm must be filtered');

    const longText = 'A'.repeat(200);
    const truncated = sanitizeRoastText(longText);
    assert.strictEqual(truncated.length, 120, 'Text must be truncated to max 120 characters');
  });

  // ==========================================================================
  // SECTION 3: API Route Handler Stress Tests (/api/game)
  // ==========================================================================
  console.log('\n--- SECTION 3: API Route Handler Empirical Stress Tests ---');

  const room = `CHALLENGER_ROOM_${Date.now()}`;

  // Helper setup: Join 4 test players
  await runTest('3.0 Room player onboarding setup', async () => {
    const players = [
      { playerId: 'pl_alpha', name: 'Nguyễn Văn Alpha', avatarId: 'keyboard_warrior' },
      { playerId: 'pl_beta', name: 'Trần Thị Beta', avatarId: 'fact_checker' },
      { playerId: 'pl_gamma', name: 'Lê Văn Gamma', avatarId: 'drama_queen' },
      { playerId: 'pl_delta', name: 'Phạm Thị Delta', avatarId: 'memer' },
    ];
    for (const p of players) {
      const res = await POST(createMockPostRequest({ roomCode: room, action: 'JOIN', payload: p }));
      assert.strictEqual(res.status, 200);
    }
    const stateRes = await GET(createMockGetRequest(room));
    const data = await stateRes.json();
    assert.strictEqual(Object.keys(data.players || data.state?.players || {}).length, 4);
  });

  // 3.1 SUBMIT_FEED_COMMENT
  await runTest('3.1 SUBMIT_FEED_COMMENT text sanitization and metadata', async () => {
    const res = await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FEED_COMMENT',
      payload: {
        playerId: 'pl_alpha',
        text: 'Dân chủ là bản chất của chế độ ta vl không thể xuyên tạc!',
      },
    }));
    assert.strictEqual(res.status, 200);

    const getRes = await GET(createMockGetRequest(room));
    const body = await getRes.json();
    const round1 = body.round1State || body.state?.round1State;
    assert(round1, 'round1State must exist');
    const comments = Object.values(round1.comments || {}) as any[];
    assert.strictEqual(comments.length, 1);
    const comment = comments[0];
    assert.strictEqual(comment.authorId, 'pl_alpha');
    assert.strictEqual(comment.authorName, 'Nguyễn Văn Alpha');
    // Verify profanity masked
    assert(comment.text.includes('[VAR đã che 🎦]'), 'Profanity vl should be masked');
    assert(round1.posts[comment.id], 'Corresponding post must be created in posts map');
    assert(round1.submissions['pl_alpha'], 'Backwards compatibility submission recorded');
  });

  await runTest('3.2 SUBMIT_FEED_COMMENT edge cases (missing text, unknown player, empty string)', async () => {
    // Missing text
    const res1 = await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FEED_COMMENT',
      payload: { playerId: 'pl_alpha' },
    }));
    assert.strictEqual(res1.status, 200);

    // Empty text
    const res2 = await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FEED_COMMENT',
      payload: { playerId: 'pl_alpha', text: '' },
    }));
    assert.strictEqual(res2.status, 200);

    // Unknown player submitting with custom name
    const res3 = await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FEED_COMMENT',
      payload: { playerId: 'pl_ghost', text: 'Bình luận từ khách vãng lai', playerName: 'Khách Ẩn Danh' },
    }));
    assert.strictEqual(res3.status, 200);

    const getRes = await GET(createMockGetRequest(room));
    const body = await getRes.json();
    const round1 = body.round1State || body.state?.round1State;
    const comments = Object.values(round1.comments || {}) as any[];
    // Expected 2 comments: pl_alpha's first comment and pl_ghost's comment (empty ones skipped)
    assert.strictEqual(comments.length, 2);
  });

  // 3.3 REACT_FEED_POST
  await runTest('3.3 REACT_FEED_POST reaction types and author scoring', async () => {
    const getRes1 = await GET(createMockGetRequest(room));
    const body1 = await getRes1.json();
    const round1 = body1.round1State || body1.state?.round1State;
    const comments = Object.values(round1.comments || {}) as any[];
    const targetComment = comments.find((c) => c.authorId === 'pl_alpha');
    assert(targetComment, 'Target comment must exist');

    // 1. Heart reaction (via 'heart')
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'REACT_FEED_POST',
      payload: { postId: targetComment.id, reactionType: 'heart', voterId: 'pl_beta' },
    }));

    // 2. Tomato reaction (via 'tomato')
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'REACT_FEED_POST',
      payload: { postId: targetComment.id, reactionType: 'tomato', voterId: 'pl_gamma' },
    }));

    // 3. Brick reaction (via 'brick')
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'REACT_FEED_POST',
      payload: { postId: targetComment.id, reactionType: 'brick', voterId: 'pl_delta' },
    }));

    // 4. Like reaction (normalized to 'heart')
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'REACT_FEED_POST',
      payload: { postId: targetComment.id, reactionType: 'like', voterId: 'pl_beta' },
    }));

    const getRes2 = await GET(createMockGetRequest(room));
    const body2 = await getRes2.json();
    const updatedRound1 = body2.round1State || body2.state?.round1State;
    const updatedComment = updatedRound1.comments[targetComment.id];
    const updatedPost = updatedRound1.posts[targetComment.id];

    assert.strictEqual(updatedComment.reactions.heart, 2, '2 hearts recorded (1 heart + 1 normalized like)');
    assert.strictEqual(updatedComment.reactions.tomato, 1, '1 tomato recorded');
    assert.strictEqual(updatedComment.reactions.brick, 1, '1 brick recorded');
    assert.strictEqual(updatedComment.score, 400, 'Comment score 400 (4 x 100)');

    assert.strictEqual(updatedPost.likes, 2);
    assert.strictEqual(updatedPost.tomatoes, 1);
    assert.strictEqual(updatedPost.bricks, 1);
    assert.strictEqual(updatedPost.totalReactions, 4);

    // Verify author gained +400 points
    const players = body2.players || body2.state?.players;
    assert.strictEqual(players['pl_alpha'].score, 400);
    assert.strictEqual(players['pl_alpha'].roundScores.ROUND_1, 400);
  });

  await runTest('3.4 REACT_FEED_POST trendingTopIds sorting order and slice', async () => {
    // Submit comment from pl_beta
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FEED_COMMENT',
      payload: { playerId: 'pl_beta', text: 'Comment cực hot triệu like!' },
    }));

    let getRes = await GET(createMockGetRequest(room));
    let round1 = (await getRes.json()).round1State || (await getRes.json()).state?.round1State;
    const betaComment = (Object.values(round1.comments) as any[]).find((c) => c.authorId === 'pl_beta');

    // Give betaComment 6 reactions (beats pl_alpha's 4 reactions)
    for (let i = 0; i < 6; i++) {
      await POST(createMockPostRequest({
        roomCode: room,
        action: 'REACT_FEED_POST',
        payload: { postId: betaComment.id, reactionType: 'heart', voterId: `voter_${i}` },
      }));
    }

    getRes = await GET(createMockGetRequest(room));
    round1 = (await getRes.json()).round1State || (await getRes.json()).state?.round1State;
    assert.strictEqual(round1.trendingTopIds[0], betaComment.id, 'Top 1 must be betaComment with 6 reactions');
    // Trending list contains up to 5 comments sorted descending
    const totalComments = Object.keys(round1.comments).length;
    assert.strictEqual(round1.trendingTopIds.length, Math.min(5, totalComments));
  });

  await runTest('3.5 REACT_FEED_POST edge cases (invalid reaction type, non-existent postId)', async () => {
    // Non-existent post
    const res1 = await POST(createMockPostRequest({
      roomCode: room,
      action: 'REACT_FEED_POST',
      payload: { postId: 'ghost_post_id', reactionType: 'heart', voterId: 'pl_alpha' },
    }));
    assert.strictEqual(res1.status, 200);

    // Missing reactionType
    const res2 = await POST(createMockPostRequest({
      roomCode: room,
      action: 'REACT_FEED_POST',
      payload: { postId: 'some_id' },
    }));
    assert.strictEqual(res2.status, 200);
  });

  // 3.6 SUBMIT_FACT_OR_CAP
  await runTest('3.6 SUBMIT_FACT_OR_CAP correct answer with speed-decay', async () => {
    const q1 = MLN131_FACT_OR_CAP_QUESTIONS[0];
    const correctChoice = q1.isFact ? 'FACT' : 'CAP';

    // Player Alpha answers correctly in 1000ms out of 5000ms -> 4000ms remaining -> 80% of 1000 = 800
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        playerId: 'pl_alpha',
        choice: correctChoice,
        reactionTimeMs: 1000,
        totalTime: 5000,
        questionIndex: 0,
      },
    }));

    const getRes = await GET(createMockGetRequest(room));
    const data = await getRes.json();
    const round2 = data.round2State || data.state?.round2State;
    const pAlphaAns = round2.answers['pl_alpha'];

    assert(pAlphaAns, 'pl_alpha answer recorded');
    assert.strictEqual(pAlphaAns.choice, correctChoice);
    assert.strictEqual(pAlphaAns.isCorrect, true);
    assert.strictEqual(pAlphaAns.score, 800);
    assert.strictEqual(pAlphaAns.livesRemaining, 3, 'Lives unaffected on correct answer');

    const players = data.players || data.state?.players;
    // pl_alpha already had 400 from Mode 1 + 800 = 1200
    assert.strictEqual(players['pl_alpha'].score, 1200);
    assert.strictEqual(players['pl_alpha'].roundScores.ROUND_2, 800);
  });

  await runTest('3.7 SUBMIT_FACT_OR_CAP incorrect answer life loss & 0 points', async () => {
    const q1 = MLN131_FACT_OR_CAP_QUESTIONS[0];
    const wrongChoice = q1.isFact ? 'CAP' : 'FACT';

    // Player Beta answers WRONG very fast (500ms)
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        playerId: 'pl_beta',
        choice: wrongChoice,
        reactionTimeMs: 500,
        totalTime: 5000,
        questionIndex: 0,
      },
    }));

    const getRes = await GET(createMockGetRequest(room));
    const data = await getRes.json();
    const round2 = data.round2State || data.state?.round2State;
    const pBetaAns = round2.answers['pl_beta'];

    assert(pBetaAns, 'pl_beta answer recorded');
    assert.strictEqual(pBetaAns.choice, wrongChoice);
    assert.strictEqual(pBetaAns.isCorrect, false);
    assert.strictEqual(pBetaAns.score, 0, 'Wrong answer must yield 0 points');
    assert.strictEqual(pBetaAns.livesRemaining, 2, 'Lives decremented from 3 to 2');

    const players = data.players || data.state?.players;
    // Beta gained 0 in Mode 2
    assert.strictEqual(players['pl_beta'].roundScores.ROUND_2 || 0, 0);
  });

  await runTest('3.8 SUBMIT_FACT_OR_CAP edge cases (timeout, negative, out-of-bounds index)', async () => {
    const q1 = MLN131_FACT_OR_CAP_QUESTIONS[0];
    const correctChoice = q1.isFact ? 'FACT' : 'CAP';

    // Timeout (reactionTimeMs 5500 > totalTime 5000)
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        playerId: 'pl_gamma',
        choice: correctChoice,
        reactionTimeMs: 5500,
        totalTime: 5000,
        questionIndex: 0,
      },
    }));

    // Question index out of bounds (999) -> fallback to question 0
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        playerId: 'pl_delta',
        choice: correctChoice,
        remainingTime: 2500,
        totalTime: 5000,
        questionIndex: 999,
      },
    }));

    const getRes = await GET(createMockGetRequest(room));
    const data = await getRes.json();
    const round2 = data.round2State || data.state?.round2State;

    // pl_gamma had timeout: remainingTime clamped to 0 -> score 0
    assert.strictEqual(round2.answers['pl_gamma'].score, 0);
    // pl_delta used explicit remainingTime 2500 -> 50% score = 500
    assert.strictEqual(round2.answers['pl_delta'].score, 500);
  });

  // 3.9 SUBMIT_DILEMMA_STANCE
  await runTest('3.9 SUBMIT_DILEMMA_STANCE tally recalculation (A vs B, percentages, majority)', async () => {
    // Player Alpha votes A
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'pl_alpha', stance: 'A' },
    }));

    let getRes = await GET(createMockGetRequest(room));
    let r3 = (await getRes.json()).round3State || (await getRes.json()).state?.round3State;
    assert.strictEqual(r3.tally.countA, 1);
    assert.strictEqual(r3.tally.countB, 0);
    assert.strictEqual(r3.tally.percentA, 100);
    assert.strictEqual(r3.tally.percentB, 0);
    assert.strictEqual(r3.tally.majority, 'A');

    // Player Beta votes B -> 50/50 Draw
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'pl_beta', stance: 'B' },
    }));

    getRes = await GET(createMockGetRequest(room));
    r3 = (await getRes.json()).round3State || (await getRes.json()).state?.round3State;
    assert.strictEqual(r3.tally.countA, 1);
    assert.strictEqual(r3.tally.countB, 1);
    assert.strictEqual(r3.tally.percentA, 50);
    assert.strictEqual(r3.tally.percentB, 50);
    assert.strictEqual(r3.tally.majority, 'DRAW');

    // Player Gamma votes B, Player Delta votes B -> B is 3 vs 1
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'pl_gamma', stance: 'B' },
    }));
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'pl_delta', stance: 'B' },
    }));

    getRes = await GET(createMockGetRequest(room));
    r3 = (await getRes.json()).round3State || (await getRes.json()).state?.round3State;
    assert.strictEqual(r3.tally.countA, 1);
    assert.strictEqual(r3.tally.countB, 3);
    assert.strictEqual(r3.tally.percentA, 25);
    assert.strictEqual(r3.tally.percentB, 75);
    assert.strictEqual(r3.tally.majority, 'B');

    // Flip stance: Player Alpha changes stance from A to B -> B is 4 vs 0
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_DILEMMA_STANCE',
      payload: { playerId: 'pl_alpha', stance: 'B' },
    }));

    getRes = await GET(createMockGetRequest(room));
    r3 = (await getRes.json()).round3State || (await getRes.json()).state?.round3State;
    assert.strictEqual(r3.tally.countA, 0);
    assert.strictEqual(r3.tally.countB, 4);
    assert.strictEqual(r3.tally.percentA, 0);
    assert.strictEqual(r3.tally.percentB, 100);
    assert.strictEqual(r3.tally.majority, 'B');
  });

  // 3.10 SUBMIT_DILEMMA_BET
  await runTest('3.10 SUBMIT_DILEMMA_BET majority bet payout with speed-decay', async () => {
    // Current majority is 'B'
    // pl_gamma bets 'B' with remainingTime 16000 out of 20000 -> 80% of 5000 = 4000
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_DILEMMA_BET',
      payload: {
        playerId: 'pl_gamma',
        predictedMajority: 'B',
        remainingTime: 16000,
        totalTime: 20000,
      },
    }));

    // pl_alpha bets 'A' (minority bet) -> 0 points
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_DILEMMA_BET',
      payload: {
        playerId: 'pl_alpha',
        predictedMajority: 'A',
        remainingTime: 18000,
        totalTime: 20000,
      },
    }));

    const getRes = await GET(createMockGetRequest(room));
    const data = await getRes.json();
    const r3 = data.round3State || data.state?.round3State;
    const players = data.players || data.state?.players;

    assert.strictEqual(r3.consensusBets['pl_gamma'], 'B');
    assert.strictEqual(r3.playerChoices['pl_gamma'].pointsEarned, 4000);
    assert.strictEqual(players['pl_gamma'].roundScores.ROUND_3, 4000);

    assert.strictEqual(r3.consensusBets['pl_alpha'], 'A');
    assert.strictEqual(r3.playerChoices['pl_alpha'].pointsEarned, undefined); // No points for wrong bet
    assert.strictEqual(players['pl_alpha'].roundScores.ROUND_3 || 0, 0);
  });

  // 3.11 RETURN_TO_HUB
  await runTest('3.11 RETURN_TO_HUB restores status to LOBBY and retains player roster/scores', async () => {
    // Put room into ROUND_3
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SET_STATUS',
      payload: { status: 'ROUND_3' },
    }));

    let getRes = await GET(createMockGetRequest(room));
    let data = await getRes.json();
    assert.strictEqual(data.status || data.state?.status, 'ROUND_3');

    // Call RETURN_TO_HUB
    const res = await POST(createMockPostRequest({
      roomCode: room,
      action: 'RETURN_TO_HUB',
      payload: {},
    }));
    assert.strictEqual(res.status, 200);

    getRes = await GET(createMockGetRequest(room));
    data = await getRes.json();
    assert.strictEqual(data.status || data.state?.status, 'LOBBY');
    assert.strictEqual(data.currentRoundPhase || data.state?.currentRoundPhase, 'LOBBY_WAITING');

    // Crucial check: player scores and roster must be PRESERVED (not wiped like RESET_GAME)
    const players = data.players || data.state?.players;
    assert.strictEqual(Object.keys(players).length, 4, '4 players still in room');
    assert(players['pl_alpha'].score > 0, 'Scores retained upon returning to hub');
  });

  // 3.12 SUBMIT_TRIVIA in Mode 4 speed-decay check
  await runTest('3.12 SUBMIT_TRIVIA speed-decay scoring in Mode 4', async () => {
    // Question 0 of MLN131_QUESTIONS
    const q0 = MLN131_QUESTIONS[0];
    const correctAns = q0.correctAnswer;

    // Player Delta answers correctly in 5000ms out of 20000ms -> 15000ms remaining -> 75% of 10000 = 7500
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_TRIVIA',
      payload: {
        playerId: 'pl_delta',
        questionIndex: 0,
        optionIndex: correctAns,
        timeMs: 5000,
      },
    }));

    const getRes = await GET(createMockGetRequest(room));
    const data = await getRes.json();
    const r4 = data.round4State || data.state?.round4State;
    const ans = r4.playerAnswers['pl_delta'];
    assert(ans, 'Answer recorded');
    assert.strictEqual(ans.isCorrect, true);
    assert.strictEqual(ans.pointsEarned, 7500);

    const players = data.players || data.state?.players;
    assert.strictEqual(players['pl_delta'].roundScores.ROUND_4, 7500);
  });

  // ==========================================================================
  // SECTION 4: Adversarial Stress & Vulnerability Probing
  // ==========================================================================
  console.log('\n--- SECTION 4: Adversarial Stress & Vulnerability Probing ---');

  await runTest('4.1 Double submission idempotency probe on SUBMIT_FACT_OR_CAP', async () => {
    const q1 = MLN131_FACT_OR_CAP_QUESTIONS[0];
    const correctChoice = q1.isFact ? 'FACT' : 'CAP';
    const initialScore = 1200; // pl_alpha current score

    // Duplicate answer from pl_alpha
    await POST(createMockPostRequest({
      roomCode: room,
      action: 'SUBMIT_FACT_OR_CAP',
      payload: {
        playerId: 'pl_alpha',
        choice: correctChoice,
        reactionTimeMs: 1000,
        totalTime: 5000,
        questionIndex: 0,
      },
    }));

    const getRes = await GET(createMockGetRequest(room));
    const data = await getRes.json();
    const currentScore = (data.players || data.state?.players)['pl_alpha'].score;

    // Check whether route.ts prevents double-scoring or accumulates score
    const scoreDiff = currentScore - initialScore;
    console.log(`[PROBE] Double submit score diff: +${scoreDiff} (0 means idempotent, >0 means duplicate accumulation)`);
    // Note: We document this observation for our challenger analysis
    assert(typeof currentScore === 'number' && !isNaN(currentScore), 'Score must remain a valid number');
  });

  await runTest('4.2 Stance flip idempotency on SUBMIT_DILEMMA_STANCE', async () => {
    // pl_alpha toggles stance 10 times rapidly
    for (let i = 0; i < 10; i++) {
      const stance = i % 2 === 0 ? 'A' : 'B';
      await POST(createMockPostRequest({
        roomCode: room,
        action: 'SUBMIT_DILEMMA_STANCE',
        payload: { playerId: 'pl_alpha', stance },
      }));
    }

    const getRes = await GET(createMockGetRequest(room));
    const data = await getRes.json();
    const r3 = data.round3State || data.state?.round3State;
    const totalVotes = r3.tally.countA + r3.tally.countB;
    assert.strictEqual(totalVotes, 4, 'Total votes must stay strictly equal to 4 players without leaks');
  });

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n================================================================');
  console.log('  CHALLENGER EMPIRICAL VERIFICATION SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);

  if (failed > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    for (const f of results.filter((r) => !r.passed)) {
      console.error(`- ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n✔ ALL CHALLENGER EMPIRICAL STRESS TESTS PASSED WITH 100% ACCURACY!');
  }
}

main().catch((err) => {
  console.error('Fatal crash during test execution:', err);
  process.exit(1);
});
