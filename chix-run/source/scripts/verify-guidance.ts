import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";
import type { Arcade } from "../src/arcade";
import type { Phase } from "../src/flow";

type Lesson = "move" | "dash";
type Snapshot = {
  phase: Phase;
  player: { x: number; y: number } | null;
  elapsed: number;
  dashes: number;
  arcade: Arcade;
  guidance: { inputMode: "keyboard" | "pointer"; active: Lesson | null; learned: Lesson[] };
};
type ChixRunWindow = Window & { __chixRun?: { snapshot: () => Snapshot } };
type CanvasDimensions = { left: number; top: number; width: number; height: number };

const url = process.env.GAME_URL ?? "http://127.0.0.1:5173";
const localUrl = new URL(url);
const artifacts = resolve("artifacts/chix-run-learn");
const browserCandidates = [
  process.env.BROWSER_EXECUTABLE,
  "/Users/williswee/.cache/puppeteer/chrome/mac_arm-152.0.7977.54/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  "/Users/williswee/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((path): path is string => Boolean(path));
if (process.env.BROWSER_EXECUTABLE) assert(existsSync(process.env.BROWSER_EXECUTABLE), "BROWSER_EXECUTABLE does not exist");
const executablePath = browserCandidates.find((path) => existsSync(path));
const errors: string[] = [];
const remoteRequests = new Set<string>();
const requests = new Set<string>();
const captures: string[] = [];
const report: Record<string, unknown> = {
  url,
  browserExecutable: executablePath ?? "Playwright default",
  input: "Real keyboard and touchscreen input. The dev snapshot and lesson storage are read-only; no game state, spawns, styles, or timers are injected.",
  captures,
};

await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ["--enable-unsafe-swiftshader"],
});

function observe(page: Page, name: string): void {
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${name}: ${message.text()}`);
  });
  page.on("request", (request) => {
    const requestUrl = request.url();
    requests.add(requestUrl);
    const parsed = new URL(requestUrl);
    if (["http:", "https:", "ws:", "wss:"].includes(parsed.protocol)
      && (parsed.hostname !== localUrl.hostname || parsed.port !== localUrl.port)) remoteRequests.add(requestUrl);
  });
}

async function readSnapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const hook = (window as ChixRunWindow).__chixRun;
    if (!hook) throw new Error("The Chix Run read-only dev snapshot is unavailable");
    return hook.snapshot();
  });
}

async function waitForElapsed(page: Page, seconds: number): Promise<Snapshot> {
  await page.waitForFunction((target) => {
    const snapshot = (window as ChixRunWindow).__chixRun?.snapshot();
    return snapshot?.phase.kind === "playing" && snapshot.elapsed >= target;
  }, seconds, { polling: 30, timeout: 20_000 });
  const snapshot = await readSnapshot(page);
  assert.equal(snapshot.phase.kind, "playing", "The guidance capture requires an active run");
  return snapshot;
}

async function openGame(page: Page, reload = false): Promise<Snapshot> {
  if (reload) await page.reload({ waitUntil: "networkidle" });
  else await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean((window as ChixRunWindow).__chixRun));
  await page.evaluate(() => document.fonts.ready);
  const snapshot = await readSnapshot(page);
  assert.equal(snapshot.phase.kind, "menu", "Opening the game must show its menu");
  assert.equal(snapshot.guidance.active, null, "Non-playing scenes must not show a gameplay lesson");
  return snapshot;
}

async function capture(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: resolve(artifacts, `${name}.png`) });
  captures.push(`${name}.png`);
}

async function canvasDimensions(page: Page): Promise<CanvasDimensions> {
  const dimensions = await page.locator("#game").evaluate((canvas: HTMLCanvasElement) => {
    const box = canvas.getBoundingClientRect();
    return { left: box.left, top: box.top, width: box.width, height: box.height,
      viewportWidth: innerWidth, viewportHeight: innerHeight, scrollWidth: document.documentElement.scrollWidth };
  });
  assert(dimensions.width > 0 && dimensions.height > 0, "The game canvas must be visible");
  assert(Math.abs(dimensions.width / dimensions.height - 480 / 720) < 0.01, "The game canvas must preserve 480:720 proportions");
  assert(dimensions.left >= -1 && dimensions.top >= -1, "The game canvas must start within the viewport");
  assert(dimensions.left + dimensions.width <= dimensions.viewportWidth + 1, "The game canvas must fit horizontally");
  assert(dimensions.top + dimensions.height <= dimensions.viewportHeight + 1, "The game canvas must fit vertically");
  assert(dimensions.scrollWidth <= dimensions.viewportWidth + 1, "The guidance screen must not overflow horizontally");
  return dimensions;
}

function gamePoint(dimensions: CanvasDimensions, x: number, y: number): { x: number; y: number } {
  return { x: dimensions.left + x / 480 * dimensions.width, y: dimensions.top + y / 720 * dimensions.height };
}

async function keyboardStart(page: Page): Promise<Snapshot> {
  await page.locator("#game").focus();
  await page.keyboard.press("Enter");
  const snapshot = await waitForElapsed(page, 0.15);
  assert.equal(snapshot.guidance.inputMode, "keyboard", "Keyboard start must teach keyboard controls");
  assert.equal(snapshot.arcade.dash.kind, "ready", "A fresh run must start with dash ready");
  return snapshot;
}

async function expectStoredLessons(page: Page, lessons: Lesson[]): Promise<void> {
  const stored: unknown = await page.evaluate(() => {
    const value = localStorage.getItem("chix-run-lessons");
    return value === null ? [] : JSON.parse(value) as unknown;
  });
  assert(Array.isArray(stored), "Lesson progress must be saved as a JSON array");
  assert.deepEqual([...stored].sort(), [...lessons].sort(), "Only completed lessons should be stored");
  assert.deepEqual([...(await readSnapshot(page)).guidance.learned].sort(), [...lessons].sort(), "Snapshot progress must match saved lessons");
}

async function waitForDashState(page: Page, kind: Arcade["dash"]["kind"]): Promise<Snapshot> {
  await page.waitForFunction((expected) => (window as ChixRunWindow).__chixRun?.snapshot().arcade.dash.kind === expected,
    kind, { polling: 15, timeout: 6_000 });
  return readSnapshot(page);
}

async function desktopGuidance(): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 916, height: 1344 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  observe(page, "desktop-guidance");
  try {
    const menu = await openGame(page);
    assert.deepEqual(menu.guidance.learned, [], "A fresh browser context must start with no completed lessons");
    report.desktopCanvas = await canvasDimensions(page);
    await capture(page, "desktop-menu");
    const opening = await keyboardStart(page);
    assert.equal(opening.guidance.active, "move", "First-time players must first learn movement");
    assert(opening.player, "The opening run must contain its chicken");
    await capture(page, "desktop-move-hint");

    // Leave the real player stationary so the dash lesson has not been completed early.
    const dashHint = await waitForElapsed(page, 4.8);
    assert.equal(dashHint.guidance.active, "dash", "The dash lesson must appear after the opening movement window");
    assert.equal(dashHint.dashes, 0, "The dash hint capture must precede any dash input");
    assert.deepEqual(dashHint.guidance.learned, [], "Waiting alone must not complete either lesson");
    assert(dashHint.player && Math.abs(dashHint.player.x - opening.player.x) < 1, "The dash hint capture must precede movement input");
    await capture(page, "desktop-dash-hint");
    report.desktopOpening = { menu, moveHint: opening, dashHint };

    await page.keyboard.press("Space");
    const activeDash = await waitForDashState(page, "dashing");
    assert.equal(activeDash.dashes, dashHint.dashes + 1, "Space must activate one real dash");
    assert.equal(activeDash.guidance.active, null, "A successful dash must dismiss its lesson immediately");
    await capture(page, "desktop-dash-active");
    await expectStoredLessons(page, ["dash"]);

    const recharge = await waitForDashState(page, "cooldown");
    assert.equal(recharge.guidance.active, null, "Recharge must not repeat a completed dash lesson");
    await capture(page, "desktop-dash-recharge");
    await page.keyboard.press("Space");
    const blockedDash = await readSnapshot(page);
    assert.equal(blockedDash.dashes, activeDash.dashes, "Dash input during recharge must not activate another dash");
    assert.equal(blockedDash.arcade.dash.kind, "cooldown", "Dash must remain in recharge after unavailable input");
    const ready = await waitForDashState(page, "ready");
    assert.equal(ready.phase.kind, "playing", "A short dash/recharge check must preserve the run");
    report.desktopDash = { active: activeDash, recharge, blockedDash, ready };

    const afterDashReload = await openGame(page, true);
    await expectStoredLessons(page, ["dash"]);
    const movementStart = await keyboardStart(page);
    assert.equal(movementStart.guidance.active, "move", "Reload must retain the uncompleted movement lesson");
    assert(movementStart.player, "The movement lesson run must contain its chicken");
    await page.keyboard.down("ArrowRight");
    let moved: Snapshot;
    try {
      await page.waitForFunction(() => (window as ChixRunWindow).__chixRun?.snapshot().guidance.learned.includes("move"),
        undefined, { polling: 15, timeout: 1_500 });
      moved = await readSnapshot(page);
    } finally {
      await page.keyboard.up("ArrowRight");
    }
    assert(moved.player && moved.player.x - movementStart.player.x >= 32, "Movement must be taught by at least 32px of actual displacement");
    assert.equal(moved.guidance.active, null, "Learning movement must dismiss its active lesson");
    await expectStoredLessons(page, ["move", "dash"]);

    await page.keyboard.press("Shift");
    const shiftDash = await waitForDashState(page, "dashing");
    assert.equal(shiftDash.dashes, 1, "Shift must also activate a ready dash");
    report.desktopLearning = { afterDashReload, movementStart, moved, shiftDash };

    const learnedReload = await openGame(page, true);
    await expectStoredLessons(page, ["move", "dash"]);
    const learnedStart = await keyboardStart(page);
    assert.equal(learnedStart.guidance.active, null, "Completed movement guidance must stay dismissed on reload");
    const learnedLater = await waitForElapsed(page, 4.8);
    assert.equal(learnedLater.guidance.active, null, "Completed dash guidance must stay dismissed when its window arrives");
    report.desktopPersistence = { menu: learnedReload, opening: learnedStart, afterDashWindow: learnedLater };
  } finally {
    await context.close();
  }
}

async function mobileGuidance(): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  observe(page, "mobile-guidance");
  try {
    const menu = await openGame(page);
    assert.deepEqual(menu.guidance.learned, [], "Mobile must verify first-run hints in a fresh context");
    const dimensions = await canvasDimensions(page);
    report.mobileCanvas = dimensions;
    await capture(page, "mobile-menu");
    const start = gamePoint(dimensions, 240, 565);
    await page.touchscreen.tap(start.x, start.y);
    const opening = await waitForElapsed(page, 0.15);
    assert.equal(opening.guidance.inputMode, "pointer", "Touchscreen start must select pointer instructions");
    assert.equal(opening.guidance.active, "move", "Mobile must first teach holding a side to move");
    assert(opening.player, "The mobile opening run must contain its chicken");
    await capture(page, "mobile-move-hint");
    const dashHint = await waitForElapsed(page, 4.8);
    assert.equal(dashHint.guidance.inputMode, "pointer", "Mobile dash hint must retain tap instructions");
    assert.equal(dashHint.guidance.active, "dash", "Mobile must show its contextual dash lesson");
    assert.equal(dashHint.dashes, 0, "The mobile dash hint capture must precede dash input");
    assert.deepEqual(dashHint.guidance.learned, [], "Mobile waiting must not complete lessons");
    assert(dashHint.player && Math.abs(dashHint.player.x - opening.player.x) < 1, "Mobile hint capture must precede movement input");
    await capture(page, "mobile-dash-hint");
    const dashButton = gamePoint(dimensions, 240, 665);
    await page.touchscreen.tap(dashButton.x, dashButton.y);
    const activeDash = await waitForDashState(page, "dashing");
    assert.equal(activeDash.dashes, 1, "Tapping the real mobile dash control must activate dash");
    assert.equal(activeDash.guidance.active, null, "A mobile dash must dismiss its lesson");
    assert.equal(activeDash.guidance.inputMode, "pointer", "Mobile dash must preserve pointer guidance");
    await expectStoredLessons(page, ["dash"]);
    report.mobileGuidance = { menu, opening, dashHint, activeDash };
  } finally {
    await context.close();
  }
}

async function extraMenuCapture(name: string, width: number, height: number): Promise<void> {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1,
    ...(width <= 390 ? { isMobile: true, hasTouch: true } : {}) });
  const page = await context.newPage();
  observe(page, name);
  try {
    const menu = await openGame(page);
    const canvas = await canvasDimensions(page);
    await capture(page, name);
    report[name] = { viewport: { width, height }, canvas, menu };
  } finally {
    await context.close();
  }
}

try {
  await desktopGuidance();
  await mobileGuidance();
  await Promise.all([
    extraMenuCapture("narrow-menu", 320, 568),
    extraMenuCapture("wide-desktop-menu", 1129, 1344),
  ]);
  assert.deepEqual(errors, [], "Guidance must not produce browser errors");
  assert.deepEqual([...remoteRequests], [], "Guidance must use only local requests");
  report.result = "passed";
  console.log("Chix Run guidance verification passed: contextual keyboard/touch lessons, real movement and dash learning, recharge, reload persistence, and four viewport captures.");
} catch (error) {
  report.result = "failed";
  report.failure = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  report.browserErrors = errors;
  report.remoteRequests = [...remoteRequests];
  report.localRequestCount = requests.size;
  await writeFile(resolve(artifacts, "verification.json"), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
