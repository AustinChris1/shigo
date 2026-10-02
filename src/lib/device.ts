import { createHash, randomBytes } from "crypto";
import { db } from "./db";

// A phone's key to send bank-app alerts for one seller. The phone keeps the key; Shigo keeps only its hash.

const hash = (key: string) => createHash("sha256").update(key).digest("base64url");

export async function createDeviceKey(sellerId: string, label: string | null) {
  const key = `shd_${randomBytes(32).toString("base64url")}`;
  const device = await db.device.create({ data: { sellerId, keyHash: hash(key), label: label?.slice(0, 60) || null } });
  return { key, deviceId: device.id };
}

export async function deviceFromBearer(header: string | null) {
  const key = header?.match(/^Bearer\s+(shd_[A-Za-z0-9_-]{20,})$/)?.[1];
  if (!key) return null;
  const device = await db.device.findUnique({ where: { keyHash: hash(key) }, include: { seller: true } });
  if (!device || device.revokedAt) return null;
  return device;
}
