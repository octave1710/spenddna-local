# Spend DNA — Generative City Wallet

> The AI personalization layer that turns Sparkasse's transaction data into hyperlocal commerce — for citizens AND for the local merchants Sparkasse already serves.

Built solo in 12 hours for **Hack-Nation Global AI Hackathon #5** — DSV Gruppe Challenge "Generative City Wallet".

## The Problem

Mia walks through Stuttgart's old town on a Tuesday lunch break. 12 minutes to spare, slightly cold. There's a quiet café 80m away that just brewed a fresh batch. The data exists. The location is precise. The intent is inferable. None of it is being used. That's the gap we close.

## What Spend DNA Does

**For citizens** — One curated, transparent offer per day generated dynamically from real spend patterns + live context (weather, time, location, demand). Every offer comes with full "Why am I getting this?" explanation. Click any DNA pill to see exactly which transactions drove the score.

**For merchants** — A daily strategic brief that replaces 7 fragmented decisions with 1 click. Plus: yesterday's recap with insights, churn alerts on slipping customers, neighborhood pulse showing live competitive moves, multi-turn voice/chat consultant for follow-ups, three strategically distinct offer variants, agent recommendation.

**For Sparkassen** — Activates the bank's most underused asset: transaction data, in a way that drives local commerce instead of feeding e-commerce giants.

## Three Modules (per brief)

1. **Context Sensing Layer** — Weather, time, location, and Payone-style transaction density visible to the user at all times. Composite states trigger the generative pipeline.
2. **Generative Offer Engine** — Three visually distinct offer variants (factual / emotional / urgent) generated dynamically with different strategic logic. Agent recommends one.
3. **Seamless Checkout & Redemption** — Dynamic QR codes, simulated cashback to Sparkasse account.

## Key Features Beyond the Brief

- **Daily Decision Engine** — Proactive AI brief that eliminates merchant decision fatigue
- **Learning Library** — Every decision feeds the next one; insights compound over time
- **Churn Alert** — Identify and re-engage customers slipping away
- **Neighborhood Pulse** — Coordinate with adjacent merchants
- **Decision Trace** — Every recommendation is traceable to source data, audit-ready
- **Values DNA (Citizen)** — Transparent, explainable, privacy-respecting
- **Multi-turn Conversation** — Voice or text, context preserved across turns

## Stack

- **Frontend**: React + TypeScript + Tailwind (Lovable scaffold extended with Cursor + Claude)
- **Reasoning**: OpenAI GPT-4o with structured JSON outputs
- **Voice**: OpenAI Whisper (STT) + ElevenLabs (TTS)
- **Charts**: Recharts
- **Mock Data**: 3 CSVs simulating Sparkasse-Payone structure (90d transactions, 20 merchants, 6 customer segments)

## Privacy by Design

User behavior data stays on-device. Only abstract "intent signals" reach the cloud. Every offer surfaced includes transparent "Why am I getting this?" explanation — no black box. GDPR-aware architecture: all data points are inspectable, dismissable, and auditable.

## Demo Architecture Note

For demo, both citizen and merchant interfaces are in one app with a toggle. In production: separate citizen-facing surface (Sparkasse app) and merchant B2B portal — same backend.

## Demo Videos

- **Demo Video** (60s): https://www.loom.com/share/d683a20b9f634c07920a8f1a329bdf2c
- **Tech Video** (60s): https://www.loom.com/share/f365338620304b4884d6a4b381d82049

## Built by

Octave Alliot-Herbin · Hack-Nation #5 · NYC · April 25-26, 2026

## Challenge

DSV Gruppe (Deutscher Sparkassenverlag) — Generative City Wallet
Contact: Tim Heuschele, Referent Strategisches Portfoliomanagement, DSV Gruppe
