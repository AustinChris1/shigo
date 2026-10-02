import Link from "next/link";
import { redirect } from "next/navigation";
import { Smartphone } from "lucide-react";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { naira } from "@/lib/money";
import { BANK_APPS } from "@/lib/rails/bankapp";
import { clearAlertsAction, revokeDeviceAction } from "@/lib/actions";
import { AlertsSetup } from "@/components/AlertsSetup";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; pill: string }> = {
  credit: { label: "Payment read", pill: "pill-green" },
  check: { label: "Held for you", pill: "pill-amber" },
  unclear: { label: "Could not read", pill: "pill-amber" },
  not_credit: { label: "Not a payment", pill: "pill-grey" },
  stale: { label: "Too old", pill: "pill-grey" },
};

// Android app only: Shigo reads the credit alerts the seller's own bank app shows, and lists every one it saw.
export default async function Alerts() {
  const seller = await currentSeller();
  if (!seller) redirect("/login");

  const [devices, alerts] = await Promise.all([
    db.device.findMany({ where: { sellerId: seller.id, revokedAt: null }, orderBy: { createdAt: "desc" } }),
    db.bankAlert.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  const apps = [...new Set(Object.values(BANK_APPS))];

  return (
    <main className="space-y-5">
      <header>
        <Link href="/account" className="text-sm text-(--muted)">← Account</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Bank app alerts</h1>
        <p className="text-sm text-(--muted)">The Shigo app for Android can read the credit alert your bank app shows on this phone, so your order turns green from the real payment.</p>
        <p className="mt-2 text-sm">
          Only alerts for <b>{seller.bankName ?? "the account on your orders"}</b> turn an order green, because that is the account buyers are told to pay. Money into your other bank apps is shown here and held under Unmatched for you to decide.
        </p>
      </header>

      <AlertsSetup apps={apps} linkedPhones={devices.length} androidUrl={process.env.NEXT_PUBLIC_ANDROID_URL ?? null} />

      {devices.length > 0 && (
        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Linked phones</h2>
          {devices.map((d) => (
            <form key={d.id} action={revokeDeviceAction} className="flex items-center justify-between gap-3">
              <input type="hidden" name="deviceId" value={d.id} />
              <div className="flex items-center gap-2 text-sm">
                <Smartphone size={18} aria-hidden="true" />
                <div>
                  <div className="font-medium">{d.label ?? "Android phone"}</div>
                  <div className="text-xs text-(--muted)">{d.lastSeenAt ? `Last alert ${d.lastSeenAt.toLocaleString("en-NG")}` : "No alerts yet"}</div>
                </div>
              </div>
              <button className="btn btn-ghost text-sm" type="submit">Stop</button>
            </form>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">What Shigo saw</h2>
        {alerts.length === 0 && <p className="card p-4 text-sm text-(--muted)">No bank-app alerts yet. They appear here as they arrive, with what Shigo made of each one.</p>}
        {alerts.map((a) => {
          const s = STATUS[a.status] ?? STATUS.unclear;
          return (
            <article key={a.id} className="card space-y-1 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{BANK_APPS[a.app] ?? a.app}{a.amountKobo ? ` · ${naira(a.amountKobo)}` : ""}</div>
                <span className={`pill ${s.pill}`}>{s.label}</span>
              </div>
              <p className="text-xs text-(--muted)">{a.postedAt.toLocaleString("en-NG")}{a.payerName ? ` · from ${a.payerName}` : ""}{a.reason ? ` · ${a.reason}` : ""}</p>
              <p className="line-clamp-3 text-sm">{a.title ? `${a.title}: ` : ""}{a.text}</p>
              {a.status === "check" && <Link href="/credits" className="text-sm font-semibold text-(--green)">Decide under Unmatched</Link>}
            </article>
          );
        })}
        {alerts.length > 0 && (
          <form action={clearAlertsAction}>
            <button className="btn btn-ghost w-full text-sm" type="submit">Delete these alerts</button>
          </form>
        )}
      </section>
    </main>
  );
}
