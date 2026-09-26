# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Nigerian student sellers aged 18 to 25 who run a small business on WhatsApp (hair, thrift, food, phone accessories, skincare, printing) and receive payment by bank transfer into a personal account, often handing goods over before the credit shows. They hold or can open an Ecobank Blaze account.

Secondary, and the landing page's first audience (confirmed 26 Sep 2026): InnovateX 2026 judges and Ecobank staff who scan a QR code at regional selection or the 30 October finale and need to understand the mechanic within seconds and see that it is real.

## Product Purpose

Shigo tells a seller, with certainty, that the money for a specific order has actually arrived in their bank account, and turns every confirmed payment into a row in an income record they can export for a loan application. It exists because fake transfer receipts are cheap, real credits are slow, and sellers decide by looking at the buyer's phone. Success: sellers stop losing goods to fake alerts and stop refusing transfers; the seller has a verified income record a bank can read.

## Positioning

The seller's screen turns green only when the receiving bank's own callback confirms the credit into the seller's account, tied to one order. No screenshot, SMS or buyer's app can turn it green. OPay, PalmPay and Moniepoint confirm payments for merchants with their devices; their alert never becomes an Ecobank income record. Shigo needs no hardware and no buyer-side app. The name is Hausa for "enter"; the green state is "shigo".

## Operating Context

Selling happens in WhatsApp chats and at hostel doors; the phone is the till. The buyer pays by ordinary transfer from any bank. The rails are Ecobank's Notification Service webhook (primary, payload unconfirmed until sandbox access) and Paystack dedicated virtual accounts in test mode (declared fallback, always named as such on stage). A local simulator exists for the five-step test script and is off on any deployment shown as a real rail. Judges evaluate at a pitch with a live demo of one order turning green.

## Capabilities and Constraints

- Create order with amount and note; unique reference; WhatsApp share of payment details.
- Webhook ingestion from any rail normalised to one credit event; idempotent; matching by reference, else exact amount when exactly one open order fits; ambiguity is held for the seller to resolve, never auto-green; unmatched credits are kept and shown.
- Live green state by SSE on a single server and by 2-second polling on serverless hosts.
- Ledger of confirmed payments; printable one-page income record.
- Seller's own fake-receipt report, kept on their account for them to send to their bank; never shared across sellers.
- Not built, on purpose: shared payer blacklist, receipt image detection, BVN lookups, any CBN watchlist claim, class dues wallet, locked savings.
- Sign-in is demo-grade (phone number only); OTP before any public pilot. No pilot sellers yet: the page must not claim users, volumes or outcomes.
- Mobile-first PWA; Next.js, Postgres; deployed on Vercel at https://shigo-austinchris-projects.vercel.app.

## Brand Commitments

Visual world pinned by the user on 26 Sep 2026: pure white ground with a true dark mode, image-rich pages with real photographs of Nigerian sellers (free-licence Unsplash, credited, to be replaced by the team's own photos), icons, and scroll animation on the landing page; all pages including sign-in share the world. No slider or video until real footage exists.

Name: Shigo. Mark: the account is a box with a slot; the coin sits outside, amber, until the bank confirms, then drops inside and turns green (src/components/Mark.tsx, public/icon.svg). Wordmark set in Bricolage Grotesque. Copy is plain and short, no em dashes. Ecobank reference confirmed 26 Sep 2026: "Built for Ecobank Blaze accounts" and "an InnovateX 2026 entry", never implying endorsement or partnership. Nothing on the page or in the repo mentions the tooling used to build it.

## Evidence on Hand

Confirmed 26 Sep 2026 as citable with source links:
- Punch, 15 Feb 2025, survey of 330 Lagos traders: 52% had received a fake alert, 27% lost money, 15% stopped accepting transfers, 71% prefer cash.
- Sahara Reporters, 20 Sep 2026: Slipcraft generates fake OPay, Kuda and PalmPay receipts; Telegram community over 61,000; 650 points per receipt; Kuda confirmed the impersonation.
- TechCabal, 16 Mar 2026 (The Garage study, 4,000+ students, 55 institutions): two-thirds of students earn while in school; 53% of student businesses sell mainly on WhatsApp.
- Ecobank developer documentation: Notification Service with transaction webhooks.
Absent, must not be fabricated: pilot results, seller testimonials, transaction volumes, any Ecobank or YouthCred underwriting outcome, a naira price per Slipcraft point.

## Product Principles

1. The bank is the only witness. Nothing a buyer shows can change the seller's screen.
2. Never guess with money. Ambiguity is held for a human; a real payment is never lost.
3. One loop, done completely, beats three features half done.
4. Say which rail is live. A simulated or test-mode credit is always labelled.
5. The record belongs to the seller. Evidence is theirs to share; the lender decides.
