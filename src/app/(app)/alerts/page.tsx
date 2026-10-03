import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck, CircleHelp, CircleMinus, Clock3, Inbox, PauseCircle, Smartphone, Target } from "lucide-react";
import { db } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { naira } from "@/lib/money";
import { BANK_APPS } from "@/lib/rails/bankapp";
import { clearAlertsAction, revokeDeviceAction } from "@/lib/actions";
import { AlertsSetup } from "@/components/AlertsSetup";
import { BankBadge } from "@/components/BankBadge";

export const dynamic = "force-dynamic";

// "Paid" only when the money settled an order; money read fine but tied to no order yet is "Money in".
const STATUS = {
  paid: { label: "Paid", Icon: CircleCheck, cls: "text-(--green)" },
  credit: { label: "Money in", Icon: Inbox, cls: "text-(--green)" },
  check: { label: "Held", Icon: PauseCircle, cls: "text-(--amber)" },
  unclear: { label: "Unclear", Icon: CircleHelp, cls: "text-(--amber)" },
  not_credit: { label: "Ignored", Icon: CircleMinus, cls: "text-(--muted)" },
  stale: { label: "Too old", Icon: Clock3, cls: "text-(--muted)" },
} as const;

const time = (d: Date) => d.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Android app only: Shigo reads the credit alerts the seller's own bank app shows, and lists every one it saw.
export default async function Alerts() {
  const seller = await currentSeller();
  if (!seller) redirect("/login");

  const [devices, alerts] = await Promise.all([
    db.device.findMany({ where: { sellerId: seller.id, revokedAt: null }, orderBy: { createdAt: "desc" } }),
    db.bankAlert.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  const apps = Object.entries(BANK_APPS).map(([pkg, label]) => ({ pkg, label }));
  const creditIds = alerts.map((a) => a.creditId).filter((id): id is string => !!id);
  const settled = new Set(
    (await db.credit.findMany({ where: { id: { in: creditIds }, state: "MATCHED" }, select: { id: true } })).map((c) => c.id),
  );

  return (
    <main className="space-y-4">
      <header className="space-y-2">
        <Link href="/account" className="text-sm text-(--muted)">← Account</Link>
        <h1 className="text-2xl font-bold tracking-tight">Bank alerts</h1>
        {/* The one rule sellers must know: only the account on their orders can turn one green. */}
        <p className="inline-flex items-center gap-1.5 rounded-full bg-(--green-bg) px-3 py-1.5 text-xs font-semibold text-(--green)">
          <Target size={14} aria-hidden="true" /> Green only for {seller.bankName ?? "your account"}{seller.accountNumber ? ` ·${seller.accountNumber.slice(-4)}` : ""}
        </p>
      </header>

      <AlertsSetup apps={apps} androidUrl={process.env.NEXT_PUBLIC_ANDROID_URL ?? null} />

      {devices.map((d) => (
        <form key={d.id} action={revokeDeviceAction} className="card flex items-center gap-3 p-3 text-sm">
          <input type="hidden" name="deviceId" value={d.id} />
          <Smartphone size={20} aria-hidden="true" className="shrink-0 text-(--muted)" />
          <div className="flex-1">
            <div className="font-medium">{d.label ?? "Android phone"}</div>
            <div className="text-xs text-(--muted)">{d.lastSeenAt ? `Last alert ${time(d.lastSeenAt)}` : "No alerts yet"}</div>
          </div>
          <button className="btn btn-ghost text-xs" type="submit">Stop</button>
        </form>
      ))}

      {(alerts.length > 0 || devices.length > 0) && (
      <section className="card divide-y divide-(--line)">
        {alerts.length === 0 && devices.length > 0 && <p className="p-4 text-sm text-(--muted)">No alerts yet.</p>}
        {alerts.map((a) => {
          const s = a.creditId && settled.has(a.creditId) ? STATUS.paid : (STATUS[a.status as keyof typeof STATUS] ?? STATUS.unclear);
          const label = BANK_APPS[a.app] ?? "Test";
          return (
            <details key={a.id} className="group p-3">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <BankBadge pkg={a.app} label={label} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.amountKobo ? naira(a.amountKobo) : label}</div>
                  <div className="truncate text-xs text-(--muted)">{[a.payerName, time(a.postedAt)].filter(Boolean).join(" · ")}</div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${s.cls}`}>
                  <s.Icon size={16} aria-hidden="true" /> {s.label}
                </span>
              </summary>
              <div className="mt-2 space-y-1 pl-12 text-xs">
                <p className="text-(--muted)">{a.title ? `${a.title}: ` : ""}{a.text}</p>
                {a.reason && <p className="font-semibold text-(--amber)">{a.reason}</p>}
                {a.status === "check" && <Link href="/credits" className="font-semibold text-(--green)">Decide in Unmatched →</Link>}
              </div>
            </details>
          );
        })}
      </section>
      )}

      {alerts.length > 0 && (
        <form action={clearAlertsAction} className="text-center">
          <button className="text-xs text-(--muted) underline" type="submit">Delete all alerts</button>
        </form>
      )}
    </main>
  );
}
