// Phone-size screenshots of every screen in light and dark, using the local Edge; usage: node scripts/screenshots.mjs <sellerId> <orderId> [outDir]
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "fs";
import { createHmac } from "crypto";

// Session cookies are signed; sign the seller id with the same secret the server uses.
const envLine = readFileSync(".env", "utf8").split(String.fromCharCode(10)).map((l) => l.trim()).find((l) => l.startsWith("SESSION_SECRET="));
const envSecret = envLine ? envLine.slice("SESSION_SECRET=".length).replace(/"/g, "").trim() : undefined;
const secret = process.env.SESSION_SECRET ?? envSecret ?? "dev-only-session-secret-change-me-0000000000";
const signed = (id) => `${id}.${createHmac("sha256", secret).update(id).digest("base64url")}`;

const [sellerId, orderId, outDir = "screenshots"] = process.argv.slice(2);
if (!sellerId || !orderId) {
  console.error("usage: node scripts/screenshots.mjs <sellerId> <orderId> [outDir]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const pages = [
  ["login", "/login"], ["orders", "/app"], ["new", "/new"], ["order-detail", `/orders/${orderId}`],
  ["credits", "/credits"], ["ledger", "/ledger"], ["ledger-export", "/ledger/export"], ["report", `/report/${orderId}`],
];

const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "shigo_seller", value: signed(sellerId), domain: "localhost", path: "/" }]);
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
