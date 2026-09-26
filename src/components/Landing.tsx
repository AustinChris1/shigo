"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Mark } from "./Mark";
import "@/app/landing.css";

// The landing page as a printed note: engraved plates, one idea each, one security thread down the page.

function Guilloche({ className = "", rings = 28, opacity = 0.16, fit = "slice" }: { className?: string; rings?: number; opacity?: number; fit?: "slice" | "meet" }) {
  const ellipses = Array.from({ length: rings }, (_, i) => (i * 180) / rings);
  return (
    <svg className={className} viewBox="0 0 1000 1000" preserveAspectRatio={`xMidYMid ${fit}`} aria-hidden="true" fill="none">
      <g stroke="currentColor" opacity={opacity}>
        {ellipses.map((a, i) => (
          <ellipse key={a} cx="500" cy="500" rx="470" ry="150" strokeWidth={i % 3 === 0 ? 1.4 : 0.7} transform={`rotate(${a} 500 500)`} />
        ))}
        {ellipses.map((a) => (
          <ellipse key={`i${a}`} cx="500" cy="500" rx="300" ry="60" strokeWidth="0.6" transform={`rotate(${a + 3} 500 500)`} />
        ))}
        <circle cx="500" cy="500" r="486" strokeWidth="2" />
        <circle cx="500" cy="500" r="478" strokeWidth="0.6" />
      </g>
    </svg>
  );
}

function Band({ className = "" }: { className?: string }) {
  const n = 60;
  return (
    <svg className={className} viewBox={`0 0 ${n * 20} 20`} preserveAspectRatio="none" aria-hidden="true" fill="none">
      <path d={Array.from({ length: n }, (_, i) => `M${i * 20} 18 q10 -20 20 0`).join(" ")} stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d={`M0 10 H${n * 20}`} stroke="currentColor" strokeWidth="0.6" opacity="0.45" />
    </svg>
  );
}

// Every outcome present at once; the live one is struck forward. Inactive words are hidden from readers.
function StateWord({ live, size = "" }: { live: boolean; size?: string }) {
  return (
    <span className={`note-state ${size}`}>
      <span className="note-state-word note-state-notyet" aria-hidden={live ? "true" : undefined}>Not yet</span>
      <span className="note-state-word note-state-held" aria-hidden="true">Held</span>
      <span className={`note-state-word note-state-shigo ${live ? "is-live" : ""}`} aria-hidden={live ? undefined : "true"}>Shigo</span>
    </span>
  );
}

export function Landing() {
  const threadRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef<HTMLElement>(null);

  // The spine draws with scroll; the plate 2 callback is the one scroll reveal on the page.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const el = threadRef.current;
      if (!el) return;
      const tween = gsap.fromTo(el, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.4 } });
      cleanup = () => { tween.scrollTrigger?.kill(); tween.kill(); };
    })();
    const cb = callbackRef.current;
    let io: IntersectionObserver | null = null;
    if (cb) {
      io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) { cb.setAttribute("data-visible", ""); io?.disconnect(); } }, { rootMargin: "-80px" });
      io.observe(cb);
    }
    return () => { cleanup(); io?.disconnect(); };
  }, []);

  return (
    <div className="note">
      <div ref={threadRef} className="note-thread" aria-hidden="true" />

      <header className="note-top">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="Shigo home">
          <Mark size={22} state="entered" />
          <span className="font-display text-lg font-extrabold tracking-tight">Shigo</span>
        </Link>
        <Link href="/login" className="note-link">Open Shigo</Link>
      </header>

      {/* Plate 0: the medallion. The whole mechanic, looping, centred, nothing else around it. */}
      <section className="plate plate-hero" aria-labelledby="hero-title">
        <div className="note-medallion">
          <div className="note-rosette" aria-hidden="true"><Guilloche className="note-rosette-svg" rings={30} opacity={0.22} fit="meet" /></div>
          <div className="note-watermark font-display" aria-hidden="true">SHIGO</div>
          <div className="note-coin-track" aria-hidden="true">
            <Mark size={300} state="pending" className="note-mark note-mark-pending" />
            <Mark size={300} state="entered" className="note-mark note-mark-entered" />
          </div>
          <p className="note-statebar font-display">
            <span className="note-statebar-amt">₦4,500</span> <StateWord live size="note-state-lg" />
          </p>
        </div>
        <div className="note-hero-copy">
          <h1 id="hero-title" className="font-display note-h1">
            Shigo. <span className="note-h1-quiet">It has entered.</span>
          </h1>
          <p className="note-lede">Your screen turns green only when the bank says so.</p>
        </div>
        <div className="note-actions note-actions-hero">
          <Link href="/login" className="note-btn note-btn-primary">
            Open Shigo <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <a href="#screenshot" className="note-btn note-btn-ghost">See it work</a>
        </div>
        <Band className="note-band note-band-bottom" />
      </section>

      {/* Plate 1: the screenshot changes nothing. */}
      <section id="screenshot" className="plate plate-paper" aria-labelledby="p1">
        <div className="plate-inner">
          <h2 id="p1" className="font-display note-h2">A screenshot changes nothing.</h2>
          <p className="note-body">The buyer shows a receipt. Your order stays where it is. Not a screenshot, not an SMS, not their app can move it.</p>
          <div className="note-demo">
            <figure className="note-receipt">
              <figcaption className="note-receipt-head">
                <span>Transfer successful</span>
                <span className="note-tag">illustrative</span>
              </figcaption>
              <div className="font-display note-receipt-amt">₦4,500.00</div>
              <div className="note-receipt-meta">to ADA OBI · 14:02 · Ref 00X…</div>
              <div className="note-receipt-stamp-row"><span className="note-receipt-stamp">CANNOT CHANGE THE SCREEN</span></div>
            </figure>
            <figure className="note-order">
              <Mark size={40} state="pending" />
              <figcaption>
                <div className="font-display text-2xl font-extrabold">₦4,500</div>
                <div className="note-order-meta">SG-7K2Q · 2 wigs</div>
              </figcaption>
              <StateWord live={false} />
            </figure>
          </div>
        </div>
      </section>

      {/* Plate 2: the bank is the only witness. The one scroll reveal on the page. */}
      <section className="plate plate-green" aria-labelledby="p2">
        <Guilloche className="note-guilloche" rings={18} opacity={0.1} />
        <div className="plate-inner">
          <h2 id="p2" className="font-display note-h2">The bank is the only witness.</h2>
          <p className="note-body">When ₦4,500 lands in your Ecobank account, the bank tells Shigo directly. The coin drops. The order turns green.</p>
          <figure ref={callbackRef} className="note-callback">
            <figcaption className="note-callback-line">
              <span className="note-callback-cr">CR</span>
              <span className="note-callback-amt">NGN 4,500.00</span>
              <span className="note-callback-meta">Ecobank · 14:02:11 · SG-7K2Q</span>
              <span className="note-tag">illustrative</span>
            </figcaption>
            <div className="note-order note-order-dark">
              <Mark size={40} state="entered" />
              <div>
                <div className="font-display text-2xl font-extrabold">₦4,500</div>
                <div className="note-order-meta">SG-7K2Q · 2 wigs</div>
              </div>
              <StateWord live />
            </div>
          </figure>
        </div>
      </section>

      {/* Plate 3: held, never guessed. */}
      <section className="plate plate-paper" aria-labelledby="p3">
        <div className="plate-inner">
          <h2 id="p3" className="font-display note-h2">Held, never guessed.</h2>
          <p className="note-body">Two orders at the same amount and a payment with no reference? Shigo holds the money and asks you which order it belongs to. It never marks the wrong one paid.</p>
          <ul className="note-ghosts" aria-label="Every outcome an order can have">
            <li className="note-ghost">Not yet</li>
            <li className="note-ghost is-struck">Held</li>
            <li className="note-ghost">Shigo</li>
          </ul>
        </div>
      </section>

      {/* Plate 4: every green becomes a row. */}
      <section className="plate plate-paper plate-ledger" aria-labelledby="p4">
        <div className="plate-inner">
          <h2 id="p4" className="font-display note-h2">Every green becomes a row.</h2>
          <p className="note-body">Each confirmed payment is a dated line in a record you own. Export it when you apply for a loan after NYSC. The lender decides. The record is yours.</p>
          <table className="note-ledger">
            <caption className="note-fine">Illustrative rows. No pilot has run yet; nothing here is a claim of volume.</caption>
            <thead>
              <tr><th>Date</th><th>Order</th><th>Confirmed by</th><th className="text-right">Amount</th></tr>
            </thead>
            <tbody>
              {[
                ["26 Sep", "SG-7K2Q · 2 wigs", "Ecobank", "₦4,500"],
                ["26 Sep", "SG-M3PA · lashes", "Ecobank", "₦7,250"],
                ["25 Sep", "SG-Q9TR · frontal", "Ecobank", "₦18,000"],
                ["25 Sep", "SG-B2ZX · closure", "Ecobank", "₦12,000"],
              ].map((r) => (
                <tr key={r[1]}>
                  <td className="note-nowrap">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td className="text-right note-nowrap">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Plate 5: why. Three sentences, each with its source. */}
      <section className="plate plate-green" aria-labelledby="p5">
        <div className="plate-inner">
          <h2 id="p5" className="font-display note-h2">Why this, why now.</h2>
          <div className="note-evidence">
            <p>
              <span className="font-display note-figure">52</span> of every 100 Lagos traders surveyed had been shown a fake alert; 27 had lost money to one; 15 had stopped taking transfers.
              <a className="note-source" href="https://saharareporters.com/2026/09/20/investigation-how-online-platform-slipcraft-helps-scammers-fake-transfers-generate" target="_blank" rel="noreferrer">Punch survey, 2025, as reported by Sahara Reporters <ExternalLink size={12} aria-hidden="true" /></a>
            </p>
            <p>
              <span className="font-display note-figure">61,000</span> people sit in the Telegram group of a site that prints fake OPay, Kuda and PalmPay receipts for 650 points each.
              <a className="note-source" href="https://saharareporters.com/2026/09/20/investigation-how-online-platform-slipcraft-helps-scammers-fake-transfers-generate" target="_blank" rel="noreferrer">Sahara Reporters, 20 Sep 2026 <ExternalLink size={12} aria-hidden="true" /></a>
            </p>
            <p>
              <span className="font-display note-figure">2 in 3</span> Nigerian students already earn while in school, and 53% of student businesses sell mainly on WhatsApp.
              <a className="note-source" href="https://techcabal.com/2026/03/16/nigerias-campus-gig-economy-may-be-generating-%E2%82%A6400-billion-a-year/" target="_blank" rel="noreferrer">The Garage via TechCabal, Mar 2026 <ExternalLink size={12} aria-hidden="true" /></a>
            </p>
          </div>
        </div>
      </section>

      {/* Plate 6: the seal and the door. */}
      <section className="plate plate-green plate-close" aria-labelledby="close-title">
        <Band className="note-band note-band-top" />
        <div className="plate-inner text-center">
          <div className="mx-auto mb-6 w-fit"><Mark size={96} state="entered" /></div>
          <h2 id="close-title" className="font-display note-h2">Built for Ecobank Blaze accounts.</h2>
          <p className="note-body mx-auto">An InnovateX 2026 entry. No hardware, no app for the buyer, no guessing with money.</p>
          <div className="note-actions justify-center">
            <Link href="/login" className="note-btn note-btn-primary">Open Shigo <ArrowRight size={18} aria-hidden="true" /></Link>
            <a href="https://github.com/AustinChris1/shigo" className="note-btn note-btn-ghost" target="_blank" rel="noreferrer">Source</a>
          </div>
        </div>
        <footer className="note-foot">
          <span>Shigo is Hausa for “enter”.</span>
          <span>Rails: Ecobank Notification Service, Paystack test mode. A simulated or test credit is always labelled.</span>
        </footer>
      </section>

      <div className="note-scrollhint" aria-hidden="true">scroll</div>
    </div>
  );
}
