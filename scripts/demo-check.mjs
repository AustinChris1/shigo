// Demo mode end to end: sign in, create an order, send a test payment, see green, confirm it is not counted as income.
// Needs a server started with DEMO_MODE=1; usage: node scripts/demo-check.mjs [outDir]
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const out = process.argv[2] ?? ".impeccable/review";
mkdirSync(out, { recursive: true });
const base = "http://localhost:3000";
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!ok) fails++; };

await p.goto(base + "/login", { waitUntil: "load", timeout: 120000 });
await p.fill("#name", "Demo Seller");
await p.fill("#phone", "08099990003");
await p.fill("#accountNumber", "1234509878");
await p.waitForTimeout(1200);
await p.click("button[type=submit]");
await p.waitForSelector("#code", { timeout: 60000 });
await p.fill("#code", (await p.textContent(".otp-demo b")).trim());
await p.click("button[type=submit]");
await p.waitForURL("**/app", { timeout: 60000 });

await p.goto(base + "/new", { waitUntil: "load" });
await p.fill("#amount", "18000");
await p.fill("#buyerName", "Chidi Okafor");
await p.fill("#note", "12-inch frontal");
await p.click("button[type=submit]");
await p.waitForURL("**/orders/**", { timeout: 60000 });
check("demo panel shows on a waiting order", (await p.locator(".demo-pay").count()) === 1);
const wa = await p.getAttribute('a[href^="https://wa.me"]', "href");
check("WhatsApp text has no code", !/SG-/.test(decodeURIComponent(wa ?? "")), decodeURIComponent(wa ?? "").slice(-60));
await p.screenshot({ path: `${out}/demo-before.png` });

await p.click(".demo-pay-btn");
await p.waitForSelector("text=Shigo. It has entered.", { timeout: 20000 });
await p.waitForTimeout(1500);
check("order turns green", (await p.locator("text=Shigo. It has entered.").count()) > 0);
check("labelled as a test payment", (await p.locator("text=test payment, not real money").count()) > 0);
check("demo panel gone once paid", (await p.locator(".demo-pay").count()) === 0);
await p.screenshot({ path: `${out}/demo-after.png` });

await p.goto(base + "/ledger", { waitUntil: "load" });
check("ledger says the test payment is not counted", (await p.locator("text=/test payment.* not counted/").count()) === 1);
await p.goto(base + "/ledger/export", { waitUntil: "load" });
check("export has no test payment", !(await p.content()).includes("simulated"));
check("no page errors", errs.length === 0, errs.join("; "));

await b.close();
console.log(fails ? `\n${fails} FAILURE(S)` : "\nALL PASS");
process.exit(fails ? 1 : 0);
