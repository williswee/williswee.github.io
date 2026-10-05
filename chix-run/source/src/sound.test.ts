import { afterEach, describe, expect, test } from 'bun:test';
import { createSound, type SoundKind } from './sound';

const originalContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
const originalWebkit = Object.getOwnPropertyDescriptor(globalThis, 'webkitAudioContext');

function setAudioContext(value: unknown): void {
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, writable: true, value });
  Object.defineProperty(globalThis, 'webkitAudioContext', { configurable: true, writable: true, value: undefined });
}

afterEach(() => {
  if (originalContext) Object.defineProperty(globalThis, 'AudioContext', originalContext);
  else Reflect.deleteProperty(globalThis, 'AudioContext');
  if (originalWebkit) Object.defineProperty(globalThis, 'webkitAudioContext', originalWebkit);
  else Reflect.deleteProperty(globalThis, 'webkitAudioContext');
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
});
