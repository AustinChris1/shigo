import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { deleteAccountAction, logoutAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Account() {
  const seller = await currentSeller();
  if (!seller) redirect("/login");
  const [orders, alerts] = await Promise.all([
    db.order.count({ where: { sellerId: seller.id } }),
    db.bankAlert.count({ where: { sellerId: seller.id } }),
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

      <section className="card space-y-3 p-4 text-sm">
        <h2 className="font-semibold">Delete my account</h2>
        <p className="text-(--muted)">Deletes your account and all {orders} orders, their payments and your income record, your reports, and {alerts} saved bank-app alerts. This cannot be undone. Export your income record first if you need it.</p>
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
