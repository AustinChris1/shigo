"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { newReference, toKobo } from "./money";
import { assignCredit, ingestCredit } from "./match";
import { requireSeller, setSession, clearSession } from "./session";
import { emitToSeller } from "./events";
import { cookies } from "next/headers";
import banks from "./banks.json";
import { resolveAccount, nameTallies } from "./bank";
import { sendOtpSms } from "./sms";
import { createHash, randomInt } from "crypto";
import { createDeviceKey } from "./device";


// A one-shot message the next page shows as a toast (read and cleared by FlashToast).
async function flash(type: "success" | "error" | "info", title: string, description?: string) {
  const jar = await cookies();
  jar.set("shigo_flash", JSON.stringify({ type, title, description }), { path: "/", maxAge: 30, sameSite: "lax" });
}

export type LoginState = { step?: "code"; phone?: string; demoCode?: string; error?: string; accountName?: string; resent?: number };

type Pending = { phone: string; name: string; bankCode: string; bankName: string; accountNumber: string; accountName: string | null; verified: boolean };

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;
const hashCode = (phone: string, code: string) => createHash("sha256").update(`${phone}:${code}:${process.env.SESSION_SECRET ?? "dev"}`).digest("hex");

// Step 1: check the details and the bank account, then send a one-time code. Nothing is saved as a seller yet.
// Step 2: the code must match; only then is the seller saved and signed in.
export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  return String(formData.get("step")) === "code" ? verifyCode(prev, formData) : startSignIn(formData);
}

function reviewLogin(): { phone: string; code: string } | null {
  const phone = process.env.REVIEW_PHONE ?? "";
  const code = process.env.REVIEW_CODE ?? "";
  return /^0\d{10}$/.test(phone) && /^\d{6}$/.test(code) ? { phone, code } : null;
}

async function startSignIn(formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").replace(/\s+/g, "");
  const name = String(formData.get("name") ?? "").trim();
  const bankCode = String(formData.get("bankCode") ?? "").trim();
  const bankName = banks.find((b) => b.code === bankCode)?.name ?? null;
  const accountNumber = String(formData.get("accountNumber") ?? "").replace(/\s+/g, "");
  if (name.length < 2) return { error: "Enter your name as it appears on your bank account." };
  if (!/^0\d{10}$/.test(phone)) return { error: "Phone number must be 11 digits, like 08012345678." };

  // Google Play review: one demo account, reached with REVIEW_PHONE and the secret REVIEW_CODE given to Google in
  // Play Console. No bank check, no SMS, a dummy account number that no bank or webhook can ever credit.
  const review = reviewLogin();
  if (review && phone === review.phone) {
    const pending: Pending = { phone, name: "Play Review", bankCode: "050", bankName: "Ecobank Nigeria", accountNumber: "0000000000", accountName: null, verified: false };
    await db.otpCode.create({ data: { phone, codeHash: hashCode(phone, review.code), payload: JSON.stringify(pending), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
    return { step: "code", phone, resent: Date.now() };
  }

  if (!bankName) return { error: "Pick the bank buyers pay into." };
  if (!/^\d{10}$/.test(accountNumber)) return { error: "Account number must be 10 digits." };

  // The server checks with the bank again; what the browser showed is never trusted.
  const r = await resolveAccount(accountNumber, bankCode);
  if (r.status === "notfound") return { error: `No account ${accountNumber} was found at ${bankName}. Check the number and the bank.` };
  if (r.status === "found" && !nameTallies(name, r.name)) {
    return { error: `This account is in the name ${r.name}. Enter your name as it appears on the account.`, accountName: r.name };
  }
  const existing = await db.seller.findUnique({ where: { railAccountRef: accountNumber } });
  if (existing && existing.phone !== phone) return { error: "This account is already linked to another phone number." };

  const recent = await db.otpCode.count({ where: { phone, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
  if (recent >= MAX_CODES_PER_HOUR) return { error: "Too many codes requested for this number. Try again in an hour." };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const pending: Pending = { phone, name, bankCode, bankName, accountNumber, accountName: r.status === "found" ? r.name : null, verified: r.status === "found" };
  await db.otpCode.create({ data: { phone, codeHash: hashCode(phone, code), payload: JSON.stringify(pending), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });

  const sent = await sendOtpSms(phone, code);
  if (!sent.sent && !sent.demo) return { error: `We could not text your code: ${sent.error}. Try again.` };
  return { step: "code", phone, demoCode: sent.sent ? undefined : code, resent: Date.now() };
}

async function verifyCode(prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  const back = { step: "code" as const, phone, demoCode: prev.demoCode, resent: prev.resent };
  if (code.length !== 6) return { ...back, error: "Enter the 6-digit code." };

  const otp = await db.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.expiresAt < new Date()) return { ...back, error: "That code has expired. Go back and request a new one." };
  if (otp.attempts >= MAX_ATTEMPTS) return { ...back, error: "Too many wrong tries. Go back and request a new code." };
  if (otp.codeHash !== hashCode(phone, code)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { ...back, error: `That code is not right. ${MAX_ATTEMPTS - otp.attempts - 1} tries left.` };
  }

  const p = JSON.parse(otp.payload) as Pending;
  await db.otpCode.deleteMany({ where: { phone } });
  const data = {
    name: p.name,
    bankName: p.bankName,
    bankCode: p.bankCode,
    accountNumber: p.accountNumber,
    railAccountRef: p.accountNumber,
    accountName: p.accountName,
    verifiedAt: p.verified ? new Date() : null,
  };
  const seller = await db.seller.upsert({ where: { phone }, create: { phone, ...data }, update: data });
  await setSession(seller.id);
  await flash("success", `Welcome, ${p.name.split(" ")[0]}`, p.verified ? "Your account is verified with your bank." : "You're signed in. We couldn't check your account with the bank this time, so it shows as not verified.");
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  await flash("info", "Signed out", "See you soon.");
  redirect("/login");
}

export type OrderFormState = { error?: string; amount?: string; buyerName?: string; note?: string };
const MAX_ORDER_KOBO = 10_000_000 * 100;

export async function createOrderAction(_prev: OrderFormState, formData: FormData): Promise<OrderFormState> {
  const seller = await requireSeller();
  const rawAmount = String(formData.get("amount") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const buyerName = String(formData.get("buyerName") ?? "").trim().split(/ +/).join(" ").slice(0, 60) || null;
  const kept = { amount: rawAmount, buyerName: buyerName ?? "", note: note ?? "" };

  // Bad amounts come back to the form with a plain message, never an error page.
  let amountKobo: number;
  try {
    amountKobo = toKobo(rawAmount);
  } catch {
    return { ...kept, error: "Enter an amount above ₦0, like 4500." };
  }
  if (amountKobo > MAX_ORDER_KOBO) return { ...kept, error: "That is over ₦10,000,000. Check the amount." };

  // Retry on the rare reference collision.
  let order = null;
  for (let i = 0; i < 5 && !order; i++) {
    try {
      order = await db.order.create({ data: { sellerId: seller.id, amountKobo, note, buyerName, reference: newReference() } });
    } catch {
      /* collision, try again */
    }
  }
  if (!order) return { ...kept, error: "Could not create the order. Try again." };
  emitToSeller(seller.id, { type: "order.created", orderId: order.id });
  revalidatePath("/app");
  await flash("success", buyerName ? `Waiting for ${buyerName.split(" ")[0]}'s payment` : "Order created", "Send your account details to the buyer on WhatsApp.");
  redirect(`/orders/${order.id}`);
}

export async function cancelOrderAction(formData: FormData) {
  const seller = await requireSeller();
  const id = String(formData.get("orderId"));
  await db.order.updateMany({ where: { id, sellerId: seller.id, state: "PENDING" }, data: { state: "CANCELLED" } });
  revalidatePath("/app");
  await flash("info", "Order cancelled");
  redirect("/app");
}

export async function assignCreditAction(formData: FormData) {
  const seller = await requireSeller();
  await assignCredit(seller.id, String(formData.get("creditId")), String(formData.get("orderId")));
  revalidatePath("/credits");
  revalidatePath("/app");
  await flash("success", "Marked paid", "The payment is now tied to that order and in your ledger.");
  redirect("/app");
}

export async function createReportAction(formData: FormData) {
  const seller = await requireSeller();
  const orderId = String(formData.get("orderId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  // The form sends a shrunk JPEG; anything else (or anything huge) is dropped, the note is still saved.
  const rawImage = String(formData.get("imageDataUrl") ?? "");
  const imageDataUrl = /^data:image\/(jpeg|png|webp);base64,/.test(rawImage) && rawImage.length <= 1_000_000 ? rawImage : null;
  await db.report.create({ data: { sellerId: seller.id, orderId, note, imageDataUrl } });
  await flash("success", "Report saved", "Keep the goods until the order turns green.");
  redirect(orderId ? `/orders/${orderId}` : "/app");
}

// Demo mode (DEMO_MODE=1): the seller sends a labelled test payment to their own open order, so the green moment can be
// shown before a bank is connected. Test payments are marked "simulated" and never count in the exported income record.
export const demoModeOn = async () => process.env.DEMO_MODE === "1";

export async function sendTestPaymentAction(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (process.env.DEMO_MODE !== "1") return { ok: false, error: "Test payments are switched off." };
  const seller = await requireSeller();
  const order = await db.order.findFirst({ where: { id: orderId, sellerId: seller.id, state: "PENDING" } });
  if (!order) return { ok: false, error: "This order is not waiting for payment." };
  if (!seller.railAccountRef) return { ok: false, error: "Add your account number first." };
  const r = await ingestCredit({
    rail: "simulated",
    externalId: `demo_${order.id}_${Date.now()}`,
    amountKobo: order.amountKobo,
    currency: "NGN",
    accountRef: seller.railAccountRef,
    narration: order.note ?? undefined,
    payerName: order.buyerName ? order.buyerName.toUpperCase() : "TEST BUYER",
    occurredAt: new Date(),
    raw: { demo: true },
  });
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/app");
  return r.status === "matched" ? { ok: true } : { ok: false, error: "The test payment arrived but needs you to pick the order under Unmatched." };
}

// Android app: this phone may now send the seller's bank-app alerts. The key goes straight to the app; it is never shown.
export async function pairDeviceAction(label: string | null): Promise<{ key: string }> {
  const seller = await requireSeller();
  const { key } = await createDeviceKey(seller.id, label);
  revalidatePath("/alerts");
  return { key };
}

export async function revokeDeviceAction(formData: FormData) {
  const seller = await requireSeller();
  const id = String(formData.get("deviceId") ?? "");
  await db.device.updateMany({ where: { id, sellerId: seller.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await flash("info", "Phone stopped", "Shigo will ignore bank-app alerts from that phone.");
  revalidatePath("/alerts");
}

// Deletes the stored alert text; payments already matched stay in the ledger.
export async function clearAlertsAction() {
  const seller = await requireSeller();
  await db.bankAlert.deleteMany({ where: { sellerId: seller.id } });
  await flash("info", "Alerts deleted", "Payments already matched stay in your ledger.");
  revalidatePath("/alerts");
}

// Play Store rule and the seller's right: everything goes, at once.
export async function deleteAccountAction(formData: FormData) {
  const seller = await requireSeller();
  if (formData.get("confirm") !== "yes") return;
  const sellerId = seller.id;
  await db.$transaction([
    db.bankAlert.deleteMany({ where: { sellerId } }),
    db.device.deleteMany({ where: { sellerId } }),
    db.ledgerEntry.deleteMany({ where: { sellerId } }),
    db.report.deleteMany({ where: { sellerId } }),
    db.credit.deleteMany({ where: { sellerId } }),
    db.order.deleteMany({ where: { sellerId } }),
    db.otpCode.deleteMany({ where: { phone: seller.phone } }),
    db.seller.delete({ where: { id: sellerId } }),
  ]);
  await clearSession();
  await flash("info", "Account deleted", "Everything Shigo held for you is gone.");
  redirect("/");
}
