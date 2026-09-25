"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { newReference, toKobo } from "./money";
import { assignCredit } from "./match";
import { requireSeller, setSession, clearSession } from "./session";
import { emitToSeller } from "./events";

export async function loginAction(formData: FormData) {
  const phone = String(formData.get("phone") ?? "").replace(/\s+/g, "");
  const name = String(formData.get("name") ?? "").trim();
  const bankName = String(formData.get("bankName") ?? "").trim() || null;
  const accountNumber = String(formData.get("accountNumber") ?? "").replace(/\s+/g, "") || null;
  if (!/^0\d{10}$/.test(phone)) throw new Error("phone must be 11 digits, e.g. 08012345678");
  if (name.length < 2) throw new Error("enter your name");

  const seller = await db.seller.upsert({
    where: { phone },
    create: { phone, name, bankName, accountNumber, railAccountRef: accountNumber },
    update: { name, bankName: bankName ?? undefined, accountNumber: accountNumber ?? undefined, railAccountRef: accountNumber ?? undefined },
  });
  await setSession(seller.id);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
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
  revalidatePath("/");
  redirect(`/orders/${order.id}`);
}

export async function cancelOrderAction(formData: FormData) {
  const seller = await requireSeller();
  const id = String(formData.get("orderId"));
  await db.order.updateMany({ where: { id, sellerId: seller.id, state: "PENDING" }, data: { state: "CANCELLED" } });
  revalidatePath("/");
  redirect("/");
}

export async function assignCreditAction(formData: FormData) {
  const seller = await requireSeller();
  await assignCredit(seller.id, String(formData.get("creditId")), String(formData.get("orderId")));
  revalidatePath("/credits");
  revalidatePath("/");
  redirect("/");
}

export async function createReportAction(formData: FormData) {
  const seller = await requireSeller();
  const orderId = String(formData.get("orderId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const imageDataUrl = String(formData.get("imageDataUrl") ?? "") || null;
  await db.report.create({ data: { sellerId: seller.id, orderId, note, imageDataUrl } });
  redirect(orderId ? `/orders/${orderId}?reported=1` : "/");
}
