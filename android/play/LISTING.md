# Shigo on Google Play: what to paste where

Everything Play Console asks for, in the order it asks. Graphics are in this folder (`node scripts/play-assets.mjs` remakes them).

## 1. Create app

| Field | Answer |
| --- | --- |
| App name | Shigo |
| Default language | English (United Kingdom) |
| App or game | App |
| Free or paid | Free |

## 2. Store listing

**Short description** (80 max)

> See the money land in your own bank before you hand over goods.

**Full description**

> Shigo stops fake transfer alerts.
>
> Create an order, send your account details to the buyer, and keep Shigo open. The order turns green only when your own bank app shows the money has landed. A buyer's screenshot, SMS or fake receipt cannot change it.
>
> • Works with OPay, Moniepoint, PalmPay, Kuda, Ecobank, GTWorld, Zenith, Access, FirstMobile, ALAT, UBA and Fidelity
> • Buyers pay the normal way, from any bank. No codes to type.
> • Never guesses: a doubtful payment waits for you to decide
> • Every confirmed sale goes into your income record, ready to export
> • Small and fast, made for everyday phones
>
> How Shigo reads payments
> With your permission, Shigo reads notifications from the bank apps listed above, and only those, to find payments for your orders. It never reads SMS, WhatsApp or any other app, and never sees your bank login or PIN. Switch it off any time.
>
> Shigo is a student project entered in InnovateX 2026. It is not a bank, holds no money, and is not affiliated with any bank.

| Asset | File |
| --- | --- |
| App icon (512×512) | `icon-512.png` |
| Feature graphic (1024×500) | `feature-graphic.png` |
| Phone screenshots (1080×2160) | `screenshot-1-waiting.png` to `screenshot-5-ledger.png`, in that order |

| Field | Answer |
| --- | --- |
| Category | Business |
| Email | (the team's support email; required, shown publicly) |
| Website | https://useshigo.vercel.app |

## 3. App content (Policy > App content)

**Privacy policy:** `https://useshigo.vercel.app/privacy`

**App access:** "All or some functionality is restricted". Add these instructions:

> Sign-in normally needs a Nigerian bank account in your own name. Use this test account instead:
> 1. Open Shigo and tap Open Shigo (or go to Sign in).
> 2. Name: any. Phone: REVIEW_PHONE. Bank: any. Account number: any 10 digits.
> 3. Tap "Send me a code" and enter REVIEW_CODE.
> 4. Tap New, enter an amount, and create the order. "Send test payment" (demo mode) turns it green.
> 5. Bank-app alerts: Account > Bank alerts > "Agree and turn on", then allow Shigo in Notification access. It reads only the bank apps listed on that screen.

(The real phone and code are in `android/play-review.secret` on the team PC, never in git.)

**Ads:** No, the app does not contain ads.

**Content rating:** fill the questionnaire with category "Utility, productivity, communication or other" and answer No to everything (no violence, no user-to-user chat, no gambling, no location sharing). Expected rating: Everyone / 3+.

**Target audience:** 18 and over only. Not designed for children.

**News app:** No. **Government app:** No. **Health:** none.

**Financial features:** Shigo does not move, hold or lend money and does not initiate payments; it confirms that a payment arrived and keeps a sales record. Pick the option that says the app does not provide those financial features. If Play insists on a category, "Other" with that sentence.

**Data safety:**

| Question | Answer |
| --- | --- |
| Collects or shares user data? | Yes, collects. Shares: No (Paystack, Ecobank and the SMS provider only process data for Shigo, which Play does not count as sharing) |
| Encrypted in transit? | Yes |
| Can users ask for deletion? | Yes. In the app (Account > Delete my account) and at `https://useshigo.vercel.app/account` |
| Personal info: Name | Collected, required. App functionality, Account management |
| Personal info: Phone number | Collected, required. App functionality, Account management |
| Financial info: Other financial info | Collected, required. Bank account number, payment amounts and payer names, and the text of notifications from the listed bank apps. App functionality |
| Photos | Collected, optional. Fake-receipt screenshots the seller chooses to save. App functionality |
| Processed ephemerally? | No |

**Account deletion URL:** `https://useshigo.vercel.app/account` (sign in, then "Delete my account").

## 4. Testing > Closed testing

1. Create a track, e.g. "Pilot".
2. Countries: Nigeria.
3. Testers: an email list of the pilot sellers' and team's Google accounts (12 or more for a new personal developer account, opted in for 14 days before production).
4. Upload `Shigo-1.0.0.aab`. Release name `1.0.0 (1)`. Release notes: "First test release: orders, bank-app alerts, income record."
5. Review and roll out, then send testers the opt-in link from the track's page.

## Signing

The bundle is signed with the team's **upload key** (`android/shigo-upload.jks`, passwords in `android/keystore.properties`, both outside git). On the first upload, accept **Play App Signing**: Google keeps the app signing key, and this upload key signs every future upload. Keep both files backed up privately; a lost upload key can be reset through Play support, but it takes days.

Every new upload needs a higher `versionCode` in `android/app/build.gradle.kts`.
