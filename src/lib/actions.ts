"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { newReference, toKobo } from "./money";
import { assignCredit } from "./match";
import { requireSeller, setSession, clearSession } from "./session";
import { emitToSeller } from "./events";
import { cookies } from "next/headers";
import banks from "./banks.json";
import { resolveAccount, nameTallies } from "./bank";


// A one-shot message the next page shows as a toast (read and cleared by FlashToast).
async function flash(type: "success" | "error" | "info", title: string, description?: string) {
  const jar = await cookies();
  jar.set("shigo_flash", JSON.stringify({ type, title, description }), { path: "/", maxAge: 30, sameSite: "lax" });
}

export type LoginState = { error?: string; accountName?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").replace(/\s+/g, "");
  const name = String(formData.get("name") ?? "").trim();
  const bankCode = String(formData.get("bankCode") ?? "").trim();
  const bankName = banks.find((b) => b.code === bankCode)?.name ?? null;
  const accountNumber = String(formData.get("accountNumber") ?? "").replace(/\s+/g, "");
  if (name.length < 2) return { error: "Enter your name as it appears on your bank account." };
  if (!/^0\d{10}$/.test(phone)) return { error: "Phone number must be 11 digits, like 08012345678." };
  if (!bankName) return { error: "Pick the bank buyers pay into." };
  if (!/^\d{10}$/.test(accountNumber)) return { error: "Account number must be 10 digits." };

  // The server checks with the bank again; what the browser showed is never trusted.
  const r = await resolveAccount(accountNumber, bankCode);
  if (r.status === "notfound") return { error: `No account ${accountNumber} was found at ${bankName}. Check the number and the bank.` };
  if (r.status === "found" && !nameTallies(name, r.name)) {
    return { error: `This account is in the name ${r.name}. Enter your name as it appears on the account.`, accountName: r.name };
  }
  const verified = r.status === "found";

  const data = {
    name,
    bankName,
    bankCode,
    accountNumber,
    railAccountRef: accountNumber,
    accountName: verified ? r.name : null,
    verifiedAt: verified ? new Date() : null,
  };
  const existing = await db.seller.findUnique({ where: { railAccountRef: accountNumber } });
  if (existing && existing.phone !== phone) return { error: "This account is already linked to another phone number." };
  const seller = await db.seller.upsert({ where: { phone }, create: { phone, ...data }, update: data });
  await setSession(seller.id);
  await flash("success", `Welcome, ${name.split(" ")[0]}`, verified ? "Your account is verified with your bank." : "You're signed in. Bank verification turns on once a Paystack key is set.");
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  await flash("info", "Signed out", "See you soon.");
  redirect("/login");
}

export async function createOrderAction(formData: FormData) {
  const seller = await requireSeller();
  const amountKobo = toKobo(String(formData.get("amount") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;

  // Retry on the rare reference collision.
  let order = null;
  for (let i = 0; i < 5 && !order; i++) {
    try {
      order = await db.order.create({ data: { sellerId: seller.id, amountKobo, note, reference: newReference() } });
    } catch {
      /* collision, try again */
    }
  }
  if (!order) throw new Error("could not create order, try again");
  emitToSeller(seller.id, { type: "order.created", orderId: order.id });
  revalidatePath("/app");
  await flash("success", `Order ${order.reference} created`, "Send the payment details to your buyer on WhatsApp.");
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
  const imageDataUrl = String(formData.get("imageDataUrl") ?? "") || null;
  await db.report.create({ data: { sellerId: seller.id, orderId, note, imageDataUrl } });
  await flash("success", "Report saved", "Keep the goods until the order turns green.");
  redirect(orderId ? `/orders/${orderId}` : "/app");
}
