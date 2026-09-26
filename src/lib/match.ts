import { db } from "./db";
import { emitToSeller } from "./events";
import type { CreditEvent } from "./rails/types";
import { nameTallies } from "./names";

// Matching rules are product decisions (README "Matching rules"): never auto-green an ambiguous credit.

export const REFERENCE_RE = /SG-[A-Z0-9]{4,6}/i;
const OPEN_ORDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export type MatchResult =
  | { status: "matched"; creditId: string; orderId: string; replay: boolean }
  | { status: "held"; creditId: string; candidateOrderIds: string[]; replay: boolean }
  | { status: "unmatched"; creditId: string; replay: boolean }
  | { status: "unknown_account"; creditId: string; replay: boolean };

export async function ingestCredit(ev: CreditEvent): Promise<MatchResult> {
  // 1. Idempotency
  const existing = await db.credit.findUnique({ where: { rail_externalId: { rail: ev.rail, externalId: ev.externalId } } });
  if (existing) {
    if (existing.state === "MATCHED" && existing.orderId) return { status: "matched", creditId: existing.id, orderId: existing.orderId, replay: true };
    if (existing.state === "HELD") return { status: "held", creditId: existing.id, candidateOrderIds: [], replay: true };
    if (!existing.sellerId) return { status: "unknown_account", creditId: existing.id, replay: true };
    return { status: "unmatched", creditId: existing.id, replay: true };
  }

  const seller = await db.seller.findUnique({ where: { railAccountRef: ev.accountRef } });
  const base = {
    rail: ev.rail,
    externalId: ev.externalId,
    amountKobo: ev.amountKobo,
    narration: ev.narration ?? null,
    payerName: ev.payerName ?? null,
    occurredAt: ev.occurredAt,
    raw: JSON.stringify(ev.raw ?? null),
  };

  if (!seller) {
    const c = await db.credit.create({ data: { ...base, state: "UNMATCHED" } });
    return { status: "unknown_account", creditId: c.id, replay: false };
  }

  const since = new Date(Date.now() - OPEN_ORDER_WINDOW_MS);

  // 2. Reference in the narration still wins if a buyer happens to include it (never required).
  const refHit = ev.narration?.match(REFERENCE_RE)?.[0]?.toUpperCase();
  if (refHit) {
    const order = await db.order.findFirst({ where: { sellerId: seller.id, reference: refHit, state: "PENDING" } });
    if (order && order.amountKobo === ev.amountKobo) {
      return settle(seller.id, base, order.id);
    }
    // Reference with a different amount is never forced; fall through to the amount rules.
  }

  // 3. Amount, then the sender's name (the bank credit carries it; buyers never type a code).
  const candidates = await db.order.findMany({
    where: { sellerId: seller.id, state: "PENDING", amountKobo: ev.amountKobo, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });
  const payer = ev.payerName?.trim() ?? "";
  const byName = payer ? candidates.filter((o) => o.buyerName && nameTallies(o.buyerName, payer)) : [];

  // Exactly one order at this amount whose buyer matches the sender: that's the one.
  if (byName.length === 1) return settle(seller.id, base, byName[0].id);

  // One order at this amount: take it, unless the seller named a different buyer. People often pay from a
  // sibling's or friend's account, so a name mismatch is held for the seller to confirm, never guessed or lost.
  if (candidates.length === 1) {
    const only = candidates[0];
    const conflict = !!(payer && only.buyerName && !nameTallies(only.buyerName, payer));
    if (!conflict) return settle(seller.id, base, only.id);
  }

  // Several fit, or the name disagrees: hold for the seller to pick.
  if (candidates.length >= 1) {
    const c = await db.credit.create({ data: { ...base, sellerId: seller.id, state: "HELD" } });
    emitToSeller(seller.id, { type: "credit.held", creditId: c.id, amountKobo: ev.amountKobo, candidateOrderIds: candidates.map((o) => o.id) });
    return { status: "held", creditId: c.id, candidateOrderIds: candidates.map((o) => o.id), replay: false };
  }

  const c = await db.credit.create({ data: { ...base, sellerId: seller.id, state: "UNMATCHED" } });
  emitToSeller(seller.id, { type: "credit.unmatched", creditId: c.id, amountKobo: ev.amountKobo });
  return { status: "unmatched", creditId: c.id, replay: false };
}

// Order paid, credit stored, ledger row written, phone told: all or nothing.
async function settle(
  sellerId: string,
  base: { rail: string; externalId: string; amountKobo: number; narration: string | null; payerName: string | null; occurredAt: Date; raw: string },
  orderId: string,
): Promise<MatchResult> {
  const paidAt = new Date();
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.update({ where: { id: orderId, state: "PENDING" }, data: { state: "PAID", paidAt } });
    const credit = await tx.credit.create({ data: { ...base, sellerId, state: "MATCHED", orderId } });
    await tx.ledgerEntry.create({ data: { sellerId, orderId, amountKobo: order.amountKobo, date: base.occurredAt } });
    return { order, credit };
  });
  emitToSeller(sellerId, { type: "order.paid", orderId, amountKobo: result.order.amountKobo, reference: result.order.reference, paidAt: paidAt.toISOString() });
  return { status: "matched", creditId: result.credit.id, orderId, replay: false };
}

// Seller resolves a HELD or UNMATCHED credit by picking the order.
export async function assignCredit(sellerId: string, creditId: string, orderId: string) {
  const credit = await db.credit.findFirst({ where: { id: creditId, sellerId, state: { in: ["HELD", "UNMATCHED"] } } });
  if (!credit) throw new Error("credit not found or already settled");
  const order = await db.order.findFirst({ where: { id: orderId, sellerId, state: "PENDING" } });
  if (!order) throw new Error("order not found or not open");
  if (order.amountKobo !== credit.amountKobo) throw new Error("amount does not match this order");

  const paidAt = new Date();
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { state: "PAID", paidAt } });
    await tx.credit.update({ where: { id: creditId }, data: { state: "MATCHED", orderId } });
    await tx.ledgerEntry.create({ data: { sellerId, orderId, amountKobo: order.amountKobo, date: credit.occurredAt } });
  });
  emitToSeller(sellerId, { type: "order.paid", orderId, amountKobo: order.amountKobo, reference: order.reference, paidAt: paidAt.toISOString() });
}
