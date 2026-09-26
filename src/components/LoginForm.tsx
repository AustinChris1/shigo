"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { loginAction, type LoginState } from "@/lib/actions";
import { AccountField, type AccountStatus } from "./AccountField";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [name, setName] = useState("");
  const [acct, setAcct] = useState<AccountStatus>("idle");
  useEffect(() => { if (state.error) toast.error("Could not sign you in", { id: "login-error", description: state.error }); }, [state]);
  const blocked = acct === "notfound" || acct === "mismatch" || acct === "checking";

  return (
    <form action={action} className="card lg-card">
      <div>
        <label className="label" htmlFor="name">Your name, as on your bank account</label>
        <input className="input" id="name" name="name" placeholder="Ada Obi" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone number</label>
        <input className="input font-mono tracking-wider" id="phone" name="phone" inputMode="numeric" autoComplete="tel-national" placeholder="08012345678" pattern="0\d{10}" maxLength={11} required />
      </div>
      <AccountField personName={name} onStatus={setAcct} />
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn btn-primary w-full" type="submit" disabled={pending || blocked} aria-disabled={pending || blocked}>
        {pending ? "Checking with your bank…" : acct === "checking" ? "Checking account…" : "Continue"}
      </button>
    </form>
  );
}
