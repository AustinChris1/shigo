import { NextResponse } from "next/server";
import { ingestCredit } from "../match";
import type { RailAdapter } from "./types";

// Verified but irrelevant events still get 200, because rails retry on anything else.
export async function handleWebhook(rail: RailAdapter, req: Request) {
  const rawBody = await req.text();
  if (!rail.verify(req.headers, rawBody)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const ev = rail.parse(body);
  if (!ev) return NextResponse.json({ ok: true, ignored: true });
  const result = await ingestCredit(ev);
  console.log(`[webhook:${rail.id}]`, result.status, result.replay ? "(replay)" : "", ev.externalId, ev.amountKobo);
  return NextResponse.json({ ok: true, result });
}
