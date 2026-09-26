"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function ShareButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="btn btn-green w-full"
      onClick={() => toast.info("Opening WhatsApp", { id: "share", description: "Send the details, then keep this screen open. It turns green when the money lands." })}
    >
      <MessageCircle size={18} aria-hidden="true" /> Send details on WhatsApp
    </a>
  );
}
