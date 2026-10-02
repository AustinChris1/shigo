import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { naira } from "@/lib/money";
import { assignCreditAction } from "@/lib/actions";
import { confirmedBy, holdReasonOf } from "@/lib/rails/labels";

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
        <p className="text-sm text-(--muted)">Payments that fit more than one order, or none, or that Shigo was not sure about. Pick the order each one belongs to.</p>
      </header>

      {credits.length === 0 && <p className="card p-4 text-sm text-(--muted)">Nothing waiting. Every confirmed payment is tied to an order.</p>}

      {credits.map((c) => {
        const fits = open.filter((o) => o.amountKobo === c.amountKobo);
        return (
          <section key={c.id} className="card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">{naira(c.amountKobo)}</div>
                <div className="text-xs text-(--muted)">
                  {new Date(c.occurredAt).toLocaleString("en-NG")}
                  {c.payerName ? ` · ${c.payerName}` : ""}
                  {c.narration ? ` · "${c.narration}"` : ""}
                </div>
                <div className="text-xs text-(--muted)">{confirmedBy(c.rail, c.raw)}</div>
                {holdReasonOf(c.raw) && <div className="mt-1 text-xs font-semibold text-(--amber)">Held: {holdReasonOf(c.raw)}</div>}
              </div>
              <span className={`pill ${c.state === "HELD" ? "pill-amber" : "pill-grey"}`}>{c.state === "HELD" ? "Pick one" : "No order"}</span>
            </div>
            {fits.length === 0 ? (
              <p className="text-sm text-(--muted)">No open order for this amount. Create one for {naira(c.amountKobo)} and come back, or leave it here as a record.</p>
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
