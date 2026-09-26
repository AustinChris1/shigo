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
- [x] Bank verification: the account is resolved with the bank and the name must tally, checked again on the server at sign-in (needs a real `PAYSTACK_SECRET_KEY`; off until then)
- [x] Toasts for sign-in, sign-out, orders, payments, held money and reports; dismissible "Install Shigo" prompt (Android install button, iPhone steps), PNG app icons, service worker
- [x] Sign-in by one-time SMS code (Termii, "dnd" route) with a signed session cookie; demo mode shows the code on screen until `TERMII_API_KEY` and `TERMII_BASE_URL` are set
- [x] Live at https://useshigo.vercel.app
- [x] Smooth scroll on the landing page (Lenis, synced with the scroll animations; off for reduced motion)
- [x] Tests: `node scripts/e2e-local.mjs` (matcher rules), `node scripts/bank-picker-check.mjs` (bank search), `node scripts/name-match-check.mts` (bank name rule), `node scripts/signin-check.mjs` and `node scripts/toast-check.mjs` (sign-in and toasts), `node scripts/screenshots.mjs` and `node scripts/landing-shots.mjs` (visual review)

## This week (blockers, need a human)

- [ ] Register the team at innovatex.africa under Track A; all four members 18 to 25 with school ID and a Blaze account
- [ ] Email Ecobank sandbox support with the questions the docs leave open (see `docs/ecobank-api-notes.md`)
- [ ] Ask Ecobank or YouthCred whether six months of verified inflows on a Blaze account affects a corps member's eligibility or limit; keep the written answer
- [x] Neon Postgres connected locally and on Vercel (tables created)
- [ ] Paystack account (a real secret key turns on bank-name verification at sign-in); put `PAYSTACK_SECRET_KEY` in Vercel env; register `https://useshigo.vercel.app/api/webhooks/paystack`; pay a test virtual account so a real callback lands

## Next in the code

- [ ] Ecobank adapter (blocked on the sandbox reply): replace field guesses in `src/lib/rails/ecobank.ts` once a real sandbox payload is seen; note the source in the file
- [ ] Termii account: set `TERMII_API_KEY`, `TERMII_BASE_URL` (from the dashboard) and a registered `TERMII_SENDER_ID` in `.env` and Vercel so codes arrive by SMS

## Later (not needed for the finale)

- [ ] Postgres migrations instead of `prisma db push` at build (`scripts/db-sync.mjs`)
- [ ] Redis or a single-server host if the green screen must be instant rather than within 2 s on Vercel
- [ ] Offline shell in the service worker (install already works)
- [ ] Move from npm to pnpm (team preference)

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
