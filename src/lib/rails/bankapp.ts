import { createHash } from "crypto";

// Bank-app alerts: the Shigo Android app reads the credit alert a bank app shows on the SELLER's own phone and
// sends it here. Only the bank's installed app can post that alert, so a buyer's screenshot, SMS or WhatsApp
// message cannot produce one. It is weaker evidence than the bank calling Shigo directly (the seller's phone
// reports it), so these credits are always labelled "read from the bank app alert", never "confirmed by the bank".

// Package names checked against each app's Google Play listing on 2 Oct 2026. Never add SMS or messaging apps:
// anyone can send a fake "you have received" message through them.
export const BANK_APPS: Record<string, string> = {
  "team.opay.pay": "OPay",
  "com.moniepoint.personal": "Moniepoint",
  "com.moniepoint.business": "Moniepoint Business",
  "com.transsnet.palmpay": "PalmPay",
  "com.kudabank.app": "Kuda",
  "com.app.ecobank": "Ecobank",
  "com.ecobank.mobileapp5": "Ecobank",
  "com.ecobankbusiness": "Ecobank Business",
  "com.gtbank.gtworldv1": "GTWorld",
  "com.zenithBank.eazymoney": "Zenith Bank",
  "com.accessbank.nextgen": "Access Bank",
  "com.accessbank.accessbankapp": "Access Bank",
  "com.firstbank.firstmobile": "FirstMobile",
  "com.wemabank.alat.prod": "ALAT",
  "com.uba.vericash": "UBA",
  "com.fidelitybank.mobile": "Fidelity Bank",
};

// Which bank each app's alerts are about, as NIP codes from src/lib/banks.json. An alert only settles an order when
// it comes from the app of the bank on the seller's Shigo account: money into the seller's other accounts is real,
// but it is not the account the buyer was told to pay, so it could be an unrelated payment of the same amount.
export const BANK_APP_CODES: Record<string, string[]> = {
  "team.opay.pay": ["999992"],
  "com.moniepoint.personal": ["50515"],
  "com.moniepoint.business": ["50515"],
  "com.transsnet.palmpay": ["999991"],
  "com.kudabank.app": ["50211"],
  "com.app.ecobank": ["050"],
  "com.ecobank.mobileapp5": ["050"],
  "com.ecobankbusiness": ["050"],
  "com.gtbank.gtworldv1": ["058"],
  "com.zenithBank.eazymoney": ["057"],
  "com.accessbank.nextgen": ["044", "063"],
  "com.accessbank.accessbankapp": ["044", "063"],
  "com.firstbank.firstmobile": ["011"],
  "com.wemabank.alat.prod": ["035", "035A"],
  "com.uba.vericash": ["033"],
  "com.fidelitybank.mobile": ["070"],
};

// Masked account digits some alerts carry: "****2338", "xx2338", "...2338", "ending 2338".
const MASKED_ACCOUNT = /(?:\*+|x{2,}|\.{3}|ending (?:in )?)\s?(\d{3,4})\b/i;

// Is this alert about the account on the seller's orders? Unknown means no: never guess.
export function sameAccount(app: string, text: string, seller: { bankCode: string | null; accountNumber: string | null }): { ok: boolean; reason?: string } {
  const label = BANK_APPS[app] ?? "that";
  if (app === TEST_APP) return { ok: true };
  if (!seller.bankCode || !BANK_APP_CODES[app]?.includes(seller.bankCode)) {
    return { ok: false, reason: `Arrived in your ${label} account, not the one buyers are told to pay` };
  }
  const tail = text.match(MASKED_ACCOUNT)?.[1];
  if (tail && seller.accountNumber && !seller.accountNumber.endsWith(tail)) {
    return { ok: false, reason: `For your ${label} account ending ${tail}, not the one buyers are told to pay` };
  }
  return { ok: true };
}

// The debug build of the Android app posts its own test alerts under this name. Accepted only where simulated
// credits are allowed (local tests), never on the live site.
export const TEST_APP = "app.shigo.test";

export function bankAppLabel(pkg: string): string | null {
  if (pkg === TEST_APP) return process.env.ALLOW_SIMULATED_CREDITS === "1" ? "Shigo test" : null;
  return BANK_APPS[pkg] ?? null;
}

export type AlertReading =
  | { kind: "credit"; amountKobo: number; payerName?: string }
  // Money came in, but something about it (a reversal, a request, a debit word) means the seller should decide.
  | { kind: "check"; amountKobo: number; payerName?: string; reason: string }
  | { kind: "unclear"; reason: string }
  | { kind: "not_credit" };

// These rules started as a guess. Real alerts seen so far (keep scripts/bankapp-parse-check.mts in step):
//   OPay, 3 Oct 2026: "Incoming Transfer Successful" / "NAME has sent you ₦500.00.  Get up to 6% bonus on OPay Airtime."
// Every alert is kept (BankAlert) so the pilot shows where they are wrong. When in doubt, never auto-green.
const CREDIT = /\b(received|credited|credit(?! card| limit| score)|incoming (?:transfer|payment)|deposit(?:ed)?|money in|sent you)\b|\bcr\b/i;
const DEBIT = /\b(debit(?:ed)?|withdrawn|withdrawal|purchase|you paid|paid to|transfer(?:red)? to|airtime|data bundle|bill payment)\b|\bsent\b(?! you)|\bdr\b/i;
// A sentence that is only an advert (OPay adds one to credit alerts) is dropped before reading.
const ADVERT = /\b(bonus|cashback|promo|offer|reward|up to|discount|win|airtime|data plan)\b/i;
const NOT_A_SALE = /\b(reversal|reversed|refund(?:ed)?|cashback|bonus|reward|promo|offer|up to|loan|request(?:ed)?)\b/i;
const AMOUNT = /(?<![A-Za-z0-9])(?:₦|NGN|N)\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?(?![\d,])/gi;
// An amount right after one of these is a balance or a charge, not the money that came in.
const NOT_THE_PAYMENT = /(bal(?:ance)?|avail(?:able)?|ledger|total|fee|charge[sd]?|duty|vat|levy)\W{0,4}(?:is|of|:|=)?\s*$/i;

// Advert sentences with no money-in words are dropped; everything else is read.
function withoutAdverts(s: string) {
  return s
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !(ADVERT.test(sentence) && !CREDIT.test(sentence)))
    .join(" ");
}

export function readAlert(title: string | null | undefined, text: string): AlertReading {
  const body = withoutAdverts(text.replace(/\s+/g, " ").trim());
  const all = `${title ?? ""} ${body}`.trim();
  if (!CREDIT.test(all)) return { kind: "not_credit" };

  const amounts = new Set<number>();
  for (const m of all.matchAll(AMOUNT)) {
    const before = all.slice(Math.max(0, (m.index ?? 0) - 24), m.index);
    if (NOT_THE_PAYMENT.test(before)) continue;
    const naira = Number(m[1].replace(/,/g, ""));
    const kobo = m[2] ? Number(m[2].padEnd(2, "0")) : 0;
    if (naira > 0 || kobo > 0) amounts.add(naira * 100 + kobo);
  }
  if (amounts.size === 0) return { kind: "unclear", reason: "No amount found" };
  // Two amounts usually means the buyer typed one into the narration. Never pick one.
  if (amounts.size > 1) return { kind: "unclear", reason: "More than one amount" };

  const amountKobo = [...amounts][0];
  // The title is often a label ("Transfer"), so look for the sender in the body first.
  const payerName = readPayer(body) ?? readPayer(all);
  const doubt = all.match(NOT_A_SALE)?.[0] ?? all.match(DEBIT)?.[0];
  if (doubt) return { kind: "check", amountKobo, payerName, reason: `Mentions "${doubt.toLowerCase()}"` };
  return { kind: "credit", amountKobo, payerName };
}

function readPayer(s: string): string | undefined {
  const m =
    s.match(/\bfrom\s+([A-Za-z][A-Za-z.'\- ]{1,60}?)(?=\s*(?:[.,:;|()]|\s-\s|\b(?:on|via|to|ref|at|with|into|for)\b|$))/i) ??
    s.match(/^(?:[A-Za-z ]*:\s*)?([A-Z][A-Za-z.'\- ]{1,60}?)\s+(?:has\s+|have\s+)?sent you\b/);
  const name = m?.[1]?.replace(/\s+/g, " ").trim();
  if (!name || /^(your|you|the|a|an|account|bank|wallet)$/i.test(name)) return undefined;
  return name.slice(0, 60);
}

export function alertFingerprint(sellerId: string, app: string, postedAtMs: number, title: string | null, text: string) {
  return createHash("sha256").update([sellerId, app, String(postedAtMs), title ?? "", text].join("\u0000")).digest("base64url").slice(0, 40);
}
