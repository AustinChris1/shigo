import { redirect } from "next/navigation";
import { currentSeller } from "@/lib/session";
import { loginAction } from "@/lib/actions";
import { Wordmark } from "@/components/Mark";
import { AccountField } from "@/components/AccountField";

export default async function Login() {
  if (await currentSeller()) redirect("/app");
  return (
    <main className="space-y-6 pt-8">
      <div>
        <h1><Wordmark size={44} /></h1>
        <p className="mt-1 text-(--muted)">It has entered. Your screen turns green only when the bank says so.</p>
      </div>

      <form action={loginAction} className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input className="input" id="name" name="name" placeholder="Ada Obi" autoComplete="name" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input className="input font-mono tracking-wider" id="phone" name="phone" inputMode="numeric" autoComplete="tel-national" placeholder="08012345678" pattern="0\d{10}" maxLength={11} required />
        </div>
        <AccountField />
        <button className="btn btn-primary w-full" type="submit">Continue</button>
      </form>
      <p className="text-center text-xs text-(--muted)">Pilot build. Sign-in is by phone number only; OTP comes before public use.</p>
    </main>
  );
}
