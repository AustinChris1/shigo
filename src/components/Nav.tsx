"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, ClipboardList, Inbox, Plus } from "lucide-react";

const items = [
  { href: "/app", label: "Orders", Icon: ClipboardList },
  { href: "/credits", label: "Unmatched", Icon: Inbox },
  { href: "/new", label: "New", Icon: Plus, primary: true },
  { href: "/ledger", label: "Ledger", Icon: BookOpenText },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="app-nav" aria-label="App">
      <div className="app-nav-row">
        {items.map(({ href, label, Icon, primary }) => {
          const active = path === href || (href !== "/app" && path.startsWith(href));
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`app-nav-item ${active ? "is-active" : ""} ${primary ? "is-primary" : ""}`}>
              <span className="app-nav-icon"><Icon size={primary ? 24 : 21} aria-hidden="true" /></span>
              <span className="app-nav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
