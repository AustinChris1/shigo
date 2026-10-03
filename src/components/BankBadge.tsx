"use client";

import { useSyncExternalStore } from "react";

// Bank logos come from the bank apps on the seller's own phone (the Android app sends their icons), cached here so
// every screen can show them. Shigo hosts no bank's branding. Elsewhere, a tile with the bank's initials.
const KEY = "shigo-bank-icons";
const EVENT = "shigo-bank-icons";

export function saveBankIcons(apps: { pkg: string; icon?: string | null }[]) {
  try {
    const cur = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    for (const a of apps) if (a.icon) cur[a.pkg] = a.icon;
    localStorage.setItem(KEY, JSON.stringify(cur));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage blocked: initials it is */
  }
}

function iconFor(pkg: string): string | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}")[pkg] ?? null;
  } catch {
    return null;
  }
}

const subscribe = (fn: () => void) => {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
};

const initials = (label: string) => {
  const words = label.replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : label.slice(0, 2)).toUpperCase();
};

export function BankBadge({ pkg, label, size = 36 }: { pkg: string; label: string; size?: number }) {
  const icon = useSyncExternalStore(subscribe, () => iconFor(pkg), () => null);
  const box = { width: size, height: size };
  if (icon) {
    // A small data-URL from the phone; next/image adds nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt={label} title={label} style={box} className="shrink-0 rounded-xl" />;
  }
  return (
    <span
      title={label}
      aria-label={label}
      style={{ ...box, fontSize: size * 0.36 }}
      className="grid shrink-0 place-items-center rounded-xl border border-(--line) bg-(--bg-2) font-bold text-(--muted)"
    >
      {initials(label)}
    </span>
  );
}
