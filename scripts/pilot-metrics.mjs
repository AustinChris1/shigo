// Pilot numbers for the week 4 slides. Read-only.
// usage: npm run pilot -- [--since 2026-10-09] [--until 2026-10-16] [--phones 0803...,0806...] [--json]
// Test sellers (phones starting 0809999, and the e2e seller 08000000001) and test payments are left out unless --phones names them.
import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const since = new Date(opt("since") ?? Date.now() - 7 * 86400_000);
const until = new Date(opt("until") ?? Date.now());
const phones = opt("phones")?.split(",").map((p) => p.trim()).filter(Boolean);
const asJson = args.includes("--json");

const db = new PrismaClient();
const sellers = await db.seller.findMany({
  where: phones ? { phone: { in: phones } } : { NOT: [{ phone: { startsWith: "0809999" } }, { phone: "08000000001" }] },
  select: { id: true, name: true, phone: true },
});
const ids = sellers.map((s) => s.id);
const inWindow = { gte: since, lte: until };

const [orders, credits, alerts, reports] = await Promise.all([
  db.order.findMany({ where: { sellerId: { in: ids }, createdAt: inWindow }, include: { credit: true } }),
  db.credit.findMany({ where: { sellerId: { in: ids }, createdAt: inWindow, NOT: { rail: "simulated" } } }),
  db.bankAlert.findMany({ where: { sellerId: { in: ids }, createdAt: inWindow }, select: { sellerId: true, status: true, app: true } }),
  db.report.findMany({ where: { sellerId: { in: ids }, createdAt: inWindow }, select: { sellerId: true } }),
]);
await db.$disconnect();

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const count = (xs, f) => xs.filter(f).length;

function summarise(sellerIds) {
  const o = orders.filter((x) => sellerIds.includes(x.sellerId));
  const real = o.filter((x) => x.state === "PAID" && x.credit && x.credit.rail !== "simulated");
  // Paid by the matcher on arrival, or picked by the seller later from Unmatched.
  const byHand = real.filter((x) => x.credit && x.paidAt && x.paidAt.getTime() - x.credit.createdAt.getTime() > 5_000);
  const minutes = real.filter((x) => x.paidAt).map((x) => (x.paidAt.getTime() - x.createdAt.getTime()) / 60_000);
  const c = credits.filter((x) => sellerIds.includes(x.sellerId));
  const a = alerts.filter((x) => sellerIds.includes(x.sellerId));
  return {
    ordersCreated: o.length,
    green: real.length,
    greenNaira: real.reduce((n, x) => n + x.amountKobo, 0) / 100,
    greenByEvidence: {
      bankNotification: count(real, (x) => x.credit?.rail === "paystack" || x.credit?.rail === "ecobank"),
      bankAppAlert: count(real, (x) => x.credit?.rail === "bankapp"),
    },
    greenAutomatically: real.length - byHand.length,
    greenPickedBySeller: byHand.length,
    stillAmber: count(o, (x) => x.state === "PENDING"),
    cancelled: count(o, (x) => x.state === "CANCELLED"),
    testPaymentsLeftOut: count(o, (x) => x.state === "PAID" && (!x.credit || x.credit.rail === "simulated")),
    medianMinutesToGreen: median(minutes),
    creditsWaitingForSeller: { held: count(c, (x) => x.state === "HELD"), unmatched: count(c, (x) => x.state === "UNMATCHED") },
    bankAppAlerts: Object.fromEntries(["credit", "check", "unclear", "not_credit", "stale"].map((s) => [s, count(a, (x) => x.status === s)])),
    fakeReceiptReports: count(reports, (x) => sellerIds.includes(x.sellerId)),
  };
}

const result = {
  window: { since: since.toISOString(), until: until.toISOString() },
  sellers: sellers.length,
  total: summarise(ids),
  perSeller: sellers.map((s) => ({ name: s.name, phone: s.phone.replace(/\d(?=\d{4})/g, "•"), ...summarise([s.id]) })),
};

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const t = result.total;
  const naira = (n) => `₦${n.toLocaleString("en-NG")}`;
  console.log(`Pilot ${since.toDateString()} to ${until.toDateString()}, ${result.sellers} sellers\n`);
  console.log(`Orders created         ${t.ordersCreated}`);
  console.log(`Turned green           ${t.green} (${naira(t.greenNaira)})`);
  console.log(`  by bank notification ${t.greenByEvidence.bankNotification}`);
  console.log(`  by bank-app alert    ${t.greenByEvidence.bankAppAlert}`);
  console.log(`  automatically        ${t.greenAutomatically}`);
  console.log(`  picked by the seller ${t.greenPickedBySeller}`);
  console.log(`Still amber            ${t.stillAmber}`);
  console.log(`Cancelled              ${t.cancelled}`);
  console.log(`Median time to green   ${t.medianMinutesToGreen == null ? "-" : `${t.medianMinutesToGreen.toFixed(1)} min`}`);
  console.log(`Waiting for the seller ${t.creditsWaitingForSeller.held} held, ${t.creditsWaitingForSeller.unmatched} unmatched`);
  console.log(`Bank-app alerts        ${Object.entries(t.bankAppAlerts).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`Fake receipts reported ${t.fakeReceiptReports}`);
  console.log(`Test payments left out ${t.testPaymentsLeftOut}`);
  console.log(`\nPer seller:`);
  for (const s of result.perSeller) console.log(`  ${s.name.padEnd(24)} ${s.phone}  ${s.ordersCreated} orders, ${s.green} green, ${s.stillAmber} amber, ${s.fakeReceiptReports} reports`);
}
