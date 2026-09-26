import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { naira } from "@/lib/money";

export const dynamic = "force-dynamic";

function monthKey(d: Date) {
  return d.toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

// The record. Every row here was confirmed by a bank callback tied to one order.
export default async function Ledger() {
  const seller = await currentSeller();
  if (!seller) redirect("/login");

  const all = await db.ledgerEntry.findMany({ where: { sellerId: seller.id }, orderBy: { date: "desc" }, include: { order: { include: { credit: true } } } });
  // Test payments from demo mode are shown as a count but never added to the income totals.
  const rows = all.filter((r) => r.order.credit?.rail !== "simulated");
  const tests = all.length - rows.length;
  const total = rows.reduce((a, r) => a + r.amountKobo, 0);
  // Server component, rendered once per request; reading the clock here is intended.
  // eslint-disable-next-line react-hooks/purity
  const since7 = Date.now() - 7 * 86400000;
  const week = rows.filter((r) => r.date.getTime() >= since7).reduce((a, r) => a + r.amountKobo, 0);
  const byMonth = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = monthKey(r.date);
    const cur = byMonth.get(k) ?? { sum: 0, n: 0 };
    byMonth.set(k, { sum: cur.sum + r.amountKobo, n: cur.n + 1 });
  }

  return (
    <main className="space-y-5">
      <header>
        <Link href="/app" className="text-sm text-(--muted)">← Orders</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Ledger</h1>
        <p className="text-sm text-(--muted)">Confirmed payments only. This is your income record.</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <div className="card p-4">
          <div className="text-xs text-(--muted)">Last 7 days</div>
          <div className="text-xl font-bold">{naira(week)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-(--muted)">All time · {rows.length} paid</div>
          <div className="text-xl font-bold">{naira(total)}</div>
        </div>
      </div>

      {tests > 0 && <p className="pill pill-amber">{tests} test payment{tests === 1 ? "" : "s"} not counted</p>}

      <Link href="/ledger/export" className="btn btn-primary w-full">Export income record</Link>

      <section className="card divide-y divide-(--line)">
        {[...byMonth.entries()].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between p-4">
            <div>
              <div className="font-semibold">{k}</div>
              <div className="text-xs text-(--muted)">{v.n} paid orders</div>
            </div>
            <div className="font-bold">{naira(v.sum)}</div>
          </div>
        ))}
        {rows.length === 0 && <p className="p-4 text-sm text-(--muted)">No confirmed payments yet.</p>}
      </section>
    </main>
  );
}
