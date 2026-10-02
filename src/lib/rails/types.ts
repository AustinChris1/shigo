// Every rail (Ecobank, Paystack, bank-app alerts, local simulator) normalises to a CreditEvent so the matcher never knows the bank.

export type RailId = "ecobank" | "paystack" | "bankapp" | "simulated";

export interface CreditEvent {
  rail: RailId;
  externalId: string; // the rail's id for this transaction; used for idempotency
  amountKobo: number;
  currency: "NGN";
  accountRef: string; // which receiving account this credit hit (maps to Seller.railAccountRef)
  narration?: string;
  payerName?: string;
  occurredAt: Date;
  // Never settle this credit on its own: hold it (or keep it unmatched) for the seller to decide.
  holdForSeller?: boolean;
  raw: unknown;
}

export interface RailAdapter {
  id: RailId;
  // rawBody must be the exact bytes received; signatures are computed over them.
  verify(headers: Headers, rawBody: string): boolean;
  // Non-credit events return null.
  parse(body: unknown): CreditEvent | null;
}
