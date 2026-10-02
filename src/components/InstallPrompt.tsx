"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const KEY = "shigo-install-dismissed";
const QUIET_DAYS = 7;

// Offers "Install Shigo" once per week until installed; Android/Chrome gets a real install button, iPhone gets the steps.
export function InstallPrompt() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    // Already inside the Shigo Android app (its WebView adds "ShigoAndroid" to the user agent).
    if (standalone || /ShigoAndroid\//.test(navigator.userAgent)) return;
    let last = 0;
    try { last = Number(localStorage.getItem(KEY) ?? 0); } catch { /* storage blocked */ }
    if (Date.now() - last < QUIET_DAYS * 86400000) return;

    const remember = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* storage blocked */ } };
    const common = { id: "install", duration: Infinity, onDismiss: remember };
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      const ev = e as InstallEvent;
      timer = setTimeout(() => {
        toast("Install Shigo", {
          ...common,
          description: "Open it from your home screen and never miss a green.",
          action: {
            label: "Install",
            onClick: async () => {
              await ev.prompt();
              const { outcome } = await ev.userChoice;
              if (outcome === "accepted") toast.success("Shigo installed", { description: "Find it on your home screen." });
              else remember();
            },
          },
        });
      }, 2500);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (ios) {
      timer = setTimeout(() => {
        toast("Install Shigo", { ...common, description: "Tap the Share button, then Add to Home Screen." });
      }, 2500);
    }

    const onInstalled = () => { toast.dismiss("install"); remember(); };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}
