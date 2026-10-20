// Procedural Web Audio API Synthesizer for NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)
// 100% Offline, Zero external MP3/WAV dependencies

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public masterVolume: number = 0.6;
  private bgmInterval: NodeJS.Timeout | null = null;
  private isBgmPlaying: boolean = false;
  private bgmStep: number = 0;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Clamped volume to satisfy W3C Web Audio API requirement: exponentialRamp cannot ramp to/from <= 0
  private get safeVolume(): number {
    return Math.max(0.0001, this.masterVolume);
  }

  // Get master gain node for controlled volume
  private getDestination(): AudioNode | null {
    if (!this.ctx) return null;
    return this.ctx.destination;
  }

  // ==========================================
  // 1. Party Game Show Signatures
  // ==========================================

  /**
   * MLG / Meme Troll Airhorn (3-burst detuned brass blast)
   */
  playTrollHorn() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const blasts = [0, 0.12, 0.24, 0.44];
    const durations = [0.08, 0.08, 0.08, 0.32];
    const now = this.ctx.currentTime;

    blasts.forEach((startOffset, idx) => {
      if (!this.ctx) return;
      const startTime = now + startOffset;
      const duration = durations[idx];

      // Chord frequencies: Bb4 (466.16Hz) and F4 (349.23Hz) + Db5 (554.37Hz)
      const freqs = [349.23, 466.16, 554.37];

      freqs.forEach((freq, fIdx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        // Detune slightly for that brassy blare
        osc.frequency.setValueAtTime(freq + (fIdx === 0 ? -3 : fIdx === 1 ? 4 : -2), startTime);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, startTime);
        filter.Q.setValueAtTime(4.5, startTime);

        gain.gain.setValueAtTime(0.28 * this.safeVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
      });
    });
  }

  /**
   * Crowd Applause / Cheering noise synthesis
   */
  playApplause() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const sampleRate = this.ctx.sampleRate;
    const duration = 1.6;
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate shaped white noise + clapping bursts
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      // White noise base
      let sample = (Math.random() * 2 - 1) * 0.4;
      // Add randomized spikes representing individual hand claps
      if (Math.random() < 0.006) {
        sample += (Math.random() * 2 - 1) * 0.9;
      }
      // Amplitude envelope (rise then fade)
      let env = 1;
      if (t < 0.25) {
        env = t / 0.25;
      } else {
        env = Math.max(0, 1 - (t - 0.25) / (duration - 0.25));
      }
      data[i] = sample * env;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to sound like fleshy hand claps (bandpass around 1200Hz)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1150;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45 * this.safeVolume, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.start();
  }

  /**
   * Universal 5s Countdown Tick (Ascending woodblock impulse)
   */
  playCountdownTick(isUrgent: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isUrgent ? 'sawtooth' : 'sine';
    const startFreq = isUrgent ? 1200 : 780;
    const endFreq = isUrgent ? 450 : 260;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.045);

    gain.gain.setValueAtTime(isUrgent ? 0.35 * this.safeVolume : 0.25 * this.safeVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Liquid comic tomato / ink splat
   */
  playSplat() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Oscillator 1: Squishy pitch slide
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);

    oscGain.gain.setValueAtTime(0.4 * this.safeVolume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    // Noise burst for wet impact
    const sampleRate = this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, Math.floor(sampleRate * 0.12), sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);
    filter.Q.setValueAtTime(5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3 * this.safeVolume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * Correct Answer Chime (Harmonic 4-bell chime: C5, E5, G5, C6)
   */
  playCorrectChime() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const startTime = now + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25 * this.safeVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.42);
    });
  }

  /**
   * Wrong Buzz (Dissonant minor-second buzzer)
   */
  playWrongBuzz() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // C3 (130.81Hz) + Db3 (138.59Hz) clash
    const freqs = [130.81, 138.59];

    freqs.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3 * this.safeVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    });
  }

  /**
   * Cinematic Sabotage Stab (Diminished suspense chord hit with sub punch)
   */
  playSabotageStab() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub bass punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(65, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    subGain.gain.setValueAtTime(0.5 * this.safeVolume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.32);

    // Diminished chord hit: F#4, A4, C5, Eb5
    const chord = [369.99, 440.0, 523.25, 622.25];
    chord.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2 * this.safeVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    });
  }

  /**
   * Triumphant Victory Fanfare
   */
  playVictoryFanfare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.16 }, // C5
      { f: 523.25, d: 0.16 }, // C5
      { f: 523.25, d: 0.16 }, // C5
      { f: 659.25, d: 0.45 }, // E5
      { f: 587.33, d: 0.22 }, // D5
      { f: 659.25, d: 0.22 }, // E5
      { f: 783.99, d: 0.75 }, // G5
      { f: 1046.5, d: 0.95 }, // C6
    ];

    let t = this.ctx.currentTime + 0.05;
    notes.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.35 * this.safeVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + n.d);

      t += n.d + 0.04;
    });
  }

  // ==========================================
  // 2. Procedural 128 BPM Party BGM Loop
  // ==========================================

  /**
   * Start procedural 128 BPM chiptune party loop
   */
  startPartyBGM() {
    if (this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // 128 BPM: 1 beat = 60/128 = 0.46875s; 16th note = 0.1171875s
    const stepDurationMs = (60 / 128 / 4) * 1000; // ~117.2ms

    // D-Minor funk bassline pattern (16 steps)
    // 0: D2, 2: D2, 4: F2, 6: G2, 8: D2, 10: D2, 12: C3, 14: A2
    const basslineFreqs: Record<number, number> = {
      0: 73.42,  // D2
      2: 73.42,  // D2
      4: 87.31,  // F2
      6: 98.0,   // G2
      8: 73.42,  // D2
      10: 73.42, // D2
      12: 130.81,// C3
      14: 110.0, // A2
    };

    this.bgmInterval = setInterval(() => {
      if (!this.enabled || !this.isBgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step = this.bgmStep % 16;

      // 1. Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.1);
        kickGain.gain.setValueAtTime(0.28 * this.safeVolume, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.11);
      }

      // 2. Snare noise on 4, 12
      if (step === 4 || step === 12) {
        const snareNoise = this.createNoiseBuffer(0.09);
        if (snareNoise) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(1000, now);

          const snareGain = this.ctx.createGain();
          snareGain.gain.setValueAtTime(0.18 * this.safeVolume, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          snareNoise.connect(filter);
          filter.connect(snareGain);
          snareGain.connect(this.ctx.destination);
          snareNoise.start(now);
        }
      }

      // 3. Hi-Hat on offbeats (2, 6, 10, 14)
      if (step % 2 === 1) {
        const hat = this.createNoiseBuffer(0.035);
        if (hat) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(5000, now);

          const hatGain = this.ctx.createGain();
          hatGain.gain.setValueAtTime(0.09 * this.safeVolume, now);
          hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

          hat.connect(filter);
          filter.connect(hatGain);
          hatGain.connect(this.ctx.destination);
          hat.start(now);
        }
      }

      // 4. Bassline
      if (basslineFreqs[step]) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(basslineFreqs[step], now);

        bassGain.gain.setValueAtTime(0.22 * this.safeVolume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.16);
      }

      this.bgmStep++;
    }, stepDurationMs);
  }

  /**
   * Stop procedural BGM loop
   */
  stopPartyBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public get isPlayingBGM(): boolean {
    return this.isBgmPlaying;
  }

  private createNoiseBuffer(durationSec: number): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * durationSec), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  // ==========================================
  // 3. Backwards Compatibility SFX
  // ==========================================

  playLaser(isCrit: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCrit ? 'sawtooth' : 'sine';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(isCrit ? 880 : 520, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    gain.gain.setValueAtTime(isCrit ? 0.4 * this.safeVolume : 0.2 * this.safeVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playExplosion(heavy: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 120 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    gain.gain.setValueAtTime(heavy ? 0.6 * this.safeVolume : 0.3 * this.safeVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  playGachaReveal(rarity: 'common' | 'rare' | 'epic' | 'legendary') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = {
      common: [261.63, 329.63, 392.0],
      rare: [329.63, 392.0, 523.25, 659.25],
      epic: [392.0, 493.88, 587.33, 783.99, 987.77],
      legendary: [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5],
    }[rarity];

    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = rarity === 'legendary' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.2 * this.safeVolume, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.36);
    });
  }

  playWhistleAlarm() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now + i * 0.25);
      osc.frequency.linearRampToValueAtTime(1000, now + i * 0.25 + 0.12);
      osc.frequency.linearRampToValueAtTime(600, now + i * 0.25 + 0.24);

      gain.gain.setValueAtTime(0.3 * this.safeVolume, now + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.25 + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.25);
    }
  }

  playBossStun() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    gain.gain.setValueAtTime(0.4 * this.safeVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  playTapPunch() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(0.3 * this.safeVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }
}

export const sound = new SoundSynthesizer();
