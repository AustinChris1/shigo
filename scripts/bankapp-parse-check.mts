// Bank-app alert reading rules; run: node scripts/bankapp-parse-check.mts
// These alert texts are made up to exercise the rules. They are not copies of real bank alerts; swap in real ones
// from the pilot (Alerts screen) as they arrive.
import { readAlert, type AlertReading } from "../src/lib/rails/bankapp.ts";

type Want = Partial<AlertReading> & { kind: AlertReading["kind"] };
const cases: [string | null, string, Want][] = [
  // plain credits
  ["Money received", "You have received ₦18,000.00 from CHIDI OKAFOR", { kind: "credit", amountKobo: 1_800_000, payerName: "CHIDI OKAFOR" }],
  ["Credit Alert", "NGN 5,000 has been credited to your account from Ada Obi.", { kind: "credit", amountKobo: 500_000, payerName: "Ada Obi" }],
  ["Transfer", "CHIDI OKAFOR sent you ₦7,250", { kind: "credit", amountKobo: 725_000, payerName: "CHIDI OKAFOR" }],
  [null, "Credit: N2,500.50 from TUNDE BELLO via Transfer", { kind: "credit", amountKobo: 250_050, payerName: "TUNDE BELLO" }],
  // the balance or a charge is not the payment
  ["Credit Alert", "₦18,000 received from CHIDI OKAFOR. Bal: ₦52,340.10", { kind: "credit", amountKobo: 1_800_000 }],
  [null, "You received NGN10,000 from AMAKA EZE. Stamp duty ₦50 charged. Available balance NGN 60,000", { kind: "credit", amountKobo: 1_000_000 }],
  // never guess
  ["Money received", "You have received ₦1.00 from CHIDI. Note: you have received ₦18,000", { kind: "unclear" }],
  ["Money received", "You have received money from CHIDI", { kind: "unclear" }],
  // money in, but the seller should decide
  ["Reversal", "₦18,000 has been credited to you. Reversal of failed transfer", { kind: "check", amountKobo: 1_800_000 }],
  [null, "Cashback received: ₦50", { kind: "check", amountKobo: 5_000 }],
  // not money in at all
  ["Debit Alert", "₦3,000 was debited from your account to MTN Airtime", { kind: "not_credit" }],
  ["Transfer successful", "You sent ₦18,000 to CHIDI OKAFOR", { kind: "not_credit" }],
  ["OPay", "Get up to ₦5,000 bonus this weekend!", { kind: "not_credit" }],
  ["Payment request", "CHIDI requested ₦18,000 from you", { kind: "not_credit" }],
  ["Card", "Your credit card was charged ₦5,000 at SHOPRITE", { kind: "not_credit" }],
  [null, "Good news! Your credit limit is now ₦50,000", { kind: "not_credit" }],
];

let fails = 0;
for (const [title, text, want] of cases) {
  const got = readAlert(title, text);
  const ok = Object.entries(want).every(([k, v]) => (got as Record<string, unknown>)[k] === v);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${want.kind.padEnd(10)} ${text}${ok ? "" : `\n      got ${JSON.stringify(got)}`}`);
}
console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
