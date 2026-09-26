import { NextResponse } from "next/server";
import { resolveAccount } from "@/lib/bank";

// Live check while typing; the sign-in action verifies again on the server before saving.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const account = url.searchParams.get("account") ?? "";
  const bank = url.searchParams.get("bank") ?? "";
  if (!/^\d{10}$/.test(account) || !bank) return NextResponse.json({ error: "account must be 10 digits and bank is required" }, { status: 400 });
  const r = await resolveAccount(account, bank);
  if (r.status === "unavailable") return NextResponse.json({ unavailable: true, limit: r.reason === "limit" });
  if (r.status === "notfound") return NextResponse.json({ found: false, message: r.message });
  return NextResponse.json({ found: true, name: r.name });
}
