// Sign-in through a real browser: fill, submit, land on /app; usage: node scripts/signin-check.mjs [screenshot]
import { chromium } from "playwright";

const out = process.argv[2];
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://localhost:3000/login", { waitUntil: "load", timeout: 120000 });
await p.fill("#name", "Test Seller");
await p.fill("#phone", "08099990001");
await p.fill("#accountNumber", "1234509876");
await p.waitForTimeout(1500);
console.log("help text:", (await p.textContent("#account-help")).trim());
console.log("button enabled:", await p.isEnabled("button[type=submit]"));
await p.click("button[type=submit]");
await p.waitForSelector("#code", { timeout: 60000 });
const demoCode = (await p.textContent(".otp-demo b")).trim();
await p.fill("#code", demoCode);
await p.click("button[type=submit]");
await p.waitForURL("**/app", { timeout: 30000 });
console.log("landed on:", new URL(p.url()).pathname, "| verify line:", (await p.textContent(".app-hero-verify")).trim());
if (out) await p.screenshot({ path: out });
console.log("page errors:", errs.length);
await b.close();
