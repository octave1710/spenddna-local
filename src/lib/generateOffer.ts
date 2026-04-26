import { getOpenAI } from "./openai";
import { buildTransactionSummary } from "./parseTransactions";

export interface DnaPill {
  label: string;
  emoji: string;
  score: number;
  explanation: string;
}

export interface TodayOffer {
  merchant_name: string;
  distance_m: number;
  headline_emotional: string;
  sub_text: string;
  original_price: number;
  discount_price: number;
  expiry_minutes: number;
  reasons: [string, string, string, string];
  match_score: number;
  widget_style: "cozy" | "urgent" | "factual";
  values_match?: string[];
}

export interface OfferEngineResult {
  spend_dna: DnaPill[];
  today_offer: TodayOffer;
}

export async function generateOffer(): Promise<OfferEngineResult> {
  const openai = getOpenAI();
  const summary = buildTransactionSummary();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a hyperlocal commerce AI embedded in the Sparkasse City Wallet. You infer DEEP VALUES from bank transaction patterns — not just surface behaviors. Every purchase tells a story about what a person fundamentally cares about. You surface those values explicitly and use them to generate hyper-personalized, values-aligned micro-offers. Reasoning must reference values, not just raw counts. Respond only with valid JSON matching the exact schema provided. No additional text outside the JSON object.",
      },
      {
        role: "user",
        content: `${summary}

Current context: rainy, 11°C, Tuesday lunchtime (12:14 PM), Stuttgart Old Town. Demand at Café Müller is LOW right now (−23% vs normal baseline).

Return a JSON object with EXACTLY this schema — no extra keys, no missing keys:
{
  "spend_dna": [
    {"label": "string (≤20 chars)", "emoji": "string", "score": integer, "explanation": "string (≤80 chars)"}
  ],
  "today_offer": {
    "merchant_name": "string",
    "distance_m": integer,
    "headline_emotional": "string (≤50 chars)",
    "sub_text": "string (≤60 chars)",
    "original_price": number,
    "discount_price": number,
    "expiry_minutes": integer,
    "reasons": ["string", "string", "string", "string"],
    "match_score": integer,
    "widget_style": "cozy",
    "values_match": ["string"]
  }
}

Constraints:
- spend_dna: exactly 4 items inferring DEEP VALUES from transaction patterns. Pick from: 🌱 Local-first, 🌍 Sustainability, ⚡ Convenience-driven, 🎨 Discovery-oriented, 💰 Value-conscious, ☕ Routine-anchored, 🏃 Wellness-focused, 🍷 Experience-seeker. Select the 4 best evidenced by the actual transaction data.
  - label: value name (≤20 chars)
  - emoji: matching emoji from the list above
  - score: 65–99 reflecting evidence strength in the data
  - explanation: 1 sentence citing a SPECIFIC data point (e.g. "You visit 3.4× more independents than chains across 90 days")
- today_offer: pick the single merchant with the strongest behavioral match given current context.
- headline_emotional: ≤ 50 chars, emotionally resonant (e.g. "Cold outside? Your coffee is waiting.").
- sub_text: ≤ 60 chars, concrete product description.
- discount_price must be 15–30% lower than original_price (round to 2 decimal places).
- expiry_minutes: 45–90 minutes.
- reasons: exactly 4 strings — each MUST explicitly reference the user's values (e.g. "Your ☕ Routine-anchored value — 47 consecutive weekday visits at 08:12 ± 3min — makes this the ideal welcome-back slot"). At least 2 reasons must name a specific value from spend_dna.
- match_score: 75–99, reflecting genuine behavioral and values alignment.
- widget_style: use "cozy" for rainy/cold context with a familiar comfort merchant; "urgent" for scarcity or hard deadline; "factual" for value-driven, data-first appeal.
- values_match: 1–2 value labels (text only, no emoji) from spend_dna that this specific offer directly aligns with (e.g. ["Local-first", "Routine-anchored"]).`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");
  return JSON.parse(raw) as OfferEngineResult;
}

export async function generateAlternativeOffers(): Promise<TodayOffer[]> {
  const openai = getOpenAI();
  const summary = buildTransactionSummary();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a hyperlocal commerce AI embedded in the Sparkasse City Wallet. Generate alternative offer options that align with the user's values. Each must be from a DIFFERENT merchant. Respond only with valid JSON.",
      },
      {
        role: "user",
        content: `${summary}

Current context: rainy, 11°C, Tuesday lunchtime (12:14 PM), Stuttgart Old Town.

Return 3 alternative offers, each from a DIFFERENT merchant than each other. Mix the widget_styles across the 3.

Return JSON:
{
  "alternatives": [
    {
      "merchant_name": "string",
      "distance_m": integer,
      "headline_emotional": "string (≤50 chars)",
      "sub_text": "string (≤60 chars)",
      "original_price": number,
      "discount_price": number,
      "expiry_minutes": integer,
      "reasons": ["string","string","string","string"],
      "match_score": integer,
      "widget_style": "cozy" | "urgent" | "factual",
      "values_match": ["string"]
    }
  ]
}

Rules:
- Exactly 3 alternatives, each from a distinct Stuttgart Old Town merchant
- match_scores: 60–82 (slightly lower than primary recommendation)
- discount_price must be 15–30% below original_price
- Each alternative matches at least 1 user value from the transaction patterns
- Use a different widget_style per alternative (one cozy, one urgent, one factual)`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");
  const parsed = JSON.parse(raw) as { alternatives: TodayOffer[] };
  return parsed.alternatives;
}
