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
- [x] Ecobank Validate Account Name client (`src/lib/ecobank.ts`), used for Ecobank accounts once `ECOBANK_*` credentials are set; Paystack covers every bank until then
- [x] Buyer-name matching (no codes for buyers); FAQ on the landing page
- [x] Demo mode for the pitch: "Send test payment" on waiting orders, labelled as a test and left out of the income record (`DEMO_MODE=1`, on in production)
- [x] Smooth scroll on the landing page (Lenis, synced with the scroll animations; off for reduced motion)
- [x] Tests: `node scripts/e2e-local.mjs` (matcher rules), `node scripts/bank-picker-check.mjs` (bank search), `node scripts/name-match-check.mts` (bank name rule), `node scripts/signin-check.mjs` and `node scripts/toast-check.mjs` (sign-in and toasts), `node scripts/screenshots.mjs` and `node scripts/landing-shots.mjs` (visual review)

## This week (blockers, need a human)

- [ ] Register the team at innovatex.africa under Track A; all four members 18 to 25 with school ID and a Blaze account
- [ ] Email Ecobank sandbox support with the questions the docs leave open (see `docs/ecobank-api-notes.md`)
- [ ] Ask Ecobank or YouthCred whether six months of verified inflows on a Blaze account affects a corps member's eligibility or limit; keep the written answer
- [x] Neon Postgres connected locally and on Vercel (tables created)
- [ ] Paystack account (a real secret key turns on bank-name verification at sign-in); put `PAYSTACK_SECRET_KEY` in Vercel env; register `https://useshigo.vercel.app/api/webhooks/paystack`; pay a test virtual account so a real callback lands

## Next in the code

- [ ] Android app (`android/`): Play developer account, upload key, closed test with the pilot sellers as testers (12 for 14 days); replace the alert-reading guesses in `src/lib/rails/bankapp.ts` with what real OPay and Moniepoint alerts say (Alerts screen keeps every one)
- [ ] Support email for the Play listing and the privacy page (the page links to GitHub issues for now)

- [ ] Ecobank adapter (blocked on the sandbox reply): replace field guesses in `src/lib/rails/ecobank.ts` once a real sandbox payload is seen; note the source in the file
- [ ] Termii account: set `TERMII_API_KEY`, `TERMII_BASE_URL` (from the dashboard) and a registered `TERMII_SENDER_ID` in `.env` and Vercel so codes arrive by SMS

## Money screen and SMS (after the green path is proven)

Agreed 3 Oct 2026. Start only once a real bank-app credit has turned an order green for the right reason (the account on the order, the right sender).

- [ ] Money screen: every credit and debit from the bank-app alerts Shigo already receives, across all the seller's accounts (business or not): from or to whom, what for, totals by day, week, month and year. Its own switch and its own disclosure. Never part of the sales income record or its export.
- [ ] SMS, only after the first Play approval, under Play's "SMS-based money management" exception (declaration form; the tracker must be a core feature of the listing). Filter on the phone: only bank transaction texts leave it, never the rest of someone's SMS. SMS rows are labelled "SMS", stay out of the sales export, and never settle an order; at most "SMS says ₦X arrived. SMS can be faked, check your bank app."


Done 3 Oct 2026: `npm test` (no server) and `npm run test:e2e` (against `BASE_URL`); `npm run pilot -- --since 2026-10-09` for the pilot slides.

- [x] Audio chime on single order screen (`OrderLive.tsx`): home screen chimes on payment; single order screen only vibrates and toasts
- [x] 1-tap copy account button: add quick copy button for bank account number / details on the waiting order screen alongside WhatsApp share
- [x] Fix export styling in dark mode: `/ledger/export` has a white background but inherits dark theme ink, rendering text invisible
- [x] Client-side photo compression: resize and compress fake receipt screenshots on canvas in `ReportForm.tsx` before writing to Postgres
- [x] Form validation on `/new`: handle zero or invalid amounts gracefully with inline feedback instead of throwing an unhandled error
- [x] Network status indicator: show a subtle reconnecting badge on the order screen when polling fails due to unstable campus data
- [ ] Unmatched credit flexibility: allow partial payments or manual linking in `/credits` when transfer amount differs from order amount
  - Deferred: a partial payment changes what "paid" means and what the income record shows, so it needs a product decision first (mark the order paid at the amount received? keep it open for the rest?). Before the finale, the seller can cancel and re-create the order at the amount that arrived.
- [x] Add `npm test` script to `package.json` covering `name-match-check`, `bank-picker-check` and `e2e-local`
- [x] Pilot metrics summary: script or endpoint to aggregate green, amber and held counts for the week 4 pilot slides

## Later (not needed for the finale)

- [ ] Postgres migrations instead of `prisma db push` at build (`scripts/db-sync.mjs`)
- [ ] Redis or a single-server host if the green screen must be instant rather than within 2 s on Vercel
- [ ] Offline shell in the service worker (install already works)
- [ ] Move from npm to pnpm (team preference)

## Pilot (week 4)

- [ ] Ten student sellers using the app for every order for seven days
- [ ] Log every green, amber and held result; that log is the strongest slide

## Pitch

- [x] Deck in `pitch/` (moment, crime, damage, user, how it works, live demo, matching, record, why Ecobank, status, next, ask); fill in team names and pilot numbers
- [ ] Say which rail is live on stage; never call a Paystack test credit an Ecobank deposit
- [ ] Rehearse the version where the sandbox is down

## Rules that do not change

- The bank is the only witness; nothing a buyer shows changes the screen
- Never auto-green an ambiguous credit
- No pilot numbers, users or volumes on any page until the pilot has run
- Plain copy, no em dashes
