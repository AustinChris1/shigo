import { redirect } from "next/navigation";
import { currentSeller } from "@/lib/session";
import { loginAction } from "@/lib/actions";
import { Wordmark } from "@/components/Mark";

export default async function Login() {
  if (await currentSeller()) redirect("/");
  return (
    <main className="space-y-6 pt-8">
      <div>
        <h1><Wordmark size={44} /></h1>
        <p className="mt-1 text-(--muted)">It has entered. Your screen turns green only when the bank says so.</p>
      </div>

      <form action={loginAction} className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input className="input" id="name" name="name" placeholder="Ada Obi" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input className="input" id="phone" name="phone" inputMode="numeric" placeholder="08012345678" required />
        </div>
        <div>
          <label className="label" htmlFor="bankName">Bank buyers pay into</label>
          <input className="input" id="bankName" name="bankName" placeholder="Ecobank" defaultValue="Ecobank" />
        </div>
        <div>
          <label className="label" htmlFor="accountNumber">Account number buyers pay into</label>
          <input className="input" id="accountNumber" name="accountNumber" inputMode="numeric" placeholder="10 digits" />
          <p className="mt-1 text-xs text-(--muted)">This must be the account the bank sends us notifications for.</p>
        </div>
        <button className="btn btn-primary w-full" type="submit">Continue</button>
      </form>
      <p className="text-center text-xs text-(--muted)">Pilot build. Sign-in is by phone number only; OTP comes before public use.</p>
    </main>
  );
}
