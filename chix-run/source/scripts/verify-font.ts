import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

type FontAtlas = {
  size: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  chars: string;
  glyphs: Record<string, { width: number; height: number }>;
  paddingTop: number;
};

const url = process.env.GAME_URL ?? "http://127.0.0.1:5173";
const metadata = JSON.parse(await readFile(resolve("src/display-font.json"), "utf8")) as FontAtlas;
const candidates = [
  process.env.BROWSER_EXECUTABLE,
  "/Users/williswee/.cache/puppeteer/chrome/mac_arm-152.0.7977.54/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  "/Users/williswee/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((path): path is string => Boolean(path));
if (process.env.BROWSER_EXECUTABLE) {
  assert(existsSync(process.env.BROWSER_EXECUTABLE), "BROWSER_EXECUTABLE does not exist");
}
const executablePath = candidates.find(existsSync);
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

const errors: string[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1129, height: 1344 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url, { waitUntil: "networkidle" });
  const pixels = await page.evaluate(async (atlas: FontAtlas) => {
    const fontResponse = await fetch("./fonts/anton.ttf");
    if (!fontResponse.ok) throw new Error("Could not load the native Anton reference font");
    const face = new FontFace("AntonPixelReference", await fontResponse.arrayBuffer());
    await face.load();
    document.fonts.add(face);
    const image = new Image();
    image.src = "./fonts/anton-atlas.png";
    await image.decode();
    const chars = Array.from(atlas.chars);
    if (image.width !== atlas.cellWidth * atlas.columns
      || image.height !== atlas.cellHeight * Math.ceil(chars.length / atlas.columns)) {
      throw new Error("Atlas image dimensions do not match the metadata");
    }
    const atlasCanvas = document.createElement("canvas");
    atlasCanvas.width = image.width;
    atlasCanvas.height = image.height;
    const atlasContext = atlasCanvas.getContext("2d", { willReadFrequently: true });
    if (!atlasContext) throw new Error("Could not create the atlas canvas");
    atlasContext.drawImage(image, 0, 0);

    function reference(char: string, size: number, paddingTop: number) {
      const guard = size * 2;
      const canvas = document.createElement("canvas");
      canvas.width = size * 6;
      canvas.height = size * 6;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Could not create a glyph reference canvas");
      context.font = `${size}px AntonPixelReference`;
      context.textBaseline = "top";
      context.textAlign = "left";
      context.fillStyle = "white";
      const metrics = context.measureText(char);
      context.fillText(char, guard, guard + paddingTop);
      return { context, guard, metrics, pixels: context.getImageData(0, 0, canvas.width, canvas.height) };
    }

    function compare(
      referencePixels: ImageData,
      guard: number,
      stored: ImageData,
    ) {
      let referenceInkPixels = 0;
      let storedInkPixels = 0;
      let lostPixels = 0;
      let lostTopPixels = 0;
      let lostAlpha = 0;
      let referenceAlpha = 0;
      let storedAlpha = 0;
      let leftInkX: number | null = null;
      let rightInkX: number | null = null;
      let topInkY: number | null = null;
      let bottomInkY: number | null = null;
      for (let i = 3; i < stored.data.length; i += 4) {
        const alpha = stored.data[i]!;
        storedAlpha += alpha;
        if (alpha > 0) storedInkPixels++;
      }
      for (let y = 0; y < referencePixels.height; y++) {
        for (let x = 0; x < referencePixels.width; x++) {
          const alpha = referencePixels.data[(y * referencePixels.width + x) * 4 + 3]!;
          if (alpha === 0) continue;
          const localX = x - guard;
          const localY = y - guard;
          referenceInkPixels++;
          referenceAlpha += alpha;
          leftInkX = leftInkX === null ? localX : Math.min(leftInkX, localX);
          rightInkX = rightInkX === null ? localX : Math.max(rightInkX, localX);
          topInkY = topInkY === null ? localY : Math.min(topInkY, localY);
          bottomInkY = bottomInkY === null ? localY : Math.max(bottomInkY, localY);
          const inside = localX >= 0 && localX < stored.width && localY >= 0 && localY < stored.height;
          const actual = inside ? stored.data[(localY * stored.width + localX) * 4 + 3]! : 0;
          if (actual < alpha) {
            lostPixels++;
            lostAlpha += alpha - actual;
            if (localY < 0) lostTopPixels++;
          }
        }
      }
      return {
        referenceInkPixels, storedInkPixels, referenceAlpha, storedAlpha,
        lostPixels, lostTopPixels, lostAlpha,
        leftInkX, rightInkX, topInkY, bottomInkY,
      };
    }

    const glyphs = chars.map((char, index) => {
      const dimensions = atlas.glyphs[char];
      if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0
        || dimensions.width > atlas.cellWidth || dimensions.height > atlas.cellHeight) {
        throw new Error(`Invalid atlas dimensions for ${JSON.stringify(char)}`);
      }
      const ref = reference(char, atlas.size, atlas.paddingTop);
      const expectedWidth = Math.max(
        Math.ceil(ref.metrics.width),
        Math.ceil(ref.metrics.actualBoundingBoxRight) + 1,
      );
      if (dimensions.width !== expectedWidth) {
        throw new Error(`Atlas width differs from Anton's proportional advance and ink guard for ${JSON.stringify(char)}`);
      }
      const stored = atlasContext.getImageData(
        index % atlas.columns * atlas.cellWidth,
        Math.floor(index / atlas.columns) * atlas.cellHeight,
        dimensions.width,
        dimensions.height,
      );
      return { char, ...dimensions, ...compare(ref.pixels, ref.guard, stored) };
    });

    // Reproduce KAPLAY 3001's original TTF cache: top baseline at (0, 0),
    // then crop to ceil(advance) × (ceil(abs(ascent)) + ceil(abs(descent))).
    const oldEngine = Array.from("098").map((char) => {
      const ref = reference(char, 64, 0);
      const width = Math.ceil(ref.metrics.width);
      const height = Math.ceil(Math.abs(ref.metrics.actualBoundingBoxAscent))
        + Math.ceil(Math.abs(ref.metrics.actualBoundingBoxDescent));
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Could not create the old-engine canvas");
      context.font = "64px AntonPixelReference";
      context.textBaseline = "top";
      context.textAlign = "left";
      context.fillStyle = "white";
      context.fillText(char, 0, 0);
      return {
        char, width, height,
        ascent: ref.metrics.actualBoundingBoxAscent,
        descent: ref.metrics.actualBoundingBoxDescent,
        ...compare(ref.pixels, ref.guard, context.getImageData(0, 0, width, height)),
      };
    });
    return {
      atlas: { size: atlas.size, paddingTop: atlas.paddingTop, characters: chars.length },
      glyphs,
      oldEngine,
      totalLostPixels: glyphs.reduce((sum, glyph) => sum + glyph.lostPixels, 0),
      totalLostAlpha: glyphs.reduce((sum, glyph) => sum + glyph.lostAlpha, 0),
    };
  }, metadata);
  const output = resolve("artifacts/text-fix/glyph-pixels.json");
  await mkdir(resolve("artifacts/text-fix"), { recursive: true });
  await writeFile(output, `${JSON.stringify({ url, ...pixels, errors }, null, 2)}\n`);
  assert.deepEqual(errors, [], "The browser must not log runtime errors");
  for (const old of pixels.oldEngine) {
    assert(old.lostTopPixels > 0, `The old TTF cache must reproduce clipped tops for ${old.char}`);
  }
  assert.equal(pixels.totalLostPixels, 0, "Every bitmap glyph must retain all native Anton ink pixels");
  assert.equal(pixels.totalLostAlpha, 0, "Every bitmap glyph must retain all native Anton alpha coverage");
  console.log(`Verified ${pixels.glyphs.length} glyphs with zero lost pixels; old cache clipping reproduced for 0, 9, and 8. Proof: ${output}`);
} finally {
  await browser.close();
}
