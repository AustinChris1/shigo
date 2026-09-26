"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { readTheme, subscribeTheme, type Theme } from "@/lib/theme";

// The choice is kept per browser.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as Theme);

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
