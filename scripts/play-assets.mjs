// Play Store graphics: the feature graphic and five phone screenshots (1080x2160), into android/play/.
// Needs a local server with demo payments on: PAYSTACK_SECRET_KEY=sk_test_dummy DEMO_MODE=1 npm start
// usage: BASE_URL=http://localhost:3000 node scripts/play-assets.mjs
// Uses a throwaway demo seller (phone 08099990008) with sample buyers, and deletes it afterwards.
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "url";
import { resolve } from "path";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = resolve("android/play");
const phone = "08099990008";
const db = new PrismaClient();

async function clean() {
  const s = await db.seller.findUnique({ where: { phone } });
  if (s) {
    const sellerId = s.id;
    await db.$transaction([
      db.bankAlert.deleteMany({ where: { sellerId } }), db.device.deleteMany({ where: { sellerId } }),
      db.ledgerEntry.deleteMany({ where: { sellerId } }), db.credit.deleteMany({ where: { sellerId } }),
      db.report.deleteMany({ where: { sellerId } }), db.order.deleteMany({ where: { sellerId } }), db.seller.delete({ where: { id: sellerId } }),
    ]);
  }
  await db.otpCode.deleteMany({ where: { phone } });
}

await clean();
const b = await chromium.launch({ channel: "msedge", headless: true });

// Feature graphic.
const fg = await (await b.newContext({ viewport: { width: 1024, height: 500 } })).newPage();
await fg.goto(pathToFileURL(resolve(out, "feature-graphic.html")).href, { waitUntil: "networkidle" });
await fg.evaluate(() => document.fonts.ready);
await fg.screenshot({ path: `${out}/feature-graphic.png` });

// Phone: 360x720 at 3x = 1080x2160 (Play allows up to 2:1). A stand-in for the app's bridge shows the bank list.
const ctx = await b.newContext({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: "light" });
await ctx.addInitScript(() => {
  const listeners = new Set();
  const state = JSON.parse(sessionStorage.getItem("bridge") ?? '{"paired":false,"listenerEnabled":false}');
  window.__log = [];
  const apps = [["team.opay.pay", "OPay"], ["com.moniepoint.personal", "Moniepoint"], ["com.app.ecobank", "Ecobank"], ["com.kudabank.app", "Kuda"]];
  const reply = () => listeners.forEach((fn) => fn({ data: JSON.stringify({ type: "status", version: "1.0.0", device: "Samsung SM-A155F", ...state, installedApps: apps.map(([pkg, label]) => ({ pkg, label })), sdk: 35, sideloaded: false }) }));
  window.shigoAndroid = {
    addEventListener: (_t, fn) => listeners.add(fn),
    removeEventListener: (_t, fn) => listeners.delete(fn),
    postMessage: (raw) => {
      const m = JSON.parse(raw);
      window.__log.push(m);
      if (m.type === "pair") state.paired = true;
      if (m.type === "openListenerSettings") state.listenerEnabled = true;
      sessionStorage.setItem("bridge", JSON.stringify(state));
      setTimeout(reply, 10);
    },
  };
  // No toasts or demo-mode panel in store pictures.
  addEventListener("DOMContentLoaded", () => {
    const s = document.createElement("style");
    s.textContent = "[data-sonner-toaster],.demo-pay{display:none!important}";
    document.head.append(s);
  });
});
const p = await ctx.newPage();

await p.goto(base + "/login", { waitUntil: "load" });
await p.fill("#name", "Ada Obi");
await p.fill("#phone", phone);
await p.fill("#accountNumber", "1234509875");
await p.waitForTimeout(1200);
await p.click("button[type=submit]");
await p.waitForSelector("#code", { timeout: 60000 });
await p.fill("#code", (await p.textContent(".otp-demo b")).trim());
await p.click("button[type=submit]");
await p.waitForURL("**/app", { timeout: 60000 });

await p.goto(base + "/alerts", { waitUntil: "load" });
await p.getByRole("button", { name: "Agree and turn on" }).click();
await p.waitForFunction(() => window.__log.some((m) => m.type === "pair"));
const key = (await p.evaluate(() => window.__log)).find((m) => m.type === "pair").key;

async function order(amount, buyer, note) {
  await p.goto(base + "/new", { waitUntil: "load" });
  await p.fill("#amount", amount);
  await p.fill("#buyerName", buyer);
  await p.fill("#note", note);
  await p.click("button[type=submit]");
  await p.waitForURL(/\/orders\//, { timeout: 30000 });
  return p.url();
}
let t = Date.now() - 600_000;
const alert = (text) => {
  t += 60_000;
  return fetch(base + "/api/rails/bankapp", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ app: "com.app.ecobank", title: "Credit Alert", text, postedAt: t, receivedAt: t + 300, sentAt: t + 800 }),
  }).then((r) => r.json());
};

await order("25000", "Tunde Bello", "Wig revamp");
await alert("You have received ₦25,000.00 from TUNDE BELLO");
const paidUrl = await order("18000", "Chidi Okafor", "12-inch frontal");
await alert("You have received ₦18,000.00 from CHIDI OKAFOR");
const waitingUrl = await order("7500", "Amaka Eze", "Lace closure");

const shot = async (url, name) => {
  await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/screenshot-${name}.png` });
};
await shot(waitingUrl, "1-waiting");
await shot(paidUrl, "2-paid");
await shot(base + "/app", "3-orders");
await shot(base + "/alerts", "4-alerts");
await shot(base + "/ledger", "5-ledger");

await b.close();
await clean();
await db.$disconnect();
console.log("wrote android/play/feature-graphic.png and 5 screenshots");
