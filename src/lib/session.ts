import { cookies } from "next/headers";
import { db } from "./db";

// Demo-grade session (unsigned cookie with seller id); replace with OTP and a signed token before any public pilot.
const COOKIE = "shigo_seller";

export async function currentSeller() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return db.seller.findUnique({ where: { id } });
}

export async function requireSeller() {
  const s = await currentSeller();
  if (!s) throw new Error("not signed in");
  return s;
}

export async function setSession(sellerId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sellerId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
