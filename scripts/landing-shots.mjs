// Landing page captures for the finish review: desktop 1440 and mobile 390, full page, motion settled; usage: node scripts/landing-shots.mjs [outDir]
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? ".impeccable/review";
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];

for (const [name, width, height, mobile] of [["desktop", 1440, 900, false], ["mobile", 390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`${name} console: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${name} pageerror: ${e.message}`));
  await page.goto(base + "/", { waitUntil: "load", timeout: 120000 });
  // Scroll through once so in-view reveals have fired, then return to the top for a full-page capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  await page.screenshot({ path: `${outDir}/${name}-fold.png`, fullPage: false });
  console.log("shot", name);
  await ctx.close();
}
await browser.close();
if (errors.length) { console.log("\nBrowser errors:"); errors.forEach((e) => console.log(" -", e)); process.exit(1); }
console.log("\nno console or page errors");
