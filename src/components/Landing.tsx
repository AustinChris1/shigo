"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Mark } from "./Mark";
import "@/app/landing.css";

// The landing page as a printed note: engraved plates, one idea each, one security thread down the page.

const ease = [0.23, 1, 0.32, 1] as const;

function Guilloche({ className = "", rings = 28, opacity = 0.16, fit = "slice" }: { className?: string; rings?: number; opacity?: number; fit?: "slice" | "meet" }) {
  const ellipses = Array.from({ length: rings }, (_, i) => (i * 180) / rings);
  return (
    <svg className={className} viewBox="0 0 1000 1000" preserveAspectRatio={`xMidYMid ${fit}`} aria-hidden="true" fill="none">
      <g stroke="currentColor" strokeWidth="0.8" opacity={opacity}>
        {ellipses.map((a) => (
          <ellipse key={a} cx="500" cy="500" rx="470" ry="150" transform={`rotate(${a} 500 500)`} />
        ))}
        {ellipses.map((a) => (
          <ellipse key={`i${a}`} cx="500" cy="500" rx="300" ry="60" transform={`rotate(${a + 3} 500 500)`} />
        ))}
      </g>
    </svg>
  );
}

function Band({ className = "" }: { className?: string }) {
  const n = 60;
  return (
    <svg className={className} viewBox={`0 0 ${n * 20} 20`} preserveAspectRatio="none" aria-hidden="true" fill="none">
      <path
        d={Array.from({ length: n }, (_, i) => `M${i * 20} 18 q10 -20 20 0`).join(" ")}
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      <path d={`M0 10 H${n * 20}`} stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
    </svg>
  );
}

function Plate({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} id={id} data-visible={inView ? "" : undefined} className={`plate ${className}`}>
      {children}
    </section>
  );
}

function StateWord({ live }: { live: boolean }) {
  return (
    <span className="note-state" aria-live="off">
      <span className="note-state-word note-state-notyet">Not yet</span>
      <span className="note-state-word note-state-held">Held</span>
      <span className={`note-state-word note-state-shigo ${live ? "is-live" : ""}`}>Shigo</span>
    </span>
  );
}

export function Landing() {
  const reduce = useReducedMotion();
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
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
    return () => cleanup();
  }, [reduce]);

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

      {/* Plate 0: the medallion. The whole mechanic, looping. */}
      <section className="plate plate-hero" aria-labelledby="hero-title">
        <div className="note-medallion" aria-hidden="true">
          <div className="note-rosette"><Guilloche className="note-rosette-svg" rings={30} opacity={0.22} fit="meet" /></div>
          <div className="note-watermark font-display">SHIGO</div>
          <div className="note-coin-track">
            <Mark size={220} state="pending" className="note-mark note-mark-pending" />
            <Mark size={220} state="entered" className="note-mark note-mark-entered" />
          </div>
        </div>
        <div className="note-hero-copy">
          <p className="note-serial">NO 0001 · BUILT FOR ECOBANK BLAZE ACCOUNTS</p>
          <h1 id="hero-title" className="font-display note-h1">
            Shigo. <span className="note-h1-quiet">It has entered.</span>
          </h1>
          <p className="note-lede">Your screen turns green only when the bank says so.</p>
          <div className="note-actions">
            <Link href="/login" className="note-btn note-btn-primary">
              Open Shigo <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href="#screenshot" className="note-btn note-btn-ghost">See it work</a>
          </div>
          <p className="note-statebar" aria-hidden="true">
            Order ₦4,500 · <StateWord live />
          </p>
        </div>
        <Band className="note-band note-band-bottom" />
      </section>

      {/* Plate 1: the screenshot changes nothing. */}
      <Plate id="screenshot" className="plate-paper">
        <div className="plate-inner">
          <h2 className="font-display note-h2">A screenshot changes nothing.</h2>
          <p className="note-body">The buyer shows a receipt. Your order stays where it is. Not a screenshot, not an SMS, not their app can move it.</p>
          <div className="note-demo">
            <div className="note-receipt" aria-label="An illustrative fake transfer receipt">
              <div className="note-receipt-head">
                <span>Transfer successful</span>
                <span className="note-receipt-tag">illustrative</span>
              </div>
              <div className="font-display note-receipt-amt">₦4,500.00</div>
              <div className="note-receipt-meta">to ADA OBI · 14:02 · Ref 00X…</div>
              <div className="note-receipt-stamp-row"><span className="note-receipt-stamp">CANNOT CHANGE THE SCREEN</span></div>
            </div>
            <div className="note-order" aria-label="The seller's order card, still waiting">
              <Mark size={40} state="pending" />
              <div>
                <div className="font-display text-2xl font-extrabold">₦4,500</div>
                <div className="note-order-meta">SG-7K2Q · 2 wigs</div>
              </div>
              <StateWord live={false} />
            </div>
          </div>
        </div>
      </Plate>

      {/* Plate 2: the bank is the only witness. */}
      <Plate className="plate-green">
        <Guilloche className="note-guilloche note-guilloche-soft" rings={18} opacity={0.12} />
        <div className="plate-inner">
          <h2 className="font-display note-h2">The bank is the only witness.</h2>
          <p className="note-body">When ₦4,500 lands in your Ecobank account, the bank tells Shigo directly. The coin drops. The order turns green.</p>
          <div className="note-callback" role="img" aria-label="A bank credit notification arriving and confirming the order">
            <div className="note-callback-line">
              <span className="note-callback-cr">CR</span>
              <span className="note-callback-amt">NGN 4,500.00</span>
              <span className="note-callback-meta">Ecobank · 14:02:11 · SG-7K2Q</span>
            </div>
            <div className="note-order note-order-dark">
              <Mark size={40} state="entered" />
              <div>
                <div className="font-display text-2xl font-extrabold">₦4,500</div>
                <div className="note-order-meta">SG-7K2Q · 2 wigs</div>
              </div>
              <StateWord live />
            </div>
          </div>
        </div>
      </Plate>

      {/* Plate 3: held, never guessed. */}
      <Plate className="plate-paper">
        <div className="plate-inner">
          <h2 className="font-display note-h2">Held, never guessed.</h2>
          <p className="note-body">Two orders at the same amount and a payment with no reference? Shigo holds the money and asks you which order it belongs to. It never marks the wrong one paid.</p>
          <ul className="note-ghosts" aria-label="Every outcome an order can have">
            <li className="note-ghost">Not yet</li>
            <li className="note-ghost is-struck">Held</li>
            <li className="note-ghost">Shigo</li>
          </ul>
        </div>
      </Plate>

      {/* Plate 4: every green becomes a row. */}
      <Plate className="plate-paper plate-ledger">
        <div className="plate-inner">
          <h2 className="font-display note-h2">Every green becomes a row.</h2>
          <p className="note-body">Each confirmed payment is a dated line in a record you own. Export it when you apply for a loan after NYSC. The lender decides. The record is yours.</p>
          <table className="note-ledger" aria-label="Illustrative ledger rows">
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
                  <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td className="text-right">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note-fine">Illustrative rows. No pilot has run yet; nothing here is a claim of volume.</p>
        </div>
      </Plate>

      {/* Plate 5: why. Three sentences, each with its source. */}
      <Plate className="plate-green">
        <div className="plate-inner">
          <h2 className="font-display note-h2">Why this, why now.</h2>
          <div className="note-evidence">
            <p>
              <span className="font-display note-figure">52</span> of every 100 Lagos traders surveyed had been shown a fake alert; 27 had lost money to one; 15 had stopped taking transfers.
              <a className="note-source" href="https://saharareporters.com/2026/09/20/investigation-how-online-platform-slipcraft-helps-scammers-fake-transfers-generate" target="_blank" rel="noreferrer">Punch, 2025, via Sahara Reporters <ExternalLink size={12} aria-hidden="true" /></a>
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
      </Plate>

      {/* Plate 6: the seal and the door. */}
      <section className="plate plate-hero plate-close" aria-labelledby="close-title">
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

      <motion.div
        className="note-scrollhint"
        initial={{ opacity: 0, transform: "translateY(6px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        transition={{ delay: 1.2, duration: 0.6, ease }}
        aria-hidden="true"
      >
        scroll
      </motion.div>
    </div>
  );
}
