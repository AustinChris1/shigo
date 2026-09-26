"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Toaster, toast } from "sonner";
import { readTheme, subscribeTheme, type Theme } from "@/lib/theme";

type Flash = { type: "success" | "error" | "info"; title: string; description?: string };

// One Toaster for the whole site, following the site's own theme toggle.
export function AppToaster() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as Theme);
  return <Toaster theme={theme} position="top-center" richColors closeButton mobileOffset={{ top: 12 }} toastOptions={{ style: { borderRadius: 14 } }} />;
}

// Server actions leave a short-lived shigo_flash cookie before redirecting; this turns it into a toast on arrival.
export function FlashToast() {
  const path = usePathname();
  useEffect(() => {
    const raw = document.cookie.split("; ").find((c) => c.startsWith("shigo_flash="))?.slice("shigo_flash=".length);
    if (!raw) return;
    document.cookie = "shigo_flash=; Max-Age=0; path=/";
    try {
      let text = raw;
      for (let i = 0; i < 3 && text.includes("%"); i++) text = decodeURIComponent(text);
      const f = JSON.parse(text) as Flash;
      toast[f.type](f.title, { id: `flash-${f.title}`, description: f.description });
    } catch { /* malformed flash, ignore */ }
  }, [path]);
  return null;
}
