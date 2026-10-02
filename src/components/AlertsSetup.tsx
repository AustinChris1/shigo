"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { pairDeviceAction } from "@/lib/actions";

// Talks to the Shigo Android app through the "shigoAndroid" bridge, which the app adds only for Shigo's own pages.
type Bridge = {
  postMessage(message: string): void;
  addEventListener(type: "message", fn: (e: MessageEvent) => void): void;
  removeEventListener(type: "message", fn: (e: MessageEvent) => void): void;
};
type Status = {
  type: "status";
  version: string;
  device: string;
  paired: boolean;
  listenerEnabled: boolean;
  installedApps: { pkg: string; label: string }[];
  sdk: number;
  sideloaded: boolean;
};

const bridge = () => (typeof window === "undefined" ? null : ((window as unknown as { shigoAndroid?: Bridge }).shigoAndroid ?? null));
const send = (msg: object) => bridge()?.postMessage(JSON.stringify(msg));
const noSubscribe = () => () => {};

export function AlertsSetup({ apps, linkedPhones, androidUrl }: { apps: string[]; linkedPhones: number; androidUrl: string | null }) {
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
        if (m.type === "status") setStatus(m);
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
        toast.info("Find Shigo in the list and switch it on", { description: "Then come back to this screen." });
        send({ type: "openListenerSettings" });
      }
    } catch {
      toast.error("Could not link this phone", { description: "Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }, [status]);

  if (inApp === null) return null;

  if (!inApp) {
    return (
      <section className="card space-y-2 p-4 text-sm">
        <h2 className="font-semibold">Works in the Shigo app for Android</h2>
        <p className="text-(--muted)">A website cannot read your phone&apos;s alerts, and iPhones do not allow any app to read them.</p>
        {androidUrl ? (
          <a href={androidUrl} className="btn btn-primary w-full">Get the Android app</a>
        ) : (
          <p className="text-(--muted)">The Android app is in testing. Ask the Shigo team for an invite.</p>
        )}
      </section>
    );
  }

  if (!status) return <section className="card p-4 text-sm text-(--muted)">Checking this phone…</section>;

  const ready = status.paired && status.listenerEnabled;
  const restricted = !status.listenerEnabled && status.sideloaded && status.sdk >= 33;

  return (
    <section className="card space-y-4 p-4 text-sm">
      <ol className="space-y-2">
        <Step done={status.paired}>Phone linked to your Shigo account</Step>
        <Step done={status.listenerEnabled}>Shigo allowed to read notifications</Step>
        <Step done={status.installedApps.length > 0}>
          {status.installedApps.length > 0 ? `Bank apps found: ${status.installedApps.map((a) => a.label).join(", ")}` : "No supported bank app on this phone yet"}
        </Step>
      </ol>

      {ready ? (
        <p className="flex items-start gap-2 text-(--green)"><ShieldCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0" /> On. Keep your bank app&apos;s notifications switched on, and Shigo will match each credit alert to your orders.</p>
      ) : (
        <>
          <div className="space-y-2 rounded-xl border border-(--line) p-3">
            <p className="font-semibold">Before you turn it on</p>
            <p className="text-(--muted)">Shigo reads notifications only from these bank apps: {apps.join(", ")}. It sends each one to your Shigo account to find payments for your orders, and keeps it here so you can check it. Delete them any time.</p>
            <p className="text-(--muted)">It never reads SMS, WhatsApp or any other app, and never sees your bank login or PIN.</p>
          </div>
          <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={turnOn}>
            {busy ? "Linking…" : status.paired ? "Allow notification access" : "I agree, turn it on"}
          </button>
        </>
      )}

      {restricted && (
        <div className="space-y-2 rounded-xl bg-(--amber-bg) p-3">
          <p className="font-semibold">Switch greyed out?</p>
          <p>Android blocks this for apps installed outside the Play Store. Open Shigo&apos;s app info, tap the ⋮ menu, choose &quot;Allow restricted settings&quot;, then try again.</p>
          <button type="button" className="btn btn-ghost w-full" onClick={() => send({ type: "openAppSettings" })}>Open app info</button>
        </div>
      )}

      {linkedPhones > 0 && !status.paired && <p className="text-xs text-(--muted)">This account is linked to another phone too. You can stop old phones below.</p>}
    </section>
  );
}

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${done ? "bg-(--green) text-white" : "border border-(--line)"}`}>{done && <Check size={13} aria-hidden="true" />}</span>
      <span className={done ? "" : "text-(--muted)"}>{children}</span>
    </li>
  );
}
