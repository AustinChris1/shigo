import { createHmac, timingSafeEqual } from "crypto";
import type { CreditEvent, RailAdapter } from "./types";

// Ecobank Notification Service rail (primary): payload fields and signing are unpublished, so this reads defensively until a real sandbox callback confirms them.

const pick = (o: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
};

export const ecobankRail: RailAdapter = {
  id: "ecobank",

  verify(headers, rawBody) {
    // ECOBANK_SIGNATURE_MODE picks shared-secret header or HMAC-SHA256 of the raw body.
    const shared = process.env.ECOBANK_WEBHOOK_SECRET;
    if (!shared) return false;
    const headerName = process.env.ECOBANK_SIGNATURE_HEADER ?? "x-ecobank-signature";
    const sig = headers.get(headerName);
    if (!sig) return false;
    if (process.env.ECOBANK_SIGNATURE_MODE === "shared") {
      const a = Buffer.from(shared), b = Buffer.from(sig);
      return a.length === b.length && timingSafeEqual(a, b);
    }
    const expected = createHmac("sha256", shared).update(rawBody).digest("hex");
    const a = Buffer.from(expected), b = Buffer.from(sig);
    return a.length === b.length && timingSafeEqual(a, b);
  },

  parse(body): CreditEvent | null {
    const o = (body ?? {}) as Record<string, unknown>;
    const data = (o.data ?? o.transaction ?? o) as Record<string, unknown>;
    const type = String(pick(data, ["transactionType", "drCr", "type", "direction"]) ?? "C").toUpperCase();
    if (!(type.startsWith("C") || type === "CREDIT")) return null; // only credits

    const rawAmount = pick(data, ["amount", "transactionAmount", "amt"]);
    const amountNaira = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount ?? "NaN"));
    if (!Number.isFinite(amountNaira)) return null;

    const accountRef = pick(data, ["accountNumber", "accountNo", "creditAccount", "account"]);
    const externalId = pick(data, ["transactionId", "transactionReference", "reference", "id", "tranId"]);
    if (!accountRef || !externalId) return null;

    const when = pick(data, ["transactionDate", "valueDate", "timestamp", "date"]);
    return {
      rail: "ecobank",
      externalId: String(externalId),
      amountKobo: Math.round(amountNaira * 100),
      currency: "NGN",
      accountRef: String(accountRef),
      narration: (pick(data, ["narration", "remarks", "description"]) as string | undefined) ?? undefined,
      payerName: (pick(data, ["senderName", "originatorName", "payerName"]) as string | undefined) ?? undefined,
      occurredAt: when ? new Date(String(when)) : new Date(),
      raw: body,
    };
  },
};
