import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { LiveOrders } from "@/components/LiveOrders";
import { logoutAction } from "@/lib/actions";
import { Mark, Wordmark } from "@/components/Mark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { naira } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Home() {
  const seller = await currentSeller();
  if (!seller) redirect("/login");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [orders, today, pendingCredits] = await Promise.all([
    db.order.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.ledgerEntry.aggregate({ where: { sellerId: seller.id, date: { gte: startOfDay } }, _sum: { amountKobo: true }, _count: true }),
    db.credit.count({ where: { sellerId: seller.id, state: { in: ["HELD", "UNMATCHED"] } } }),
  ]);
  const rows = orders.map((o) => ({
    id: o.id,
    amountKobo: o.amountKobo,
    reference: o.reference,
    note: o.note,
    state: o.state,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
  }));
  const waiting = orders.filter((o) => o.state === "PENDING").length;
  const first = seller.name.split(" ")[0];

  return (
    <main className="space-y-5">
      <header className="app-head">
        <Wordmark size={26} />
        <div className="flex items-center gap-2">
          <ThemeToggle className="icon-btn" />
          <form action={logoutAction}>
            <button className="icon-btn" aria-label="Sign out" title="Sign out"><LogOut size={18} aria-hidden="true" /></button>
          </form>
        </div>
      </header>

      <section className="app-hero" aria-label="Today">
        <div className="app-hero-top">
          <div>
            <p className="app-hero-hi">Hi {first}</p>
            <p className="app-hero-acct">{seller.bankName ?? "Bank"} · {seller.accountNumber ?? "no account yet"}</p>
          </div>
          <Mark size={40} state="entered" className="app-hero-mark" />
        </div>
        <p className="app-hero-k">Confirmed today</p>
        <p className="app-hero-amt font-display">{naira(today._sum.amountKobo ?? 0)}</p>
        <div className="app-hero-stats">
          <span><b>{today._count}</b> paid</span>
          <span><b>{waiting}</b> waiting</span>
          {pendingCredits > 0 && <Link href="/credits"><b>{pendingCredits}</b> to assign</Link>}
        </div>
      </section>

      <Link href="/new" className="btn btn-primary w-full app-collect">
        <Plus size={20} aria-hidden="true" /> Collect a payment
      </Link>

      <LiveOrders initial={rows} />
    </main>
  );
}
