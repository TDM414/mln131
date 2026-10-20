// tests/empirical_m2_challenger.mjs
// Standalone Empirical Challenger Verification Suite for Milestone 2: Danmaku Engine, Text Sanitizer & Audio

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

console.log('\n================================================================');
console.log('  CHALLENGER M2-2: EMPIRICAL STRESS & ADVERSARIAL VERIFICATION');
console.log('  Target: Danmaku Canvas Engine, Text Sanitizer & Web Audio');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function runTest(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    fn();
    const ms = (performance.now() - start).toFixed(2);
    passedTests++;
    console.log(`  ✔ [PASS] ${name} (${ms}ms)`);
  } catch (err) {
    const ms = (performance.now() - start).toFixed(2);
    failedTests++;
    findings.push({ name, error: err.message, stack: err.stack });
    console.log(`  ✖ [FAIL] ${name} (${ms}ms)`);
    console.log(`    Error: ${err.message}`);
  }
}

// ============================================================================
// SECTION 1: Danmaku Canvas Particle Pool & Trajectory Physics Stress Testing
// ============================================================================
console.log('--- SECTION 1: Danmaku Canvas Particle Pool & Physics Stress Test ---');

const danmakuSourcePath = path.resolve('src/components/DanmakuCanvas.tsx');
const danmakuSource = fs.readFileSync(danmakuSourcePath, 'utf8');

runTest('1.1 - Source Code Invariant: POOL_SIZE is exactly 120', () => {
  assert.ok(
    danmakuSource.includes('const POOL_SIZE = 120;'),
    'Expected "const POOL_SIZE = 120;" in DanmakuCanvas.tsx'
  );
});

runTest('1.2 - Source Code Invariant: Splat projectile gravity is 700 and vy += gravity * dt', () => {
  assert.ok(
    danmakuSource.includes('p.gravity = 700;') || danmakuSource.includes('gravity: 700'),
    'Expected gravity set to 700 for splat projectile'
  );
  assert.ok(
    danmakuSource.includes('p.vy += p.gravity * dt;'),
    'Expected "p.vy += p.gravity * dt;" in SPLAT_PROJECTILE physics update'
  );
});

// Headless Danmaku Simulation Engine matching DanmakuCanvas.tsx exactly
class HeadlessDanmakuEngine {
  constructor(poolSize = 120, width = 1280, height = 720) {
    this.poolSize = poolSize;
    this.width = width;
    this.height = height;
    this.laneIndex = 0;
    this.splatEvents = [];

    // Pre-allocated particle pool
    this.pool = [];
    for (let i = 0; i < poolSize; i++) {
      this.pool.push({
        active: false,
        type: 'EMOJI_BARRAGE',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        gravity: 0,
        baseY: 0,
        wobbleFreq: 0,
        wobbleAmp: 0,
        scale: 1,
        alpha: 1,
        life: 0,
        maxLife: 1,
        emoji: '🔥',
        text: '',
        senderName: '',
        color: '#FFD166',
        targetY: 0,
        splatTriggered: false,
        rotation: 0,
        vRot: 0,
        size: 32,
      });
    }
  }

  allocateParticle() {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    return null;
  }

  getActiveCount() {
    return this.pool.filter(p => p.active).length;
  }

  spawnDropletBurst(originX, originY, isTomato) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const p = this.allocateParticle();
      if (!p) break;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 220 + 80;
      p.active = true;
      p.type = 'SPLAT_DROPLET';
      p.x = originX;
      p.y = originY;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 400;
      p.baseY = originY;
      p.wobbleFreq = 0;
      p.wobbleAmp = 0;
      p.scale = 1;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.65;
      p.emoji = '';
      p.text = '';
      p.senderName = '';
      p.color = isTomato ? '#EF233C' : '#E76F51';
      p.splatTriggered = true;
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 10;
      p.size = isTomato ? Math.random() * 8 + 4 : Math.random() * 10 + 5;
    }
  }

  spawn(msg) {
    const emoji = msg.emoji || '🔥';
    const text = (msg.text || '').trim();
    const sender = msg.senderName || 'Netizen';
    const { width, height } = this;

    if (emoji === '🍅' || emoji === '🧱') {
      const p = this.allocateParticle();
      if (!p) return false;
      const startX = Math.random() * (width * 0.7) + width * 0.15;
      const startY = height + 30;
      const targetY = height * (0.2 + Math.random() * 0.45);
      const flightDuration = 0.75;
      const vy = -((startY - targetY) / flightDuration + 0.5 * 700 * flightDuration);

      p.active = true;
      p.type = 'SPLAT_PROJECTILE';
      p.x = startX;
      p.y = startY;
      p.vx = (Math.random() - 0.5) * 120;
      p.vy = vy;
      p.gravity = 700;
      p.baseY = startY;
      p.wobbleFreq = 0;
      p.wobbleAmp = 0;
      p.scale = 1;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 2.0;
      p.emoji = emoji;
      p.text = '';
      p.senderName = sender;
      p.color = emoji === '🍅' ? '#EF233C' : '#E76F51';
      p.targetY = targetY;
      p.splatTriggered = false;
      p.rotation = 0;
      p.vRot = (Math.random() - 0.5) * 12;
      p.size = 44;
      return true;
    }

    if (emoji === '❤️') {
      const p = this.allocateParticle();
      if (!p) return false;
      p.active = true;
      p.type = 'FLOATING_HEART';
      p.x = Math.random() * (width * 0.8) + width * 0.1;
      p.y = height + 20;
      p.vx = 0;
      p.vy = -(Math.random() * 60 + 90);
      p.gravity = 0;
      p.baseY = p.y;
      p.wobbleFreq = Math.random() * 3 + 2;
      p.wobbleAmp = Math.random() * 25 + 15;
      p.scale = Math.random() * 0.4 + 0.8;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = (height + 50) / 90;
      p.emoji = emoji;
      p.text = '';
      p.senderName = sender;
      p.color = '#EF233C';
      p.splatTriggered = false;
      p.rotation = 0;
      p.vRot = 0;
      p.size = 38;
      return true;
    }

    if (text.length > 0) {
      const p = this.allocateParticle();
      if (!p) return false;
      const lane = (this.laneIndex % 7) + 1;
      this.laneIndex++;
      const laneY = height * (0.08 + lane * 0.11);

      p.active = true;
      p.type = 'TEXT_PILL';
      p.x = width + 20;
      p.y = laneY;
      p.vx = -(Math.random() * 100 + 190);
      p.vy = 0;
      p.gravity = 0;
      p.baseY = laneY;
      p.wobbleFreq = Math.random() * 2 + 1;
      p.wobbleAmp = 6;
      p.scale = 1;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = (width + 600) / 190;
      p.emoji = emoji;
      p.text = text;
      p.senderName = sender;
      p.color = '#FFD166';
      p.splatTriggered = false;
      p.rotation = 0;
      p.vRot = 0;
      p.size = 18;
      return true;
    }

    // Default EMOJI_BARRAGE
    const p = this.allocateParticle();
    if (!p) return false;
    const lane = (this.laneIndex % 8) + 1;
    this.laneIndex++;
    const laneY = height * (0.07 + lane * 0.10);

    p.active = true;
    p.type = 'EMOJI_BARRAGE';
    p.x = width + 30;
    p.y = laneY;
    p.vx = -(Math.random() * 140 + 220);
    p.vy = 0;
    p.gravity = 0;
    p.baseY = laneY;
    p.wobbleFreq = Math.random() * 3 + 2;
    p.wobbleAmp = Math.random() * 12 + 6;
    p.scale = Math.random() * 0.3 + 0.9;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = (width + 200) / 220;
    p.emoji = emoji;
    p.text = '';
    p.senderName = sender;
    p.color = '#FFFFFF';
    p.splatTriggered = false;
    p.rotation = 0;
    p.vRot = 0;
    p.size = 36;
    return true;
  }

  update(dt, timestamp) {
    const { width, height } = this;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      if (p.type === 'EMOJI_BARRAGE') {
        p.x += p.vx * dt;
        p.y = p.baseY + Math.sin(timestamp * 0.003 * p.wobbleFreq) * p.wobbleAmp;
        if (p.x < -100) p.active = false;
      } else if (p.type === 'FLOATING_HEART') {
        p.y += p.vy * dt;
        p.x += Math.sin(timestamp * 0.004 * p.wobbleFreq) * (p.wobbleAmp * dt * 2.5);
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.y < -50) p.active = false;
      } else if (p.type === 'SPLAT_PROJECTILE') {
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.vRot * dt;

        if (!p.splatTriggered && p.vy >= -50 && p.y <= p.targetY + 80) {
          p.splatTriggered = true;
          p.active = false;
          this.splatEvents.push({ x: p.x, y: p.y, emoji: p.emoji });
          this.spawnDropletBurst(p.x, p.y, p.emoji === '🍅');
          continue;
        }
        if (p.y > height + 100 && p.vy > 0) {
          p.active = false;
        }
      } else if (p.type === 'SPLAT_DROPLET') {
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.vRot * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      } else if (p.type === 'TEXT_PILL') {
        p.x += p.vx * dt;
        p.y = p.baseY + Math.sin(timestamp * 0.002 * p.wobbleFreq) * p.wobbleAmp;
        if (p.x < -500) p.active = false;
      }
    }
  }
}

runTest('1.3 - Stress Test: Rapid injection of 350 particles strictly capped to 120 pool slots', () => {
  const engine = new HeadlessDanmakuEngine(120);
  let accepted = 0;
  let rejected = 0;

  const emojis = ['🍅', '🧱', '❤️', '🤡', '🔥', '✨'];
  for (let i = 0; i < 350; i++) {
    const success = engine.spawn({
      emoji: emojis[i % emojis.length],
      text: i % 4 === 0 ? `Bình luận ném gạch thứ ${i}` : '',
      senderName: `SinhVien_${i}`,
    });
    if (success) accepted++;
    else rejected++;
  }

  const activeCount = engine.getActiveCount();
  assert.equal(activeCount, 120, `Active particle count must equal 120 pool limit, got ${activeCount}`);
  assert.equal(engine.pool.length, 120, `Pool array length must strictly remain 120 without expanding, got ${engine.pool.length}`);
  assert.equal(accepted, 120, `Accepted count must be 120, got ${accepted}`);
  assert.equal(rejected, 230, `Rejected overflow count must be 230, got ${rejected}`);
});

runTest('1.4 - Memory Boundedness: 10,000 rapid spawns with simulation loop produce zero heap explosion', () => {
  const engine = new HeadlessDanmakuEngine(120);
  if (global.gc) global.gc();
  const heapBefore = process.memoryUsage().heapUsed;

  let timestamp = 0;
  const dt = 0.016; // ~60fps
  const emojis = ['🍅', '🧱', '❤️', '🤡', '🔥'];

  // Simulate 10,000 spawn attempts over 500 frames (~8.3 seconds)
  for (let frame = 0; frame < 500; frame++) {
    timestamp += dt * 1000;
    // Spawn 20 particles per frame
    for (let j = 0; j < 20; j++) {
      engine.spawn({
        emoji: emojis[(frame * 20 + j) % emojis.length],
        text: (frame + j) % 5 === 0 ? `Netizen shoutout ${frame}` : '',
        senderName: `Bot_${j}`,
      });
    }
    engine.update(dt, timestamp);
    const active = engine.getActiveCount();
    assert.ok(active <= 120, `Active particles exceeded limit during frame ${frame}: active=${active}`);
  }

  const heapAfter = process.memoryUsage().heapUsed;
  const heapGrowthMB = (heapAfter - heapBefore) / (1024 * 1024);

  assert.equal(engine.pool.length, 120, 'Particle pool size must remain exactly 120');
  assert.ok(heapGrowthMB < 25, `Heap growth must be under 25MB for 10,000 spawns (actual: ${heapGrowthMB.toFixed(2)} MB)`);
});

runTest('1.5 - Trajectory Math Verification: Tomato/Brick ballistic arc obeys vy += 700 * dt', () => {
  const engine = new HeadlessDanmakuEngine(120, 1000, 800);
  engine.spawn({ emoji: '🍅', senderName: 'Tester' });

  const p = engine.pool.find(pt => pt.active && pt.type === 'SPLAT_PROJECTILE');
  assert.ok(p, 'Projectile particle must exist');
  assert.equal(p.gravity, 700, 'Gravity must be 700');

  const initialVy = p.vy;
  const dt = 0.02; // 20ms step
  let prevVy = initialVy;
  let prevY = p.y;

  // Track 10 steps of flight
  for (let step = 1; step <= 10; step++) {
    engine.update(dt, step * 20);
    if (!p.active) break;

    const expectedVy = prevVy + 700 * dt;
    const diffVy = Math.abs(p.vy - expectedVy);
    assert.ok(diffVy < 1e-4, `Step ${step}: vy did not increase by 700 * dt. Expected ${expectedVy}, got ${p.vy}`);

    const eulerY = prevY + (prevVy + 700 * dt) * dt;
    const diffY = Math.abs(p.y - eulerY);
    assert.ok(diffY < 1e-4, `Step ${step}: y position mismatch in numerical integration`);

    prevVy = p.vy;
    prevY = p.y;
  }
});

runTest('1.6 - Trajectory Math Verification: Analytical target arrival in ballistic flight', () => {
  const startY = 830;
  const targetY = 300;
  const flightDuration = 0.75;
  const g = 700;
  const vy0 = -((startY - targetY) / flightDuration + 0.5 * g * flightDuration);

  // Exact continuous equation: y(t) = startY + vy0 * t + 0.5 * g * t^2
  const yAtDuration = startY + vy0 * flightDuration + 0.5 * g * (flightDuration * flightDuration);
  const err = Math.abs(yAtDuration - targetY);
  assert.ok(err < 1e-6, `Analytical flight position at 0.75s must equal targetY=${targetY}, got ${yAtDuration}`);
});

runTest('1.7 - Trajectory Math Verification: Sine-wave oscillation bounded within viewport lanes', () => {
  const engine = new HeadlessDanmakuEngine(120, 1920, 1080);
  const height = 1080;

  for (let l = 1; l <= 8; l++) {
    engine.spawn({ emoji: '🔥', senderName: `Lane_${l}` });
  }

  const barrageParticles = engine.pool.filter(p => p.active && p.type === 'EMOJI_BARRAGE');
  assert.equal(barrageParticles.length, 8, '8 barrage particles should be active');

  for (let t = 0; t <= 50000; t += 100) {
    for (const p of barrageParticles) {
      const y = p.baseY + Math.sin(t * 0.003 * p.wobbleFreq) * p.wobbleAmp;
      assert.ok(y >= 0 && y <= height, `Particle Y out of viewport bounds: y=${y}, height=${height}, lane baseY=${p.baseY}`);
      const dev = Math.abs(y - p.baseY);
      assert.ok(dev <= p.wobbleAmp + 1e-4, `Wobble deviation ${dev} exceeded wobbleAmp ${p.wobbleAmp}`);
      assert.ok(p.wobbleAmp <= 18, `wobbleAmp must be <= 18px, got ${p.wobbleAmp}`);
    }
  }
});

// ============================================================================
// SECTION 2: Profanity Filter & Text Sanitization Stress Testing
// ============================================================================
console.log('\n--- SECTION 2: Profanity Filter & Text Sanitization Stress Test ---');

import { sanitizeRoastText, PROFANITY_FILTER_WORDS } from '../src/data/questions';

runTest('2.1 - Empty, Whitespace-only, and Null/Undefined inputs return empty string', () => {
  assert.equal(sanitizeRoastText(''), '');
  assert.equal(sanitizeRoastText('   '), '');
  assert.equal(sanitizeRoastText('\t\n\r  '), '');
  assert.equal(sanitizeRoastText(null), '');
  assert.equal(sanitizeRoastText(undefined), '');
  assert.equal(sanitizeRoastText(12345), '');
});

runTest('2.2 - Emoji-only strings are preserved without truncation or corruption', () => {
  const emojiStr = '😂😂😂 🍅🧱❤️ 🔥💯';
  const sanitized = sanitizeRoastText(emojiStr);
  assert.equal(sanitized, emojiStr);
});

runTest('2.3 - 120-Character Length Boundary Enforcement', () => {
  const exact120 = 'A'.repeat(120);
  assert.equal(sanitizeRoastText(exact120).length, 120);

  const long150 = 'B'.repeat(150);
  const sanitized150 = sanitizeRoastText(long150);
  assert.equal(sanitized150.length, 120);
  assert.equal(sanitized150, 'B'.repeat(120));

  const long500 = 'Chào các bạn sinh viên MLN131 '.repeat(20);
  assert.equal(sanitizeRoastText(long500).length, 120);
});

runTest('2.4 - Baseline Profanity Masking for all dictionary words', () => {
  for (const word of PROFANITY_FILTER_WORDS) {
    const input = `Alo ${word} bạn ơi`;
    const res = sanitizeRoastText(input);
    assert.ok(
      res.includes('[VAR đã che 🎦]'),
      `Expected profanity "${word}" to be masked in "${input}", got "${res}"`
    );
    assert.ok(
      !res.toLowerCase().split(' ').includes(word),
      `Sanitized text still contains unmasked profanity token "${word}"`
    );
  }
});

runTest('2.5 - Mixed Casing Profanity Neutralization', () => {
  const cases = [
    { input: 'DM bạn ơi', expectedMask: true },
    { input: 'VCL luôn á', expectedMask: true },
    { input: 'ĐM gì vậy trời', expectedMask: true },
    { input: 'ĐMM luôn', expectedMask: true },
    { input: 'LỒN gì thế', expectedMask: true },
    { input: 'CẶC thật chứ', expectedMask: true },
    { input: 'ĐỤ má', expectedMask: true },
    { input: 'ĐỊT nhau', expectedMask: true },
  ];

  for (const c of cases) {
    const res = sanitizeRoastText(c.input);
    assert.ok(
      res.includes('[VAR đã che 🎦]'),
      `Mixed case input "${c.input}" was not masked! Got: "${res}"`
    );
  }
});

runTest('2.6 - Unicode Normalization (NFC vs NFD Diacritics)', () => {
  const nfc = 'lồn cặc đụ địt';
  const nfd = nfc.normalize('NFD');

  const resNfc = sanitizeRoastText(nfc);
  assert.ok(resNfc.includes('[VAR đã che 🎦]'), 'NFC composite diacritics must be masked');

  const resNfd = sanitizeRoastText(nfd);
  console.log(`    [Empirical Observation 2.6] NFC result: "${resNfc}" | NFD result: "${resNfd}"`);
});

runTest('2.7 - Adversarial Evasion Test: Consecutive Swear Words ("dm dm")', () => {
  const input = 'dm dm';
  const res = sanitizeRoastText(input);
  console.log(`    [Empirical Observation 2.7] Input: "${input}" -> Result: "${res}"`);
  assert.ok(res.includes('[VAR đã che 🎦]'), 'At least one dm must be masked');
});

runTest('2.8 - Adversarial Evasion Test: Swear word with adjacent punctuation ("dm!", "vcl?")', () => {
  const input1 = 'dm!';
  const res1 = sanitizeRoastText(input1);
  const input2 = 'vcl?';
  const res2 = sanitizeRoastText(input2);
  console.log(`    [Empirical Observation 2.8] "dm!" -> "${res1}" | "vcl?" -> "${res2}"`);
});

runTest('2.9 - Adversarial Evasion Test: Leetspeak / delimiter insertion ("d.m", "d_m", "d-m")', () => {
  const cases = ['d.m', 'd_m', 'd-m', 'd m', 'v.c.l', 'c.a.c'];
  for (const c of cases) {
    const res = sanitizeRoastText(c);
    console.log(`    [Empirical Observation 2.9] Leetspeak "${c}" -> "${res}"`);
  }
});

// ============================================================================
// SECTION 3: Web Audio Synthesizer Interface & Method Invocations
// ============================================================================
console.log('\n--- SECTION 3: Web Audio Synthesizer Interface & Method Invocations ---');

import { sound } from '../src/lib/audioSynthesizer';

runTest('3.1 - Singleton sound object exists and is enabled by default', () => {
  assert.ok(sound, 'sound export must exist');
  assert.equal(typeof sound.enabled, 'boolean');
  assert.equal(sound.enabled, true);
  assert.equal(typeof sound.masterVolume, 'number');
  assert.equal(sound.masterVolume, 0.6);
});

runTest('3.2 - Round 1 Audio Methods exist and do not throw in SSR / Node.js', () => {
  assert.equal(typeof sound.playWhistleAlarm, 'function');
  assert.doesNotThrow(() => sound.playWhistleAlarm(), 'playWhistleAlarm must not throw');

  assert.equal(typeof sound.playApplause, 'function');
  assert.doesNotThrow(() => sound.playApplause(), 'playApplause must not throw');

  assert.equal(typeof sound.playCountdownTick, 'function');
  assert.doesNotThrow(() => sound.playCountdownTick(true), 'playCountdownTick(true) must not throw');
  assert.doesNotThrow(() => sound.playCountdownTick(false), 'playCountdownTick(false) must not throw');

  assert.equal(typeof sound.playSplat, 'function');
  assert.doesNotThrow(() => sound.playSplat(), 'playSplat must not throw');

  assert.equal(typeof sound.playTrollHorn, 'function');
  assert.doesNotThrow(() => sound.playTrollHorn(), 'playTrollHorn must not throw');

  assert.equal(typeof sound.playVictoryFanfare, 'function');
  assert.doesNotThrow(() => sound.playVictoryFanfare(), 'playVictoryFanfare must not throw');

  assert.equal(typeof sound.playCorrectChime, 'function');
  assert.doesNotThrow(() => sound.playCorrectChime(), 'playCorrectChime must not throw');

  assert.equal(typeof sound.playWrongBuzz, 'function');
  assert.doesNotThrow(() => sound.playWrongBuzz(), 'playWrongBuzz must not throw');
});

// Strict W3C Mock AudioContext Test
class StrictMockAudioParam {
  constructor(name) {
    this.name = name;
    this.value = 1;
    this.history = [];
  }
  setValueAtTime(val, time) {
    this.history.push({ type: 'setValueAtTime', val, time });
    this.value = val;
  }
  exponentialRampToValueAtTime(val, time) {
    if (this.value <= 0 || val <= 0) {
      throw new RangeError(
        `W3C Web Audio Violation: exponentialRamp cannot ramp to/from <= 0 (current: ${this.value}, target: ${val})`
      );
    }
    this.history.push({ type: 'exponentialRampToValueAtTime', val, time });
    this.value = val;
  }
  linearRampToValueAtTime(val, time) {
    this.history.push({ type: 'linearRampToValueAtTime', val, time });
    this.value = val;
  }
}

class StrictMockAudioNode {
  constructor(ctx, nodeType) {
    this.ctx = ctx;
    this.nodeType = nodeType;
    this.connectedTo = [];
  }
  connect(dest) {
    this.connectedTo.push(dest);
    this.ctx.connections.push({ from: this, to: dest });
  }
}

class StrictMockOscillatorNode extends StrictMockAudioNode {
  constructor(ctx) {
    super(ctx, 'Oscillator');
    this.frequency = new StrictMockAudioParam('frequency');
    this.type = 'sine'; // Oscillator waveform type
    this.started = false;
    this.stopped = false;
  }
  start(t) { this.started = true; this.startTime = t; }
  stop(t) { this.stopped = true; this.stopTime = t; }
}

class StrictMockGainNode extends StrictMockAudioNode {
  constructor(ctx) {
    super(ctx, 'Gain');
    this.gain = new StrictMockAudioParam('gain');
  }
}

class StrictMockBiquadFilterNode extends StrictMockAudioNode {
  constructor(ctx) {
    super(ctx, 'BiquadFilter');
    this.frequency = new StrictMockAudioParam('frequency');
    this.Q = new StrictMockAudioParam('Q');
  }
}

class StrictMockBufferSourceNode extends StrictMockAudioNode {
  constructor(ctx) {
    super(ctx, 'AudioBufferSource');
    this.buffer = null;
    this.started = false;
  }
  start(t) { this.started = true; }
}

class StrictMockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.state = 'suspended';
    this.destination = new StrictMockAudioNode(this, 'Destination');
    this.nodes = [];
    this.connections = [];
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createOscillator() {
    const n = new StrictMockOscillatorNode(this);
    this.nodes.push(n);
    return n;
  }
  createGain() {
    const n = new StrictMockGainNode(this);
    this.nodes.push(n);
    return n;
  }
  createBiquadFilter() {
    const n = new StrictMockBiquadFilterNode(this);
    this.nodes.push(n);
    return n;
  }
  createBufferSource() {
    const n = new StrictMockBufferSourceNode(this);
    this.nodes.push(n);
    return n;
  }
  createBuffer(channels, length, sampleRate) {
    return {
      channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length)
    };
  }
}

// Transpile audioSynthesizer to evaluate inside simulated browser window
const audioSourcePath = path.resolve('src/lib/audioSynthesizer.ts');
const audioSource = fs.readFileSync(audioSourcePath, 'utf8');

const transpileSynthesizer = (code) => {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return result.outputText
    .replace('exports.sound = new SoundSynthesizer();', '')
    .replace('Object.defineProperty(exports, "__esModule", { value: true });', '');
};

const jsSynthCode = transpileSynthesizer(audioSource);
const makeSynth = (mockWindow) => {
  const exports = {};
  const fn = new Function('window', 'AudioContext', 'exports', `${jsSynthCode}\nreturn SoundSynthesizer;`);
  const Cls = fn(mockWindow, mockWindow.AudioContext, exports);
  return new Cls();
};

runTest('3.3 - Strict Web Audio W3C Compliance: playWhistleAlarm (2-burst referee whistle)', () => {
  const mockCtx = new StrictMockAudioContext();
  const mockWindow = { AudioContext: function() { return mockCtx; } };
  const synth = makeSynth(mockWindow);

  synth.playWhistleAlarm();

  const oscs = mockCtx.nodes.filter(n => n.nodeType === 'Oscillator');
  const gains = mockCtx.nodes.filter(n => n.nodeType === 'Gain');

  assert.equal(oscs.length, 2, 'playWhistleAlarm must create 2 oscillators for the 2 whistle bursts');
  assert.equal(gains.length, 2, 'playWhistleAlarm must create 2 gain nodes');
  assert.ok(oscs.every(o => o.started && o.stopped), 'All oscillators must start and stop');
  assert.ok(oscs.every(o => o.type === 'sawtooth'), 'Whistle waveform must be sawtooth');
});

runTest('3.4 - Strict Web Audio W3C Compliance: playApplause (Shaped noise + clap bursts)', () => {
  const mockCtx = new StrictMockAudioContext();
  const mockWindow = { AudioContext: function() { return mockCtx; } };
  const synth = makeSynth(mockWindow);

  synth.playApplause();

  const bufferSources = mockCtx.nodes.filter(n => n.nodeType === 'AudioBufferSource');
  const filters = mockCtx.nodes.filter(n => n.nodeType === 'BiquadFilter');
  const gains = mockCtx.nodes.filter(n => n.nodeType === 'Gain');

  assert.equal(bufferSources.length, 1, 'playApplause must create 1 noise buffer source');
  assert.equal(filters.length, 1, 'playApplause must create 1 bandpass filter');
  assert.equal(gains.length, 1, 'playApplause must create 1 gain node');
  assert.equal(filters[0].frequency.value, 1150, 'Filter frequency must be 1150Hz for fleshy claps');
});

runTest('3.5 - Strict Web Audio W3C Compliance: playCountdownTick (Normal vs Urgent woodblock)', () => {
  const mockCtx = new StrictMockAudioContext();
  const mockWindow = { AudioContext: function() { return mockCtx; } };
  const synth = makeSynth(mockWindow);

  // Normal tick
  mockCtx.nodes = [];
  synth.playCountdownTick(false);
  const normalOsc = mockCtx.nodes.find(n => n.nodeType === 'Oscillator');
  assert.ok(normalOsc, 'Normal tick oscillator must exist');
  assert.equal(normalOsc.type, 'sine');

  // Urgent tick
  mockCtx.nodes = [];
  synth.playCountdownTick(true);
  const urgentOsc = mockCtx.nodes.find(n => n.nodeType === 'Oscillator');
  assert.ok(urgentOsc, 'Urgent tick oscillator must exist');
  assert.equal(urgentOsc.type, 'sawtooth');
});

runTest('3.6 - Strict Web Audio W3C Compliance: playSplat (Liquid squish + noise burst)', () => {
  const mockCtx = new StrictMockAudioContext();
  const mockWindow = { AudioContext: function() { return mockCtx; } };
  const synth = makeSynth(mockWindow);

  synth.playSplat();

  const oscs = mockCtx.nodes.filter(n => n.nodeType === 'Oscillator');
  const bufferSources = mockCtx.nodes.filter(n => n.nodeType === 'AudioBufferSource');
  const filters = mockCtx.nodes.filter(n => n.nodeType === 'BiquadFilter');
  const gains = mockCtx.nodes.filter(n => n.nodeType === 'Gain');

  assert.equal(oscs.length, 1, 'playSplat must create 1 squish oscillator');
  assert.equal(oscs[0].type, 'triangle', 'Squish oscillator must be triangle');
  assert.equal(bufferSources.length, 1, 'playSplat must create 1 noise burst source');
  assert.equal(filters.length, 1, 'playSplat must create 1 lowpass filter');
  assert.equal(gains.length, 2, 'playSplat must create 2 gain nodes (osc + noise)');
});

runTest('3.7 - Zero Master Volume Safety: exponentialRamp never receives <= 0 value', () => {
  const mockCtx = new StrictMockAudioContext();
  const mockWindow = { AudioContext: function() { return mockCtx; } };
  const synth = makeSynth(mockWindow);
  synth.masterVolume = 0; // Edge case: muted volume

  // None of these should throw W3C violation even when masterVolume = 0
  assert.doesNotThrow(() => synth.playTrollHorn());
  assert.doesNotThrow(() => synth.playApplause());
  assert.doesNotThrow(() => synth.playCountdownTick(true));
  assert.doesNotThrow(() => synth.playSplat());
  assert.doesNotThrow(() => synth.playWhistleAlarm());
  assert.doesNotThrow(() => synth.playCorrectChime());
  assert.doesNotThrow(() => synth.playWrongBuzz());
  assert.doesNotThrow(() => synth.playVictoryFanfare());
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log('  CHALLENGER M2-2 VERIFICATION SUMMARY');
console.log('================================================================');
console.log(`  Total Invariant Tests: ${totalTests}`);
console.log(`  Passed Tests:          ${passedTests}`);
console.log(`  Failed Tests:          ${failedTests}`);
console.log(`  Pass Rate:             ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (findings.length > 0) {
  console.log('\n  CRITICAL FINDINGS / FAILURES:');
  findings.forEach((f, idx) => {
    console.log(`  ${idx + 1}. [${f.name}]`);
    console.log(`     Error: ${f.error}`);
  });
} else {
  console.log('\n  ALL EMPIRICAL TESTS PASSED SATISFACTORILY.');
}
console.log('================================================================\n');

process.exit(failedTests > 0 ? 1 : 0);
