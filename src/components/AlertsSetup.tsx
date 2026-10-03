"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { BellRing, Check, Link2, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { pairDeviceAction } from "@/lib/actions";
import { BankBadge, saveBankIcons } from "./BankBadge";

// Talks to the Shigo Android app through the "shigoAndroid" bridge, which the app adds only for Shigo's own pages.
type Bridge = {
  postMessage(message: string): void;
  addEventListener(type: "message", fn: (e: MessageEvent) => void): void;
  removeEventListener(type: "message", fn: (e: MessageEvent) => void): void;
};
type App = { pkg: string; label: string; icon?: string | null };
type Status = {
  type: "status";
  version: string;
  device: string;
  paired: boolean;
  listenerEnabled: boolean;
  installedApps: App[];
  sdk: number;
  sideloaded: boolean;
};

const bridge = () => (typeof window === "undefined" ? null : ((window as unknown as { shigoAndroid?: Bridge }).shigoAndroid ?? null));
const send = (msg: object) => bridge()?.postMessage(JSON.stringify(msg));
const noSubscribe = () => () => {};

export function AlertsSetup({ apps, androidUrl }: { apps: App[]; androidUrl: string | null }) {
  // null while rendering on the server; the bridge exists only in the app's WebView.
  const inApp = useSyncExternalStore(noSubscribe, () => !!bridge(), () => null);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const b = bridge();
    if (!b) return;
    const onMessage = (e: MessageEvent) => {
      try {
        const m = JSON.parse(String(e.data));
        if (m.type !== "status") return;
        setStatus(m);
        saveBankIcons(m.installedApps ?? []);
      } catch {
        /* not ours */
      }
    };
    const refresh = () => document.visibilityState === "visible" && send({ type: "status" });
    b.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", refresh);
    send({ type: "status" });
    return () => {
      b.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const turnOn = useCallback(async () => {
    setBusy(true);
    try {
      if (!status?.paired) {
        const { key } = await pairDeviceAction(status?.device ?? null);
        send({ type: "pair", key });
      }
      if (!status?.listenerEnabled) {
        toast.info("Switch Shigo on, then come back");
        send({ type: "openListenerSettings" });
      }
    } catch {
      toast.error("Could not link this phone", { description: "Check your connection." });
    } finally {
      setBusy(false);
    }
  }, [status]);

  if (inApp === null) return null;

  if (!inApp) {
    return (
      <section className="card flex items-center gap-3 p-4 text-sm">
        <Smartphone size={28} aria-hidden="true" className="shrink-0 text-(--muted)" />
        <div className="flex-1">
          <p className="font-semibold">Android app only</p>
          <p className="text-(--muted)">{androidUrl ? "Install it to read your bank alerts." : "In testing. Ask the Shigo team."}</p>
        </div>
        {androidUrl && <a href={androidUrl} className="btn btn-primary">Get it</a>}
      </section>
    );
  }

  if (!status) return <section className="card p-4 text-sm text-(--muted)">Checking this phone…</section>;

  const found = status.installedApps;
  const ready = status.paired && status.listenerEnabled;
  // Only after a first try: a linked phone whose access is still off is the sign of a greyed-out switch.
  const restricted = status.paired && !status.listenerEnabled && status.sideloaded && status.sdk >= 33;

  return (
    <section className="card space-y-4 p-4 text-sm">
      {ready ? (
        <div className="flex items-center gap-2 font-semibold text-(--green)">
          <ShieldCheck size={22} aria-hidden="true" /> On
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Chip done={status.paired} Icon={Link2}>Phone linked</Chip>
          <Chip done={status.listenerEnabled} Icon={BellRing}>Access allowed</Chip>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted)">{found.length ? "Your banks" : "No supported bank app yet"}</p>
        <div className="flex flex-wrap gap-3">
          {found.map((a) => (
            <span key={a.pkg} className="grid w-14 justify-items-center gap-1 text-center text-[11px] leading-tight">
              <BankBadge pkg={a.pkg} label={a.label} size={40} />
              {a.label}
            </span>
          ))}
        </div>
      </div>

      {!ready && (
        <>
          {/* Google Play's prominent disclosure: what is read, where it goes, what is never read. Keep it, keep it short. */}
          <div className="space-y-1 rounded-xl bg-(--bg-2) p-3 text-xs">
            <p>Shigo reads notifications from bank apps only and sends them to your Shigo account to find payments.</p>
            <p className="font-semibold">Never SMS, WhatsApp, or your PIN.</p>
            <details>
              <summary className="cursor-pointer text-(--muted)">All {apps.length} supported banks</summary>
              <p className="mt-1 text-(--muted)">{[...new Set(apps.map((a) => a.label))].join(", ")}</p>
            </details>
          </div>
          <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={turnOn}>
            {busy ? "Linking…" : status.paired ? "Allow access" : "Agree and turn on"}
          </button>
        </>
      )}

      {restricted && (
        <div className="flex items-center gap-3 rounded-xl bg-(--amber-bg) p-3 text-xs">
          <TriangleAlert size={20} aria-hidden="true" className="shrink-0 text-(--amber)" />
          <p className="flex-1">Switch greyed out? App info, ⋮, Allow restricted settings.</p>
          <button type="button" className="btn btn-ghost text-xs" onClick={() => send({ type: "openAppSettings" })}>Open</button>
        </div>
      )}
    </section>
  );
}

function Chip({ done, Icon, children }: { done: boolean; Icon: typeof Check; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${done ? "bg-(--green-bg) text-(--green)" : "border border-(--line) text-(--muted)"}`}>
      {done ? <Check size={14} aria-hidden="true" /> : <Icon size={14} aria-hidden="true" />} {children}
    </span>
  );
}
