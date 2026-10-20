// tests/suites/tier4_real_world.mjs
import assert from 'node:assert/strict';
import { GameShowEngine } from '../lib/gameShowEngine.mjs';
import { sound } from '../../src/lib/audioSynthesizer.ts';

export async function runTier4RealWorldTests(testCtx) {
  testCtx.suite('Tier 4: Real-World Application Scenarios');

  testCtx.test('T4.1 - High Concurrency 50-Client Simulation and Delta Polling Benchmark', () => {
    const engine = new GameShowEngine('MLN131');
    const clientCount = 50;

    const startJoin = performance.now();
    for (let i = 1; i <= clientCount; i++) {
      engine.joinPlayer(`client_${i}`, `Sinh Viên Di Động ${i}`);
    }
    const endJoin = performance.now();
    assert.equal(engine.players.size, 50);
    assert.ok(endJoin - startJoin < 100, `Joining 50 players took ${endJoin - startJoin}ms (< 100ms)`);

    // Emit some events
    for (let i = 1; i <= 20; i++) {
      engine.sendDanmaku(`client_${(i % clientCount) + 1}`, 'heart');
    }

    // 50 clients polling delta simultaneously
    const startPoll = performance.now();
    const pollSince = Date.now() - 5000;
    const pollingResults = [];
    for (let i = 1; i <= clientCount; i++) {
      const clientEvents = engine.events.filter(e => e.timestamp >= pollSince);
      pollingResults.push(clientEvents.length);
    }
    const endPoll = performance.now();

    assert.equal(pollingResults.length, 50);
    assert.ok(pollingResults[0] >= 20);
    assert.ok(endPoll - startPoll < 50, `50 concurrent polls took ${endPoll - startPoll}ms (< 50ms)`);
  });

  testCtx.test('T4.2 - Disconnection and Reconnection Delta Catchup', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('mobile_user', 'Sinh Viên Rớt Mạng');

    // User is active at T0
    const t0 = Date.now() - 1000;

    // While user is offline, 3 game events happen
    engine.sendDanmaku('mobile_user', 'tomato');
    engine.sendDanmaku('mobile_user', 'brick');
    engine.sendDanmaku('mobile_user', 'clown');

    // User reconnects with since: t0
    const caughtUpEvents = engine.events.filter(e => e.timestamp > t0);
    assert.ok(caughtUpEvents.length >= 3);
    assert.equal(caughtUpEvents[caughtUpEvents.length - 1].payload.reactionType, 'clown');
  });

  testCtx.test('T4.3 - Event Buffer Memory Bounding (Zero Memory Leak Invariant)', () => {
    const engine = new GameShowEngine('MLN131');
    engine.joinPlayer('spammer', 'Spam Bot');

    // Simulate 600 rapid events during intensive 90-minute lecture
    for (let i = 0; i < 600; i++) {
      engine.sendDanmaku('spammer', 'heart');
    }

    // Verify buffer capped to prevent unbounded memory consumption
    assert.ok(engine.events.length <= 500, `Buffer size ${engine.events.length} exceeds 500 cap`);
    assert.ok(engine.events.length >= 200);
  });

  testCtx.test('T4.4 - Procedural Audio Synthesizer Interface Contract Verification', () => {
    // Verify required procedural SFX methods defined in PROJECT.md
    const requiredSfx = [
      'playTrollHorn',
      'playApplause',
      'playCountdownTick',
      'playSplat',
      'playCorrectChime',
      'playWrongBuzz',
      'playSabotageStab',
      'playVictoryFanfare',
      'startPartyBGM',
      'stopPartyBGM'
    ];

    assert.ok(sound, 'sound instance must be exported from audioSynthesizer.ts');
    for (const sfx of requiredSfx) {
      assert.equal(
        typeof sound[sfx],
        'function',
        `SoundSynthesizer must implement ${sfx}() method`
      );
    }

    // Verify safe execution in Node.js (AudioContext is undefined in Node, methods must safely guard without throwing)
    assert.doesNotThrow(() => {
      sound.playTrollHorn();
      sound.playApplause();
      sound.playCountdownTick();
      sound.playSplat();
      sound.playCorrectChime();
      sound.playWrongBuzz();
      sound.playSabotageStab();
      sound.playVictoryFanfare();
      sound.startPartyBGM();
      sound.stopPartyBGM();
    });
  });
}
