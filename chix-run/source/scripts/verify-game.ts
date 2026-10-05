import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type BrowserContext, type CDPSession, type Page } from "playwright";
import type { Arcade } from "../src/arcade";
import type { Phase } from "../src/flow";

type Snapshot = {
  phase: Phase;
  player: { x: number; y: number } | null;
  items: { kind: "coin" | "hazard" | "magnet"; x: number; y: number; hazardType?: "drone" | "gate"; width?: number }[];
  hits: number;
  coins: number;
  run: number;
  arcade: Arcade;
  best: number;
  elapsed: number;
  dashes: number;
  smashes: number;
  nearMisses: number;
  magnets: number;
  level: number;
};

type ChixRunWindow = Window & {
  __chixRun?: { snapshot: () => Snapshot };
};

type CanvasDimensions = {
  width: number;
  height: number;
  left: number;
  top: number;
  renderedWidth: number;
  renderedHeight: number;
  viewportWidth: number;
  viewportHeight: number;
};

const url = process.env.GAME_URL ?? "http://127.0.0.1:5173";
const desktopViewport = {
  width: Number(process.env.GAME_VIEWPORT_WIDTH ?? 960),
  height: Number(process.env.GAME_VIEWPORT_HEIGHT ?? 900),
};
assert(Number.isInteger(desktopViewport.width) && desktopViewport.width >= 320
  && Number.isInteger(desktopViewport.height) && desktopViewport.height >= 480, "Invalid verification viewport");
const artifacts = resolve(process.env.GAME_ARTIFACT_DIR ?? "artifacts");
const browserCandidates = [
  process.env.BROWSER_EXECUTABLE,
  "/Users/williswee/.cache/puppeteer/chrome/mac_arm-152.0.7977.54/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  "/Users/williswee/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((path): path is string => Boolean(path));
const executablePath = browserCandidates.find((path) => existsSync(path));
if (process.env.BROWSER_EXECUTABLE) {
  assert(existsSync(process.env.BROWSER_EXECUTABLE), "BROWSER_EXECUTABLE does not exist");
}

await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ["--enable-unsafe-swiftshader"],
});

const errors: string[] = [];
const remoteRequests = new Set<string>();
const requests = new Set<string>();
const localUrl = new URL(url);
const report: Record<string, unknown> = {
  url,
  browserExecutable: executablePath ?? "Playwright default",
  input: "Real keyboard and touch events; snapshot inspection is read-only.",
};

function observeErrors(page: Page, name: string): void {
  page.on("request", (request) => {
    const requestUrl = request.url();
    requests.add(requestUrl);
    const parsed = new URL(requestUrl);
    if (["http:", "https:", "ws:", "wss:"].includes(parsed.protocol)
      && (parsed.hostname !== localUrl.hostname || parsed.port !== localUrl.port)) {
      remoteRequests.add(requestUrl);
    }
  });
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${name}: ${message.text()}`);
  });
}

async function readSnapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const hook = (window as ChixRunWindow).__chixRun;
    if (!hook) throw new Error("The Chix Run dev inspection hook is unavailable");
    return hook.snapshot();
  });
}

async function openGame(page: Page): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean((window as ChixRunWindow).__chixRun));
  assert.equal((await readSnapshot(page)).phase.kind, "menu", "Expected the start screen");
}

async function holdKey(page: Page, key: string, milliseconds: number): Promise<void> {
  await page.keyboard.down(key);
  try {
    await page.waitForTimeout(milliseconds);
  } finally {
    await page.keyboard.up(key);
  }
}

function playing(snapshot: Snapshot): Extract<Phase, { kind: "playing" }> {
  assert.equal(snapshot.phase.kind, "playing", "Expected an active run");
  assert(snapshot.phase.kind === "playing");
  return snapshot.phase;
}

async function checkCanvas(page: Page): Promise<CanvasDimensions> {
  const dimensions = await page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const box = canvas.getBoundingClientRect();
    return {
      width: canvas.width,
      height: canvas.height,
      left: box.left,
      top: box.top,
      renderedWidth: box.width,
      renderedHeight: box.height,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
    };
  });
  assert(dimensions.renderedWidth > 0 && dimensions.renderedHeight > 0, "Canvas must be visible");
  assert(Math.abs(dimensions.width / dimensions.height - 480 / 720) < 0.01, "Fixed 480:720 canvas aspect ratio");
  assert(Math.abs(dimensions.renderedWidth / dimensions.renderedHeight - 480 / 720) < 0.01, "Canvas must preserve its aspect ratio");
  assert(dimensions.left >= -1 && dimensions.top >= -1, "Canvas must fit inside the viewport");
  assert(dimensions.left + dimensions.renderedWidth <= dimensions.viewportWidth + 1, "Canvas must fit horizontally");
  assert(dimensions.top + dimensions.renderedHeight <= dimensions.viewportHeight + 1, "Canvas must fit vertically");
  return dimensions;
}

function gamePoint(dimensions: CanvasDimensions, x: number, y: number): { x: number; y: number } {
  return {
    x: dimensions.left + x / 480 * dimensions.renderedWidth,
    y: dimensions.top + y / 720 * dimensions.renderedHeight,
  };
}

async function runDesktop(): Promise<void> {
  const context = await browser.newContext({
    viewport: desktopViewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: resolve(artifacts, "chix-run-raw-video"), size: desktopViewport },
  });
  const page = await context.newPage();
  observeErrors(page, "desktop");
  let held: "ArrowLeft" | "ArrowRight" | null = null;
  const video = page.video();

  async function steer(next: typeof held): Promise<void> {
    if (held === next) return;
    if (held) await page.keyboard.up(held);
    if (next) await page.keyboard.down(next);
    held = next;
  }

  try {
    await openGame(page);
    const dimensions = await checkCanvas(page);
    report.desktopCanvas = dimensions;
    await page.screenshot({ path: resolve(artifacts, "chix-run-menu.png") });
    await page.waitForTimeout(800);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    const start = await readSnapshot(page);
    assert.deepEqual(playing(start), { kind: "playing", score: 0, lives: 3 });
    assert(start.player);
    const initialX = start.player.x;

    await holdKey(page, "a", 160);
    const movedLeft = await readSnapshot(page);
    assert(movedLeft.player && movedLeft.player.x < initialX - 35, "A must move the chicken left");
    await holdKey(page, "d", 160);
    const movedRight = await readSnapshot(page);
    assert(movedRight.player && movedRight.player.x > movedLeft.player.x + 35, "D must move the chicken right");
    report.desktopMovement = { initialX, leftX: movedLeft.player.x, rightX: movedRight.player.x };

    assert.equal(movedRight.arcade.dash.kind, "ready");
    await page.keyboard.press("Space", { delay: 60 });
    const firstDash = await readSnapshot(page);
    assert.equal(firstDash.arcade.dash.kind, "dashing", "Space must activate dash");
    assert.equal(firstDash.dashes, movedRight.dashes + 1, "A dash should be counted once");
    report.keyboardDash = firstDash;

    let capturedCoin = false;
    let capturedFrenzy = false;
    let capturedMagnet = false;
    let sawCooldown = false;
    let sawRechargedDash = false;
    let verifiedDashSmash = false;
    let dashAttempt: {
      before: Snapshot;
      activated: Snapshot;
      target: Snapshot["items"][number];
      expires: number;
    } | null = null;
    const dashAttempts: Record<string, unknown>[] = [];
    report.dashAttempts = dashAttempts;
    let maxObservedCombo = 0;
    const dashStates = new Set<string>(["ready", "dashing"]);
    const deadline = Date.now() + 55_000;
    let last = await readSnapshot(page);
    while (last.phase.kind === "playing" && Date.now() < deadline) {
      assert.deepEqual(errors, [], "Gameplay must not produce runtime errors");
      assert(last.player);
      dashStates.add(last.arcade.dash.kind);
      sawCooldown ||= last.arcade.dash.kind === "cooldown";
      sawRechargedDash ||= sawCooldown && last.arcade.dash.kind === "ready";
      maxObservedCombo = Math.max(maxObservedCombo, last.arcade.maxCombo);
      if (!capturedFrenzy && last.arcade.frenzyRemaining > 0) {
        report.frenzy = last;
        capturedFrenzy = true;
        await page.screenshot({ path: resolve(artifacts, "chix-run-shield.png") });
      }
      if (!capturedMagnet && last.magnets > 0 && last.arcade.magnetRemaining > 0) {
        report.magnet = last;
        capturedMagnet = true;
        await page.screenshot({ path: resolve(artifacts, "chix-run-magnet.png") });
      }
      if (!capturedCoin && last.coins >= 1) {
        await steer(null);
        await page.screenshot({ path: resolve(artifacts, "chix-run-playing.png") });
        report.afterCoin = last;
        capturedCoin = true;
      }

      if (dashAttempt) {
        const unchangedLives = playing(last).lives === playing(dashAttempt.before).lives;
        if (last.smashes > dashAttempt.before.smashes
          && last.hits === dashAttempt.before.hits
          && unchangedLives
          && last.arcade.frenzyRemaining <= 0) {
          verifiedDashSmash = true;
          report.dashSmash = { before: dashAttempt.before, activated: dashAttempt.activated, after: last, target: dashAttempt.target };
          dashAttempts.push({ result: "verified", elapsed: last.elapsed, hits: last.hits, smashes: last.smashes });
          await page.screenshot({ path: resolve(artifacts, "chix-run-dash.png") });
          dashAttempt = null;
        } else if (Date.now() > dashAttempt.expires
          || last.hits !== dashAttempt.before.hits
          || last.arcade.frenzyRemaining > 0) {
          dashAttempts.push({ result: "retry", before: dashAttempt.before, after: last, target: dashAttempt.target });
          dashAttempt = null;
        }
      }

      // The opening coin trails can build shield protection before hazards arrive. A magnet
      // appears shortly after; once those opportunities pass, seek real hits.
      const desiredKind = !capturedFrenzy && last.elapsed < 7.5
        ? "coin"
        : !capturedMagnet && last.elapsed < 10.5
          ? "magnet"
          : "hazard";
      const seekingDash: boolean = desiredKind === "hazard"
        && !verifiedDashSmash
        && !dashAttempt
        && last.arcade.dash.kind === "ready"
        && last.arcade.frenzyRemaining <= 0;
      const target: Snapshot["items"][number] | undefined = last.items
        .filter((item) => item.kind === desiredKind && item.y < last.player!.y + 28)
        .filter((item) => !seekingDash || item.y <= last.player!.y - 50)
        .filter((item) => Math.max(0, Math.abs(item.x - last.player!.x) - (item.width ?? 0) / 2) / 380 < (last.player!.y + 30 - item.y) / 320 + 0.15)
        .sort((a, b) => b.y - a.y)[0];
      const safeHalfWidth = target?.hazardType === "gate" ? Math.max(0, (target.width ?? 0) / 2 - 20) : 0;
      const aimX = target
        ? Math.max(target.x - safeHalfWidth, Math.min(target.x + safeHalfWidth, last.player.x))
        : last.player.x;
      const difference = aimX - last.player.x;
      if (seekingDash && target && Math.abs(difference) < 12
        && target.y >= last.player.y - 70
        && target.y <= last.player.y - 50) {
        await steer(null);
        const before = last;
        await page.keyboard.press("Shift", { delay: 40 });
        const activated = await readSnapshot(page);
        assert.equal(activated.arcade.dash.kind, "dashing", "A timed Shift press must activate dash");
        assert.equal(activated.dashes, before.dashes + 1);
        assert.equal(activated.hits, before.hits, "Dash activation must precede the hazard collision");
        dashAttempt = { before, activated, target, expires: Date.now() + 1_000 };
      } else {
        await steer(dashAttempt ? null : difference < -9 ? "ArrowLeft" : difference > 9 ? "ArrowRight" : null);
      }
      await page.waitForTimeout(40);
      last = await readSnapshot(page);
    }
    await steer(null);
    report.lastRunSnapshot = last;
    assert(capturedCoin, "The real playthrough must collect at least one coin");
    assert(capturedFrenzy, "The real playthrough must activate an eight-coin shield");
    assert(capturedMagnet, "The real playthrough must collect a magnet");
    assert(last.smashes >= 1, "The real playthrough must smash a hazard");
    assert(verifiedDashSmash, "A timed keyboard dash must smash a hazard without losing a life after shield protection expires");
    assert.equal(last.phase.kind, "gameover", "Three real hazard collisions must end the run within 55 seconds");
    assert(last.hits >= 3, "The playthrough must contain at least three hits");
    assert(last.coins >= 1, "Final run must contain a collected coin");
    assert(sawCooldown && sawRechargedDash, "Dash must transition through cooldown and become ready again");
    assert.deepEqual([...dashStates].sort(), ["cooldown", "dashing", "ready"]);
    report.arcadeObservations = { dashStates: [...dashStates], maxObservedCombo, capturedFrenzy, capturedMagnet, verifiedDashSmash, dashAttempts, smashes: last.smashes, nearMisses: last.nearMisses, level: last.level };
    report.gameover = last;
    await page.waitForTimeout(500);
    await page.screenshot({ path: resolve(artifacts, "chix-run-gameover.png") });
    await page.locator("#game").screenshot({ path: resolve(artifacts, "chix-run-gameover-canvas.png") });
    await page.waitForTimeout(800);

    const documentIdentity = await page.evaluate(() => performance.timeOrigin);
    const restartButton = gamePoint(dimensions, 240, 565);
    await page.mouse.click(restartButton.x, restartButton.y);
    await page.waitForTimeout(100);
    const restarted = await readSnapshot(page);
    assert.deepEqual(playing(restarted), { kind: "playing", score: 0, lives: 3 });
    assert.equal(restarted.run, 2, "Restart should create the second run");
    assert(last.phase.kind === "gameover");
    assert(restarted.best >= last.phase.score, "The best score must survive restart");
    assert.equal(await page.evaluate(() => performance.timeOrigin), documentIdentity, "Restart must not reload the document");
    report.restart = restarted;

    await holdKey(page, "ArrowLeft", 850);
    const leftBound = await readSnapshot(page);
    assert(leftBound.player && leftBound.player.x >= 0 && leftBound.player.x < 70);
    await holdKey(page, "ArrowLeft", 150);
    assert.equal((await readSnapshot(page)).player?.x, leftBound.player.x, "Left bound must stop movement");
    await holdKey(page, "ArrowRight", 1_300);
    const rightBound = await readSnapshot(page);
    assert(rightBound.player && rightBound.player.x <= 480 && rightBound.player.x > 410);
    await holdKey(page, "ArrowRight", 150);
    assert.equal((await readSnapshot(page)).player?.x, rightBound.player.x, "Right bound must stop movement");
    report.desktopBounds = { left: leftBound.player.x, right: rightBound.player.x };

    const beforeButtonDash = await readSnapshot(page);
    assert.equal(beforeButtonDash.arcade.dash.kind, "ready");
    const dashButton = gamePoint(dimensions, 240, 665);
    await page.mouse.click(dashButton.x, dashButton.y);
    await page.waitForTimeout(70);
    const afterButtonDash = await readSnapshot(page);
    assert.equal(afterButtonDash.arcade.dash.kind, "dashing", "The desktop dash button must activate dash");
    assert.equal(afterButtonDash.dashes, beforeButtonDash.dashes + 1);
    report.desktopButtonDash = afterButtonDash;

    let nearMiss = afterButtonDash;
    const nearMissDeadline = Date.now() + 8_000;
    while (nearMiss.elapsed < 6.8 && Date.now() < nearMissDeadline) {
      await page.waitForTimeout(100);
      nearMiss = await readSnapshot(page);
    }
    assert.equal(nearMiss.phase.kind, "playing", "The stationary near miss must preserve the active run");
    assert(nearMiss.nearMisses >= 1, "A drone passing close to the stationary chicken must register a near miss");
    assert.equal(nearMiss.hits, afterButtonDash.hits, "The near miss must not lose a life");
    report.nearMiss = nearMiss;
    await page.screenshot({ path: resolve(artifacts, "chix-run-near-miss.png") });
  } finally {
    await steer(null).catch(() => undefined);
    await context.close();
    if (video) await video.saveAs(resolve(artifacts, "chix-run.webm"));
  }
}

async function sendTouch(session: CDPSession, type: "touchStart" | "touchEnd" | "touchCancel", x = 0, y = 0): Promise<void> {
  await session.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: type === "touchStart" ? [{ x, y, id: 1 }] : [],
  });
}

async function runMobile(): Promise<void> {
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  observeErrors(page, "mobile");
  const session = await context.newCDPSession(page);
  try {
    await openGame(page);
    const dimensions = await checkCanvas(page);
    report.mobileCanvas = dimensions;
    const startButton = gamePoint(dimensions, 240, 565);
    await page.touchscreen.tap(startButton.x, startButton.y);
    await page.waitForTimeout(150);
    const start = await readSnapshot(page);
    assert.deepEqual(playing(start), { kind: "playing", score: 0, lives: 3 });
    assert(start.player);

    const left = gamePoint(dimensions, 90, 665);
    await sendTouch(session, "touchStart", left.x, left.y);
    await page.waitForTimeout(280);
    await sendTouch(session, "touchEnd");
    const afterLeft = await readSnapshot(page);
    assert(afterLeft.player && afterLeft.player.x < start.player.x - 40, "Touch on the left half must move left");
    await page.waitForTimeout(220);
    const afterRelease = await readSnapshot(page);
    assert(afterRelease.player && Math.abs(afterRelease.player.x - afterLeft.player.x) < 5, "Releasing touch must stop movement");

    const right = gamePoint(dimensions, 390, 665);
    await sendTouch(session, "touchStart", right.x, right.y);
    await page.waitForTimeout(380);
    await sendTouch(session, "touchCancel");
    const afterRight = await readSnapshot(page);
    assert(afterRight.player && afterRight.player.x > afterLeft.player.x + 60, "Touch on the right half must move right");
    await page.waitForTimeout(220);
    const afterCancel = await readSnapshot(page);
    assert(afterCancel.player && Math.abs(afterCancel.player.x - afterRight.player.x) < 5, "Canceling touch must stop movement");
    const dashButton = gamePoint(dimensions, 240, 665);
    await page.touchscreen.tap(dashButton.x, dashButton.y);
    await page.waitForTimeout(70);
    const afterDash = await readSnapshot(page);
    assert.equal(afterDash.arcade.dash.kind, "dashing", "The mobile dash button must activate dash");
    assert.equal(afterDash.dashes, afterCancel.dashes + 1);
    report.mobileDash = afterDash;
    await page.screenshot({ path: resolve(artifacts, "chix-run-mobile.png") });
    report.mobileMovement = {
      start: start.player.x,
      left: afterLeft.player.x,
      released: afterRelease.player.x,
      right: afterRight.player.x,
      canceled: afterCancel.player.x,
    };
  } finally {
    await sendTouch(session, "touchEnd").catch(() => undefined);
    await context.close();
  }
}

try {
  await runDesktop();
  await runMobile();
  assert.deepEqual(errors, [], "The browser must have no console errors or uncaught page errors");
  assert.deepEqual([...remoteRequests], [], "Gameplay must use only local requests");
  report.result = "passed";
  console.log("Chix Run verification passed: real coin, three hits, game over, restart, dash recharge/button input, keyboard bounds, mobile touch and cancellation, local requests only.");
} catch (error) {
  report.result = "failed";
  report.failure = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  report.browserErrors = errors;
  report.remoteRequests = [...remoteRequests];
  report.localRequestCount = requests.size;
  await writeFile(resolve(artifacts, "chix-run-verification.json"), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
