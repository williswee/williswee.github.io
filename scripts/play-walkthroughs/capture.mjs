import {chromium} from 'playwright-core';
import {mkdir, rename, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {resolve} from 'node:path';

const CAPTURE_SECONDS = 26;
const SOURCE_FPS = 30;
const VIEWPORT = {width: 540, height: 960};
const app = process.argv[2];
if (!['gifgpt', 'mobbin'].includes(app)) {
  throw new Error('Usage: node capture.mjs <gifgpt|mobbin>');
}

const directory = resolve('captures', app);
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
await mkdir(directory, {recursive: true});
await mkdir('public', {recursive: true});
const origin = process.env.PLAY_CAPTURE_ORIGIN
  ?? (app === 'gifgpt' ? 'https://williswee.com' : 'http://127.0.0.1:4173');
const opening = app === 'gifgpt'
  ? 'feed/dance-corgi-horse'
  : 'duolingo/2026-10/welcome';
const executablePath = process.env.REMOTION_BROWSER;
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? {executablePath} : {channel: 'chrome'}),
  args: ['--autoplay-policy=no-user-gesture-required'],
});

async function walkMobbin(page, at) {
  const year = page.locator('#year-picker');
  const date = (name) => page.locator('#timeline-stops button').filter({hasText: name});
  const hotspot = (name) => page.locator('#hotspots button[aria-label="' + name + '"]');
  await at(2.1, year, 'Choose a year');
  await at(3.2, date('May 2018'), 'Travel to May 2018');
  await at(6.3, hotspot('Get Started'), 'Get Started in 2018');
  await at(8.5, hotspot('German'), 'Choose German');
  await at(10.4, hotspot('Set Goal'), 'Set a daily goal');
  await at(12.5, year, 'Choose another year');
  await at(13.6, date('Oct 2026'), 'Return to October 2026');
  await at(15.4, hotspot('Get Started'), 'Meet modern Duo');
  await at(17.3, page.locator('#app-picker'), 'Choose another app');
  await at(18.6, page.locator('#app-list button').filter({hasText: 'Netflix'}), 'Explore Netflix');
  await at(21, hotspot('Join free for a month'), 'View captured Netflix onboarding');
  await at(23.1, hotspot('See the plans'), 'Compare captured Netflix plans');
}

async function walkGifgpt(page, at, waitUntil, click) {
  const link = (name) => page.getByRole('link', {name, exact: true});
  const button = (name) => page.getByRole('button', {name, exact: true});
  const frog = page.locator('button.grid-open[data-gif="dance-frog-disco"]');
  await at(3.5, link('Explore'), 'Explore GIFs');
  await at(5, button('Dance'), 'Browse dancing reactions');
  await at(7.3, frog, 'Open the disco frog');
  await at(11.1, button('Save One more song.'), 'Save the reaction');
  await at(13.6, link('Saved'), 'Open saved GIFs');
  await at(15.5, frog, 'Reopen the saved reaction');
  await at(19.5, button('Share One more song.'), 'Share the reaction');
  await waitUntil(21.4);
  const shareError = page.getByText('Couldn’t prepare the GIF. You can share its link.', {exact: true});
  if (await shareError.isVisible()) throw new Error('The GIF share preview did not load');
  await click(button('Copy link'), 'Copy the GIF link');
  await page.getByText('Link copied.', {exact: true}).waitFor({state: 'visible', timeout: 1500});
  await waitUntil(23.4);
  const close = button('Close dialog');
  if (await close.isVisible()) await click(close, 'Return to the animation');
}

async function encodeCapture(frames) {
  const entries = frames.map(({file, t}, index) => {
    const end = frames[index + 1]?.t ?? CAPTURE_SECONDS;
    const duration = Math.max(0.001, end - t).toFixed(6);
    return "file '" + file + "'\nduration " + duration;
  });
  entries.push("file '" + frames.at(-1).file + "'");
  const concat = resolve(directory, 'frames.ffconcat');
  await writeFile(concat, ['ffconcat version 1.0', ...entries, ''].join('\n'));
  const encoded = resolve(directory, 'raw.mp4');
  const args = [
    '-y', '-f', 'concat', '-i', concat,
    '-vf', 'fps=' + SOURCE_FPS + ',scale=' + VIEWPORT.width + ':' + VIEWPORT.height,
    '-t', String(CAPTURE_SECONDS), '-an', '-c:v', 'libx264', '-crf', '16',
    '-preset', 'fast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', encoded,
  ];
  await new Promise((done, fail) => {
    const child = spawn(ffmpeg, args, {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', fail);
    child.on('close', (code) => code === 0 ? done() : fail(new Error(stderr)));
  });
  await rename(encoded, resolve('public', app + '-raw.mp4'));
}

try {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    permissions: app === 'gifgpt' ? ['clipboard-read', 'clipboard-write'] : [],
  });
  const page = await context.newPage();
  const errors = [];
  const events = [];
  const frames = [];
  const writes = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(new URL('/' + app + '/#' + opening, origin).href, {waitUntil: 'networkidle'});
  if (app === 'mobbin') await page.locator('#capture').waitFor({state: 'visible'});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const session = await context.newCDPSession(page);
  const start = performance.now();
  let firstTimestamp;
  session.on('Page.screencastFrame', ({metadata, data, sessionId}) => {
    firstTimestamp ??= metadata.timestamp;
    const file = String(frames.length).padStart(5, '0') + '.jpg';
    frames.push({file, t: metadata.timestamp - firstTimestamp});
    writes.push(writeFile(resolve(directory, file), Buffer.from(data, 'base64')));
    session.send('Page.screencastFrameAck', {sessionId}).catch(() => {});
  });
  await session.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 96,
    maxWidth: VIEWPORT.width,
    maxHeight: VIEWPORT.height,
    everyNthFrame: 1,
  });

  async function waitUntil(seconds) {
    const remaining = seconds * 1000 - (performance.now() - start);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  }

  async function click(target, label) {
    await target.waitFor({state: 'visible', timeout: 5000});
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error('Missing ' + label);
    events.push({
      t: (performance.now() - start) / 1000,
      label,
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    });
    await target.click();
  }

  async function at(seconds, target, label) {
    await waitUntil(seconds);
    await click(target, label);
  }

  if (app === 'mobbin') await walkMobbin(page, at);
  else await walkGifgpt(page, at, waitUntil, click);
  await waitUntil(CAPTURE_SECONDS);
  await session.send('Page.stopScreencast');
  await Promise.all(writes);
  if (frames.length === 0) throw new Error('Chrome did not capture any frames');
  await encodeCapture(frames);

  const receipt = {
    app,
    sourceDuration: CAPTURE_SECONDS,
    sourceFps: SOURCE_FPS,
    outputPlaybackRate: 1.3,
    viewport: VIEWPORT,
    events,
    frames,
    errors,
    finalUrl: page.url(),
  };
  await writeFile(resolve(directory, 'capture.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({app, frames: frames.length, events: events.length, errors, finalUrl: receipt.finalUrl}));
} finally {
  await browser.close();
}
