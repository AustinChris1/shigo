import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";

// Polling fallback for hosts where the SSE bus cannot cross instances (Vercel); the phone asks every ~2s.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [orders, pending] = await Promise.all([
    db.order.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, state: true, paidAt: true, amountKobo: true, reference: true } }),
    db.credit.count({ where: { sellerId: seller.id, state: { in: ["HELD", "UNMATCHED"] } } }),
  ]);
  return NextResponse.json(
    { orders: orders.map((o) => ({ ...o, paidAt: o.paidAt?.toISOString() ?? null })), pendingCredits: pending },
    { headers: { "Cache-Control": "no-store" } },
  );
}
