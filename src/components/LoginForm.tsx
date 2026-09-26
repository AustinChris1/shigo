"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { loginAction, type LoginState } from "@/lib/actions";
import { AccountField, type AccountStatus } from "./AccountField";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [name, setName] = useState("");
  const [acct, setAcct] = useState<AccountStatus>("idle");
  const [leftResponse, setLeftResponse] = useState<number | undefined>(undefined);
  const codeRef = useRef<HTMLInputElement>(null);

  // A new code response switches to the code step; "Change details" switches back.
  const onCodeStep = state.step === "code" && leftResponse !== state.resent;
  useEffect(() => {
    if (state.step === "code" && !state.error) {
      if (state.demoCode) toast.info("Demo mode: no SMS sent", { id: "otp-demo", description: `Your code is ${state.demoCode}. Real texts start once an SMS key is set.` });
      else toast.success("Code sent", { id: "otp-sent", description: `Check the texts on ${state.phone}.` });
    }
    if (state.error) toast.error(state.step === "code" ? "Could not confirm the code" : "Could not sign you in", { id: "login-error", description: state.error });
  }, [state]);
  useEffect(() => { if (onCodeStep) codeRef.current?.focus(); }, [onCodeStep]);

  const blocked = acct === "notfound" || acct === "mismatch" || acct === "checking";

  if (onCodeStep) {
    return (
      <form action={action} className="card lg-card">
        <input type="hidden" name="step" value="code" />
        <input type="hidden" name="phone" value={state.phone} />
        <div className="otp-head">
          <span className="otp-icon"><MessageSquareText size={20} aria-hidden="true" /></span>
          <div>
            <p className="font-semibold">Enter the code</p>
            <p className="text-sm text-(--muted)">We sent 6 digits to {state.phone}. It expires in 10 minutes.</p>
          </div>
        </div>
        {state.demoCode && <p className="otp-demo">Demo mode, no SMS sent. Your code is <b>{state.demoCode}</b>.</p>}
        <div>
          <label className="label" htmlFor="code">6-digit code</label>
          <input ref={codeRef} className="input otp-input" id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="000000" required />
        </div>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button className="btn btn-primary w-full" type="submit" disabled={pending}>{pending ? "Checking…" : "Confirm and sign in"}</button>
        <button type="button" className="lg-back justify-center" onClick={() => setLeftResponse(state.resent)}><ArrowLeft size={16} aria-hidden="true" /> Change details or get a new code</button>
      </form>
    );
  }

  return (
    <form action={action} className="card lg-card">
      <input type="hidden" name="step" value="details" />
      <div>
        <label className="label" htmlFor="name">Your name, as on your bank account</label>
        <input className="input" id="name" name="name" placeholder="Ada Obi" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone number</label>
        <input className="input font-mono tracking-wider" id="phone" name="phone" inputMode="numeric" autoComplete="tel-national" placeholder="08012345678" pattern="0\d{10}" maxLength={11} required defaultValue={state.phone} />
      </div>
      <AccountField personName={name} onStatus={setAcct} />
      {state.error && state.step !== "code" && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn btn-primary w-full" type="submit" disabled={pending || blocked} aria-disabled={pending || blocked}>
        {pending ? "Checking with your bank…" : acct === "checking" ? "Checking account…" : "Send me a code"}
      </button>
    </form>
  );
}
