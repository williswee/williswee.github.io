import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {copyFile, mkdir, readFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';

const id = process.argv[2];
if (!id) throw new Error('Usage: node render.mjs <composition> [output.mp4]');
const output = resolve(process.argv[3] ?? 'out/' + id + '.mp4');
await mkdir(dirname(output), {recursive: true});

const isGifgptReel = id === 'GifgptReel';
if (isGifgptReel) {
  const shots = JSON.parse(await readFile('src/gifgpt-shots.json', 'utf8'));
  await mkdir('public/gifgpt', {recursive: true});
  await Promise.all(shots.map(({id}) =>
    copyFile(`../../gifgpt/media/${id}.mp4`, `public/gifgpt/${id}.mp4`),
  ));
}

const serveUrl = await bundle({
  entryPoint: resolve(isGifgptReel ? 'src/gifgpt-reel.tsx' : 'src/index.tsx'),
  publicDir: resolve('public'),
  outDir: resolve('.bundle'),
});
const browser = await openBrowser('chrome', {
  browserExecutable: process.env.REMOTION_BROWSER ?? null,
});

try {
  const composition = await selectComposition({
    serveUrl,
    id,
    puppeteerInstance: browser,
  });
  await renderMedia({
    serveUrl,
    composition,
    puppeteerInstance: browser,
    outputLocation: output,
    codec: 'h264',
    audioCodec: 'aac',
    crf: 18,
    x264Preset: 'veryfast',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    concurrency: 1,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    disableSharedMemoryCapture: true,
  });
  console.log(output);
} finally {
  await browser.close({silent: true});
}
