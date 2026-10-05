export type SoundKind = 'start' | 'coin' | 'dash' | 'hit' | 'power' | 'over' | 'near';

export interface GameSound {
  unlock(): void;
  /** Returns the new muted state. Toggling never creates an audio context. */
  toggle(): boolean;
  isMuted(): boolean;
  /** Pitch is a frequency multiplier; 1 is the original pitch. */
  play(kind: SoundKind, pitch?: number): void;
}

type AudioGlobals = typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

class SynthSound implements GameSound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private resuming = false;
  private pending: { kind: SoundKind; pitch: number; at: number }[] = [];

  unlock(): void {
    try {
      if (!this.context || this.context.state === 'closed') {
        const audioGlobals = globalThis as AudioGlobals;
        const Context = audioGlobals.AudioContext ?? audioGlobals.webkitAudioContext;
        if (!Context) return;
        const context = new Context();
        const master = context.createGain();
        const compressor = context.createDynamicsCompressor();
        master.gain.value = this.muted ? 0 : 0.06;
        compressor.threshold.value = -18;
        compressor.knee.value = 20;
        compressor.ratio.value = 3;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.12;
        master.connect(compressor);
        compressor.connect(context.destination);
        const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.18), context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        this.context = context;
        this.master = master;
        this.noise = noise;
        this.resuming = false;
        this.pending = [];
      }
      const context = this.context;
      if (context.state === 'running') {
        this.flushPending();
        return;
      }
      if (this.resuming) return;
      this.resuming = true;
      // Called only by unlock(), which the game invokes from a user gesture.
      // Queue that gesture's sound briefly while Safari finishes resuming audio.
      void context.resume().then(() => {
        if (this.context !== context) return;
        this.resuming = false;
        this.flushPending();
      }).catch(() => {
        if (this.context !== context) return;
        this.resuming = false;
        this.pending = [];
      });
    } catch {
      // Missing or blocked WebAudio must never interrupt the game.
      this.resuming = false;
      this.pending = [];
    }
  }

  toggle(): boolean {
    this.muted = !this.muted;
    if (this.muted) this.pending = [];
    try {
      if (this.context && this.master && this.context.state !== 'closed') {
        this.master.gain.cancelScheduledValues(this.context.currentTime);
        this.master.gain.setTargetAtTime(this.muted ? 0 : 0.06, this.context.currentTime, 0.012);
      }
    } catch {
      // A device may disappear or the browser may close its context.
    }
    return this.muted;
  }

  isMuted(): boolean { return this.muted; }

  play(kind: SoundKind, pitch = 1): void {
    if (this.muted || !this.context || !this.master) return;
    const tuning = Number.isFinite(pitch) ? Math.min(2, Math.max(0.5, pitch)) : 1;
    if (this.context.state !== 'running') {
      if (this.resuming && this.pending.length < 6) this.pending.push({ kind, pitch: tuning, at: Date.now() });
      return;
    }
    try {
      const now = this.context.currentTime + 0.005;
      const note = (frequency: number, offset: number, length = 0.1, volume = 0.7, type: OscillatorType = 'triangle', end = frequency) => {
        this.tone(frequency * tuning, end * tuning, now + offset, length, volume, type);
      };
      switch (kind) {
        case 'start':
          [262, 330, 392, 523].forEach((frequency, i) => note(frequency, i * 0.055, 0.13, 0.65));
          return;
        case 'coin':
          note(880, 0, 0.075, 0.75, 'sine');
          note(1320, 0.045, 0.13, 0.65, 'sine');
          return;
        case 'dash':
          note(760, 0, 0.16, 0.65, 'triangle', 130);
          return;
        case 'hit':
          note(145, 0, 0.18, 0.95, 'triangle', 48);
          this.noiseBurst(now, 0.12);
          return;
        case 'power':
          [262, 392, 523, 784, 1047].forEach((frequency, i) => note(frequency, i * 0.055, 0.17, 0.65));
          return;
        case 'over':
          [392, 330, 262, 196].forEach((frequency, i) => note(frequency, i * 0.14, 0.22, 0.6, 'sine'));
          return;
        case 'near':
          note(440, 0, 0.065, 0.4, 'sine', 660);
          return;
        default: {
          const unreachable: never = kind;
          void unreachable;
        }
      }
    } catch {
      // Audio errors are contained even during browser/device state changes.
    }
  }

  private flushPending(): void {
    const pending = this.pending;
    this.pending = [];
    if (this.context?.state !== 'running') return;
    for (const sound of pending) {
      if (Date.now() - sound.at < 350) this.play(sound.kind, sound.pitch);
    }
  }

  private tone(start: number, end: number, at: number, length: number, volume: number, type: OscillatorType): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(start, at);
    oscillator.frequency.exponentialRampToValueAtTime(end, at + length);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(at);
    oscillator.stop(at + length + 0.01);
  }

  private noiseBurst(at: number, length: number): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || !this.noise) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = this.noise;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, at);
    filter.frequency.exponentialRampToValueAtTime(250, at + length);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.65, at + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(at);
    source.stop(at + length + 0.01);
  }
}

/** Local oscillator/noise synthesis, with no downloaded audio or external service. */
export function createSound(): GameSound { return new SynthSound(); }
