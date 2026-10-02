// Bank-app alerts end to end, with a stand-in for the Android app's bridge.
// Needs a server: PAYSTACK_SECRET_KEY=sk_test_dummy DEMO_MODE=1 npx next start -p 3100
// usage: node scripts/bankapp-check.mjs [baseUrl]
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const base = process.argv[2] ?? "http://localhost:3100";
const phone = "08099990004";
// Start clean: remove the test seller from any earlier run.
const db = new PrismaClient();
const old = await db.seller.findUnique({ where: { phone } });
if (old) {
  const sellerId = old.id;
  await db.$transaction([
    db.bankAlert.deleteMany({ where: { sellerId } }), db.device.deleteMany({ where: { sellerId } }),
    db.ledgerEntry.deleteMany({ where: { sellerId } }), db.report.deleteMany({ where: { sellerId } }),
    db.credit.deleteMany({ where: { sellerId } }), db.order.deleteMany({ where: { sellerId } }), db.seller.delete({ where: { id: sellerId } }),
  ]);
}
await db.otpCode.deleteMany({ where: { phone } });
await db.$disconnect();

const b = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!ok) fails++; };

// The real app injects window.shigoAndroid; this one answers status and records what the page asks for.
await ctx.addInitScript(() => {
  const listeners = new Set();
  const state = { paired: false, listenerEnabled: false };
  window.__bridgeLog = [];
  const reply = () => listeners.forEach((fn) => fn({ data: JSON.stringify({ type: "status", version: "test", device: "Test Phone", ...state, installedApps: [{ pkg: "team.opay.pay", label: "OPay" }], sdk: 34, sideloaded: true }) }));
  window.shigoAndroid = {
    addEventListener: (_t, fn) => listeners.add(fn),
    removeEventListener: (_t, fn) => listeners.delete(fn),
    postMessage: (raw) => {
      const m = JSON.parse(raw);
      window.__bridgeLog.push(m);
      if (m.type === "pair") state.paired = true;
      if (m.type === "openListenerSettings") state.listenerEnabled = true;
      setTimeout(reply, 10);
    },
  };
});

// Sign in (demo mode shows the code on screen).
await p.goto(base + "/login", { waitUntil: "load", timeout: 120000 });
await p.fill("#name", "Alert Seller");
await p.fill("#phone", phone);
await p.fill("#accountNumber", "1234509871");
await p.waitForTimeout(1200);
await p.click("button[type=submit]");
await p.waitForSelector("#code", { timeout: 60000 });
await p.fill("#code", (await p.textContent(".otp-demo b")).trim());
await p.click("button[type=submit]");
await p.waitForURL("**/app", { timeout: 60000 });

// Link the phone from the Alerts screen.
await p.goto(base + "/alerts", { waitUntil: "load" });
await p.getByText("Before you turn it on").waitFor({ timeout: 20000 });
check("disclosure shown before turning on", await p.getByText("never reads SMS, WhatsApp").isVisible());
await p.getByRole("button", { name: "I agree, turn it on" }).click();
await p.waitForFunction(() => window.__bridgeLog.some((m) => m.type === "pair"), null, { timeout: 20000 });
const log = await p.evaluate(() => window.__bridgeLog);
const key = log.find((m) => m.type === "pair")?.key;
check("page hands a phone key to the app", /^shd_/.test(key ?? ""));
check("page opens notification access", log.some((m) => m.type === "openListenerSettings"));
await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
await p.getByText(/On\. Keep your bank app/).waitFor({ timeout: 10000 });
check("status shows on once access is allowed", true);

// Orders to pay.
async function newOrder(amount, buyer, note) {
  await p.goto(base + "/new", { waitUntil: "load" });
  await p.fill("#amount", amount);
  if (buyer) await p.fill("#buyerName", buyer);
  await p.fill("#note", note);
  await p.click("button[type=submit]");
  await p.waitForURL(/\/orders\//, { timeout: 30000 });
  return p.url();
}
const orderUrl = await newOrder("18000", "Chidi Okafor", "12-inch frontal");

let t = Date.now();
const send = (body, auth = key) => fetch(base + "/api/rails/bankapp", {
  method: "POST",
  headers: { "content-type": "application/json", ...(auth ? { authorization: `Bearer ${auth}` } : {}) },
  body: JSON.stringify(body),
}).then(async (r) => ({ code: r.status, ...(await r.json()) }));
const alert = (text, extra = {}) => { t += 1000; return { app: "team.opay.pay", title: "Money received", text, postedAt: t, receivedAt: t + 300, sentAt: t + 900, ...extra }; };

const credit = alert("You have received ₦18,000.00 from CHIDI OKAFOR");
let r = await send(credit);
check("credit alert matches the order", r.status === "credit" && r.match === "matched", JSON.stringify(r));
r = await send(credit);
check("same alert twice is counted once", r.replay === true, JSON.stringify(r));

await p.goto(orderUrl, { waitUntil: "load" });
check("order says where the confirmation came from", await p.getByText("Read from your OPay app alert").isVisible());

r = await send(alert("You have received ₦9,000 from OLD BUYER", { receivedAt: t + 20 * 60_000, sentAt: t + 20 * 60_000 + 500 }));
check("old alert is kept but not acted on", r.status === "stale", JSON.stringify(r));
r = await send(alert("You have received ₦1.00 from CHIDI. Note: you have received ₦18,000"));
check("two amounts are never guessed", r.status === "unclear", JSON.stringify(r));
r = await send(alert("You have received ₦18,000 from CHIDI", { app: "com.whatsapp" }));
check("messaging apps are refused", r.code === 400, JSON.stringify(r));
r = await send(alert("You have received ₦18,000 from CHIDI"), null);
check("no key, no entry", r.code === 401);

await newOrder("25000", null, "Lace closure");
r = await send(alert("₦25,000 has been credited to you. Reversal of failed transfer"));
check("doubtful credit is held for the seller", r.status === "check" && r.match === "held", JSON.stringify(r));

await p.goto(base + "/alerts", { waitUntil: "load" });
check("alerts screen lists what Shigo saw", (await p.locator("article").count()) >= 4);
await p.goto(base + "/ledger/export", { waitUntil: "load" });
check("income record names the evidence", await p.getByText("OPay app alert on seller's phone").first().isVisible());

// Stop the phone: its key no longer works.
await p.goto(base + "/alerts", { waitUntil: "load" });
await p.getByRole("button", { name: "Stop" }).first().click();
await p.waitForLoadState("load");
await p.waitForTimeout(1500);
r = await send(alert("You have received ₦18,000 from CHIDI"));
check("stopped phone is refused", r.code === 401, JSON.stringify(r));

// Delete the account.
await p.goto(base + "/account", { waitUntil: "load" });
await p.check("input[name=confirm]");
await p.getByRole("button", { name: "Delete my account" }).click();
await p.waitForURL((u) => new URL(u).pathname === "/", { timeout: 30000 });
await p.goto(base + "/app", { waitUntil: "load" });
check("deleted account is signed out", new URL(p.url()).pathname === "/login");

check("no page errors", errs.length === 0, errs.join(" | "));
await b.close();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
