import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { LiveOrders } from "@/components/LiveOrders";
import { logoutAction } from "@/lib/actions";
import { Wordmark } from "@/components/Mark";

export const dynamic = "force-dynamic";

export default async function Home() {
  const seller = await currentSeller();
  if (!seller) redirect("/login");

  const orders = await db.order.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const rows = orders.map((o) => ({
    id: o.id,
    amountKobo: o.amountKobo,
    reference: o.reference,
    note: o.note,
    state: o.state,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
  }));

  return (
    <main className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <h1><Wordmark size={30} /></h1>
          <p className="text-sm text-(--muted)">{seller.name} · {seller.bankName ?? "bank"} {seller.accountNumber ?? ""}</p>
        </div>
        <form action={logoutAction}>
          <button className="text-xs text-(--muted) underline">Sign out</button>
        </form>
      </header>

      <Link href="/new" className="btn btn-primary w-full">
        Collect a payment
      </Link>

      <LiveOrders initial={rows} />
    </main>
  );
}
