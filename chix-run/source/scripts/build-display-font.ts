import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Pre-render Anton with room above its ink. KAPLAY 3001's TTF cache draws at
// y=0 with a top baseline, clipping fonts whose ink extends above that origin.
const executablePath = [process.env.BROWSER_EXECUTABLE,
  '/Users/williswee/.cache/puppeteer/chrome/mac_arm-152.0.7977.54/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((path): path is string => Boolean(path && existsSync(path)));
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const page = await browser.newPage();
  await page.goto(process.env.GAME_URL ?? 'http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  const atlas = await page.evaluate(async () => {
    const face = new FontFace('AtlasAnton', await fetch('./fonts/anton.ttf').then((response) => response.arrayBuffer()));
    await face.load(); document.fonts.add(face);
    const size = 192;
    const chars = Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32)).join('') + '’';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.font = `${size}px AtlasAnton`; ctx.textBaseline = 'top';
    const measured = [...chars].map((ch) => ({ ch, metrics: ctx.measureText(ch) }));
    const paddingTop = Math.ceil(Math.max(...measured.map(({ metrics }) => metrics.actualBoundingBoxAscent))) + 2;
    const cellWidth = Math.ceil(Math.max(...measured.map(({ metrics }) => metrics.width))) + 2;
    const cellHeight = Math.ceil(paddingTop + Math.max(...measured.map(({ metrics }) => metrics.actualBoundingBoxDescent))) + 2;
    const columns = 8;
    canvas.width = cellWidth * columns;
    canvas.height = cellHeight * Math.ceil(chars.length / columns);
    ctx.font = `${size}px AtlasAnton`; ctx.textBaseline = 'top'; ctx.fillStyle = '#fff';
    const glyphs: Record<string, { width: number; height: number }> = {};
    measured.forEach(({ ch, metrics }, i) => {
      ctx.fillText(ch, (i % columns) * cellWidth, Math.floor(i / columns) * cellHeight + paddingTop);
      glyphs[ch] = { width: Math.max(Math.ceil(metrics.width), Math.ceil(metrics.actualBoundingBoxRight) + 1),
        height: Math.max(1, Math.ceil(paddingTop + metrics.actualBoundingBoxDescent) + 1) };
    });
    return { png: canvas.toDataURL('image/png'), metadata: { size, cellWidth, cellHeight, columns, chars, paddingTop, glyphs } };
  });
  assert(atlas.png.startsWith('data:image/png;base64,'));
  await writeFile('public/fonts/anton-atlas.png', Buffer.from(atlas.png.split(',')[1]!, 'base64'));
  await writeFile('src/display-font.json', `${JSON.stringify(atlas.metadata, null, 2)}\n`);
  console.log(`Anton atlas generated: ${atlas.metadata.chars.length} proportional glyphs, ${atlas.metadata.paddingTop}px top padding.`);
} finally { await browser.close(); }
