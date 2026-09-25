// Phone-size screenshots of every screen in light and dark, using the local Edge; usage: node scripts/screenshots.mjs <sellerId> <orderId> [outDir]
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const [sellerId, orderId, outDir = "screenshots"] = process.argv.slice(2);
if (!sellerId || !orderId) {
  console.error("usage: node scripts/screenshots.mjs <sellerId> <orderId> [outDir]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const pages = [
  ["login", "/login"], ["orders", "/"], ["new", "/new"], ["order-detail", `/orders/${orderId}`],
  ["credits", "/credits"], ["ledger", "/ledger"], ["ledger-export", "/ledger/export"], ["report", `/report/${orderId}`],
];

const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "shigo_seller", value: sellerId, domain: "localhost", path: "/" }]);
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`${scheme} console: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${scheme} pageerror: ${e.message}`));
  for (const [label, p] of pages) {
    // "load" not "networkidle": the SSE stream never goes idle and dev compiles can take a while.
    await page.goto(base + p, { waitUntil: "load", timeout: 120000 });
    await page.waitForTimeout(800);
    const name = `${label}-${scheme}.png`;
    await page.screenshot({ path: `${outDir}/${name}`, fullPage: true });
    console.log("shot", name);
  }
  await ctx.close();
}
await browser.close();
if (errors.length) {
  console.log("\nBrowser errors:");
  for (const e of errors) console.log(" -", e);
  process.exit(1);
}
console.log("\nno console or page errors");
