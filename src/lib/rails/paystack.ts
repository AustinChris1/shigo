import { createHmac, timingSafeEqual } from "crypto";
import type { CreditEvent, RailAdapter } from "./types";

// Paystack DVA rail (declared fallback): HMAC-SHA512 of the raw body in x-paystack-signature; credits arrive as charge.success on dedicated_nuban.

type PaystackCharge = {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number; // kobo
    currency: string;
    channel?: string;
    paid_at?: string;
    created_at?: string;
    metadata?: Record<string, unknown> | null;
    authorization?: {
      channel?: string;
      sender_name?: string;
      narration?: string;
      receiver_bank_account_number?: string;
    } | null;
    customer?: { email?: string } | null;
  };
};

export const paystackRail: RailAdapter = {
  id: "paystack",

  verify(headers, rawBody) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const sig = headers.get("x-paystack-signature");
    if (!secret || !sig) return false;
    const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(sig, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  },

  parse(body): CreditEvent | null {
    const e = body as PaystackCharge;
    if (e?.event !== "charge.success") return null;
    const d = e.data;
    if (d.currency && d.currency !== "NGN") return null;
    const channel = d.channel ?? d.authorization?.channel;
    // Only transfer credits into the dedicated account count as money landing.
    if (channel && channel !== "dedicated_nuban" && channel !== "bank_transfer") return null;
    const accountRef = d.authorization?.receiver_bank_account_number;
    if (!accountRef) return null;
    return {
      rail: "paystack",
      externalId: String(d.id ?? d.reference),
      amountKobo: d.amount,
      currency: "NGN",
      accountRef,
      narration: d.authorization?.narration ?? undefined,
      payerName: d.authorization?.sender_name ?? undefined,
      occurredAt: new Date(d.paid_at ?? d.created_at ?? Date.now()),
      raw: body,
    };
  },
};
