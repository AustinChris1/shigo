"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BadgeCheck, Check, ChevronDown, Search } from "lucide-react";
import banks from "@/lib/banks.json";
import { nameTallies } from "@/lib/names";

type Result = { key: string; kind: "found"; name: string } | { key: string; kind: "notfound" } | { key: string; kind: "unavailable"; limit: boolean };
type Bank = { name: string; code: string; slug: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Searchable bank picker (type to filter, arrows to move, Enter to pick) plus the account number,
// which resolves to the account holder's name when a Paystack key is configured server-side.
export type AccountStatus = "idle" | "checking" | "found" | "mismatch" | "notfound" | "unavailable";

export function AccountField({ defaultBankCode = "050", defaultAccount = "", personName = "", onStatus }: { defaultBankCode?: string; defaultAccount?: string; personName?: string; onStatus?: (s: AccountStatus) => void }) {
  const list = banks as Bank[];
  const [bank, setBank] = useState<Bank>(() => list.find((b) => b.code === defaultBankCode) ?? list[0]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [account, setAccount] = useState(defaultAccount);
  const [result, setResult] = useState<Result | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return list.slice(0, 12);
    const starts = list.filter((b) => norm(b.name).startsWith(q));
    const contains = list.filter((b) => !norm(b.name).startsWith(q) && norm(b.name).includes(q));
    return [...starts, ...contains].slice(0, 12);
  }, [query, list]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (b: Bank) => { setBank(b); setQuery(""); setOpen(false); };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) { setOpen(true); e.preventDefault(); return; }
    if (e.key === "ArrowDown") { setActive((a) => Math.min(a + 1, matches.length - 1)); e.preventDefault(); }
    else if (e.key === "ArrowUp") { setActive((a) => Math.max(a - 1, 0)); e.preventDefault(); }
    else if (e.key === "Enter") { if (matches[active]) pick(matches[active]); e.preventDefault(); }
    else if (e.key === "Escape") { setOpen(false); setQuery(""); }
    else if (e.key === "Tab") { setOpen(false); setQuery(""); }
  };

  const valid = /^\d{10}$/.test(account);
  const key = `${bank.code}:${account}`;
  const status = !valid ? "idle" : result?.key === key ? result.kind : "checking";

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/bank/resolve?account=${account}&bank=${encodeURIComponent(bank.code)}`, { cache: "no-store" });
        const d = await r.json();
        if (cancelled) return;
        if (d.unavailable) setResult({ key, kind: "unavailable", limit: !!d.limit });
        else if (d.found) setResult({ key, kind: "found", name: d.name });
        else setResult({ key, kind: "notfound" });
      } catch {
        if (!cancelled) setResult({ key, kind: "unavailable", limit: false });
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [account, bank.code, key, valid]);

  // Name matching runs in the browser against the stored bank name, so editing the name never spends a lookup.
  const tallies = result?.kind === "found" && personName.trim() ? nameTallies(personName, result.name) : null;
  const shown: AccountStatus = status === "found" && tallies === false ? "mismatch" : (status as AccountStatus);
  useEffect(() => { onStatus?.(shown); }, [shown, onStatus]);

  return (
    <>
      <div ref={wrapRef} className="bank-picker">
        <label className="label" htmlFor="bankSearch">Bank buyers pay into</label>
        <input type="hidden" name="bankCode" value={bank.code} />
        <div className="bank-picker-field">
          <Search size={16} aria-hidden="true" className="bank-picker-icon" />
          <input
            id="bankSearch"
            className="input bank-picker-input"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].code}` : undefined}
            autoComplete="off"
            placeholder={bank.name}
            value={open ? query : bank.name}
            onFocus={() => { setOpen(true); setActive(0); }}
            onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
            onKeyDown={onKey}
            onBlur={() => { setOpen(false); setQuery(""); }}
          />
          <ChevronDown size={16} aria-hidden="true" className="bank-picker-chev" />
        </div>
        {open && (
          <ul id={listId} role="listbox" className="bank-picker-list" aria-label="Banks">
            {matches.length === 0 && <li className="bank-picker-empty">No bank matches “{query}”.</li>}
            {matches.map((b, i) => (
              <li
                key={b.code}
                id={`${listId}-${b.code}`}
                role="option"
                aria-selected={b.code === bank.code}
                className={`bank-picker-item ${i === active ? "is-active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); pick(b); }}
                onMouseEnter={() => setActive(i)}
              >
                <span>{b.name}</span>
                {b.code === bank.code && <Check size={16} aria-hidden="true" />}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label className="label" htmlFor="accountNumber">Account number buyers pay into</label>
        <input
          className="input font-mono tracking-wider"
          id="accountNumber"
          name="accountNumber"
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          placeholder="0123456789"
          value={account}
          onChange={(e) => setAccount(e.target.value.replace(/\D/g, "").slice(0, 10))}
          aria-describedby="account-help"
        />
        <p id="account-help" className="mt-1 text-xs" aria-live="polite">
          {status === "checking" && <span className="text-(--muted)">Checking the name on this account…</span>}
          {shown === "found" && result?.kind === "found" && <span className="acct-ok"><BadgeCheck size={14} aria-hidden="true" /> {result.name}{tallies ? " · matches your name" : ""}</span>}
          {shown === "mismatch" && result?.kind === "found" && <span className="acct-bad">This account is in the name <b>{result.name}</b>. Enter your name as it appears on the account.</span>}
          {status === "notfound" && <span className="text-(--red)">No account found with that number at this bank.</span>}
          {status === "unavailable" && result?.kind === "unavailable" && <span className="text-(--muted)">{result.limit ? "The bank check is busy right now, so we can’t confirm the name. You can still continue; your account will show as not verified." : "Name check is off on this build. You can still continue."}</span>}
          {status === "idle" && <span className="text-(--muted)">The account the bank sends Shigo notifications for.</span>}
        </p>
      </div>
    </>
  );
}
