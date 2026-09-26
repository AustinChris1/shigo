import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentSeller } from "@/lib/session";
import { loginAction } from "@/lib/actions";
import { Mark, Wordmark } from "@/components/Mark";
import { AccountField } from "@/components/AccountField";
import { ThemeToggle } from "@/components/ThemeToggle";
import { photos, src } from "@/lib/photos";
import "@/app/landing.css";
import "./login.css";

export default async function Login() {
  if (await currentSeller()) redirect("/app");
  return (
    <main className="lg">
      <aside className="lg-photo" aria-hidden="true">
        <Image src={src(photos.stall, 1400)} alt="" fill sizes="(min-width: 900px) 50vw, 100vw" priority className="lg-photo-img" />
        <div className="lg-photo-shade" />
        <div className="lg-photo-copy">
          <span className="lg-live"><Mark size={20} state="entered" /> ₦7,250 · Shigo</span>
          <p className="font-display lg-photo-line">Your screen turns green only when the bank says so.</p>
        </div>
      </aside>

      <section className="lg-form">
        <div className="lg-form-top">
          <Link href="/" className="lg-back"><ArrowLeft size={16} aria-hidden="true" /> Home</Link>
          <ThemeToggle className="icon-btn" />
        </div>
        <div className="lg-form-body">
          <h1><Wordmark size={40} /></h1>
          <p className="lg-intro">Sign in to collect a payment. It takes a minute.</p>

          <form action={loginAction} className="card lg-card">
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
          <p className="lg-fine">Demo build. Sign-in is by phone number only; OTP comes before public use.</p>
          <p className="lg-fine">Photo by <a className="underline underline-offset-2" href={`https://unsplash.com/@${photos.stall.user}`} target="_blank" rel="noreferrer">{photos.stall.by}</a>, free to use under the Unsplash licence.</p>
        </div>
      </section>
    </main>
  );
}
