import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentSeller } from "@/lib/session";
import { Mark, Wordmark } from "@/components/Mark";
import { LoginForm } from "@/components/LoginForm";
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

          <LoginForm />
          <p className="lg-fine">We text a one-time code to your phone to sign you in.</p>
        </div>
      </section>
    </main>
  );
}
