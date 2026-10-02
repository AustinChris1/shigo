# Shigo

**No more fake alerts. Just real money.** Shigo confirms a seller's sale straight from their bank, and turns every confirmed payment into an income record they can take to a lender.

Live: **https://useshigo.vercel.app**

Shigo (Hausa for "enter") is a mobile web app for Nigerian student sellers who sell on WhatsApp. The seller creates an order, the buyer pays by normal bank transfer from any bank, and the order turns green only when the receiving bank confirms the credit. A buyer's screenshot, SMS or app cannot change the seller's screen.

Built for Blaze by Ecobank InnovateX 2026, Track A (Inclusive Finance). Built for Ecobank Blaze accounts; not affiliated with Ecobank. The full brief is `Shigo-InnovateX-2026-Build-Brief.docx`; what's done and what's next is in [TODO.md](TODO.md).

Pitch deck: [pitch/](pitch/) (PDF, presentable HTML slides and speaker notes).

## What it does

- **Sign in with bank verification.** Pick your bank (searchable list of every Nigerian bank), enter your account number, and the name on the account appears as you type. Your name must match it. A 6-digit code is then texted to your phone.
- **Collect a payment.** Create an order (amount, and the buyer's name if you know it), send your account details on WhatsApp, and keep the screen open. The buyer never types a code. It turns green, with a sound and a toast, the moment the bank confirms.
- **Never guess with money.** Two orders at the same amount? The payment is held and you pick. Money with no matching order is kept under Unmatched.
- **Income record.** Every confirmed payment is a dated ledger row; export a one-page record for a loan application.
- **Report a fake receipt.** Save what you were shown, on your own account, to send to your bank.
- **Installable app** (Android install button, iPhone Add to Home Screen), light and dark themes.
- **Android app** ([android/](android/README.md)): the same app, plus it can read the credit alert your bank app (OPay, Moniepoint, PalmPay, Ecobank and others) shows on your own phone, so orders turn green from real payments today. Every alert it reads is listed under Alerts.
- **Your data:** delete saved alerts, or your whole account, from inside the app. See [/privacy](https://useshigo.vercel.app/privacy).

## How Shigo knows the money arrived

Shigo never watches the **buyer**. It doesn't read their screenshot, their app or their SMS. It only listens to the **seller's bank**.

1. **The seller's bank tells Shigo.** When money lands in an account, the bank's system can instantly send a message to another server. That's called a *webhook*. Ecobank's Notification Service does this: "₦18,000 just landed in account 2350142338, from CHIDI OKAFOR". Shigo registers its address with the bank, and the bank calls it every time a credit posts.
2. **Shigo checks the message is genuine.** Each message is signed with a secret only the bank and Shigo know, so nobody can fake one.
3. **Shigo matches it to an order.** The buyer never types a code. Shigo matches the amount, and uses the sender's name on the credit to tell buyers apart when two pay the same price. If the name disagrees with the buyer the seller expected, or two orders still fit, it holds the money and asks the seller. It never guesses, and a real payment is never lost.
4. **The seller's screen turns green.** The order flips to "Shigo. It has entered.", with a sound, a vibration and a toast, within about 2 seconds.

Why fake receipts can't beat it: a fake receipt changes what's on the *buyer's* phone. Shigo only reacts to the *bank* confirming money in the *seller's* account, and no screenshot can make a bank send that message.

**Where it stands today:** steps 2 to 4 are built and tested. Step 1 waits on Ecobank's sandbox reply ([docs/ecobank-api-notes.md](docs/ecobank-api-notes.md)). Until then there are two stand-ins, each labelled for what it is:

- the **Android app** reads the credit alert from the seller's own bank app. Real money, but reported by the seller's phone rather than the bank, so it says "Read from your OPay app alert" and the income record lists it separately;
- demo mode's **Send test payment** button. Not real money: labelled as a test everywhere and never counted in the income record.

## A real-life example

**Ada** is a 300-level student at FUTO who sells wigs from her hostel, taking orders on WhatsApp. She receives payments into her Ecobank Blaze account.

**Setting up, once:** Ada opens useshigo.vercel.app and taps Install. She enters her name, phone number, "Ecobank Nigeria" and her account number. The name on her account appears in green: verified. A code arrives by SMS, she types it, and she's in.

**Friday, 6:40pm.** Chidi messages her on WhatsApp: *"The 12-inch frontal, abeg how much?"* "₦18,000."

1. **Ada creates an order** in Shigo: ₦18,000, buyer "Chidi", item "12-inch frontal". It shows amber: **Not yet**.
2. **She taps "Send details on WhatsApp".** Chidi receives: *"Please pay ₦18,000 for 12-inch frontal. Ecobank: 2350142338, Name: Ada Obi. I will see it the moment it lands."* He pays the normal way, from any bank or USSD, and writes whatever he likes in the narration.
3. **Chidi comes to collect** and shows his phone: *"I don send am, see the alert."* The screenshot says "Transfer successful ₦18,000".
4. **Ada looks at Shigo, not at Chidi's phone.** It still says **Not yet**. *"E never enter. Make we wait small."* No argument; the screen decides.
5. **Two possible endings:**
   - **The money was real.** Seconds later the bank tells Shigo ₦18,000 landed from CHIDI OKAFOR. Ada's phone chimes and the order turns green: **"Shigo. It has entered."** She hands over the frontal. The sale is now a dated row in her ledger: date, amount, Chidi, frontal.
   - **The receipt was fake.** Nothing arrives, and the order stays amber. Ada keeps her ₦18,000 frontal and taps "They showed me a receipt" to save what she was shown, for her bank.

**Six months later**, Ada is a corps member applying for a loan. She taps **Export income record**: one page of six months of sales, each confirmed by her bank rather than claimed by her. The record is hers to share; the lender decides.

## Run it locally

```bash
npm install
cp .env.example .env     # then fill in DATABASE_URL (Neon) and SESSION_SECRET
npx prisma db push       # creates the tables
npm run dev              # http://localhost:3000
```

With `vercel env pull .env` you get the same Neon database the live site uses.

## Environment

| Variable | What it does | Without it |
| --- | --- | --- |
| `DATABASE_URL` | Neon Postgres | App does not start |
| `SESSION_SECRET` | Signs the sign-in cookie (32+ random characters) | Required in production |
| `PAYSTACK_SECRET_KEY` | Bank-name check at sign-in (all banks); Paystack payment webhooks | Name check is off; sign-in still works |
| `TERMII_API_KEY`, `TERMII_BASE_URL`, `TERMII_SENDER_ID` | Texts the sign-in code (Termii, "dnd" route) | Demo mode: the code is shown on screen |
| `ECOBANK_*` | Ecobank's own account check and payment notifications | Paystack is used instead |
| `NEXT_PUBLIC_ANDROID_URL` | Play Store (or testing) link shown on the Alerts screen in a browser | "Ask the Shigo team for an invite" |
| `DEMO_MODE` | "Send test payment" button on waiting orders, for the pitch; test payments are labelled and never counted as income | No button |
| `ALLOW_SIMULATED_CREDITS` | Developer endpoint that fakes a bank credit (tests only) | Keep `0` on the live site |

## How payments reach Shigo

Every payment source is turned into one `CreditEvent` (`src/lib/rails/types.ts`) before matching, so the matcher never knows which bank sent it.

| Source | Endpoint | Status |
| --- | --- | --- |
| Ecobank Notification Service | `POST /api/webhooks/ecobank` | Built; field names wait on Ecobank's sandbox reply ([docs/ecobank-api-notes.md](docs/ecobank-api-notes.md)) |
| Paystack dedicated virtual accounts | `POST /api/webhooks/paystack` | Working; signature checked on every call |
| Bank-app alerts from the Android app | `POST /api/rails/bankapp` | Working; phone key per device, listed bank apps only, rules in `src/lib/rails/bankapp.ts` (a first guess until real alerts are seen) |
| Local simulator | `POST /api/dev/simulate` | Only when `ALLOW_SIMULATED_CREDITS=1` |

Bank-name checks: Ecobank accounts use Ecobank's Validate Account Name once Ecobank credentials are set (`src/lib/ecobank.ts`); all other banks, and Ecobank until then, use Paystack.

## Matching rules (`src/lib/match.ts`)

1. The same bank transaction is processed once, however many times it arrives.
2. If a buyer happens to include the order's internal reference in the narration, it wins when the amount is exact (never required).
3. Exact amount, and when two open orders share it, the sender's name on the credit picks the buyer the seller named.
4. One open order at that amount: it matches, unless the seller named a different buyer, in which case it is held.
5. Still ambiguous: the money is held and the seller picks. Never auto-green.
6. Nothing fits: kept under Unmatched for the seller to assign. A real payment is never lost.

## Tests

`npm test` runs the rules that need no server (name matching, reading bank-app alerts).

`npm run test:e2e` runs every browser check against one local server. Start it with the bank check off, so tests don't spend Paystack lookups, and with test payments on:

```bash
npm run build && PAYSTACK_SECRET_KEY=sk_test_dummy DEMO_MODE=1 ALLOW_SIMULATED_CREDITS=1 npm start
BASE_URL=http://localhost:3000 npm run test:e2e
```

The tests use the same database as `.env` (the live Neon database if you pulled it). They only create and delete their own test sellers (phones starting 0809999, and 08000000001).

`npm run pilot -- --since 2026-10-09` prints the pilot numbers (orders, green, amber, held, alerts, reports); add `--json` for the slides.


| Script | Checks |
| --- | --- |
| `node scripts/e2e-local.mjs` | Matching rules end to end |
| `node scripts/name-match-check.mts` | Bank-name matching ("Ada Obi" vs "OBI ADAEZE CHIOMA") |
| `node scripts/bank-picker-check.mjs` | Bank search, keyboard use |
| `node scripts/signin-check.mjs` | Sign-in with the code step |
| `node scripts/toast-check.mjs` | Toasts, install prompt, live payment |
| `node scripts/bankapp-parse-check.mts` | Reading bank-app alerts: amounts, sender, balances, never guessing |
| `node scripts/bankapp-check.mjs` | Android alerts end to end: linking a phone, matching, replays, stale and unclear alerts, blocked apps, stopping a phone, deleting an account |
| `node scripts/demo-check.mjs` | Demo mode: test payment turns green, stays out of the income record (start the server with `DEMO_MODE=1`) |
| `node scripts/landing-shots.mjs` | Landing and sign-in screenshots, light and dark |

## Deploy

Vercel project `shigo`, deploying from `main`. Server functions run in London (`vercel.json`) beside the Neon database. On Vercel the green screen arrives by a 2-second poll; on a single server it is instant over SSE.

## Deliberately not here

No shared blacklist of buyers, no receipt image detection, no BVN lookups. Fake-receipt reports stay on the seller's own account.
