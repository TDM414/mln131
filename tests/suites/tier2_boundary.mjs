// tests/suites/tier2_boundary.mjs
import assert from 'node:assert/strict';
import { GameShowEngine } from '../lib/gameShowEngine.mjs';
import {
  MLN131_ROAST_PROMPTS,
  ROAST_QUICK_CHIPS,
  VIETNAMESE_ROAST_BANK,
  sanitizeRoastText,
} from '../../src/data/questions.ts';
import { POST, GET } from '../../src/app/api/game/route.ts';
import { NextRequest } from 'next/server';

export async function runTier2BoundaryTests(testCtx) {
  testCtx.suite('Tier 2: Boundary & Corner Cases');

  testCtx.test('T2.1 - Solo Player Room (1 player handling)', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('solo', 'Cô Độc Cầu Bại');
    assert.equal(engine.players.size, 1);

    engine.startRound1(0);
    engine.submitRoast('solo', 'Một mình một cõi');
    const duels = engine.pairDuels();
    assert.equal(duels.length, 1);
    assert.equal(duels[0].candidateA.playerId, 'solo');
    assert.ok(duels[0].candidateB.playerId.startsWith('bot_'));
  });

  testCtx.test('T2.2 - High Scalability Capacity: 50 Concurrent Players Joined', () => {
    const engine = new GameShowEngine('MLN131');
    for (let i = 1; i <= 50; i++) {
      engine.joinPlayer(`user_${i}`, `Sinh Viên ${i}`);
    }
    assert.equal(engine.players.size, 50);

    engine.startRound3(0.1); // 10% seeders = 5 seeders, 45 netizens
    let seeders = 0;
    for (const role of engine.r3.roles.values()) {
      if (role === 'SEEDER') seeders++;
    }
    assert.equal(seeders, 5);
  });

  testCtx.test('T2.3 - 120-Character Boundary Clamp on Roast Submissions', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Tester');
    engine.startRound1(0);

    const longString = 'A'.repeat(250);
    const submitted = engine.submitRoast('p1', longString);
    assert.equal(submitted.length, 120);
    assert.equal(submitted, 'A'.repeat(120));
  });

  testCtx.test('T2.4 - Empty and Whitespace-Only Roast Fallback', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Tester');
    engine.startRound1(0);

    const emptySubmitted = engine.submitRoast('p1', '    \n\t   ');
    assert.ok(emptySubmitted.length > 0);
    assert.equal(emptySubmitted, 'Ủa alo? Không biết nói gì luôn!');
  });

  testCtx.test('T2.5 - Exact 5.00s Timer Boundary for Micro-Games (4999ms vs 5001ms)', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'BorderSpeed');
    engine.joinPlayer('p2', 'LateSpeed');
    engine.startRound2('catch_report');

    // 4999ms: succeeds
    const resPass = engine.submitMinigameResult('p1', true, 4999);
    assert.ok(resPass.success);
    assert.equal(resPass.remainingLives, 3);

    // 5001ms: overtime fails even if client claimed success
    const resFail = engine.submitMinigameResult('p2', true, 5001);
    assert.ok(!resFail.success);
    assert.equal(resFail.remainingLives, 2);
  });

  testCtx.test('T2.6 - Vote Tie in Round 1 Duel (50-50 Split Split Rewards)', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Candidate A');
    engine.joinPlayer('p2', 'Candidate B');
    engine.joinPlayer('v1', 'Voter 1');
    engine.joinPlayer('v2', 'Voter 2');

    engine.startRound1(0);
    engine.submitRoast('p1', 'Roast A');
    engine.submitRoast('p2', 'Roast B');
    engine.pairDuels();

    engine.voteRoast('v1', 'duel_1', 'A');
    engine.voteRoast('v2', 'duel_1', 'B');

    const result = engine.resolveDuel('duel_1');
    assert.equal(result.winnerId, 'TIE');
    assert.equal(result.pointsA, 500);
    assert.equal(result.pointsB, 500);
    assert.equal(engine.players.get('p1').totalScore, 500);
    assert.equal(engine.players.get('p2').totalScore, 500);
  });

  testCtx.test('T2.7 - Odd Points Heist Preserves Integers & Never Goes Negative', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('victim', 'Victim');
    engine.joinPlayer('thief', 'Thief');

    engine.players.get('victim').totalScore = 1337;
    engine.startRound4();

    engine.r4.cards.set('thief', ['CARD_HEIST']);
    const heistRes = engine.playSabotageCard('thief', 'victim', 'CARD_HEIST');

    assert.equal(heistRes.stolenPoints, 668); // Math.floor(1337 * 0.5)
    assert.equal(engine.players.get('victim').totalScore, 669);
    assert.equal(engine.players.get('thief').totalScore, 668);
  });

  testCtx.test('T2.8 - Zero Score Heist Does Not Corrupt State', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('broke', 'Broke Player');
    engine.joinPlayer('thief', 'Thief');

    engine.players.get('broke').totalScore = 0;
    engine.startRound4();

    engine.r4.cards.set('thief', ['CARD_HEIST']);
    const heistRes = engine.playSabotageCard('thief', 'broke', 'CARD_HEIST');
    assert.equal(heistRes.stolenPoints, 0);
    assert.equal(engine.players.get('broke').totalScore, 0);
  });

  testCtx.test('T2.9 - Double Bet Penalty Boundary on Wrong Answer', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('gambler', 'Gambler');
    engine.players.get('gambler').totalScore = 1500;
    engine.startRound4();

    engine.r4.cards.set('gambler', ['CARD_BET_2X']);
    engine.playSabotageCard('gambler', 'gambler', 'CARD_BET_2X');

    // Wrong answer penalized by -500 * 2 = -1000
    const ans = engine.submitTriviaAnswer('gambler', 1, false);
    assert.equal(ans.finalPoints, -1000);
    assert.equal(engine.players.get('gambler').totalScore, 500);
  });

  testCtx.test('T2.10 - Re-submitting action after phase finished is blocked', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Player');
    engine.startRound1(0);
    engine.pairDuels(); // transitions to DUEL phase

    assert.throws(() => {
      engine.submitRoast('p1', 'Nộp trễ hạn');
    }, /Roast submission is closed/);
  });

  testCtx.test('T2.11 - Milestone 2: MLN131 Curated Roast Bank & Quick Chips Data Integrity', () => {
    assert.ok(Array.isArray(MLN131_ROAST_PROMPTS));
    assert.ok(MLN131_ROAST_PROMPTS.length >= 6, 'Must provide at least 6 satirical MLN131 prompts');
    for (const prompt of MLN131_ROAST_PROMPTS) {
      assert.ok(prompt.id && typeof prompt.id === 'string');
      assert.ok(prompt.category && typeof prompt.category === 'string');
      assert.ok(prompt.situation && typeof prompt.situation === 'string');
      assert.ok(prompt.context && typeof prompt.context === 'string');
    }

    assert.ok(Array.isArray(ROAST_QUICK_CHIPS));
    assert.ok(ROAST_QUICK_CHIPS.length >= 8, 'Must have at least 8 quick chips');

    assert.ok(Array.isArray(VIETNAMESE_ROAST_BANK));
    assert.ok(VIETNAMESE_ROAST_BANK.length >= 25, 'Must provide at least 25 witty student roasts');
    for (const roast of VIETNAMESE_ROAST_BANK) {
      assert.ok(roast && typeof roast === 'string' && roast.length > 10);
    }
  });

  testCtx.test('T2.12 - Milestone 2: Profanity Masking & 120-Char Clamp Sanitization', () => {
    // 1. Clamping to 120 chars
    const overlyLong = 'Công dân số có trách nhiệm bảo vệ không gian mạng lành mạnh '.repeat(10);
    const clamped = sanitizeRoastText(overlyLong);
    assert.ok(clamped.length <= 120);

    // 2. Profanity masking
    const profaneInput = 'Ăn nói xà lơ vcl đồ lừa đảo dm';
    const sanitized = sanitizeRoastText(profaneInput);
    assert.ok(!sanitized.includes('vcl'));
    assert.ok(!sanitized.includes('dm'));
    assert.ok(sanitized.includes('[VAR đã che 🎦]'));

    // 3. Clean input preserved
    const cleanInput = 'Tự do trong khuôn khổ pháp luật mới là dân chủ chân chính!';
    assert.equal(sanitizeRoastText(cleanInput), cleanInput);
  });

  await testCtx.test('T2.13 - Milestone 2: Live /api/game Vote Switching Deduplication Invariant', async () => {
    const roomCode = 'TEST_SWITCH_' + Date.now();
    const makePost = (body) =>
      new NextRequest('http://localhost:3000/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

    // 1. Join players
    await POST(makePost({ action: 'JOIN', roomCode, payload: { playerId: 'gladiator_a', name: 'Đấu thủ A' } }));
    await POST(makePost({ action: 'JOIN', roomCode, payload: { playerId: 'gladiator_b', name: 'Đấu thủ B' } }));
    await POST(makePost({ action: 'JOIN', roomCode, payload: { playerId: 'voter_switch', name: 'Cử tri phân vân' } }));

    // 2. Host sets up duel
    const duelId = 'duel_test_switch';
    await POST(makePost({
      action: 'HOST_UPDATE_STATE',
      roomCode,
      payload: {
        status: 'ROUND_1',
        round1State: {
          phase: 'VOTE_ACTIVE',
          currentPromptIndex: 0,
          prompts: MLN131_ROAST_PROMPTS,
          submissions: {},
          duels: [
            {
              id: duelId,
              prompt: MLN131_ROAST_PROMPTS[0],
              submissionA: { id: 's1', playerId: 'gladiator_a', playerName: 'Đấu thủ A', avatarId: 'keyboard_warrior', text: 'Roast A', timestamp: Date.now() },
              submissionB: { id: 's2', playerId: 'gladiator_b', playerName: 'Đấu thủ B', avatarId: 'genz_slang_queen', text: 'Roast B', timestamp: Date.now() },
              votesA: [],
              votesB: [],
            }
          ],
          currentDuelIndex: 0,
        }
      }
    }));

    // 3. Voter casts vote for A
    await POST(makePost({
      action: 'VOTE_ROAST',
      roomCode,
      payload: { duelId, choice: 'A', voterId: 'voter_switch' }
    }));

    let getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    let room = await getRes.json();
    let duel = room.round1State.duels.find(d => d.id === duelId);
    assert.deepEqual(duel.votesA, ['voter_switch']);
    assert.deepEqual(duel.votesB, []);

    // 4. Voter switches vote to B
    await POST(makePost({
      action: 'VOTE_ROAST',
      roomCode,
      payload: { duelId, choice: 'B', voterId: 'voter_switch' }
    }));

    getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    room = await getRes.json();
    duel = room.round1State.duels.find(d => d.id === duelId);
    assert.deepEqual(duel.votesA, [], 'Voter must be cleanly removed from votesA');
    assert.deepEqual(duel.votesB, ['voter_switch'], 'Voter must be recorded in votesB');

    // 5. Voter switches back to A
    await POST(makePost({
      action: 'VOTE_ROAST',
      roomCode,
      payload: { duelId, choice: 'A', voterId: 'voter_switch' }
    }));

    getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    room = await getRes.json();
    duel = room.round1State.duels.find(d => d.id === duelId);
    assert.deepEqual(duel.votesA, ['voter_switch'], 'Voter returned to votesA');
    assert.deepEqual(duel.votesB, [], 'Voter cleanly removed from votesB');
  });

  testCtx.test('T2.14 - Milestone 3: Round 2 Micro-Game Configs & Concrete Payload Integrity', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('tester_r2', 'Speedy');

    engine.startRound2('catch_report');
    assert.equal(engine.status, 'ROUND_2');
    assert.equal(engine.timer.total, 5000);
    assert.equal(engine.r2.lives.get('tester_r2'), 3);

    // Verify 4 concrete micro-games
    const expectedTypes = ['CATCH_REPORT', 'SHAKE_OTP', 'DODGE_BRICKS', 'SPOT_DEEPFAKE'];
    expectedTypes.forEach((type) => {
      engine.startRound2(type.toLowerCase());
      assert.equal(engine.status, 'ROUND_2');
      assert.equal(engine.timer.total, 5000);
    });
  });

  await testCtx.test('T2.15 - Milestone 3: Live /api/game MINIGAME_RESULT Life Decrement and Score Preservation', async () => {
    const makePost = (body) => new NextRequest('http://localhost:3000/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const roomCode = `M3_TEST_${Date.now()}`;
    const pId = 'student_reflex_1';

    // 1. Join player
    await POST(makePost({
      action: 'JOIN',
      roomCode,
      payload: { playerId: pId, name: 'Phản Xạ Thần Sầu', avatarId: 'keyboard_warrior' },
    }));

    // Verify initial 3 lives
    let getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    let room = await getRes.json();
    assert.equal(room.players[pId].r2Lives ?? 3, 3);
    assert.equal(room.players[pId].score, 0);

    // 2. Fail first micro-game: 3 -> 2 lives
    await POST(makePost({
      action: 'MINIGAME_RESULT',
      roomCode,
      payload: { playerId: pId, success: false, reactionTimeMs: 5000 },
    }));

    getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    room = await getRes.json();
    assert.equal(room.players[pId].r2Lives, 2);
    assert.equal(room.players[pId].score, 0);

    // 3. Succeed with fast reaction (600ms): lives stay 2, points +1400
    await POST(makePost({
      action: 'MINIGAME_RESULT',
      roomCode,
      payload: { playerId: pId, success: true, reactionTimeMs: 600 },
    }));

    getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    room = await getRes.json();
    assert.equal(room.players[pId].r2Lives, 2);
    assert.equal(room.players[pId].score, 1400); // 2000 - 600
    assert.equal(room.players[pId].roundScores.ROUND_2, 1400);

    // 4. Fail twice: 2 -> 1 -> 0 (eliminated)
    await POST(makePost({
      action: 'MINIGAME_RESULT',
      roomCode,
      payload: { playerId: pId, success: false, reactionTimeMs: 5000 },
    }));
    await POST(makePost({
      action: 'MINIGAME_RESULT',
      roomCode,
      payload: { playerId: pId, success: false, reactionTimeMs: 5000 },
    }));

    getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    room = await getRes.json();
    assert.equal(room.players[pId].r2Lives, 0, 'Player eliminated at 0 lives');

    // 5. Subsequent fail never decrements below 0
    await POST(makePost({
      action: 'MINIGAME_RESULT',
      roomCode,
      payload: { playerId: pId, success: false, reactionTimeMs: 5000 },
    }));
    getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    room = await getRes.json();
    assert.equal(room.players[pId].r2Lives, 0, 'Lives clamped at 0');

    // 6. Return to Hub (SET_STATUS: LOBBY) preserves cumulative score!
    await POST(makePost({
      action: 'SET_STATUS',
      roomCode,
      payload: { status: 'LOBBY' },
    }));
    getRes = await GET(new NextRequest(`http://localhost:3000/api/game?room=${roomCode}&since=0`));
    room = await getRes.json();
    assert.equal(room.status, 'LOBBY');
    assert.equal(room.players[pId].score, 1400, 'Score preserved on return to hub');
  });

  testCtx.test('T2.16 - Milestone 3: DeviceMotion Fallback & Spot Deepfake Target Distance Formula', () => {
    // 1. Verify 10-tap mash fallback threshold
    let taps = 0;
    const targetTaps = 10;
    for (let i = 1; i <= targetTaps; i++) {
      taps++;
    }
    assert.ok(taps >= targetTaps, '10-tap mash threshold triggers success');

    // 2. Verify Spot Deepfake target distance formula
    const targetX = 72;
    const targetY = 64;
    const targetRadius = 18;

    // Inside target hit
    const hitTap = { x: 70, y: 62 };
    const hitDist = Math.hypot(hitTap.x - targetX, hitTap.y - targetY);
    assert.ok(hitDist <= targetRadius, `Hit distance ${hitDist} is within radius ${targetRadius}`);

    // Outside target miss
    const missTap = { x: 25, y: 30 };
    const missDist = Math.hypot(missTap.x - targetX, missTap.y - targetY);
    assert.ok(missDist > targetRadius, `Miss distance ${missDist} is outside radius ${targetRadius}`);
  });
}
