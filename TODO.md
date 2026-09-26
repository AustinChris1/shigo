# Shigo: what is done, what is next

Working list for the team. Tick things off in a PR; keep the honest state, not the hoped-for one.
Deadline: InnovateX 2026 regional selection (dates unpublished), then the finale on 30 October 2026.

## Done

- [x] Product decided and written up: `Shigo-InnovateX-2026-Build-Brief.docx`, `PRODUCT.md`
- [x] Core loop: order, rail webhook, matcher (reference, exact amount, hold when ambiguous, never auto-green), ledger row, live green screen (SSE plus 2 s polling)
- [x] Rails: Ecobank Notification Service adapter (payload unconfirmed), Paystack DVA adapter with HMAC-SHA512 verification, local simulator behind `ALLOW_SIMULATED_CREDITS`
- [x] App screens: sign-in, orders, new order with WhatsApp share, order detail, unmatched credits, ledger, printable income record, fake-receipt report
- [x] Searchable bank picker from the live Nigerian bank list (Ecobank first); account-name check when a Paystack key exists
- [x] Mark and wordmark (coin and slot; Bricolage Grotesque); light and dark themes with a toggle
- [x] Landing page at `/`: photo hero with the looping mechanic, sticky phone scroll story, cited figures, marquee, photo CTA, credits
- [x] Postgres via Prisma; Vercel project linked to GitHub (`main` deploys production); deployment protection off
- [x] Smooth scroll on the landing page (Lenis, synced with the scroll animations; off for reduced motion)
- [x] Tests: `node scripts/e2e-local.mjs` (matcher rules), `node scripts/bank-picker-check.mjs` (bank search), `node scripts/screenshots.mjs` and `node scripts/landing-shots.mjs` (visual review)

## This week (blockers, need a human)

- [ ] Register the team at innovatex.africa under Track A; all four members 18 to 25 with school ID and a Blaze account
- [ ] Email Ecobank developer support: sandbox credentials; does the Notification webhook fire on a personal Blaze account; is there a per-customer virtual account product
- [ ] Ask Ecobank or YouthCred whether six months of verified inflows on a Blaze account affects a corps member's eligibility or limit; keep the written answer
- [ ] Vercel: add Neon (Storage, Create Database) so production has `DATABASE_URL`; then `vercel env pull .env` locally
- [ ] Paystack test account; put `PAYSTACK_SECRET_KEY` in Vercel env; register `https://shigo-austinchris-projects.vercel.app/api/webhooks/paystack`; pay a test virtual account so a real callback lands

## Next in the code

- [ ] Ecobank adapter: replace field guesses in `src/lib/rails/ecobank.ts` once a real sandbox payload is seen; note the source in the file
- [ ] OTP sign-in before any pilot seller uses it (`src/lib/session.ts` is demo-grade)
- [ ] Replace the Unsplash photos in `src/lib/photos.ts` with photos of real sellers (keep the credit shape)
- [ ] Record a 20 s screen capture of the green moment and drop it into the sticky phone slot on the landing page
- [ ] Turn `ALLOW_SIMULATED_CREDITS` off on any deployment shown as a real rail
- [ ] Postgres migrations instead of `prisma db push` at build (`scripts/db-sync.mjs`)
- [ ] Redis or a single-server host if SSE must be instant in production (Vercel uses the 2 s poll)
- [ ] PWA install prompt and offline shell
- [ ] Move from npm to pnpm (team preference): delete `package-lock.json`, `pnpm import`, allow Prisma's build scripts in `pnpm-workspace.yaml`, commit `pnpm-lock.yaml`; Vercel picks pnpm from the lockfile

## Pilot (week 4)

- [ ] Ten student sellers using the app for every order for seven days
- [ ] Log every green, amber and held result; that log is the strongest slide

## Pitch

- [ ] Deck in the order from the brief: moment, crime, damage, user, live demo, pilot, why Ecobank, next, ask
- [ ] Say which rail is live on stage; never call a Paystack test credit an Ecobank deposit
- [ ] Rehearse the version where the sandbox is down

## Rules that do not change

- The bank is the only witness; nothing a buyer shows changes the screen
- Never auto-green an ambiguous credit
- No pilot numbers, users or volumes on any page until the pilot has run
- Plain copy, no em dashes
