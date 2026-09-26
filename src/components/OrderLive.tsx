"use client";

import { useEffect, useState } from "react";
import { naira } from "@/lib/money";
import { Mark } from "./Mark";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// The single-order screen the seller holds up at the counter. Amber until the bank confirms; then green.
export function OrderLive(props: {
  orderId: string;
  initialState: string;
  amountKobo: number;
  reference: string;
  note: string | null;
  paidAt: string | null;
  payer: string | null;
  rail: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState(props.initialState);
  const [paidAt, setPaidAt] = useState(props.paidAt);
  const [flash, setFlash] = useState(false);

  // Polling fallback for serverless hosts; SSE below is the fast path on a single Node server.
  useEffect(() => {
    if (state !== "PENDING") return;
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/orders/status", { cache: "no-store" });
        if (!r.ok) return;
        const data: { orders: { id: string; state: string; paidAt: string | null }[] } = await r.json();
        const me = data.orders.find((o) => o.id === props.orderId);
        if (me?.state === "PAID") {
          setState("PAID");
          setPaidAt(me.paidAt);
          setFlash(true);
        toast.success(`${naira(props.amountKobo)} has entered`, { id: `paid-${props.orderId}`, description: "Payment confirmed. Hand over the goods." });
        router.refresh();
          if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
        }
      } catch {
        /* offline; next tick */
      }
    }, 2000);
    return () => clearInterval(id);
  }, [props.orderId, props.amountKobo, state, router]);

  useEffect(() => {
    if (state !== "PENDING") return;
    const es = new EventSource("/api/events");
    es.onmessage = (m) => {
      const ev = JSON.parse(m.data);
      if (ev.type === "order.paid" && ev.orderId === props.orderId) {
        setState("PAID");
        setPaidAt(ev.paidAt);
        setFlash(true);
        toast.success(`${naira(props.amountKobo)} has entered`, { id: `paid-${props.orderId}`, description: "Payment confirmed. Hand over the goods." });
        router.refresh();
        if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
        es.close();
      }
    };
    return () => es.close();
  }, [props.orderId, props.amountKobo, state, router]);

  const paid = state === "PAID";
  return (
    <section
      className={`card p-6 text-center ${flash ? "just-paid" : ""}`}
      style={paid && !flash ? { background: "var(--green-bg)" } : undefined}
      aria-live="polite"
    >
      <div className="mb-3 flex justify-center">
        <Mark size={72} state={paid ? "entered" : state === "CANCELLED" ? "mono" : "pending"} animate={flash} />
      </div>
      <div className="text-4xl font-bold tracking-tight">{naira(props.amountKobo)}</div>
      <div className="mt-1 text-sm text-(--muted)">
        {props.reference}
        {props.note ? ` · ${props.note}` : ""}
      </div>
      <div className="mt-5">
        {paid ? (
          <>
            <div className="font-display text-2xl font-extrabold text-(--green)">Shigo. It has entered.</div>
            <div className="mt-1 text-xs text-(--muted)">
              Confirmed by the bank {paidAt ? new Date(paidAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : ""}
              {props.payer ? ` · from ${props.payer}` : ""}
              {props.rail === "simulated" ? " · test payment, not real money" : ""}
            </div>
          </>
        ) : state === "CANCELLED" ? (
          <div className="pill pill-grey">Cancelled</div>
        ) : (
          <>
            <div className="pill pill-amber text-base">Not yet</div>
            <p className="mt-3 text-xs text-(--muted)">Keep the goods until this turns green. A screenshot cannot change this screen.</p>
          </>
        )}
      </div>
    </section>
  );
}
