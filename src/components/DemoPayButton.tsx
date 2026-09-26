"use client";

import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { sendTestPaymentAction } from "@/lib/actions";

// Demo mode only: stands in for the bank's credit notification so the green moment can be shown on stage.
// The panel disappears once the order is paid, so state is only touched while it is still on screen.
export function DemoPayButton({ orderId, amount }: { orderId: string; amount: string }) {
  const [sending, setSending] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const send = async () => {
    setSending(true);
    const r = await sendTestPaymentAction(orderId);
    if (!r.ok) toast.error("Test payment not sent", { description: r.error });
    else toast.info("Test payment sent", { id: "demo-pay", description: "Not real money. Shown as a test on the order and left out of your income record." });
    if (mounted.current) setSending(false);
  };

  return (
    <section className="demo-pay">
      <div className="demo-pay-head">
        <FlaskConical size={18} aria-hidden="true" />
        <span>Demo mode</span>
      </div>
      <p>Sends a test payment of {amount} to this order, as if the bank just confirmed it. No real money moves, and it is never counted in your income record.</p>
      <button type="button" className="btn demo-pay-btn w-full" disabled={sending} onClick={send}>
        {sending ? "Sending test payment…" : "Send test payment"}
      </button>
    </section>
  );
}
