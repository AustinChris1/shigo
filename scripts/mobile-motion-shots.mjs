// Mobile landing with motion ON, captured at several scroll positions to catch sticky/reveal bugs; usage: node scripts/mobile-motion-shots.mjs <outDir> [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const [outDir, base = "http://localhost:3000"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "no-preference" })).newPage();
await page.goto(base + "/", { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(1500);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
const stops = [0.18, 0.28, 0.38, 0.5, 0.62, 0.74, 0.86, 0.97];
for (const [i, f] of stops.entries()) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(h * f));
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${outDir}/m${i}.png` });
}
console.log("height", h, "shots", stops.length);
await browser.close();
