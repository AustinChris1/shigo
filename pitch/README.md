# Shigo pitch deck

InnovateX 2026, Track A (Inclusive Finance). Thirteen slides, about five minutes plus the live demo.

- [Shigo-pitch.pdf](Shigo-pitch.pdf): the slides as a PDF (GitHub shows it inline)
- [deck.html](deck.html): the deck to present from. Download the `pitch` folder and open `deck.html` in a browser.
  Right/left arrow or space to move, **N** for speaker notes, **F** for full screen.
- `img/`: screenshots from the live app

Edit the slides in `deck.html` (one `<section>` per slide, 1920×1080, speaker notes in its `<aside>`), then rebuild the PDF with `node scripts/pitch-pdf.mjs`.

## To fill in before the finale

- Slide 1: team name
- Slide 12: pilot results (`[__] orders · [__] green · [__] held`) and one thing a seller said
- Slide 13: team members and roles

## Rules for the deck

- Every figure carries its source on the slide. No pilot numbers until the pilot has run.
- Say which rail is live. The demo's test payment stands in for Ecobank's notification; never call it an Ecobank deposit.
- Plain copy, no em dashes.

## Speaker notes

### 1. Cover

Good [morning]. We are [team name] from FUTO, and this is Shigo. Shigo is Hausa for "enter", as in "the money has entered". It is a mobile web app for student sellers. An order turns green only when the seller's own bank confirms the money, and every confirmed sale becomes a line in an income record they can take to a lender.

### 2. The moment

Picture a student selling wigs or food from her hostel. A buyer comes to collect and holds up his phone: "Transfer successful." Her own bank alert has not come yet. Alerts can be slow, the buyer is in a hurry, and asking him to wait feels rude. So she trusts his screen and hands over the goods. That one moment is where sellers lose money. The problem is not payment. It is proof.

### 3. The crime

This is not a few bad people with photo editors. Eight days ago Sahara Reporters published an investigation into Slipcraft, a website that generates fake OPay, Kuda and PalmPay receipts. Its Telegram group has over 61,000 members. Each receipt costs 650 points on the site. Kuda confirmed its brand is being impersonated. A fake receipt is now cheap, fast and sold as a service.

### 4. The damage

Punch surveyed 330 Lagos traders in February 2025. More than half had been shown a fake alert. More than a quarter lost money to one. 15% stopped accepting transfers altogether, and 71% now prefer cash. For inclusive finance, that last number is the one that hurts: fraud is pushing people out of digital payments and back to cash, where there is no record at all.

### 5. The seller

Our user is the student seller. A study by The Garage of more than 4,000 students across 55 institutions found two in three Nigerian students earn while in school, and 53% of student businesses sell mainly on WhatsApp. That means orders come in by chat, payment comes by transfer, and handover happens in a hostel corridor. There is no POS and no till. They are the people fake alerts hit hardest.

### 6. How it works

Shigo never looks at the buyer. The seller makes an order, sends her account details on WhatsApp, and keeps the screen open. The buyer pays the normal way, from any bank. When the money lands, the seller's bank sends Shigo a signed message, Shigo matches it to the order, and the coin drops into the box and turns green. A screenshot changes what is on the buyer's phone. It cannot make the seller's bank send that message.

### 7. Live demo

Switch to the phone. 1. Sign in: pick the bank, type the account number, the name on the account appears. 2. New order: 18,000 naira, buyer Chidi Okafor, 12-inch frontal. It shows amber, Not yet. 3. Hold up a fake "transfer successful" screenshot next to it: nothing changes. 4. Tap Send test payment. Say clearly: this test payment stands in for Ecobank's Notification Service, which we are waiting on sandbox access for. 5. It turns green with a chime: "Shigo. It has entered." 6. Open the ledger: the test is shown as not counted. If the network fails, use the screenshots on the previous slide.

### 8. Matching

Buyers never type a reference code; we tried that and it was stressful. Shigo matches on the amount, and uses the sender's name on the credit to tell buyers apart. The key rule: if there is any doubt, Shigo never turns an order green. It holds the money and asks the seller. A real payment is never lost: anything that fits no order waits under Unmatched for the seller to assign. And the same bank message counted twice can never double a sale.

### 9. The record

This is the inclusive finance part. Student sellers have income, but no evidence of it that a lender trusts: cash leaves no trace and a screenshot proves nothing. Every green order in Shigo is a dated row confirmed by the bank. After six months, a seller who becomes a corps member can export that record with one tap. We are careful here: Shigo does not score anyone or promise a loan. The record belongs to the seller, and the lender decides. These rows are an example, not pilot data.

### 10. Why Ecobank

Shigo only works if the bank itself is the witness, which is why it belongs with Ecobank. The Notification Service sends a message when money lands; that message is the only thing that can turn an order green. Validate Account Name lets us check at sign-in that the seller owns the account. And Blaze is Ecobank's account for young people: every Shigo seller has a daily reason to get paid into Blaze, and every sale builds history on it.

### 11. Where it stands

We want to be exact about what is real. Everything on the left is live on the public site today, and you can try it on your phone. Account names are checked through Paystack for every bank until our Ecobank credentials arrive. The sign-in code is shown on screen for now; SMS switches on once our sender ID is approved. What is waiting: we emailed Ecobank sandbox support on 27 September for Notification Service access. Until it arrives, the green screen in the demo is driven by a labelled test payment, never presented as a real Ecobank deposit.

### 12. Next

[Fill in after the pilot: how many orders, how many turned green, how many were held, and one thing a seller told you.] After the finale, two things widen who Shigo serves. Many sellers are paid into OPay or Moniepoint, so an Android companion will read the bank app's alert on the seller's own phone, never the buyer's. And the screens will speak Pidgin first, then Hausa, Igbo and Yoruba, for sellers who are not comfortable in English.

### 13. Our ask

Our ask is concrete. First, access to the Notification Service and Validate Account Name, sandbox now and UAT after, so the green screen runs on Ecobank's own credit message. Second, a pilot with Blaze student sellers on one campus. Third, a conversation on whether a bank-confirmed sales record can count as income evidence for Blaze customers. We are [names]. Thank you. The app is live at useshigo.vercel.app; try it on your phone.
