"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

// One tap to copy the payment details, for buyers who are not on WhatsApp (Instagram, SMS, in person).
export function CopyButton({ text, label = "Copy details" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Older Android WebViews have no clipboard API; a hidden textarea still works there.
      const t = document.createElement("textarea");
      t.value = text;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      ok = document.execCommand("copy");
      t.remove();
    }
    if (!ok) return toast.error("Could not copy", { description: "Hold your finger on the account number to copy it." });
    setDone(true);
    toast.success("Copied", { id: "copy", description: "Paste it to the buyer, then keep this screen open." });
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <button type="button" className="btn btn-ghost w-full" onClick={copy}>
      {done ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />} {done ? "Copied" : label}
    </button>
  );
}
