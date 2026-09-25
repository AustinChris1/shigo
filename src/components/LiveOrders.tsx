"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { naira } from "@/lib/money";
import { Mark } from "./Mark";

export type OrderRow = {
  id: string;
  amountKobo: number;
  reference: string;
  note: string | null;
  state: string;
  createdAt: string;
  paidAt: string | null;
};

type Ev =
  | { type: "hello" }
  | { type: "order.paid"; orderId: string; amountKobo: number; reference: string; paidAt: string }
  | { type: "credit.held"; creditId: string; amountKobo: number; candidateOrderIds: string[] }
  | { type: "credit.unmatched"; creditId: string; amountKobo: number }
  | { type: "order.created"; orderId: string };

// A short two-tone chime, generated in the browser so there is no audio file to load.
function chime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const play = (freq: number, at: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.4);
    };
    play(660, 0);
    play(990, 0.18);
  } catch {
    /* audio blocked until first tap; the green state still shows */
  }
}

export function LiveOrders({ initial }: { initial: OrderRow[] }) {
  const [orders, setOrders] = useState(initial);
  const [justPaid, setJustPaid] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  // Mounts fresh on every navigation (page is force-dynamic), so initial never needs syncing.
  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (m) => {
      const ev: Ev = JSON.parse(m.data);
      if (ev.type === "order.paid") {
        setOrders((prev) => prev.map((o) => (o.id === ev.orderId ? { ...o, state: "PAID", paidAt: ev.paidAt } : o)));
        setJustPaid((s) => new Set(s).add(ev.orderId));
        chime();
        if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
      } else if (ev.type === "credit.held") {
        setNotice(`${naira(ev.amountKobo)} came in and fits ${ev.candidateOrderIds.length} orders. Pick which one.`);
      } else if (ev.type === "credit.unmatched") {
        setNotice(`${naira(ev.amountKobo)} came in with no matching order. Assign it.`);
      }
    };
    return () => es.close();
  }, []);

  const open = orders.filter((o) => o.state === "PENDING");
  const done = orders.filter((o) => o.state !== "PENDING");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-(--muted)">
        <span>{connected ? "Listening to the bank" : "Reconnecting…"}</span>
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-(--green)" : "bg-(--amber)"}`} />
      </div>

      {notice && (
        <Link href="/credits" className="card block border-(--amber) bg-(--amber-bg) p-3 text-sm">
          {notice} <span className="font-semibold underline">Open</span>
        </Link>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-(--muted)">Waiting</h2>
        {open.length === 0 && <p className="card p-4 text-sm text-(--muted)">No open orders. Tap New to create one.</p>}
        <ul className="space-y-2">
          {open.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="card flex items-center justify-between p-4">
                <div>
                  <div className="text-lg font-bold">{naira(o.amountKobo)}</div>
                  <div className="text-xs text-(--muted)">
                    {o.reference}
                    {o.note ? ` · ${o.note}` : ""}
                  </div>
                </div>
                <span className="pill pill-amber"><Mark size={16} state="pending" /> Not yet</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-(--muted)">Done</h2>
        <ul className="space-y-2">
          {done.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className={`card flex items-center justify-between p-4 ${justPaid.has(o.id) ? "just-paid" : ""}`}
              >
                <div>
                  <div className="text-lg font-bold">{naira(o.amountKobo)}</div>
                  <div className="text-xs text-(--muted)">
                    {o.reference}
                    {o.note ? ` · ${o.note}` : ""}
                  </div>
                </div>
                {o.state === "PAID" ? <span className="pill pill-green"><Mark size={16} state="entered" /> Shigo</span> : <span className="pill pill-grey">Cancelled</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
