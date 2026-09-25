// Matcher rules end to end against a running dev server; usage: node scripts/e2e-local.mjs [baseUrl]
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const base = process.argv[2] ?? "http://localhost:3000";
const acct = "0123456789";
let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures++;
};
const sim = async (body) => {
  const r = await fetch(base + "/api/dev/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
};

// clean slate for this seller
const existing = await db.seller.findUnique({ where: { phone: "08000000001" } });
if (existing) {
  await db.ledgerEntry.deleteMany({ where: { sellerId: existing.id } });
  await db.credit.deleteMany({ where: { sellerId: existing.id } });
  await db.report.deleteMany({ where: { sellerId: existing.id } });
  await db.order.deleteMany({ where: { sellerId: existing.id } });
  await db.seller.delete({ where: { id: existing.id } });
}
await db.credit.deleteMany({ where: { rail: "simulated" } });
const seller = await db.seller.create({ data: { phone: "08000000001", name: "Ada Obi", bankName: "Ecobank", accountNumber: acct, railAccountRef: acct } });

// Step 1: one open order for ₦4,500
const o1 = await db.order.create({ data: { sellerId: seller.id, amountKobo: 450000, reference: "SG-E2E1", note: "2 wigs" } });

// Step 2/3: exact credit -> green
let r = await sim({ accountRef: acct, amountKobo: 450000, narration: "SG-E2E1", payerName: "Buyer A" });
check("exact amount + reference matches", r.result?.status === "matched" && r.result.orderId === o1.id, JSON.stringify(r.result));
let o = await db.order.findUnique({ where: { id: o1.id } });
check("order state is PAID", o.state === "PAID");
check("ledger row written", (await db.ledgerEntry.count({ where: { orderId: o1.id } })) === 1);

// Step 5: different amount -> nothing turns green, credit stored as UNMATCHED
r = await sim({ accountRef: acct, amountKobo: 123400, payerName: "Nobody" });
check("wrong amount is UNMATCHED, not forced", r.result?.status === "unmatched", JSON.stringify(r.result));
check("no order was auto-greened", (await db.order.count({ where: { sellerId: seller.id, state: "PAID" } })) === 1);

// Ambiguity: two open orders at ₦3,000, credit with no narration -> HELD, never auto-green
const a = await db.order.create({ data: { sellerId: seller.id, amountKobo: 300000, reference: "SG-AMB1" } });
const b = await db.order.create({ data: { sellerId: seller.id, amountKobo: 300000, reference: "SG-AMB2" } });
r = await sim({ accountRef: acct, amountKobo: 300000 });
check("two orders fit -> HELD", r.result?.status === "held" && r.result.candidateOrderIds.length === 2, JSON.stringify(r.result));
check("neither ambiguous order paid", (await db.order.count({ where: { id: { in: [a.id, b.id] }, state: "PAID" } })) === 0);

// Narration truncated but only one open order at that amount -> matched by amount
const c = await db.order.create({ data: { sellerId: seller.id, amountKobo: 725000, reference: "SG-ONLY" } });
r = await sim({ accountRef: acct, amountRef: undefined, amountKobo: 725000, narration: "SG-ON" });
check("truncated narration, single open order -> matched by amount", r.result?.status === "matched" && r.result.orderId === c.id, JSON.stringify(r.result));

// Replay: same externalId twice processed once
const d = await db.order.create({ data: { sellerId: seller.id, amountKobo: 100000, reference: "SG-RPLY" } });
const id = "sim_replay_" + Date.now();
const r1 = await sim({ accountRef: acct, amountKobo: 100000, externalId: id });
const r2 = await sim({ accountRef: acct, amountKobo: 100000, externalId: id });
check("first delivery matched", r1.result?.status === "matched" && r1.result.orderId === d.id);
check("replay flagged, not double-applied", r2.result?.replay === true && (await db.ledgerEntry.count({ where: { orderId: d.id } })) === 1);

// Unknown account -> stored, not attributed
r = await sim({ accountRef: "9999999999", amountKobo: 5000 });
check("unknown account stored as unknown_account", r.result?.status === "unknown_account", JSON.stringify(r.result));

// Simulator refuses when disabled is covered by env; pages respond
for (const p of ["/login", "/api/events"]) {
  const res = await fetch(base + p, { redirect: "manual" });
  check(`GET ${p} responds`, [200, 401, 307].includes(res.status), String(res.status));
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
await db.$disconnect();
process.exit(failures ? 1 : 0);
