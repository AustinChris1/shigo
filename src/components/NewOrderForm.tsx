"use client";

import { useActionState } from "react";
import { createOrderAction, type OrderFormState } from "@/lib/actions";

export function NewOrderForm() {
  const [state, action, pending] = useActionState<OrderFormState, FormData>(createOrderAction, {});
  return (
    // A new key after an error puts back what the seller typed, which React would otherwise clear.
    <form key={state.error ? JSON.stringify(state) : "new"} action={action} className="card space-y-4 p-4" noValidate>
      <div>
        <label className="label" htmlFor="amount">Amount (₦)</label>
        <input
          className="input text-2xl font-bold"
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="4500"
          autoFocus
          required
          defaultValue={state.amount}
          aria-invalid={!!state.error}
          aria-describedby={state.error ? "amount-error" : undefined}
        />
        {state.error && <p id="amount-error" className="form-error mt-1 text-sm" role="alert">{state.error}</p>}
      </div>
      <div>
        <label className="label" htmlFor="buyerName">Who is paying (optional)</label>
        <input className="input" id="buyerName" name="buyerName" placeholder="Chidi Okafor" autoComplete="off" maxLength={60} defaultValue={state.buyerName} />
        <p className="mt-1 text-xs text-(--muted)">As on their bank account. Helps tell buyers apart.</p>
      </div>
      <div>
        <label className="label" htmlFor="note">What they are buying (optional)</label>
        <input className="input" id="note" name="note" placeholder="12-inch frontal" maxLength={60} defaultValue={state.note} />
      </div>
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>{pending ? "Creating…" : "Create order"}</button>
    </form>
  );
}
