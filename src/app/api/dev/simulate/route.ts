import { NextResponse } from "next/server";
import { z } from "zod";
import { ingestCredit } from "@/lib/match";

// Local test harness through the real matcher; must be off on any deployment shown as a real rail.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  accountRef: z.string().min(1),
  amountKobo: z.number().int().positive(),
  narration: z.string().optional(),
  payerName: z.string().optional(),
  externalId: z.string().optional(),
});

export async function POST(req: Request) {
  if (process.env.ALLOW_SIMULATED_CREDITS !== "1") {
    return NextResponse.json({ ok: false, error: "simulator disabled" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const result = await ingestCredit({
    rail: "simulated",
    externalId: b.externalId ?? `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amountKobo: b.amountKobo,
    currency: "NGN",
    accountRef: b.accountRef,
    narration: b.narration,
    payerName: b.payerName ?? "Simulated payer",
    occurredAt: new Date(),
    raw: { simulated: true, ...b },
  });
  return NextResponse.json({ ok: true, result });
}
