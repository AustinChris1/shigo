"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Orders" },
  { href: "/new", label: "New" },
  { href: "/credits", label: "Unmatched" },
  { href: "/ledger", label: "Ledger" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-(--line) bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex-1 py-3 text-center text-sm font-semibold ${active ? "text-(--green)" : "text-(--muted)"}`}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
