// Toasts in a real browser: sign-in welcome, install prompt, a live payment, sign-out; usage: node scripts/toast-check.mjs <outDir>
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const out = process.argv[2] ?? ".impeccable/review";
mkdirSync(out, { recursive: true });
const base = "http://localhost:3000";
const b = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!ok) fails++; };
const toastText = async () => (await p.locator("[data-sonner-toast]").allTextContents()).join(" | ");

await p.goto(base + "/login", { waitUntil: "load", timeout: 120000 });
await p.fill("#name", "Toast Tester");
await p.fill("#phone", "08099990002");
await p.fill("#accountNumber", "1234509877");
await p.waitForTimeout(1200);
await p.click("button[type=submit]");
await p.waitForURL("**/app", { timeout: 60000 });
await p.waitForTimeout(1500);
check("welcome toast after sign-in", /Welcome, Toast/.test(await toastText()), await toastText());
await p.screenshot({ path: `${out}/toast-welcome.png` });

// Chrome fires beforeinstallprompt only when installable; simulate it to exercise the prompt path.
await p.evaluate(() => { localStorage.removeItem("shigo-install-dismissed"); const e = new Event("beforeinstallprompt"); e.prompt = async () => {}; e.userChoice = Promise.resolve({ outcome: "dismissed" }); window.dispatchEvent(e); });
await p.waitForTimeout(3200);
check("install toast shows", /Install Shigo/.test(await toastText()), await toastText());
await p.screenshot({ path: `${out}/toast-install.png` });
await p.locator('[data-sonner-toast]:has-text("Install Shigo") [data-close-button]').click();
await p.waitForTimeout(500);
check("install toast dismisses and is remembered", !/Install Shigo/.test(await toastText()) && (await p.evaluate(() => !!localStorage.getItem("shigo-install-dismissed"))));

// Create an order, then pay it through the simulator; the order page should toast the green moment.
await p.goto(base + "/new", { waitUntil: "load" });
await p.fill("#amount", "2750");
await p.click("button[type=submit]");
await p.waitForURL("**/orders/**", { timeout: 30000 });
await p.waitForTimeout(800);
check("order-created toast", /created/.test(await toastText()), await toastText());
const acct = "1234509877";
await p.evaluate(async (a) => fetch("/api/dev/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountRef: a, amountKobo: 275000 }) }), acct);
await p.waitForTimeout(3500);
check("payment toast on the order page", /has entered/.test(await toastText()), await toastText());
await p.screenshot({ path: `${out}/toast-paid.png` });

await p.goto(base + "/app", { waitUntil: "load" });
await p.click('button[aria-label="Sign out"]');
await p.waitForURL("**/login", { timeout: 30000 });
await p.waitForTimeout(800);
check("signed-out toast", /Signed out/.test(await toastText()), await toastText());
check("no page errors", errs.length === 0, errs.join("; "));

const m = await (await fetch(base + "/manifest.json")).json();
check("manifest has 192 and 512 PNG icons", m.icons.some((i) => i.sizes === "192x192") && m.icons.some((i) => i.sizes === "512x512"));
check("service worker served", (await fetch(base + "/sw.js")).ok);

await b.close();
console.log(fails ? `\n${fails} FAILURE(S)` : "\nALL PASS");
process.exit(fails ? 1 : 0);
