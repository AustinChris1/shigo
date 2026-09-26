import { ecobankConfigured, validateEcobankAccount } from "./ecobank";
import { db } from "./db";

// Account verification against the bank's own record: Ecobank's Validate Account Name for Ecobank accounts once
// Ecobank credentials exist, otherwise Paystack's resolver (which covers every Nigerian bank).
export type Resolve = { status: "found"; name: string } | { status: "notfound"; message: string } | { status: "unavailable"; reason?: "limit" };

const ECOBANK_NIP_CODE = "050";

// Lookups are rationed by the provider (Paystack test keys allow 3 a day), so a result is stored for 15 minutes in the
// database: the live check while typing and the server check at "Send me a code" then cost one lookup, not two.
const TTL_MS = 15 * 60 * 1000;

export async function resolveAccount(account: string, bankCode: string): Promise<Resolve> {
  const key = `${bankCode}:${account}`;
  const hit = await db.bankLookup.findUnique({ where: { key } }).catch(() => null);
  if (hit && Date.now() - hit.createdAt.getTime() < TTL_MS) {
    return hit.found && hit.name ? { status: "found", name: hit.name } : { status: "notfound", message: hit.message ?? "not found" };
  }
  const r = await lookup(account, bankCode);
  if (r.status !== "unavailable") {
    const row = { found: r.status === "found", name: r.status === "found" ? r.name : null, message: r.status === "notfound" ? r.message : null, createdAt: new Date() };
    await db.bankLookup.upsert({ where: { key }, create: { key, ...row }, update: row }).catch(() => {});
  }
  return r;
}

async function lookup(account: string, bankCode: string): Promise<Resolve> {
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
    if (r.status === 429) return { status: "unavailable", reason: "limit" };
    if (r.status === 401 || r.status === 403 || r.status >= 500) return { status: "unavailable" };
    const d = (await r.json()) as { status?: boolean; data?: { account_name?: string }; message?: string };
    if (!r.ok || !d.status || !d.data?.account_name) return { status: "notfound", message: d.message ?? "not found" };
    return { status: "found", name: d.data.account_name };
  } catch {
    return { status: "unavailable" };
  }
}

export { nameTallies } from "./names";
