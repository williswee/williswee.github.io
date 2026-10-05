import { afterEach, describe, expect, test } from 'bun:test';
import { createSound, type SoundKind } from './sound';

const originalContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
const originalWebkit = Object.getOwnPropertyDescriptor(globalThis, 'webkitAudioContext');
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalNow = Date.now;

function setAudioContext(value: unknown): void {
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, writable: true, value });
  Object.defineProperty(globalThis, 'webkitAudioContext', { configurable: true, writable: true, value: undefined });
}

afterEach(() => {
  if (originalContext) Object.defineProperty(globalThis, 'AudioContext', originalContext);
  else Reflect.deleteProperty(globalThis, 'AudioContext');
  if (originalWebkit) Object.defineProperty(globalThis, 'webkitAudioContext', originalWebkit);
  else Reflect.deleteProperty(globalThis, 'webkitAudioContext');
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else Reflect.deleteProperty(globalThis, 'navigator');
  Date.now = originalNow;
});

const param = () => ({
  value: 0,
  setValueAtTime() {}, exponentialRampToValueAtTime() {},
  cancelScheduledValues() {}, setTargetAtTime() {},
});
const node = () => ({ connect() {}, disconnect() {} });

class ContextStub {
  static latest: ContextStub | undefined;
  static constructed = 0;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  sampleRate = 48000;
  destination = node();
  voices = 0;
  resumeCalls = 0;
  finishResume: () => void = () => {};
  failResume: () => void = () => {};
  onstatechange: (() => void) | null = null;

  constructor() { ContextStub.latest = this; ContextStub.constructed++; }
  createGain() { return { ...node(), gain: param() }; }
  createDynamicsCompressor() {
    return { ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() };
  }
  createBuffer() { return { getChannelData: () => new Float32Array(16) }; }
  createOscillator() {
    return { ...node(), type: 'sine', frequency: param(), onended: null, start: () => { this.voices++; }, stop() {} };
  }
  resume() {
    this.resumeCalls++;
    return new Promise<void>((resolve, reject) => {
      this.finishResume = () => { this.state = 'running'; resolve(); };
      this.failResume = () => reject(new Error('Audio unavailable'));
    });
  }
}

describe('local game sounds', () => {
  test('stays usable when WebAudio is unavailable or its constructor fails', () => {
    const kinds: SoundKind[] = ['start', 'coin', 'dash', 'hit', 'power', 'over', 'near'];
    setAudioContext(undefined);
    const sound = createSound();
    expect(sound.isMuted()).toBe(false);
    expect(() => sound.unlock()).not.toThrow();
    for (const kind of kinds) expect(() => sound.play(kind)).not.toThrow();
    expect(sound.toggle()).toBe(true);
    expect(sound.toggle()).toBe(false);
    setAudioContext(class { constructor() { throw new Error('Blocked'); } });
    expect(() => sound.unlock()).not.toThrow();
  });

  test('creates audio only on unlock and handles asynchronous resume and mute', async () => {
    ContextStub.constructed = 0;
    setAudioContext(ContextStub);
    const sound = createSound();
    sound.play('coin');
    sound.toggle();
    sound.toggle();
    expect(ContextStub.constructed).toBe(0);

    sound.unlock();
    const context = ContextStub.latest!;
    expect(ContextStub.constructed).toBe(1);
    expect(context.resumeCalls).toBe(1);
    sound.play('start');
    expect(context.voices).toBe(0);
    context.finishResume();
    await Promise.resolve();
    expect(context.voices).toBeGreaterThan(0);

    sound.toggle();
    const previousVoices = context.voices;
    sound.play('coin');
    expect(context.voices).toBe(previousVoices);
    sound.toggle();
    sound.play('coin');
    expect(context.voices).toBeGreaterThan(previousVoices);
    context.state = 'suspended';
    const beforeSuspending = context.voices;
    sound.play('coin');
    expect(context.voices).toBe(beforeSuspending);
  });

  test('drops sounds when resume fails instead of replaying them on a later gesture', async () => {
    setAudioContext(ContextStub);
    const sound = createSound();
    sound.unlock();
    const context = ContextStub.latest!;
    sound.play('over');
    context.failResume();
    await Promise.resolve();
    await Promise.resolve();
    sound.unlock();
    context.finishResume();
    await Promise.resolve();
    expect(context.voices).toBe(0);
  });

  test('a later activation retries a pending resume without waiting for the first promise', async () => {
    setAudioContext(ContextStub);
    const sound = createSound();
    sound.unlock();
    const context = ContextStub.latest!;
    const failFirstGesture = context.failResume;
    sound.unlock();
    expect(context.resumeCalls).toBe(2);
    sound.play('dash');
    failFirstGesture();
    await Promise.resolve();
    await Promise.resolve();
    context.finishResume();
    await Promise.resolve();
    expect(context.voices).toBe(1);
  });

  test('an interrupted context recovers on a new gesture without recreating or automatically resuming it', async () => {
    ContextStub.constructed = 0;
    setAudioContext(ContextStub);
    const sound = createSound();
    sound.unlock();
    const context = ContextStub.latest!;
    context.finishResume();
    await Promise.resolve();
    context.state = 'interrupted';
    context.onstatechange?.();
    sound.play('coin');
    expect(context.resumeCalls).toBe(1);
    expect(context.voices).toBe(0);
    sound.unlock();
    sound.play('near');
    context.state = 'running';
    context.onstatechange?.();
    expect(context.voices).toBe(1);
    expect(context.resumeCalls).toBe(2);
    expect(ContextStub.constructed).toBe(1);
    context.finishResume();
    await Promise.resolve();
    expect(context.voices).toBe(1);
  });

  test('keeps a held start tap briefly but discards stale gameplay effects on resume', async () => {
    setAudioContext(ContextStub);
    let now = 0;
    Date.now = () => now;
    const sound = createSound();
    sound.unlock();
    sound.play('start');
    sound.play('coin');
    now = 600;
    ContextStub.latest!.finishResume();
    await Promise.resolve();
    expect(ContextStub.latest!.voices).toBe(4);
  });

  test('requests the optional playback route only on an unmuted user unlock', () => {
    setAudioContext(ContextStub);
    const audioSession = { type: 'ambient' };
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { audioSession } });
    const sound = createSound();
    sound.toggle();
    sound.unlock();
    expect(audioSession.type).toBe('ambient');
    sound.toggle();
    expect(audioSession.type).toBe('ambient');
    sound.unlock();
    expect(audioSession.type).toBe('playback');
  });

  test('still starts WebAudio when the optional playback route rejects configuration', async () => {
    setAudioContext(ContextStub);
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { audioSession: { get type() { return 'ambient'; }, set type(_value: string) { throw new Error('Unsupported'); } } },
    });
    const sound = createSound();
    sound.unlock();
    sound.play('near');
    ContextStub.latest!.finishResume();
    await Promise.resolve();
    expect(ContextStub.latest!.voices).toBe(1);
  });
});
