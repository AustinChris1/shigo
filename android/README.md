# Shigo for Android

The Shigo website in an app, plus one thing a website cannot do: read the credit alert your **bank app** shows on your own phone, so an order turns green from the real payment. It works with OPay, Moniepoint, PalmPay, Kuda, Ecobank and the other apps in [`BankApps.kt`](app/src/main/java/app/shigo/android/BankApps.kt).

The web app at useshigo.vercel.app stays the main product. Everything here is a shell around it; if the app has a problem, sellers keep using the website.

## How it works

1. The seller opens **Alerts** in the app, reads what Shigo will and will not read, and taps **I agree, turn it on**.
2. The page asks the server for a phone key and hands it to the app through the `shigoAndroid` bridge (`Bridge.kt`). Android only exposes the bridge to Shigo's own site.
3. Android asks the seller to allow notification access for Shigo.
4. From then on, `AlertListener.kt` sees each notification, drops everything not from a listed bank app, and `AlertSender.kt` posts the rest to `POST /api/rails/bankapp`. If the network is down, WorkManager retries.
5. The server (`src/lib/rails/bankapp.ts`) reads the amount and sender, and the matcher treats it like any other bank credit, with three extra rules:
   - two amounts in one alert, or no amount: not acted on, shown under Alerts as "Could not read";
   - money in, but mentioning a reversal, refund, request or debit: held under Unmatched for the seller;
   - seen more than 10 minutes after it arrived: kept, not acted on;
   - from a different bank's app than the account on the seller's orders (an OPay credit for a seller whose orders say Ecobank), or showing a different account number: held. It is real money, but not proof this buyer paid the account they were told to pay.

What it never reads: SMS, WhatsApp, or any app not on the list. A buyer can fake an SMS or a WhatsApp message; they cannot make the seller's bank app post a notification.

What it proves, and what it doesn't: the alert came from the bank app on the seller's phone. That stops buyers' fake receipts. It is weaker than the bank telling Shigo directly, because the seller controls their phone, so these payments say "Read from your OPay app alert" (never "Confirmed by the bank"), and the exported income record lists them separately for the lender.

The reading rules are a first guess: no real alert from these apps has been checked yet. Every alert is kept under **Alerts**, so the pilot shows where they are wrong. Fix the rules on the server; no app update is needed.

## Build

Needs JDK 17+ and the Android SDK (platform 36, build-tools 36). Put the SDK path in `local.properties` (`sdk.dir=...`), which is not committed.

```bash
cd android
./gradlew assembleDebug                      # app/build/outputs/apk/debug/app-debug.apk, talks to useshigo.vercel.app
./gradlew assembleDebug -PshigoBaseUrl=http://10.0.2.2:3100   # emulator against a local server
./gradlew bundleRelease                      # app/build/outputs/bundle/release/app-release.aab for the Play Store
```

The debug build installs as "Shigo (test)" beside the real app, and can post its own fake alerts (`DebugAlerts.kt`). The server accepts those only when `ALLOW_SIMULATED_CREDITS=1`, so never on the live site.

## Signing for the Play Store

Release builds are signed with an **upload key** kept outside git:

```bash
keytool -genkeypair -v -keystore android/shigo-upload.jks -alias shigo -keyalg RSA -keysize 2048 -validity 10000
```

Then create `android/keystore.properties`:

```properties
storeFile=shigo-upload.jks
storePassword=...
keyAlias=shigo
keyPassword=...
```

Back up both files somewhere safe (not the repo). With Play App Signing, Google holds the real signing key; a lost upload key can be reset through Play support, but it takes days.

## Getting it on Google Play

1. Create a developer account at play.google.com/console with a new Google account for Shigo ($25 once). Identity checks can take a few days.
2. Create the app: name **Shigo**, free, app. The package name is `app.shigo.android`; it can never change once uploaded.
3. Upload `app-release.aab` to a **closed testing** track. New personal accounts need 12 or more testers opted in for 14 days before a public release; the pilot sellers and the team are those testers.
4. Fill in the store listing, the privacy policy URL (`https://useshigo.vercel.app/privacy`), the account deletion URL (`https://useshigo.vercel.app/account`), and the Data safety form:
   - collected: name, phone number, financial info (bank account, payment amounts), app activity (notifications from listed bank apps), device model;
   - shared: phone number with the SMS provider, account number with Paystack/Ecobank for the name check;
   - encrypted in transit: yes; users can request deletion: yes (in the app, under Account).
5. Before the testers install it, give each one the opt-in link from the closed testing page.

Apps installed from Play can turn on notification access normally. Sideloaded APKs on Android 13 and later need "Allow restricted settings" first; the Alerts screen explains this.

## Testing

- Server rules: `node scripts/bankapp-parse-check.mts` and `node scripts/bankapp-check.mjs` (from the repo root, with a local server).
- On your own phone over USB (no internet data used): turn on Developer options > USB debugging, plug in, then
  ```bash
  ./gradlew assembleDebug -PshigoBaseUrl=http://localhost:3100
  adb install -r app/build/outputs/apk/debug/app-debug.apk
  adb reverse tcp:3100 tcp:3100     # the phone's localhost:3100 is now this computer's test server
  ```
  Start the server with `ALLOW_SIMULATED_CREDITS=1`, sign in on the phone, turn alerts on under Alerts, then send a test alert from the page (Chrome on the computer, `chrome://inspect`, console): `shigoAndroid.postMessage(JSON.stringify({type: "debugTestAlert", text: "You have received ₦18,000 from CHIDI OKAFOR"}))`. A debug build needs notification permission for its own test alerts: `adb shell pm grant app.shigo.android.debug android.permission.POST_NOTIFICATIONS`.
