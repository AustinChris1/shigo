"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// Theme lives on <html data-theme>; the system preference applies until the visitor picks one, kept per browser.
type Theme = "light" | "dark";

function read(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "dark" || set === "light") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => { mo.disconnect(); mq.removeEventListener("change", cb); };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("shigo-theme", next); } catch { /* storage blocked */ }
  };

  return (
    <button type="button" onClick={flip} className={className} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title="Light or dark">
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
