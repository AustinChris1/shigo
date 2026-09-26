"use client";

import { useEffect, useState } from "react";
import banks from "@/lib/banks.json";

type Result = { key: string; kind: "found"; name: string } | { key: string; kind: "notfound" } | { key: string; kind: "unavailable" };

// Bank picker plus account number; resolves the account name when a Paystack key is configured server-side.
export function AccountField({ defaultBankCode = "050", defaultAccount = "" }: { defaultBankCode?: string; defaultAccount?: string }) {
  const [bank, setBank] = useState(defaultBankCode);
  const [account, setAccount] = useState(defaultAccount);
  const [result, setResult] = useState<Result | null>(null);

  const valid = /^\d{10}$/.test(account);
  const key = `${bank}:${account}`;
  const status = !valid ? "idle" : result?.key === key ? result.kind : "checking";

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/bank/resolve?account=${account}&bank=${encodeURIComponent(bank)}`, { cache: "no-store" });
        const d = await r.json();
        if (cancelled) return;
        if (d.unavailable) setResult({ key, kind: "unavailable" });
        else if (d.found) setResult({ key, kind: "found", name: d.name });
        else setResult({ key, kind: "notfound" });
      } catch {
        if (!cancelled) setResult({ key, kind: "unavailable" });
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [account, bank, key, valid]);

  return (
    <>
      <div>
        <label className="label" htmlFor="bankCode">Bank buyers pay into</label>
        <select id="bankCode" name="bankCode" className="input" value={bank} onChange={(e) => setBank(e.target.value)}>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>
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
          {status === "found" && result?.kind === "found" && <span className="font-semibold text-(--green)">{result.name}</span>}
          {status === "notfound" && <span className="text-(--red)">No account found with that number at this bank.</span>}
          {status === "unavailable" && <span className="text-(--muted)">Name check is off on this build. The bank must send notifications for this account.</span>}
          {status === "idle" && <span className="text-(--muted)">The account the bank sends Shigo notifications for.</span>}
        </p>
      </div>
    </>
  );
}
