import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";
import type { Phase } from "../src/flow";

type ChixRunWindow = Window & {
  __chixRun?: { snapshot: () => { phase: Phase; best: number } };
};

const url = process.env.GAME_URL ?? "http://127.0.0.1:5173";
const artifacts = resolve("artifacts");
const browserCandidates = [
  process.env.BROWSER_EXECUTABLE,
  "/Users/williswee/.cache/puppeteer/chrome/mac_arm-152.0.7977.54/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  "/Users/williswee/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((path): path is string => Boolean(path));
if (process.env.BROWSER_EXECUTABLE) assert(existsSync(process.env.BROWSER_EXECUTABLE), "BROWSER_EXECUTABLE does not exist");
const executablePath = browserCandidates.find((path) => existsSync(path));
const viewports = [
  { name: "desktop", width: 1129, height: 1344 },
  { name: "user", width: 916, height: 1344 },
  { name: "mobile-menu", width: 390, height: 844 },
  { name: "narrow", width: 320, height: 568 },
] as const;
const expectedLinks = [
  "https://github.com/kaplayjs/kaplay",
  "https://github.com/oven-sh/bun",
  "https://github.com/microsoft/TypeScript",
  "https://github.com/vitejs/vite",
  "https://github.com/google/fonts/tree/main/ofl/anton",
  "https://github.com/Outfitio/Outfit-Fonts",
];
const errors: string[] = [];
const remoteRequests = new Set<string>();
const reports: Record<string, unknown>[] = [];
const localUrl = new URL(url);
const report: Record<string, unknown> = {
  url,
  browserExecutable: executablePath ?? "Playwright default",
  input: "Real native disclosure keyboard input; game snapshot inspection is read-only. No styles are injected.",
  viewports: reports,
};

await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ["--enable-unsafe-swiftshader"],
});

async function menuSnapshot(page: Page) {
  const snapshot = await page.evaluate(() => {
    const hook = (window as ChixRunWindow).__chixRun;
    if (!hook) throw new Error("The Chix Run read-only dev snapshot is unavailable");
    return hook.snapshot();
  });
  assert.equal(snapshot.phase.kind, "menu", "HTML footer controls must not start the game");
  return snapshot;
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      ...(viewport.width <= 390 ? { isMobile: true, hasTouch: true } : {}),
    });
    if (viewport.name === "user") {
      await context.addInitScript(() => {
        localStorage.removeItem("chix-run-best");
        localStorage.setItem("bean-run-best", "775");
      });
    }
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${viewport.name}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${viewport.name}: ${message.text()}`);
    });
    page.on("request", (request) => {
      const requestUrl = new URL(request.url());
      if (["http:", "https:", "ws:", "wss:"].includes(requestUrl.protocol)
        && (requestUrl.hostname !== localUrl.hostname || requestUrl.port !== localUrl.port)) {
        remoteRequests.add(request.url());
      }
    });
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean((window as ChixRunWindow).__chixRun));
      await page.evaluate(() => document.fonts.ready);
      const initial = await menuSnapshot(page);
      const shell = await page.evaluate(() => {
        const rect = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing shell element: ${selector}`);
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
        };
        const headline = document.querySelector("h1")!;
        const range = document.createRange();
        range.selectNodeContents(headline);
        return {
          title: document.title,
          brand: document.querySelector(".brand")!.textContent!.trim(),
          cssDisplay: getComputedStyle(document.body).display,
          viewport: { width: innerWidth, height: innerHeight },
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          header: rect(".site-header"),
          canvas: rect("#game"),
          cabinet: rect(".game-frame"),
          footer: rect(".site-footer"),
          summary: rect("summary"),
          headline: rect("h1"),
          headlineInkRows: Array.from(range.getClientRects()).map((box) => ({ x: box.x, right: box.right })),
          domText: document.body.textContent ?? "",
          footerText: document.querySelector(".site-footer")!.textContent ?? "",
          creditLinks: Array.from(document.querySelectorAll<HTMLAnchorElement>(".about-panel a"), (link) => link.href),
        };
      });
      assert.equal(shell.cssDisplay, "grid", "The real application must load its stylesheet");
      assert.equal(shell.title, "Chix Run");
      assert.equal(shell.brand, "CHIX RUN.");
      assert(shell.scrollWidth <= shell.viewport.width && shell.bodyScrollWidth <= shell.viewport.width, "No horizontal document overflow");
      assert(shell.canvas.width > 0 && shell.canvas.height > 0, "The game canvas must be visible");
      assert(Math.abs(shell.canvas.width / shell.canvas.height - 2 / 3) < 0.01, "The canvas must keep its 2:3 aspect ratio");
      assert(shell.cabinet.x >= 0 && shell.cabinet.right <= shell.viewport.width, "The full cabinet must fit horizontally");
      assert(shell.cabinet.y >= shell.header.bottom && shell.cabinet.bottom <= shell.footer.y, "The full game cabinet must fit between header and footer");
      assert(shell.footer.bottom <= shell.viewport.height, "The footer must stay in the viewport");
      assert(shell.summary.height >= 44, "The About disclosure must have a 44px touch target");
      assert(!/THE NIGHT SHIFT EDITION|GO FERAL|FRENZY/i.test(shell.domText), "Removed edition and frenzy jargon must not remain in the DOM");
      assert(shell.footerText.includes("Built with Bun, TypeScript & KAPLAY."));
      assert(shell.footerText.includes("KAPLAY, a free browser game engine"));
      assert(shell.footerText.includes("I worked with Codex"));
      assert(shell.footerText.includes("sounds are made in your browser"));
      assert(!/type experiment|illegal game states|pure transition function/i.test(shell.footerText), "About text must explain the game in plain English");
      assert.deepEqual(shell.creditLinks.filter(link => !link.startsWith(localUrl.origin)), expectedLinks, "Every requested tool credit must have its official link");
      assert(shell.creditLinks.some(link => link.endsWith("/licenses/kaplay-LICENSE.md")), "The exact package license must remain linked");
      for (const row of shell.headlineInkRows) {
        assert(row.x >= shell.headline.x - 1 && row.right <= shell.headline.right + 1, "Chicken headline must fit its rail");
      }
      const compatibility = viewport.name === "user" ? await page.evaluate(() => ({
        legacy: localStorage.getItem("bean-run-best"),
        renamed: localStorage.getItem("chix-run-best"),
        label: document.querySelector("#personal-best")?.textContent,
      })) : null;
      if (compatibility) {
        assert.equal(initial.best, 775, "Existing Bean Run personal best must survive the rename");
        assert.equal(compatibility.legacy, "775");
        assert.equal(compatibility.renamed, "775");
        assert.equal(compatibility.label, "775");
      }
      await page.screenshot({ path: resolve(artifacts, `chix-run-${viewport.name}.png`) });

      const summary = page.locator("summary");
      await summary.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
      assert(await page.locator("details").evaluate((element) => (element as HTMLDetailsElement).open), "Enter must open the native About disclosure");
      await menuSnapshot(page);
      await page.keyboard.press("Space");
      await page.waitForTimeout(100);
      assert(!(await page.locator("details").evaluate((element) => (element as HTMLDetailsElement).open)), "Space must close the native About disclosure");
      await menuSnapshot(page);
      await page.keyboard.press("Space");
      await page.waitForTimeout(100);
      assert(await page.locator("details").evaluate((element) => (element as HTMLDetailsElement).open), "Space must reopen the About disclosure");
      await menuSnapshot(page);
      const panel = await page.locator(".about-panel").evaluate((element) => {
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, height: box.height, contentHeight: element.scrollHeight, overflowY: getComputedStyle(element).overflowY };
      });
      assert(panel.x >= 0 && panel.y >= 0 && panel.right <= shell.viewport.width && panel.bottom <= shell.viewport.height, "Open project background must fit the viewport");
      if (panel.contentHeight > panel.height + 1) assert.equal(panel.overflowY, "auto", "All credits must remain reachable by scrolling");
      const firstCredit = page.locator(".about-panel a").first();
      await firstCredit.focus();
      assert(await firstCredit.evaluate((element) => element === document.activeElement), "An OSS credit must be keyboard focusable");
      await page.keyboard.press("Space");
      await page.waitForTimeout(100);
      await menuSnapshot(page);
      if (viewport.name === "user") {
        await page.locator(".about-panel").evaluate((element) => { element.scrollTop = 0; });
        await page.screenshot({ path: resolve(artifacts, "chix-run-about.png") });
      }
      await summary.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
      await menuSnapshot(page);
      reports.push({ viewport, shell, panel, compatibility, keyboardDisclosure: "Enter and Space toggle without starting a run; links accept focus without starting a run." });
      console.log(`${viewport.width}×${viewport.height}: layout, project background, OSS credits and native keyboard disclosure passed.`);
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(errors, [], "The shell must have no browser errors");
  assert.deepEqual([...remoteRequests], [], "Local shell verification must not request remote assets");
  report.result = "passed";
  console.log("Chix Run shell verification passed; the existing personal best survives the rename.");
} catch (error) {
  report.result = "failed";
  report.failure = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  report.browserErrors = errors;
  report.remoteRequests = [...remoteRequests];
  await writeFile(resolve(artifacts, "chix-run-shell.json"), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
