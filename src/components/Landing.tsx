"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, ExternalLink, FileText, Landmark, PauseCircle, Smartphone, Wallet } from "lucide-react";
import { Mark } from "./Mark";
import { ThemeToggle } from "./ThemeToggle";
import { photos, src, type Photo } from "@/lib/photos";
import "@/app/landing.css";

const STEPS = [
  { title: "The buyer shows a receipt.", body: "It looks real. Your order stays Not yet. Nothing on their phone can move your screen." },
  { title: "The bank tells Shigo.", body: "When the money lands in your Ecobank account, the bank sends Shigo a notification. Not the buyer. The bank." },
  { title: "It turns green.", body: "The coin drops into the slot. Shigo. It has entered. Hand over the goods." },
] as const;

function Pic({ p, className = "", sizes = "(min-width: 900px) 40vw, 100vw", priority = false }: { p: Photo; className?: string; sizes?: string; priority?: boolean }) {
  return <Image src={src(p, 1200)} alt={p.alt} fill sizes={sizes} className={className} priority={priority} />;
}

// The phone that tells the story while the text scrolls past it.
function PhoneScene({ step }: { step: number }) {
  return (
    <div className="ld-phone" data-step={step} aria-hidden="true">
      <div className="ld-phone-screen">
        <div className="ld-phone-top"><Mark size={16} state="entered" /><span>Shigo</span></div>
        <div className="ld-phone-card">
          <div className="ld-phone-mark">
            <Mark size={56} state="pending" className="ld-phone-mark-pending" />
            <Mark size={56} state="entered" className="ld-phone-mark-entered" animate={step === 2} />
          </div>
          <div className="ld-phone-amt font-display">₦4,500</div>
          <div className="ld-phone-ref">SG-7K2Q · 2 wigs</div>
          <div className="ld-phone-state">
            <span className="ld-phone-notyet">Not yet</span>
            <span className="ld-phone-shigo font-display">Shigo. It has entered.</span>
          </div>
        </div>
        <div className="ld-toast ld-toast-receipt"><span className="ld-toast-k">Buyer&rsquo;s screenshot</span>Transfer successful ₦4,500.00</div>
        <div className="ld-toast ld-toast-bank"><span className="ld-toast-k">Ecobank</span>CR NGN 4,500.00 · SG-7K2Q</div>
      </div>
    </div>
  );
}

// The final figure is in the markup; with motion allowed it counts up from zero once it scrolls into view.
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1100);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * eased).toLocaleString() + suffix;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix]);
  return <span ref={ref}>{to.toLocaleString()}{suffix}</span>;
}

export function Landing() {
  const [step, setStep] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const mosaicRef = useRef<HTMLDivElement>(null);

  // Reveals: anything with data-reveal gets data-visible once; the story steps drive the phone's state.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveal = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).setAttribute("data-visible", ""); reveal.unobserve(e.target); }
    }, { rootMargin: "-60px" });
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => reveal.observe(el));

    const steps = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step));
    }, { rootMargin: "-45% 0px -45% 0px" });
    stepRefs.current.forEach((el) => el && steps.observe(el));

    let cleanup = () => {};
    if (!reduce) {
      (async () => {
        const gsap = (await import("gsap")).default;
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        const Lenis = (await import("lenis")).default;
        gsap.registerPlugin(ScrollTrigger);
        // Inertial smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync.
        const lenis = new Lenis({ lerp: 0.1, anchors: true });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (t: number) => lenis.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        const tiles = mosaicRef.current?.querySelectorAll<HTMLElement>("[data-speed]") ?? [];
        const tweens = Array.from(tiles).map((el) =>
          gsap.to(el, { yPercent: -12 * Number(el.dataset.speed), ease: "none", scrollTrigger: { trigger: mosaicRef.current, start: "top bottom", end: "bottom top", scrub: 0.6 } }),
        );
        cleanup = () => { tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); }); gsap.ticker.remove(tick); lenis.destroy(); };
      })();
    }
    return () => { reveal.disconnect(); steps.disconnect(); cleanup(); };
  }, []);

  return (
    <div className="ld">
      <header className="ld-top">
        <Link href="/" className="ld-brand" aria-label="Shigo home"><Mark size={24} state="entered" /><span className="font-display">Shigo</span></Link>
        <nav className="ld-nav" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#why">Why now</a>
          <a href="#record">The record</a>
        </nav>
        <div className="ld-top-actions">
          <ThemeToggle className="icon-btn" />
          <Link href="/login" className="btn btn-primary ld-top-cta">Open Shigo</Link>
        </div>
      </header>

      {/* Hero: the words on the left, the sellers on the right, the mechanic looping on the first photo. */}
      <section className="ld-hero" aria-labelledby="hero-title">
        <div className="ld-hero-copy">
          <h1 id="hero-title" className="font-display ld-h1">No more fake alerts. <span className="ld-h1-green">Just real money.</span></h1>
          <p className="ld-lede">Shigo confirms every sale straight from your bank in seconds, and turns your sales into an income record you can take to a lender.</p>
          <div className="ld-actions">
            <Link href="/login" className="btn btn-primary">Open Shigo <ArrowRight size={18} aria-hidden="true" /></Link>
            <a href="#how" className="btn btn-ghost">See it work</a>
          </div>
          <p className="ld-hero-note">Built for Ecobank Blaze accounts. An InnovateX 2026 entry.</p>
        </div>
        <div ref={mosaicRef} className="ld-mosaic" role="group" aria-label="Nigerian sellers and buyers with their phones">
          <figure className="ld-tile ld-tile-a" data-speed="1"><Pic p={photos.excited} priority sizes="(min-width: 900px) 22vw, 50vw" />
            <figcaption className="ld-live" aria-hidden="true">
              <span className="ld-live-mark"><Mark size={22} state="pending" className="ld-live-pending" /><Mark size={22} state="entered" className="ld-live-entered" /></span>
              <span className="ld-live-amt">₦4,500</span>
              <span className="ld-live-state"><span className="ld-live-notyet">Not yet</span><span className="ld-live-shigo">Shigo</span></span>
            </figcaption>
          </figure>
          <figure className="ld-tile ld-tile-b" data-speed="2"><Pic p={photos.showing} sizes="(min-width: 900px) 22vw, 50vw" /></figure>
          <figure className="ld-tile ld-tile-c" data-speed="1.5"><Pic p={photos.headscarf} sizes="(min-width: 900px) 18vw, 50vw" /></figure>
          <figure className="ld-tile ld-tile-d" data-speed="0.6"><Pic p={photos.hand} sizes="(min-width: 900px) 18vw, 50vw" /></figure>
          <figure className="ld-tile ld-tile-e" data-speed="2.4"><Pic p={photos.fruit} sizes="(min-width: 900px) 16vw, 50vw" /></figure>
        </div>
      </section>

      <div className="ld-marquee" aria-hidden="true">
        <div className="ld-marquee-track">
          {[...Array(2)].map((_, k) => (
            <span key={k} className="ld-marquee-run">
              {["Wigs", "Lashes", "Thrift", "Small chops", "Data", "Skincare", "Printing", "Frontal", "Perfume", "Phone cases"].map((w) => (
                <span key={w + k} className="ld-marquee-item"><Mark size={14} state="entered" />{w}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* How it works: the phone stays; the story scrolls past it. */}
      <section id="how" className="ld-how" aria-labelledby="how-title">
        <div className="ld-how-head" data-reveal>
          <h2 id="how-title" className="font-display ld-h2">One order. One green screen.</h2>
          <p className="ld-sub">Scroll the story. The phone shows what the seller sees.</p>
        </div>
        <div className="ld-how-grid">
          <ol className="ld-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} ref={(el) => { stepRefs.current[i] = el; }} data-step={i} className={`ld-step ${step === i ? "is-active" : ""}`}>
                <span className="ld-step-n font-display">{i + 1}</span>
                <h3 className="font-display ld-h3">{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="ld-phone-wrap">
            <PhoneScene step={step} />
            <div className="ld-mobile-cap" aria-live="polite">
              <div className="ld-mobile-dots" aria-hidden="true">{STEPS.map((_, i) => <span key={i} className={i <= step ? "on" : ""} />)}</div>
              <h3 className="font-display ld-h3">{STEPS[step].title}</h3>
              <p>{STEPS[step].body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Three guarantees, one list. */}
      <section className="ld-rules" aria-label="What Shigo promises">
        <ul className="ld-rules-grid">
          {[
            [Landmark, "The bank is the only witness.", "A credit notification from your bank is the only thing that turns an order green."],
            [PauseCircle, "Held, never guessed.", "Two orders at the same amount? Shigo holds the money and asks you. It never marks the wrong one paid."],
            [FileText, "The record is yours.", "Every confirmed payment is a dated row you can export. The lender decides. The record is yours."],
          ].map(([Icon, t, b], i) => {
            const I = Icon as typeof Landmark;
            return (
              <li key={String(t)} className="ld-rule" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="ld-rule-icon"><I size={24} aria-hidden="true" /></span>
                <h3 className="font-display ld-h3">{String(t)}</h3>
                <p>{String(b)}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Why now: the numbers, on the people they are about. */}
      <section id="why" className="ld-why" aria-labelledby="why-title">
        <div className="ld-why-head" data-reveal>
          <h2 id="why-title" className="font-display ld-h2">Why now.</h2>
          <p className="ld-sub">Fake receipts are cheap. Real credits are slow. Sellers are going back to cash.</p>
        </div>
        <div className="ld-why-grid">
          <figure className="ld-lead" data-reveal>
            <div className="ld-lead-img"><Pic p={photos.tomatoes} sizes="(min-width: 900px) 55vw, 100vw" /></div>
            <figcaption>
              <div className="font-display ld-figure"><Counter to={52} suffix="%" /></div>
              <p>of 330 Lagos traders surveyed had been shown a fake alert. 27% lost money. 15% stopped taking transfers.</p>
              <a className="ld-source" href="https://saharareporters.com/2026/09/20/investigation-how-online-platform-slipcraft-helps-scammers-fake-transfers-generate" target="_blank" rel="noreferrer">Punch survey, Feb 2025, as cited in Sahara Reporters, 20 Sep 2026 <ExternalLink size={12} aria-hidden="true" /></a>
            </figcaption>
          </figure>
          <ul className="ld-side">
            <li className="ld-stat" data-reveal style={{ transitionDelay: "90ms" }}>
              <div className="ld-stat-img"><Pic p={photos.bananas} sizes="64px" /></div>
              <div className="ld-figure-sm"><Counter to={61000} suffix="+" /></div>
              <p>people in the Telegram group of a site that prints fake OPay, Kuda and PalmPay receipts for 650 points each.</p>
              <a className="ld-source" href="https://saharareporters.com/2026/09/20/investigation-how-online-platform-slipcraft-helps-scammers-fake-transfers-generate" target="_blank" rel="noreferrer">Sahara Reporters, 20 Sep 2026 <ExternalLink size={12} aria-hidden="true" /></a>
            </li>
            <li className="ld-stat" data-reveal style={{ transitionDelay: "180ms" }}>
              <div className="ld-stat-img"><Pic p={photos.striped} sizes="64px" /></div>
              <div className="ld-figure-sm"><Counter to={53} suffix="%" /></div>
              <p>of student businesses sell mainly on WhatsApp, and two in three Nigerian students already earn while in school.</p>
              <a className="ld-source" href="https://techcabal.com/2026/03/16/nigerias-campus-gig-economy-may-be-generating-%E2%82%A6400-billion-a-year/" target="_blank" rel="noreferrer">The Garage via TechCabal, Mar 2026 <ExternalLink size={12} aria-hidden="true" /></a>
            </li>
          </ul>
        </div>
      </section>

      {/* The record: the seller after NYSC, and the rows that speak for her. */}
      <section id="record" className="ld-record" aria-labelledby="record-title">
        <div className="ld-record-img" data-reveal><Pic p={photos.corps} sizes="(min-width: 900px) 45vw, 100vw" /></div>
        <div className="ld-record-copy" data-reveal>
          <h2 id="record-title" className="font-display ld-h2">Every green becomes a row.</h2>
          <p className="ld-sub">Each confirmed payment is a dated line in a record you own. Export it when you apply for a loan after NYSC. The lender decides. The record is yours.</p>
          <table className="ld-ledger">
            <caption>Illustrative rows. No pilot has run yet; nothing here is a claim of volume.</caption>
            <thead><tr><th>Date</th><th>Order</th><th>By</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {[["26 Sep", "SG-7K2Q · 2 wigs", "Ecobank", "₦4,500"], ["26 Sep", "SG-M3PA · lashes", "Ecobank", "₦7,250"], ["25 Sep", "SG-Q9TR · frontal", "Ecobank", "₦18,000"]].map((r) => (
                <tr key={r[1]}><td className="ld-nowrap">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td className="text-right ld-nowrap">{r[3]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* The door. */}
      <section className="ld-cta" aria-labelledby="cta-title">
        <div className="ld-cta-img"><Pic p={photos.market} sizes="100vw" /></div>
        <div className="ld-cta-body" data-reveal>
          <Mark size={64} state="entered" />
          <h2 id="cta-title" className="font-display ld-h2">Stop checking their screen.</h2>
          <p className="ld-sub">No hardware. No app for the buyer. No guessing with money.</p>
          <div className="ld-actions ld-actions-center">
            <Link href="/login" className="btn ld-btn-light">Open Shigo <ArrowRight size={18} aria-hidden="true" /></Link>
            <a href="https://github.com/AustinChris1/shigo" target="_blank" rel="noreferrer" className="btn ld-btn-outline">Source</a>
          </div>
          <ul className="ld-cta-icons" aria-label="What you need">
            <li><Smartphone size={18} aria-hidden="true" /> A phone</li>
            <li><Wallet size={18} aria-hidden="true" /> A Blaze account</li>
            <li><BadgeCheck size={18} aria-hidden="true" /> Nothing else</li>
          </ul>
        </div>
      </section>

      <footer className="ld-foot">
        <div className="ld-foot-row">
          <span className="ld-brand"><Mark size={18} state="entered" /><span className="font-display">Shigo</span></span>
          <span>Shigo is Hausa for “enter”. Built for Ecobank Blaze accounts. An InnovateX 2026 entry.</span>
        </div>
        <p className="ld-credits"><Link href="/photo-credits">Photo credits</Link></p>
        <p className="ld-credits">Rails: Ecobank Notification Service, Paystack test mode. A simulated or test credit is always labelled.</p>
      </footer>
    </div>
  );
}
