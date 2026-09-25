# Shigo (InnovateX 2026 entry)

Next.js 16 app router, TypeScript, Tailwind v4, Prisma 6 + SQLite (dev). Mobile-first PWA; no native app.

- Product rules live in `Shigo-InnovateX-2026-Build-Brief.docx` and README. The matcher rules in `src/lib/match.ts` are product decisions; do not loosen them (never auto-green an ambiguous credit).
- Rails: `src/lib/rails/*`. Every rail normalises to `CreditEvent`. The Ecobank adapter's payload fields are unconfirmed guesses until a real sandbox callback is seen; mark changes there with the source.
- Realtime: in-process EventEmitter (`src/lib/events.ts`) + SSE (`/api/events`). Single-instance only.
- Auth is demo-grade (cookie with seller id). Do not present it as production auth.
- Never say a Paystack test-mode credit is an "Ecobank deposit" in UI copy or docs.
- Build and dev use webpack (`--webpack` in package.json scripts); Turbopack segfaults and OOMs on Node 25 on this machine. Do not remove the flag.
- Verify: `npx tsc --noEmit`, `npx eslint src scripts`, `node scripts/e2e-local.mjs` with `npm run dev` running; `node scripts/screenshots.mjs <sellerId> <orderId>` for light and dark phone screenshots via the local Edge.
- The mark is `src/components/Mark.tsx` (coin outside the slot until the bank confirms, then inside). Keep it inline SVG; never swap in an icon-library glyph.
- Keep copy plain and short; no em dashes in user-facing text.
