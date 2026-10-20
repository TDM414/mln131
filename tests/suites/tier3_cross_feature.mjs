// tests/suites/tier3_cross_feature.mjs
import assert from 'node:assert/strict';
import { GameShowEngine } from '../lib/gameShowEngine.mjs';

export async function runTier3CrossFeatureTests(testCtx) {
  testCtx.suite('Tier 3: Cross-Feature Integration');

  testCtx.test('T3.1 - Full 4-Round Tournament Flow with Cumulative Score Retention', () => {
    const engine = new GameShowEngine('MLN131');
    engine.setMode('TOURNAMENT');

    // 1. Lobby: 4 players join
    engine.joinPlayer('p1', 'Nguyễn Văn A');
    engine.joinPlayer('p2', 'Trần Thị B');
    engine.joinPlayer('p3', 'Lê Hoàng C');
    engine.joinPlayer('p4', 'Phạm Thục D');

    // 2. Round 1: Cà Khịa duel
    engine.startRound1(0);
    engine.submitRoast('p1', 'Phản biện sắc bén A');
    engine.submitRoast('p2', 'Phản biện sắc bén B');
    engine.pairDuels();
    engine.voteRoast('p3', 'duel_1', 'A');
    engine.voteRoast('p4', 'duel_1', 'A');
    const r1Res = engine.resolveDuel('duel_1');
    assert.equal(r1Res.winnerId, 'p1');
    assert.equal(engine.players.get('p1').totalScore, 1000);
    assert.equal(engine.players.get('p2').totalScore, 250);

    // 3. Round 2: 5s Micro-games
    engine.startRound2('catch_report');
    engine.submitMinigameResult('p1', true, 1000); // gets 800 pts -> 1800
    engine.submitMinigameResult('p2', true, 2000); // gets 600 pts -> 850
    engine.submitMinigameResult('p3', false, 3000); // loses life, gets 0 pts -> 0
    engine.submitMinigameResult('p4', true, 1500); // gets 700 pts -> 700

    assert.equal(engine.players.get('p1').totalScore, 1800);
    assert.equal(engine.players.get('p2').totalScore, 850);
    assert.equal(engine.players.get('p4').totalScore, 700);

    // 4. Round 3: Seeder deduction
    engine.startRound3();
    engine.r3.roles.set('p3', 'SEEDER');
    engine.r3.roles.set('p1', 'NETIZEN');
    engine.r3.roles.set('p2', 'NETIZEN');
    engine.r3.roles.set('p4', 'NETIZEN');

    engine.castExpulsionVote('p1', 'p3');
    engine.castExpulsionVote('p2', 'p3');
    engine.castExpulsionVote('p4', 'p3');
    engine.resolveExpulsion();

    // p1, p2, p4 got 800 bonus points each
    assert.equal(engine.players.get('p1').totalScore, 2600);
    assert.equal(engine.players.get('p2').totalScore, 1650);
    assert.equal(engine.players.get('p4').totalScore, 1500);

    // 5. Round 4: Sabotage & Trivia
    engine.startRound4();
    // p2 uses HEIST on p1
    engine.r4.cards.set('p2', ['CARD_HEIST']);
    engine.playSabotageCard('p2', 'p1', 'CARD_HEIST'); // steals 1300 from p1
    assert.equal(engine.players.get('p1').totalScore, 1300);
    assert.equal(engine.players.get('p2').totalScore, 2950);

    // Trivia answer
    engine.submitTriviaAnswer('p2', 1, true); // +1000 -> 3950
    engine.submitTriviaAnswer('p1', 1, true); // +1000 -> 2300

    // 6. Grand Podium Ceremony
    const podium = engine.finalizePodium();
    assert.equal(podium.champion.id, 'p2');
    assert.equal(podium.runnerUp.id, 'p1');
    assert.equal(podium.thirdPlace.id, 'p4');

    // Verify per-round history was recorded
    assert.ok(engine.roundScores.ROUND_1['p1'] > 0);
    assert.ok(engine.roundScores.ROUND_2['p1'] > 0);
    assert.ok(engine.roundScores.ROUND_3['p1'] > 0);
    assert.ok(engine.roundScores.ROUND_4['p1'] > 0);
  });

  testCtx.test('T3.2 - Free-Play Standalone Mode Isolation', () => {
    const engine = new GameShowEngine('MLN131');
    engine.setMode('FREE_PLAY');

    engine.joinPlayer('user_a', 'Alice');
    engine.joinPlayer('user_b', 'Bob');

    // Launch standalone Round 2 without affecting cumulative scores
    engine.startRound2('shake_otp');
    engine.submitMinigameResult('user_a', true, 1000);
    assert.equal(engine.roundScores.ROUND_2['user_a'], 800);
    // In Free-Play, totalScore remains 0 (isolated per round)
    assert.equal(engine.players.get('user_a').totalScore, 0);
  });

  testCtx.test('T3.3 - Dev Bot Simulator Running Simultaneously with Human Players', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('human_1', 'Sinh Viên Thật');
    const botCount = engine.toggleBots(10);
    assert.equal(botCount, 10);
    assert.equal(engine.players.size, 11);

    engine.startRound1(0);
    engine.submitRoast('human_1', 'Ý kiến người thật');
    for (let i = 1; i <= 3; i++) {
      engine.submitRoast(`bot_${i}`, `Ý kiến bot số ${i}`);
    }

    const duels = engine.pairDuels();
    assert.ok(duels.length >= 2);

    // Bots cast votes
    for (let i = 4; i <= 10; i++) {
      engine.voteRoast(`bot_${i}`, duels[0].id, i % 2 === 0 ? 'A' : 'B');
    }

    const res = engine.resolveDuel(duels[0].id);
    assert.ok(res.votesA + res.votesB === 7);
  });
}
