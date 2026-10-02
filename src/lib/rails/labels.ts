import { BANK_APPS } from "./bankapp";

// How a confirmed payment is described to the seller and in the income record. Each rail says only what it proves.

export function bankAppOf(raw: string | null | undefined): string | null {
  try {
    const app = JSON.parse(raw ?? "null")?.app;
    return typeof app === "string" ? (BANK_APPS[app] ?? "bank") : null;
  } catch {
    return null;
  }
}

export function confirmedBy(rail: string | null | undefined, raw?: string | null): string {
  if (rail === "simulated") return "Test payment, not real money";
  if (rail === "bankapp") return `Read from your ${bankAppOf(raw) ?? "bank"} app alert`;
  return "Confirmed by the bank";
}

// For the exported record, which a lender reads.
export function evidenceOf(rail: string | null | undefined, raw?: string | null): string {
  if (rail === "bankapp") return `${bankAppOf(raw) ?? "Bank"} app alert on seller's phone`;
  if (rail === "paystack") return "Bank notification (Paystack)";
  if (rail === "ecobank") return "Bank notification (Ecobank)";
  return rail ?? "";
}
