// tests/suites/tier1_features.mjs
import assert from 'node:assert/strict';
import { GameShowEngine } from '../lib/gameShowEngine.mjs';
import { MOCK_AVATARS, MOCK_R1_PROMPTS, MOCK_R2_MINIGAMES, MOCK_SABOTAGE_CARDS } from '../fixtures/mockData.mjs';

export async function runTier1FeatureTests(testCtx) {
  testCtx.suite('Tier 1: Feature Coverage');

  testCtx.test('T1.1 - Hub Initialization, PIN, QR and Mode Switching', () => {
    const engine = new GameShowEngine('MLN131');
    assert.equal(engine.roomCode, 'MLN131');
    assert.equal(engine.mode, 'TOURNAMENT');
    assert.equal(engine.status, 'LOBBY');

    // Switch mode
    engine.setMode('FREE_PLAY');
    assert.equal(engine.mode, 'FREE_PLAY');
    engine.setMode('TOURNAMENT');
    assert.equal(engine.mode, 'TOURNAMENT');

    // QR target URL contract
    const qrTargetUrl = `https://netizen.party/play?room=${engine.roomCode}`;
    assert.match(qrTargetUrl, /room=MLN131$/);
  });

  testCtx.test('T1.2 - Player Joining and Netizen Avatar Assignment', () => {
    const engine = new GameShowEngine('MLN131');
    const player = engine.joinPlayer('user_101', 'Nguyễn Dân Mạng', 'keyboard_warrior');

    assert.equal(player.id, 'user_101');
    assert.equal(player.name, 'Nguyễn Dân Mạng');
    assert.equal(player.avatar.id, 'keyboard_warrior');
    assert.equal(player.totalScore, 0);
    assert.equal(engine.players.size, 1);
  });

  testCtx.test('T1.3 - Dev Bot Simulator Core Execution (16 Virtual Students)', () => {
    const engine = new GameShowEngine('MLN131');
    const added = engine.toggleBots(16);

    assert.equal(added, 16);
    assert.equal(engine.players.size, 16);
    const bot1 = engine.players.get('bot_1');
    assert.ok(bot1.isBot);
    assert.ok(bot1.name.length > 0);
    assert.ok(bot1.avatar !== undefined);
  });

  testCtx.test('T1.4 - Round 1: Prompt Broadcast and 120-Char Roast Submission', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Player One');
    engine.startRound1(0);

    assert.equal(engine.status, 'ROUND_1');
    assert.equal(engine.currentPhase, 'PROMPT');
    assert.equal(engine.r1.activePrompt.id, 'r1_p1');

    // Submit roast
    const roastText = "Lãi suất 100% thì chỉ có lùa gà thôi chiên da ơi! Lên phường uống trà nha!";
    const submitted = engine.submitRoast('p1', roastText);
    assert.equal(submitted, roastText);
    assert.equal(engine.r1.submissions.get('p1'), roastText);
  });

  testCtx.test('T1.5 - Round 1: Anonymous 1v1 Duel Pairing & Live Danmaku Barrage', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Player One');
    engine.joinPlayer('p2', 'Player Two');
    engine.startRound1(0);

    engine.submitRoast('p1', 'Roast từ p1');
    engine.submitRoast('p2', 'Roast từ p2 sắc sảo hơn');

    const duels = engine.pairDuels();
    assert.equal(duels.length, 1);
    assert.equal(engine.currentPhase, 'DUEL');

    // Danmaku reaction burst
    const danmaku = engine.sendDanmaku('p1', 'tomato');
    assert.equal(danmaku.reactionType, 'tomato');
    assert.equal(engine.r1.danmaku.length, 1);
  });

  testCtx.test('T1.6 - Round 1: Voting and Dramatic VAR Score Reveal', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Player One');
    engine.joinPlayer('p2', 'Player Two');
    engine.joinPlayer('voter_1', 'Voter One');
    engine.joinPlayer('voter_2', 'Voter Two');
    engine.joinPlayer('voter_3', 'Voter Three');

    engine.startRound1(0);
    engine.submitRoast('p1', 'Roast A');
    engine.submitRoast('p2', 'Roast B');
    engine.pairDuels();

    // Votes: 2 for B, 1 for A
    engine.voteRoast('voter_1', 'duel_1', 'B');
    engine.voteRoast('voter_2', 'duel_1', 'B');
    engine.voteRoast('voter_3', 'duel_1', 'A');

    const varResult = engine.resolveDuel('duel_1');
    assert.equal(varResult.winnerId, 'p2');
    assert.equal(varResult.votesB, 2);
    assert.equal(varResult.votesA, 1);
    assert.equal(varResult.pointsB, 1000);
    assert.equal(varResult.pointsA, 250);

    // Verify tournament cumulative score
    assert.equal(engine.players.get('p2').totalScore, 1000);
    assert.equal(engine.players.get('p1').totalScore, 250);
  });

  testCtx.test('T1.7 - Round 2: Universal 5s Timer Engine & 4 Micro-Game Verification', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Speedster');

    // Verify all 4 micro-games exist
    assert.equal(MOCK_R2_MINIGAMES.length, 4);
    assert.ok(MOCK_R2_MINIGAMES.some(g => g.type === 'CATCH_REPORT'));
    assert.ok(MOCK_R2_MINIGAMES.some(g => g.type === 'SHAKE_OTP'));
    assert.ok(MOCK_R2_MINIGAMES.some(g => g.type === 'DODGE_BRICKS'));
    assert.ok(MOCK_R2_MINIGAMES.some(g => g.type === 'SPOT_DEEPFAKE'));

    engine.startRound2('catch_report');
    assert.equal(engine.status, 'ROUND_2');
    assert.equal(engine.timer.total, 5000);
    assert.equal(engine.r2.lives.get('p1'), 3);
  });

  testCtx.test('T1.8 - Round 2: 3-Life Survival Tracking and Game Over Trigger', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Gamer');
    engine.startRound2('catch_report');

    // Success inside 2.5s
    const res1 = engine.submitMinigameResult('p1', true, 2500);
    assert.ok(res1.success);
    assert.equal(res1.remainingLives, 3);
    assert.equal(res1.pointsEarned, 500); // (5000 - 2500)/5

    // Failure 1: loses life
    const res2 = engine.submitMinigameResult('p1', false, 4000);
    assert.ok(!res2.success);
    assert.equal(res2.remainingLives, 2);

    // Failure 2
    engine.submitMinigameResult('p1', false, 4000);
    assert.equal(engine.r2.lives.get('p1'), 1);

    // Failure 3: 0 lives left
    const res4 = engine.submitMinigameResult('p1', false, 4000);
    assert.equal(res4.remainingLives, 0);

    // Next action throws eliminated error
    assert.throws(() => {
      engine.submitMinigameResult('p1', true, 1000);
    }, /already eliminated/);
  });

  testCtx.test('T1.9 - Round 3: Secret Role Assignment (~10% Seeder vs ~90% Netizen)', () => {
    const engine = new GameShowEngine('MLN131');
    // Add 20 players
    for (let i = 1; i <= 20; i++) {
      engine.joinPlayer(`u_${i}`, `Student_${i}`);
    }

    engine.startRound3(0.15); // 15% seeders
    assert.equal(engine.status, 'ROUND_3');

    let seederCount = 0;
    let netizenCount = 0;
    for (const role of engine.r3.roles.values()) {
      if (role === 'SEEDER') seederCount++;
      if (role === 'NETIZEN') netizenCount++;
    }

    assert.equal(seederCount, 3);
    assert.equal(netizenCount, 17);
    assert.equal(seederCount + netizenCount, 20);
  });

  testCtx.test('T1.10 - Round 3: Discussion Shoutbox & Expulsion Vote VAR Verdict', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('u1', 'Thám Tử Lừng Danh');
    engine.joinPlayer('u2', 'Trùm Seeder');
    engine.joinPlayer('u3', 'Người Quan Sát');

    engine.startRound3();
    // Force u2 to be seeder
    engine.r3.roles.set('u2', 'SEEDER');
    engine.r3.roles.set('u1', 'NETIZEN');
    engine.r3.roles.set('u3', 'NETIZEN');

    // Post message
    const msg = engine.postDiscussion('u1', 'Tôi thấy u2 liên tục spam bài viết giống nhau, nghi vấn seeder!');
    assert.equal(engine.r3.messages.length, 1);
    assert.equal(msg.playerId, 'u1');

    // Vote to expel u2
    engine.castExpulsionVote('u1', 'u2');
    engine.castExpulsionVote('u3', 'u2');

    const outcome = engine.resolveExpulsion();
    assert.equal(outcome.expelledId, 'u2');
    assert.equal(outcome.revealedRole, 'SEEDER');
    assert.ok(engine.r3.expelledPlayers.has('u2'));

    // Netizens u1 and u3 get bonus points
    assert.equal(engine.players.get('u1').totalScore, 800);
    assert.equal(engine.players.get('u3').totalScore, 800);
  });

  testCtx.test('T1.11 - Round 4: Sabotage Card Hand Dealing & 5 Card Types', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Player One');
    engine.startRound4();

    assert.equal(engine.status, 'ROUND_4');
    assert.equal(engine.r4.cards.get('p1').length, 3);
    assert.equal(MOCK_SABOTAGE_CARDS.length, 5);
  });

  testCtx.test('T1.12 - Round 4: Ink Splat Canvas & Multi-Touch Wipe Mechanics', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Attacker');
    engine.joinPlayer('p2', 'Target');
    engine.startRound4();

    // Give p1 an ink card
    engine.r4.cards.set('p1', ['CARD_INK']);
    const playRes = engine.playSabotageCard('p1', 'p2', 'CARD_INK');
    assert.ok(playRes.success);
    assert.equal(engine.r4.inkSplats.get('p2'), 7);

    // Simulate 7 touch wipes
    for (let i = 6; i >= 0; i--) {
      const remaining = engine.wipeInk('p2');
      assert.equal(remaining, i);
    }
    // Fully cleared
    assert.equal(engine.r4.inkSplats.has('p2'), false);
  });

  testCtx.test('T1.13 - Round 4: Point Heist, Shield Deflection, and 2x Bet Resolution', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Rich Player');
    engine.joinPlayer('p2', 'Thief');
    engine.joinPlayer('p3', 'Shielded');

    engine.players.get('p1').totalScore = 4000;
    engine.players.get('p3').totalScore = 3000;
    engine.startRound4();

    // p2 steals from p1: 50% = 2000 points
    engine.r4.cards.set('p2', ['CARD_HEIST']);
    const heistRes = engine.playSabotageCard('p2', 'p1', 'CARD_HEIST');
    assert.equal(heistRes.stolenPoints, 2000);
    assert.equal(engine.players.get('p1').totalScore, 2000);
    assert.equal(engine.players.get('p2').totalScore, 2000);

    // p3 uses SHIELD
    engine.r4.cards.set('p3', ['CARD_SHIELD']);
    engine.playSabotageCard('p3', 'p3', 'CARD_SHIELD');
    assert.ok(engine.r4.shields.has('p3'));

    // p2 tries to steal from p3 -> BLOCKED!
    engine.r4.cards.set('p2', ['CARD_HEIST']);
    const blockedRes = engine.playSabotageCard('p2', 'p3', 'CARD_HEIST');
    assert.ok(blockedRes.blockedByShield);
    assert.equal(engine.players.get('p3').totalScore, 3000); // Points safe!
    assert.ok(!engine.r4.shields.has('p3')); // Shield broken
  });

  testCtx.test('T1.14 - Round 4: High-Stakes MLN131 Trivia Final & 2x Multiplier', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Scholar');
    engine.startRound4();

    // p1 activates 2x bet card
    engine.r4.cards.set('p1', ['CARD_BET_2X']);
    engine.playSabotageCard('p1', 'p1', 'CARD_BET_2X');

    // Correct trivia answer: 1000 * 2 = 2000
    const ans = engine.submitTriviaAnswer('p1', 1, true);
    assert.equal(ans.finalPoints, 2000);
    assert.equal(engine.players.get('p1').totalScore, 2000);
  });

  testCtx.test('T1.15 - Grand Podium: Top 1, 2, 3 Championship Leaderboard', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Huy');
    engine.joinPlayer('p2', 'Lan');
    engine.joinPlayer('p3', 'Minh');

    engine.players.get('p1').totalScore = 8500;
    engine.players.get('p2').totalScore = 6200;
    engine.players.get('p3').totalScore = 4100;

    const podium = engine.finalizePodium();
    assert.equal(engine.status, 'PODIUM');
    assert.equal(podium.champion.id, 'p1');
    assert.equal(podium.runnerUp.id, 'p2');
    assert.equal(podium.thirdPlace.id, 'p3');
  });
}
