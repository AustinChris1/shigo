import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { deleteAccountAction, logoutAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Account() {
  const seller = await currentSeller();
  if (!seller) redirect("/login");
  const [orders, alerts, phones] = await Promise.all([
    db.order.count({ where: { sellerId: seller.id } }),
    db.bankAlert.count({ where: { sellerId: seller.id } }),
    db.device.count({ where: { sellerId: seller.id, revokedAt: null } }),
  ]);

  return (
    <main className="space-y-5">
      <header>
        <Link href="/app" className="text-sm text-(--muted)">← Orders</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Account</h1>
      </header>

      <section className="card space-y-2 p-4 text-sm">
        <div><span className="text-(--muted)">Name</span> · {seller.name}</div>
        <div><span className="text-(--muted)">Phone</span> · {seller.phone}</div>
        <div><span className="text-(--muted)">Bank</span> · {seller.bankName ?? "None"} {seller.accountNumber ?? ""}</div>
        <form action={logoutAction} className="pt-2">
          <button className="btn btn-ghost w-full" type="submit">Sign out</button>
        </form>
      </section>

      <Link href="/alerts" className="card flex items-center justify-between gap-3 p-4 text-sm">
        <span className="flex items-center gap-3">
          <BellRing size={20} aria-hidden="true" />
          <span>
            <span className="block font-semibold">Bank app alerts</span>
            <span className="block text-(--muted)">{phones > 0 ? `On for ${phones} phone${phones === 1 ? "" : "s"}` : "Android app: turn orders green from your bank app's alerts"}</span>
          </span>
        </span>
        <ChevronRight size={18} aria-hidden="true" className="text-(--muted)" />
      </Link>

      <section className="card space-y-3 p-4 text-sm">
        <h2 className="font-semibold">Delete my account</h2>
        <p className="text-(--muted)">Removes {orders} orders, your income record, reports and {alerts} alerts. Cannot be undone. <Link href="/ledger/export" className="underline">Export your record</Link> first.</p>
        <form action={deleteAccountAction} className="space-y-2">
          <label className="flex items-start gap-2">
            <input type="checkbox" name="confirm" value="yes" required className="mt-1" />
            <span>I understand everything will be deleted</span>
          </label>
          <button className="btn w-full border border-red-600 text-red-600" type="submit">Delete my account</button>
        </form>
      </section>

      <p className="text-center text-xs text-(--muted)"><Link href="/privacy" className="underline">Privacy</Link></p>
    </main>
  );
}
