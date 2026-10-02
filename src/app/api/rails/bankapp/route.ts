import { db } from "@/lib/db";
import { deviceFromBearer } from "@/lib/device";
import { ingestCredit } from "@/lib/match";
import { alertFingerprint, bankAppLabel, readAlert, sameAccount } from "@/lib/rails/bankapp";

export const dynamic = "force-dynamic";

// The Shigo Android app sends each alert from an allowed bank app on the seller's phone here.
// Body: { app, title, text, postedAt, shownAt, receivedAt, sentAt } with times in the phone's own clock (ms).
// postedAt: when Android got it; shownAt: the notification's own time, unchanged when the bank app updates it.
const STALE_MS = 10 * 60 * 1000; // an alert the phone first saw this long after the bank app posted it is not acted on
const MAX_PER_HOUR = 120;

export async function POST(req: Request) {
  const device = await deviceFromBearer(req.headers.get("authorization"));
  if (!device) return Response.json({ error: "unknown or revoked device" }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const app = typeof b.app === "string" ? b.app : "";
  const title = typeof b.title === "string" ? b.title.slice(0, 200) : null;
  const text = typeof b.text === "string" ? b.text.slice(0, 2000) : "";
  const postedAt = Number(b.postedAt), receivedAt = Number(b.receivedAt), sentAt = Number(b.sentAt);
  if (!bankAppLabel(app)) return Response.json({ error: "app not allowed" }, { status: 400 });
  if (!text || ![postedAt, receivedAt, sentAt].every(Number.isFinite)) return Response.json({ error: "missing fields" }, { status: 400 });

  const sellerId = device.sellerId;
  const recent = await db.bankAlert.count({ where: { deviceId: device.id, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
  if (recent >= MAX_PER_HOUR) return Response.json({ error: "too many alerts" }, { status: 429 });
  await db.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });

  // Phone clocks can be wrong, so only differences between the phone's own times are trusted.
  const sinceBank = Math.min(Math.max(0, sentAt - postedAt), 7 * 24 * 3600_000);
  const occurredAt = new Date(Date.now() - sinceBank);
  // An updated notification is posted again with the same shownAt and text, so it is stored once.
  const shownAt = Number.isFinite(Number(b.shownAt)) ? Number(b.shownAt) : postedAt;
  const fingerprint = alertFingerprint(sellerId, app, shownAt, title, text);

  const seen = await db.bankAlert.findUnique({ where: { sellerId_fingerprint: { sellerId, fingerprint } } });
  if (seen) return Response.json({ status: seen.status, replay: true });

  const reading = readAlert(title, text);
  const stale = receivedAt - postedAt > STALE_MS;
  // Money in, but into a different account from the one on the seller's orders: real, yet not proof this buyer paid.
  const account = sameAccount(app, `${title ?? ""} ${text}`, device.seller);
  const otherAccount = reading.kind === "credit" && !account.ok;
  const status = stale ? "stale" : otherAccount ? "check" : reading.kind;
  const amountKobo = "amountKobo" in reading ? reading.amountKobo : null;
  const payerName = "payerName" in reading ? (reading.payerName ?? null) : null;
  const reason = stale ? "Seen too long after it arrived" : otherAccount ? account.reason! : "reason" in reading ? reading.reason : null;

  const alert = await db.bankAlert.create({
    data: { sellerId, deviceId: device.id, app, title, text, postedAt: occurredAt, fingerprint, status, reason, amountKobo, payerName },
  });

  if (stale || (reading.kind !== "credit" && reading.kind !== "check") || !device.seller.railAccountRef) {
    return Response.json({ status });
  }

  const r = await ingestCredit({
    rail: "bankapp",
    externalId: fingerprint,
    amountKobo: reading.amountKobo,
    currency: "NGN",
    accountRef: device.seller.railAccountRef,
    payerName: reading.payerName,
    narration: text.slice(0, 300),
    occurredAt,
    holdForSeller: reading.kind === "check" || !account.ok,
    raw: { app, title, text, alertId: alert.id, holdReason: !account.ok ? account.reason : reading.kind === "check" ? reading.reason : undefined },
  });
  await db.bankAlert.update({ where: { id: alert.id }, data: { creditId: r.creditId } });
  return Response.json({ status, match: r.status });
}
