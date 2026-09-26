import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";

// Signed session: the cookie holds "<sellerId>.<hmac>", so it cannot be forged or edited without SESSION_SECRET.
const COOKIE = "shigo_seller";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (32+ characters)");
  return "dev-only-session-secret-change-me-0000000000";
}

const sign = (id: string) => createHmac("sha256", secret()).update(id).digest("base64url");

function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const a = Buffer.from(value.slice(dot + 1));
  const b = Buffer.from(sign(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export async function currentSeller() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  const id = raw ? verify(raw) : null;
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
  jar.set(COOKIE, `${sellerId}.${sign(sellerId)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
