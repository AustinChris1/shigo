import { NextResponse } from "next/server";

// Account-name lookup via Paystack's resolve endpoint; returns {unavailable:true} when no key is configured.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const account = url.searchParams.get("account") ?? "";
  const bank = url.searchParams.get("bank") ?? "";
  if (!/^\d{10}$/.test(account) || !bank) return NextResponse.json({ error: "account must be 10 digits and bank is required" }, { status: 400 });
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return NextResponse.json({ unavailable: true });
  try {
    const r = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account}&bank_code=${encodeURIComponent(bank)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const data = (await r.json()) as { status?: boolean; data?: { account_name?: string }; message?: string };
    if (r.status === 401 || r.status === 403) return NextResponse.json({ unavailable: true });
    if (!r.ok || !data.status || !data.data?.account_name) return NextResponse.json({ found: false, message: data.message ?? "not found" });
    return NextResponse.json({ found: true, name: data.data.account_name });
  } catch {
    return NextResponse.json({ unavailable: true });
  }
}
