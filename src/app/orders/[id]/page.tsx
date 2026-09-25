import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { naira } from "@/lib/money";
import { cancelOrderAction } from "@/lib/actions";
import { OrderLive } from "@/components/OrderLive";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reported?: string }> }) {
  const seller = await currentSeller();
  if (!seller) redirect("/login");
  const { id } = await params;
  const { reported } = await searchParams;
  const order = await db.order.findFirst({ where: { id, sellerId: seller.id }, include: { credit: true } });
  if (!order) notFound();

  const payText = [
    `Please pay ${naira(order.amountKobo)}${order.note ? ` for ${order.note}` : ""}.`,
    `${seller.bankName ?? "Bank"}: ${seller.accountNumber ?? "(account)"}`,
    `Name: ${seller.name}`,
    `Put ${order.reference} in the narration. I will see it the moment it lands.`,
  ].join("\n");
  const wa = `https://wa.me/?text=${encodeURIComponent(payText)}`;

  return (
    <main className="space-y-5">
      <header>
        <Link href="/" className="text-sm text-[var(--muted)]">← Orders</Link>
      </header>

      <OrderLive
        orderId={order.id}
        initialState={order.state}
        amountKobo={order.amountKobo}
        reference={order.reference}
        note={order.note}
        paidAt={order.paidAt?.toISOString() ?? null}
        payer={order.credit?.payerName ?? null}
        rail={order.credit?.rail ?? null}
      />

      {reported && <p className="card border-[var(--green)] bg-[var(--green-bg)] p-3 text-sm">Report saved. Send it to your bank from the ledger page.</p>}

      {order.state === "PENDING" && (
        <>
          <section className="card space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Buyer pays to</h2>
            <div className="text-lg font-semibold">{seller.bankName ?? "Bank"} · {seller.accountNumber ?? "add your account number"}</div>
            <div className="text-sm">{seller.name}</div>
            <div className="text-sm">
              Narration: <span className="font-mono font-bold">{order.reference}</span>
              <span className="block text-xs text-[var(--muted)]">Optional. If the buyer forgets it, exact amount still matches when this is your only open order at that amount.</span>
            </div>
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-green w-full">Send details on WhatsApp</a>
          </section>

          <div className="flex gap-2">
            <Link href={`/report/${order.id}`} className="btn btn-ghost flex-1">They showed me a receipt</Link>
            <form action={cancelOrderAction} className="flex-1">
              <input type="hidden" name="orderId" value={order.id} />
              <button className="btn btn-ghost w-full" type="submit">Cancel order</button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}
