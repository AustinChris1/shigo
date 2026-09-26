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
  // Polling fallback: on serverless hosts the SSE bus cannot reach this instance, so the phone also asks every 2s.
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/orders/status", { cache: "no-store" });
        if (!r.ok || stop) return;
        const data: { orders: { id: string; state: string; paidAt: string | null }[]; pendingCredits: number } = await r.json();
        setOrders((prev) => {
          const newlyPaid = data.orders.filter((n) => n.state === "PAID" && prev.some((p) => p.id === n.id && p.state === "PENDING"));
          if (newlyPaid.length) {
            setJustPaid((s) => { const next = new Set(s); newlyPaid.forEach((o) => next.add(o.id)); return next; });
            chime();
            if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
          }
          return prev.map((p) => { const n = data.orders.find((o) => o.id === p.id); return n ? { ...p, state: n.state, paidAt: n.paidAt } : p; });
        });
        if (data.pendingCredits > 0) setNotice((cur) => cur ?? "Money came in that needs you to pick an order.");
      } catch {
        /* offline; try again next tick */
      }
    };
    const id = setInterval(tick, 2000);
    return () => { stop = true; clearInterval(id); };
  }, []);

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

  const time = (iso: string) => new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-5">
      <div className="app-live">
        <span className={`app-live-dot ${connected ? "on" : ""}`} />
        <span>{connected ? "Listening to the bank" : "Reconnecting…"}</span>
      </div>

      {notice && (
        <Link href="/credits" className="app-notice">
          <span>{notice}</span> <span className="font-semibold underline">Open</span>
        </Link>
      )}

      <section>
        <h2 className="app-sec">Waiting <span>{open.length}</span></h2>
        {open.length === 0 && (
          <div className="app-empty">
            <Mark size={36} state="pending" />
            <p>No open orders. Tap <b>New</b> to collect a payment.</p>
          </div>
        )}
        <ul className="app-list">
          {open.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="app-row">
                <span className="app-row-icon is-wait"><Mark size={22} state="pending" /></span>
                <span className="app-row-main">
                  <span className="app-row-amt">{naira(o.amountKobo)}</span>
                  <span className="app-row-meta">{o.reference}{o.note ? ` · ${o.note}` : ""} · {time(o.createdAt)}</span>
                </span>
                <span className="pill pill-amber">Not yet</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="app-sec">Done <span>{done.length}</span></h2>
          <ul className="app-list">
            {done.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className={`app-row ${justPaid.has(o.id) ? "just-paid" : ""}`}>
                  <span className={`app-row-icon ${o.state === "PAID" ? "is-paid" : ""}`}><Mark size={22} state={o.state === "PAID" ? "entered" : "mono"} /></span>
                  <span className="app-row-main">
                    <span className="app-row-amt">{naira(o.amountKobo)}</span>
                    <span className="app-row-meta">{o.reference}{o.note ? ` · ${o.note}` : ""}{o.paidAt ? ` · ${time(o.paidAt)}` : ""}</span>
                  </span>
                  {o.state === "PAID" ? <span className="pill pill-green">Shigo</span> : <span className="pill pill-grey">Cancelled</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
