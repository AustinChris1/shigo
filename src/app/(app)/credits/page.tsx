import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { naira } from "@/lib/money";
import { assignCreditAction } from "@/lib/actions";
import { bankAppPkgOf, holdReasonOf } from "@/lib/rails/labels";
import { BANK_APPS } from "@/lib/rails/bankapp";
import { BankBadge } from "@/components/BankBadge";

export const dynamic = "force-dynamic";

// Money that arrived but could not be tied to exactly one order. The seller decides; the app never guesses.
export default async function Credits() {
  const seller = await currentSeller();
  if (!seller) redirect("/login");

  const credits = await db.credit.findMany({ where: { sellerId: seller.id, state: { in: ["HELD", "UNMATCHED"] } }, orderBy: { occurredAt: "desc" } });
  const open = await db.order.findMany({ where: { sellerId: seller.id, state: "PENDING" }, orderBy: { createdAt: "desc" } });

  return (
    <main className="space-y-5">
      <header>
        <Link href="/app" className="text-sm text-(--muted)">← Orders</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Unmatched money</h1>
        <p className="text-sm text-(--muted)">Pick the order each payment belongs to.</p>
      </header>

      {credits.length === 0 && <p className="card p-4 text-sm text-(--muted)">Nothing waiting.</p>}

      {credits.map((c) => {
        const fits = open.filter((o) => o.amountKobo === c.amountKobo);
        const pkg = c.rail === "bankapp" ? bankAppPkgOf(c.raw) : null;
        const reason = holdReasonOf(c.raw);
        return (
          <section key={c.id} className="card space-y-3 p-4">
            <div className="flex items-center gap-3">
              {pkg && <BankBadge pkg={pkg} label={BANK_APPS[pkg] ?? "Bank"} size={40} />}
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold">{naira(c.amountKobo)}</div>
                <div className="truncate text-xs text-(--muted)">
                  {[c.payerName, new Date(c.occurredAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), !pkg && c.narration ? `"${c.narration}"` : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className={`pill ${c.state === "HELD" ? "pill-amber" : "pill-grey"}`}>{c.state === "HELD" ? "Pick one" : "No order"}</span>
            </div>
            {reason && <p className="text-xs font-semibold text-(--amber)">{reason}</p>}
            {fits.length === 0 ? (
              <p className="text-sm text-(--muted)">No open {naira(c.amountKobo)} order.</p>
            ) : (
              <form action={assignCreditAction} className="space-y-2">
                <input type="hidden" name="creditId" value={c.id} />
                <select name="orderId" className="input" defaultValue="">
                  <option value="" disabled>Which order is this?</option>
                  {fits.map((o) => (
                    <option key={o.id} value={o.id}>
                      {[o.buyerName, o.note].filter(Boolean).join(" · ") || "Order"} · {new Date(o.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                    </option>
                  ))}
                </select>
                <button className="btn btn-green w-full" type="submit">Mark that order paid</button>
              </form>
            )}
          </section>
        );
      })}
    </main>
  );
}
