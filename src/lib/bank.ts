import { ecobankConfigured, validateEcobankAccount } from "./ecobank";

// Account verification against the bank's own record: Ecobank's Validate Account Name for Ecobank accounts once
// Ecobank credentials exist, otherwise Paystack's resolver (which covers every Nigerian bank).
export type Resolve = { status: "found"; name: string } | { status: "notfound"; message: string } | { status: "unavailable" };

const ECOBANK_NIP_CODE = "050";

export async function resolveAccount(account: string, bankCode: string): Promise<Resolve> {
  if (bankCode === ECOBANK_NIP_CODE && ecobankConfigured()) {
    try {
      const r = await validateEcobankAccount(account);
      if (r.found && r.active) return { status: "found", name: r.name };
      if (r.found) return { status: "notfound", message: "This Ecobank account is not active." };
      return { status: "notfound", message: "not found" };
    } catch {
      /* Ecobank unreachable or token refused: fall back to Paystack below */
    }
  }
  return resolveWithPaystack(account, bankCode);
}

async function resolveWithPaystack(account: string, bankCode: string): Promise<Resolve> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || key.includes("dummy")) return { status: "unavailable" };
  try {
    const r = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account}&bank_code=${encodeURIComponent(bankCode)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (r.status === 401 || r.status === 403 || r.status >= 500) return { status: "unavailable" };
    const d = (await r.json()) as { status?: boolean; data?: { account_name?: string }; message?: string };
    if (!r.ok || !d.status || !d.data?.account_name) return { status: "notfound", message: d.message ?? "not found" };
    return { status: "found", name: d.data.account_name };
  } catch {
    return { status: "unavailable" };
  }
}

const tokens = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((t) => t.length >= 2);

// Bank names come as "OBI ADAEZE CHIOMA"; people type "Ada Obi". A typed word counts when it starts an account-name word,
// in either direction (Ada/Adaeze). Two words must match, or every word when only one was typed.
export function nameTallies(typed: string, onAccount: string): boolean {
  const t = tokens(typed);
  const a = tokens(onAccount);
  if (t.length === 0 || a.length === 0) return false;
  const hits = t.filter((w) => a.some((x) => x.startsWith(w) || w.startsWith(x))).length;
  return t.length === 1 ? hits === 1 : hits >= 2;
}
