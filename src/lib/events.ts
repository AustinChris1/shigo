import { EventEmitter } from "events";

// In-process bus feeding SSE; single-instance only, swap for Redis pub/sub to scale out.

export type ShigoEvent =
  | { type: "order.paid"; orderId: string; amountKobo: number; reference: string; paidAt: string }
  | { type: "credit.held"; creditId: string; amountKobo: number; candidateOrderIds: string[] }
  | { type: "credit.unmatched"; creditId: string; amountKobo: number }
  | { type: "order.created"; orderId: string };

const g = globalThis as unknown as { shigoBus?: EventEmitter };
export const bus = g.shigoBus ?? new EventEmitter();
bus.setMaxListeners(1000);
if (process.env.NODE_ENV !== "production") g.shigoBus = bus;

export function emitToSeller(sellerId: string, event: ShigoEvent) {
  bus.emit(`seller:${sellerId}`, event);
}

export function subscribe(sellerId: string, fn: (e: ShigoEvent) => void) {
  const key = `seller:${sellerId}`;
  bus.on(key, fn);
  return () => bus.off(key, fn);
}
