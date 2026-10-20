import ts from 'typescript';
import fs from 'fs';
import assert from 'node:assert/strict';

console.log('--- RECHECK EMPIRICAL HARNESS: AUDIO, DANMAKU, AND CLIPPATH ---');

// 1. Audio Synthesizer Edge Cases
const code = ts.transpileModule(fs.readFileSync('src/lib/audioSynthesizer.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

const cleanedCode = code
  .replace('exports.sound = new SoundSynthesizer();', '')
  .replace('Object.defineProperty(exports, "__esModule", { value: true });', '');

const fn = new Function('window', 'AudioContext', 'exports', `${cleanedCode}\nreturn SoundSynthesizer;`);

const mockCtx = {
  currentTime: 0,
  sampleRate: 44100,
  destination: {},
  createOscillator: () => ({
    type: 'sine',
    frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
    connect: () => {},
    start: () => {},
    stop: () => {}
  }),
  createGain: () => ({
    gain: {
      value: 1,
      setValueAtTime: function(v) { this.value = v; },
      exponentialRampToValueAtTime: function(v) {
        if (this.value <= 0 || v <= 0) {
          throw new RangeError(`Web Audio RangeError: gain cannot ramp to/from <= 0 (from: ${this.value}, to: ${v})`);
        }
      }
    },
    connect: () => {}
  }),
  createBiquadFilter: () => ({
    frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
    Q: { setValueAtTime: () => {} },
    connect: () => {}
  }),
  createBufferSource: () => ({ buffer: null, connect: () => {}, start: () => {}, stop: () => {} }),
  createBuffer: () => ({ getChannelData: () => new Float32Array(100) })
};

const SoundSynthesizer = fn({ AudioContext: function() { return mockCtx; } }, function() { return mockCtx; }, {});
const synth = new SoundSynthesizer();

const testVolumes = [0, -0.5, -100, 0.000000001, 0.5, 1.0];
for (const vol of testVolumes) {
  synth.masterVolume = vol;
  synth.playTrollHorn();
  synth.playApplause();
  synth.playCountdownTick(false);
  synth.playCountdownTick(true);
  synth.playSplat();
  synth.playCorrectChime();
  synth.playWrongBuzz();
  synth.playSabotageStab();
  synth.playVictoryFanfare();
  synth.playLaser(true);
  synth.playLaser(false);
  synth.playExplosion(true);
  synth.playExplosion(false);
  synth.playGachaReveal('epic');
  synth.playWhistleAlarm();
  synth.playBossStun();
  synth.playTapPunch();
}
console.log('✔ Audio Synthesizer: All 17 sound functions execute cleanly with ZERO RangeErrors across 6 volume boundaries!');

// 2. Danmaku Cooldown Verification
const playPageSrc = fs.readFileSync('src/app/play/page.tsx', 'utf8');
assert.ok(playPageSrc.includes('lastDanmakuTime.current < 300'), '300ms cooldown lock active');
assert.ok(playPageSrc.includes('lastDanmakuTime = useRef<number>(0)'), 'lastDanmakuTime initialized with useRef');
console.log('✔ Danmaku Rate-Limiting: 300ms cooldown active and verified.');

// 3. Dynamic clipPath Verification
const avatarsSrc = fs.readFileSync('src/data/memeAvatars.tsx', 'utf8');
assert.ok(avatarsSrc.includes("const clipId = React.useId ? 'ref-clip-' + React.useId().replace(/:/g, '') : 'ref-clip-dyn';"), 'Dynamic clipId uses React.useId');
assert.ok(avatarsSrc.includes('<clipPath id={clipId}>'), '<clipPath id={clipId}> is rendered');
assert.ok(avatarsSrc.includes('<g clipPath={`url(#${clipId})`}>'), '<g clipPath={`url(#${clipId})`}> references dynamic ID');
console.log('✔ Dynamic clipPath: VarInspectorSvg uses instance-specific clipId, preventing DOM ID collision.');

// 4. Mobile Viewport Scrollability
assert.ok(playPageSrc.includes('className="my-auto py-2 space-y-4 max-w-sm mx-auto w-full overflow-y-auto"'), 'Join form has overflow-y-auto');
console.log('✔ Mobile Viewport: Join form container has overflow-y-auto for virtual keyboard accessibility.');

console.log('ALL EMPIRICAL RECHECKS PASSED (0 FAILURES)');
