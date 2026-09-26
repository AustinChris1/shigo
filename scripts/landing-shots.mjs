// Landing and sign-in captures for review: desktop 1440 and mobile 390, light and dark, motion settled; usage: node scripts/landing-shots.mjs [outDir]
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? ".impeccable/review";
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];

for (const scheme of ["light", "dark"]) {
  for (const [name, width, height, mobile] of [["desktop", 1440, 900, false], ["mobile", 390, 844, true]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce", colorScheme: scheme });
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push(`${scheme}/${name} console: ${m.text()}`));
    page.on("pageerror", (e) => errors.push(`${scheme}/${name} pageerror: ${e.message}`));
    for (const [route, label] of [["/", ""], ["/login", "-login"]]) {
      await page.goto(base + route, { waitUntil: "load", timeout: 120000 });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
      const suffix = scheme === "light" ? "" : "-dark";
      await page.screenshot({ path: `${outDir}/${name}${label}${suffix}.png`, fullPage: true });
      if (!label) await page.screenshot({ path: `${outDir}/${name}-fold${suffix}.png`, fullPage: false });
      console.log("shot", `${name}${label}${suffix}`);
    }
    await ctx.close();
  }
}
await browser.close();
if (errors.length) { console.log("\nBrowser errors:"); errors.forEach((e) => console.log(" -", e)); process.exit(1); }
console.log("\nno console or page errors");
