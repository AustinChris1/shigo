import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { naira } from "@/lib/money";
import { ReportForm } from "@/components/ReportForm";

export const dynamic = "force-dynamic";

// The seller records what they were shown. It goes to their own bank, never to other sellers.
export default async function Report({ params }: { params: Promise<{ orderId: string }> }) {
  const seller = await currentSeller();
  if (!seller) redirect("/login");
  const { orderId } = await params;
  const order = await db.order.findFirst({ where: { id: orderId, sellerId: seller.id } });
  if (!order) notFound();

  return (
    <main className="space-y-5">
      <header>
        <Link href={`/orders/${order.id}`} className="text-sm text-(--muted)">← Order</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Report a fake receipt</h1>
        <p className="text-sm text-(--muted)">
          Order {order.reference} for {naira(order.amountKobo)} has not been confirmed by the bank. Keep the goods. Save what you were shown so you can send it to your bank.
        </p>
      </header>
      <ReportForm orderId={order.id} />
    </main>
  );
}
