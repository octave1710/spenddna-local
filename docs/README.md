# Spend DNA — Generative City Wallet

> The AI personalization layer that turns your bank into a hyperlocal commerce engine.

Built solo in 24 hours for **Hack-Nation Global AI Hackathon #5** — DSV Gruppe Challenge "Generative City Wallet".

## The problem

It's a Tuesday lunch break. Mia is walking through Stuttgart's old town — 12 minutes to spare, slightly cold, vaguely hungry. There's a café 80m away that has been quiet all morning and just brewed a fresh batch. The data exists. The location is precise. The intent is inferable. **None of it is being used.**

Instead, Mia gets a generic 10%-off coupon for a restaurant she's never visited. That's the gap this project closes.

## What Spend DNA does

**For citizens** — Sparkasse customers receive ONE hyperpersonalized offer per day, generated dynamically based on their real spend patterns + live context (weather, time, location, demand). Every offer comes with full transparency on why they got it.

**For merchants** — Local shops set simple rules ("fill quiet hours, max 25% discount") and the AI generates contextual offers automatically, served only to citizens whose Spend DNA matches.

**For Sparkassen** — Activates the bank's most underused asset: transaction data, in a way that drives local commerce instead of feeding e-commerce giants.

## Three modules

1. **Context Sensing Layer** — Aggregates real-time signals: weather, time, location, Payone-style transaction density at nearby merchants
2. **Generative Offer Engine** — LLM produces dynamic offer variants (factual / emotional / urgent) with adaptive UI styling — not template fills
3. **Seamless Checkout & Redemption** — Dynamic QR codes, simulated cashback to Sparkasse account

## Stack

- **Frontend**: React + TypeScript + Tailwind (scaffolded with Lovable)
- **Reasoning**: OpenAI GPT-4o with structured JSON outputs
- **Voice**: ElevenLabs (merchant-side voice input)
- **Charts**: Recharts
- **Deploy**: Vercel
- **IDE**: Cursor + Claude Code

## Privacy by design

User behavior data stays on-device. Only abstract "intent signals" reach the cloud, in line with GDPR principles. Every offer surfaced to a user includes a transparent "Why am I getting this?" explanation — no black box.

## Demo

[Demo video link — to be added]
[Tech video link — to be added]

## Built by

Octave Alliot-Herbin — Hack-Nation #5, NYC, April 25-26 2026.

## Challenge

DSV Gruppe (Deutscher Sparkassenverlag) — Generative City Wallet. Contact: Tim Heuschele, Referent Strategisches Portfoliomanagement.
