import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import type { Arcade } from '../src/arcade';
import type { Phase } from '../src/flow';

type Item = { kind: 'coin' | 'hazard' | 'magnet'; x: number; y: number; width: number; hazardType?: 'drone' | 'gate' };
type Snapshot = {
  phase: Phase; player: { x: number; y: number } | null; items: Item[];
  arcade: Arcade; elapsed: number; coins: number; hits: number; dashes: number; smashes: number; magnets: number;
};
type DemoWindow = Window & {
  __chixRun: { snapshot: () => Snapshot };
  __demoAudio: { tap: MediaStreamAudioDestinationNode | null; context: AudioContext | null };
  __demoCapture: { recorder: MediaRecorder; chunks: Blob[]; startedAt: number; mimeType: string; audioChannels: number; sampleRate: number };
};

const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173/';
const out = resolve('artifacts/demo');
const executablePath = [
  process.env.BROWSER_EXECUTABLE,
  '/Users/williswee/.cache/puppeteer/chrome/mac_arm-152.0.7977.54/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((path): path is string => Boolean(path && existsSync(path)));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 916, height: 1344 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const events: { kind: string; at: number; elapsed: number; score: number; count?: number }[] = [];
const report: Record<string, unknown> = { url, input: 'Real keyboard input. Game state and spawns are never set. Native WebAudio is recorded after the game compressor; canvas is recorded directly.', events };
let held: 'ArrowLeft' | 'ArrowRight' | null = null;

try {
  // Recording-only tee: preserve the real speaker output, and capture that same mix.
  await page.addInitScript(() => {
    const audio = { tap: null as MediaStreamAudioDestinationNode | null, context: null as AudioContext | null };
    Object.defineProperty(window, '__demoAudio', { value: audio });
    const nativeConnect = AudioNode.prototype.connect;
    const tapped = new WeakSet<AudioNode>();
    AudioNode.prototype.connect = function (this: AudioNode, ...args: unknown[]) {
      const result = Reflect.apply(nativeConnect, this, args);
      if (this.context instanceof AudioContext && args[0] === this.context.destination && !tapped.has(this)) {
        if (audio.context !== this.context) {
          audio.context = this.context;
          audio.tap = this.context.createMediaStreamDestination();
        }
        Reflect.apply(nativeConnect, this, [audio.tap]);
        tapped.add(this);
      }
      return result;
    } as typeof AudioNode.prototype.connect;
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean((window as unknown as DemoWindow).__chixRun));
  await page.locator('#game').focus();
  assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as unknown as DemoWindow).__demoAudio.context?.state === 'running');
  report.recording = await page.evaluate(() => {
    const w = window as unknown as DemoWindow;
    const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
    const audio = w.__demoAudio;
    if (!audio.tap || !audio.context) throw new Error('Live game audio was not unlocked');
    const stream = canvas.captureStream(60);
    for (const track of audio.tap.stream.getAudioTracks()) stream.addTrack(track);
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error('The local browser cannot record video with audio');
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 192_000 });
    const capture = { recorder, chunks: [] as Blob[], startedAt: performance.now(), mimeType, audioChannels: audio.tap.channelCount, sampleRate: audio.context.sampleRate };
    Object.defineProperty(window, '__demoCapture', { value: capture });
    recorder.ondataavailable = event => { if (event.data.size) capture.chunks.push(event.data); };
    recorder.start(1_000);
    return { mimeType, width: canvas.width, height: canvas.height, videoTracks: stream.getVideoTracks().length, audioTracks: stream.getAudioTracks().length, sampleRate: capture.sampleRate };
  });

  async function read() {
    return page.evaluate(() => {
      const w = window as unknown as DemoWindow;
      return { ...w.__chixRun.snapshot(), at: (performance.now() - w.__demoCapture.startedAt) / 1000 };
    });
  }
  async function steer(next: typeof held) {
    if (held === next) return;
    if (held) await page.keyboard.up(held);
    if (next) await page.keyboard.down(next);
    held = next;
  }
  const aim = (item: Item, x: number) => item.hazardType === 'gate'
    ? Math.max(item.x - item.width / 2 + 24, Math.min(item.x + item.width / 2 - 24, x)) : item.x;
  let previous = await read();
  let shieldWasActive = false;
  let demonstratedPowerDash = false;
  let dashSmashes = 0;
  let beforeDashSmashes = 0;
  while (previous.at < 25) {
    assert.deepEqual(errors, [], 'Capture must not contain browser errors');
    assert.equal(previous.phase.kind, 'playing', 'The demo must remain in a live run');
    assert(previous.player);
    const shield = previous.arcade.frenzyRemaining > 0;
    if (shield && !shieldWasActive) events.push({ kind: 'shield', at: previous.at, elapsed: previous.elapsed, score: previous.coins });
    shieldWasActive = shield;
    const ready = previous.arcade.dash.kind === 'ready';
    const dashing = previous.arcade.dash.kind === 'dashing';
    const hazards = previous.items.filter(item => item.kind === 'hazard' && item.y > 300 && item.y < 575).sort((a, b) => b.y - a.y);
    const magnet = previous.items.filter(item => item.kind === 'magnet' && item.y < 600).sort((a, b) => b.y - a.y)[0];
    const coins = previous.items.filter(item => item.kind === 'coin' && item.y < 605)
      .filter(item => Math.abs(item.x - previous.player!.x) / 380 < Math.max(0, 580 - item.y) / 300 + 0.14)
      .sort((a, b) => b.y - a.y);
    const target = hazards.find(item => {
      const time = Math.max(0, 520 - item.y) / (item.hazardType === 'gate' ? 250 : 265);
      return Math.abs(aim(item, previous.player!.x) - previous.player!.x) / 380 < time + 0.06;
    });
    let goal = magnet && magnet.y > 330 ? magnet.x : coins[0]?.x ?? previous.player.x;

    if (shield && target) goal = aim(target, previous.player.x);
    else if (ready && target) goal = aim(target, previous.player.x);
    else if (!shield && hazards.length) {
      const candidates = [goal, previous.player.x, 60, 100, 160, 240, 320, 380, 420];
      const safe = candidates.filter(x => hazards.every(item => Math.abs(x - item.x) > item.width / 2 + 28));
      if (safe.length) goal = safe.sort((a, b) => Math.abs(a - previous.player!.x) - Math.abs(b - previous.player!.x))[0]!;
    }

    if (dashing && previous.smashes <= beforeDashSmashes) goal = previous.player.x;
    const difference = goal - previous.player.x;
    const collisionSoon = target && target.y >= 510 && Math.abs(aim(target, previous.player.x) - previous.player.x) < 15;
    if (ready && ((!demonstratedPowerDash && shield) || collisionSoon)) {
      await steer(null);
      beforeDashSmashes = previous.smashes;
      await page.keyboard.press('Shift');
      if (shield) demonstratedPowerDash = true;
    } else {
      await steer(difference < -12 ? 'ArrowLeft' : difference > 12 ? 'ArrowRight' : null);
    }
    await page.waitForTimeout(25);
    const next = await read();
    for (const [property, kind] of [['coins', 'coin'], ['dashes', 'dash'], ['smashes', 'smash'], ['magnets', 'magnet'], ['hits', 'hit']] as const) {
      if (next[property] > previous[property]) events.push({ kind, at: next.at, elapsed: next.elapsed, score: next.coins, count: next[property] - previous[property] });
    }
    if (next.smashes > previous.smashes && (dashing || next.arcade.dash.kind === 'dashing')) dashSmashes += next.smashes - previous.smashes;
    previous = next;
  }
  await steer(null);
  report.last = previous;
  report.dashSmashes = dashSmashes;
  assert(previous.coins >= 20 && previous.smashes >= 2 && previous.dashes >= 2, 'Demo needs coins, obstacle smashes and real dashes');
  assert(events.some(event => event.kind === 'shield') && events.some(event => event.kind === 'magnet'), 'Demo needs shield and magnet moments');
  const encoded = await page.evaluate(async () => {
    const capture = (window as unknown as DemoWindow).__demoCapture;
    await new Promise<void>((resolve, reject) => {
      capture.recorder.onstop = () => resolve();
      capture.recorder.onerror = () => reject(new Error('MediaRecorder failed'));
      capture.recorder.stop();
    });
    const bytes = new Uint8Array(await new Blob(capture.chunks, { type: capture.mimeType }).arrayBuffer());
    const parts: string[] = [];
    for (let offset = 0; offset < bytes.length; offset += 32_768) parts.push(String.fromCharCode(...bytes.subarray(offset, offset + 32_768)));
    return btoa(parts.join(''));
  });
  await writeFile(resolve(out, 'source.webm'), Buffer.from(encoded, 'base64'));
  const firstShield = events.find(event => event.kind === 'shield')!;
  report.suggestedStart = Math.max(0, firstShield.at - 0.55);
  report.browserErrors = errors;
  report.result = 'captured';
  await writeFile(resolve(out, 'capture.json'), JSON.stringify(report, null, 2) + '\n');
  await page.locator('#game').screenshot({ path: resolve(out, 'last-frame.png') });
  console.log(JSON.stringify({ result: report.result, start: report.suggestedStart, duration: previous.at, coins: previous.coins, smashes: previous.smashes, dashes: previous.dashes, hits: previous.hits, dashSmashes }));
} finally {
  if (held) await page.keyboard.up(held).catch(() => undefined);
  await context.close();
  await browser.close();
}
