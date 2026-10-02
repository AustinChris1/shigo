import Link from "next/link";
import type { Metadata } from "next";
import { BANK_APPS } from "@/lib/rails/bankapp";

export const metadata: Metadata = { title: "Privacy · Shigo", description: "What Shigo collects, why, and how to delete it." };

// Linked from the Play Store listing and the app. Keep it in plain words and true to what the code does.
export default function Privacy() {
  const apps = [...new Set(Object.values(BANK_APPS))].join(", ");
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 text-[15px] leading-relaxed">
      <Link href="/" className="text-sm text-(--muted)">← Shigo</Link>
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="text-sm text-(--muted)">Last updated 2 October 2026. Applies to useshigo.vercel.app and the Shigo app for Android.</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What Shigo collects</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Your account:</b> your name, phone number, bank, account number, and the name on that account as your bank returns it.</li>
          <li><b>Your sales:</b> the orders you create (amount, buyer name if you add it, what they are buying), and the payments matched to them.</li>
          <li><b>Fake-receipt reports:</b> the note and screenshot you choose to save.</li>
          <li><b>Android app only, if you turn it on:</b> notifications from these bank apps on your phone: {apps}. Shigo reads them to find payments for your orders. It never reads SMS, WhatsApp, or any other app, and never sees your bank login, PIN or card details. It also stores your phone&apos;s model name so you can tell linked phones apart.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Why</h2>
        <p>To confirm payments for your orders, keep your income record, and let you export that record when you choose. Nothing else. Shigo shows no ads and does not sell or rent your data.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Who else sees it</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Account-name check:</b> your bank code and account number are sent to Paystack (or Ecobank, for Ecobank accounts) to get the name on the account.</li>
          <li><b>Sign-in codes:</b> your phone number is sent to Termii to text you a code.</li>
          <li><b>Hosting:</b> Shigo runs on Vercel, with its database on Neon in London.</li>
          <li><b>Lenders:</b> only if you export your income record and give it to them yourself.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Deleting your data</h2>
        <p>Delete the bank-app alerts Shigo kept at any time under Alerts. Delete your whole account, with every order, payment, report and alert, under Account in the app. Sign in, open <Link href="/account" className="underline">Account</Link>, and choose Delete my account. It takes effect at once and cannot be undone.</p>
        <p>To stop the Android app reading notifications, switch Shigo off in your phone&apos;s notification access settings, or tap Stop next to the phone under Alerts.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Security</h2>
        <p>Data travels over HTTPS. Sign-in codes and phone keys are stored only as hashes. Shigo is a student project entered in InnovateX 2026; it is not a bank and holds no money.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>Questions or requests: <a href="https://github.com/AustinChris1/shigo/issues" className="underline" target="_blank" rel="noreferrer">open an issue on GitHub</a>.</p>
      </section>
    </main>
  );
}
