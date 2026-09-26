import Link from "next/link";
import { redirect } from "next/navigation";
import { currentSeller } from "@/lib/session";
import { createOrderAction } from "@/lib/actions";

export default async function NewOrder() {
  if (!(await currentSeller())) redirect("/login");
  return (
    <main className="space-y-6">
      <header>
        <Link href="/app" className="text-sm text-(--muted)">← Orders</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Collect a payment</h1>
      </header>

      <form action={createOrderAction} className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="amount">Amount (₦)</label>
          <input className="input text-2xl font-bold" id="amount" name="amount" inputMode="decimal" placeholder="4500" autoFocus required />
        </div>
        <div>
          <label className="label" htmlFor="note">What is it for (optional)</label>
          <input className="input" id="note" name="note" placeholder="2 wigs, Ada" maxLength={60} />
        </div>
        <button className="btn btn-primary w-full" type="submit">Create order</button>
      </form>
    </main>
  );
}
