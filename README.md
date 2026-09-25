# Shigo

*It has entered.* The seller's screen turns green only when the bank says so.

Shigo is a mobile-first web app for student sellers on WhatsApp. The seller creates an order, the buyer pays by normal transfer from any bank, and the order turns green only when the receiving bank's webhook confirms the credit into the seller's Ecobank Blaze account. Every confirmed payment becomes a row in a ledger the seller owns and can export as an income record.

Built for InnovateX 2026 (Ecobank / Blaze), Track A: Inclusive Finance. See `Shigo-InnovateX-2026-Build-Brief.docx` for the full brief.

## Run it locally

```bash
npm install
cp .env.example .env        # ALLOW_SIMULATED_CREDITS=1 is already set for local testing
npx prisma db push          # creates prisma/dev.db
npm run dev                 # http://localhost:3000
```

Sign in at `/login` with any 11-digit phone number and the account number buyers pay into. That account number is what the rail's webhook must carry as the receiving account.

## The five-step test script

1. In the app, create an order for ₦4,500.
2. Fire a credit for ₦4,500 at the account you signed up with:
   ```bash
   curl -X POST localhost:3000/api/dev/simulate -H 'content-type: application/json' \
     -d '{"accountRef":"0123456789","amountKobo":450000,"narration":"SG-XXXX","payerName":"Ada"}'
   ```
3. The order turns green within seconds; the ledger shows one new row.
4. `/ledger/export` produces a one-page record (Save as PDF).
5. Fire a credit for a different amount; nothing turns green, and it appears under Unmatched.

`node scripts/e2e-local.mjs` runs the matcher rules end to end against a running dev server.

## Rails

All rails are normalised into one `CreditEvent` (`src/lib/rails/types.ts`) before matching. The matcher never knows which bank it is talking to.

| Rail | Endpoint | Status |
| --- | --- | --- |
| Ecobank Notification Service (primary) | `POST /api/webhooks/ecobank` | Adapter written against the public sandbox description; payload fields and signing must be confirmed against a real sandbox callback. |
| Paystack Dedicated Virtual Accounts, test mode (declared fallback) | `POST /api/webhooks/paystack` | HMAC-SHA512 verification on the raw body; handles `charge.success` on `dedicated_nuban`. |
| Simulator (local only) | `POST /api/dev/simulate` | Enabled only when `ALLOW_SIMULATED_CREDITS=1`. Never on a deployment shown as a real rail. |

For real webhooks in development, expose the server with `ngrok http 3000` or `cloudflared tunnel --url http://localhost:3000` and register the public URL with the rail.

## Matching rules (src/lib/match.ts)

1. Same `(rail, externalId)` is processed once. Replays return the stored result.
2. An order reference in the narration (`SG-XXXX`) wins when the amount is exact.
3. Otherwise exact amount, only when the seller has exactly one open order at that amount in the last 24 hours.
4. Two or more fit: the credit is HELD and the seller picks. Never auto-green.
5. Nothing fits: the credit is UNMATCHED and shown to the seller to assign. A real payment is never lost.

## What is deliberately not here

No shared blacklist, no receipt image detection, no BVN lookups, no watchlist claims. The report feature stores what the seller was shown, on the seller's own account, for the seller to send to their own bank.

## Before any public pilot

- Replace the phone-only sign-in (`src/lib/session.ts`) with OTP and a signed session.
- Switch `DATABASE_URL` to Postgres and change the provider in `prisma/schema.prisma`.
- Set `ALLOW_SIMULATED_CREDITS=0`.
