// YOUR DAY IS DYING - Procedural Web Audio Sound Engine
// Zero external network dependencies, 100% reliable local synthesis

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private profile: 'cinematic' | 'brutal' | 'minimal' = 'cinematic';

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setProfile(profile: 'cinematic' | 'brutal' | 'minimal') {
    this.profile = profile;
  }

  // 1. NORMAL: Mechanical Clock Tick
  public playNormalTick() {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(this.profile === 'brutal' ? 1400 : 900, now);
    filter.Q.setValueAtTime(4.0, now);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 2. DISTRACTION: Low Subtle Bass Hit
  public playDistractionHit() {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(48, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

    gain.gain.setValueAtTime(0.85 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.65);
    subOsc.stop(now + 0.65);
  }

  // 3. FOCUS: Clean Soft Click
  public playFocusClick() {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.035);

    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 4. WARNING: Heartbeat / Clock Pulse
  public playWarningPulse() {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First thump
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(68, now);
    osc1.frequency.exponentialRampToValueAtTime(32, now + 0.16);

    gain1.gain.setValueAtTime(0.7 * this.volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second thump (120ms later)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const t2 = now + 0.13;
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(56, t2);
    osc2.frequency.exponentialRampToValueAtTime(28, t2 + 0.2);

    gain2.gain.setValueAtTime(0.6 * this.volume, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.25);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.28);
  }

  // 5. HOUR: Single Cinematic Clock Strike
  public playHourStrike() {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [196, 392, 587, 880]; // G3 chord harmonics
    const decay = this.profile === 'minimal' ? 1.0 : 2.5;

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);

      const amp = (0.5 / (idx + 1)) * this.volume;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }

  // 6. END OF DAY: Long Atmospheric Tone
  public playEndOfDay() {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [65.4, 98.0, 130.8, 196.0]; // Low C/G atmospheric drone

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 3.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.5);
    });
  }

  public playByType(type: string) {
    switch (type) {
      case 'distraction':
        this.playDistractionHit();
        break;
      case 'focus':
        this.playFocusClick();
        break;
      case 'warning':
        this.playWarningPulse();
        break;
      case 'hour':
        this.playHourStrike();
        break;
      case 'end_of_day':
        this.playEndOfDay();
        break;
      case 'normal':
      default:
        this.playNormalTick();
        break;
    }
  }
}

export const soundEngine = new SoundEngine();
