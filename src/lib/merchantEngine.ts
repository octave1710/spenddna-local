import merchantsCsv from "../../data/local_merchants.csv?raw";
import segmentsCsv from "../../data/customer_segments.csv?raw";
import { getOpenAI } from "./openai";

export interface Merchant {
  merchant_id: number;
  name: string;
  category: string;
  customer_avg_age: number;
  traffic_pattern: string;
  current_inventory_status: string;
}

export interface OfferVariant {
  style: "factual" | "emotional" | "urgent";
  headline: string;
  sub: string;
  est_redemptions: string;
  est_revenue: string;
}

export interface MerchantEngineResult {
  reasoning_bullets: string[];
  voice_response_text: string;
  offer_variants: [OfferVariant, OfferVariant, OfferVariant];
  recommended_variant: "factual" | "emotional" | "urgent";
  recommendation_reasoning: string;
}

export function getMerchants(): Merchant[] {
  const [, ...rows] = merchantsCsv.trim().split("\n");
  return rows
    .filter((r) => r.trim())
    .map((row) => {
      const cols = row.split(",");
      return {
        merchant_id: parseInt(cols[0]),
        name: cols[1].trim(),
        category: cols[2].trim(),
        customer_avg_age: parseInt(cols[5]),
        traffic_pattern: cols[6].trim(),
        current_inventory_status: cols[7].trim(),
      };
    });
}

function getSegmentsSummary(): string {
  const [, ...rows] = segmentsCsv.trim().split("\n");
  return rows
    .filter((r) => r.trim())
    .map((row) => {
      const cols = row.split(",");
      return `- ${cols[1].trim()}: ${cols[2].trim()} customers, avg spend €${cols[3].trim()}, top categories: ${cols[4].trim()}, peak: ${cols[5].trim()}`;
    })
    .join("\n");
}

export async function generateMerchantOffers(
  transcript: string,
  merchant: Merchant,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
): Promise<MerchantEngineResult> {
  const openai = getOpenAI();
  const segments = getSegmentsSummary();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    response_format: { type: "json_object" },
    messages: [
      // System prompt always first
      {
        role: "system",
        content:
          "You are a senior retail consultant with 15+ years in hyperlocal and neighbourhood commerce, embedded in the Sparkasse City Wallet. You don't summarize data — you reason from it strategically. You challenge merchant assumptions, surface counter-intuitive patterns, and always give merchants at least one insight they likely don't already know. When a merchant's statement contains a hidden assumption, call it out directly. Think like a strategic advisor who has seen thousands of campaigns fail because of obvious-but-wrong instincts.\n\nWhen prior conversation turns are present in the message history, actively reference them to show continuity — e.g. 'Building on what we discussed...', 'If you push the discount further than the 15% we landed on...', 'This confirms the direction from your earlier question.' Treat each session as a continuous advisory relationship, not a series of isolated queries.\n\nRespond only with valid JSON matching the exact schema provided.",
      },
      // Prior turns (user messages = merchant speech, assistant = previous voice summaries)
      ...conversationHistory,
      // Current turn
      {
        role: "user",
        content: `Merchant: ${merchant.name} (${merchant.category}), Stuttgart Old Town
Average customer age: ${merchant.customer_avg_age}
Traffic pattern: ${merchant.traffic_pattern}
Current inventory: ${merchant.current_inventory_status}

Nearby Sparkasse customer segments (within 1.5km):
${segments}

The merchant just said: "${transcript}"

Current context: Tuesday, 12:14 PM, rainy, 11°C Stuttgart Old Town.
CRITICAL — The current time is 12:14 PM (Tuesday lunchtime). All timing recommendations (push windows, offer validity, urgency deadlines) MUST reference times between 12:14 PM and 15:30 at the latest. Do NOT suggest evening windows or times like "21:45". The action opportunity is RIGHT NOW over the next 1–3 hours.

IMPORTANT — If the merchant's statement contains an assumption the data contradicts, challenge it in a non-obvious bullet. For example, if they say "I have surplus X" but inventory shows 'normal', question whether it's a forecasting issue, not a demand issue.

Return JSON with EXACTLY this schema — no extra keys:
{
  "reasoning_bullets": ["string","string","string","string","string","string"],
  "voice_response_text": "string",
  "offer_variants": [
    {"style": "factual", "headline": "string", "sub": "string", "est_redemptions": "string", "est_revenue": "string"},
    {"style": "emotional", "headline": "string", "sub": "string", "est_redemptions": "string", "est_revenue": "string"},
    {"style": "urgent", "headline": "string", "sub": "string", "est_redemptions": "string", "est_revenue": "string"}
  ],
  "recommended_variant": "factual" | "emotional" | "urgent",
  "recommendation_reasoning": "string"
}

reasoning_bullets rules — exactly 6 items with this REQUIRED MIX:
  [0] NON-OBVIOUS insight: challenges a common assumption or reveals a counter-intuitive pattern. Must name a specific segment and a surprising fact (e.g. "Targeting Senior Local seems wrong for a pastry push, but they have 3× higher Saturday walk-by conversion than your usual lunch crowd — and they're currently underserved")
  [1] NON-OBVIOUS insight: another surprising finding, ideally one the merchant has likely never considered
  [2] MEASURABLE HYPOTHESIS: a specific, testable prediction with numbers (e.g. "Shifting push time from 12:30 to 11:45 captures pre-lunch browsers — projected +18% redemption rate based on Morning Commuter peak window 07:30–09:00")
  [3] TRADEOFF / RISK: an explicit downside or failure mode (e.g. "Variant B's emotional framing outperforms in cold/rainy conditions, but if the weather improves within 2h the urgency evaporates — have Variant A as fallback")
  [4] MULTI-SIGNAL: connects at least 2 independent data signals (e.g. "Weekend Family (289 customers, €84.60 avg spend) + Saturday afternoon traffic pattern = highest ROI window despite lower redemption count vs Morning Commuter")
  [5] MULTI-SIGNAL: another insight connecting 2+ signals with a clear strategic implication

offer_variants rules — must be STRATEGICALLY DIFFERENT, not just tonally different:
  - factual (Variant A): THE SAFE PLAY — optimize for volume. Broadest matching segment. Price to maximize redemption count even at lower margin. Include explicit target segment name in sub. Headline ≤40 chars, sub ≤60 chars.
  - emotional (Variant B): THE MARGIN PLAY — target the single highest avg-spend segment specifically. Premium framing, protect margin. Fewer redemptions but higher revenue per transaction. Include target segment name in sub. Headline ≤40 chars, sub ≤60 chars.
  - urgent (Variant C): THE CLEAR PLAY — aggressive pricing to move inventory fast. Target the segment that peaks soonest (check time_of_day_peak). Hard time limit. Tie urgency to real inventory signal. Headline ≤40 chars, sub ≤60 chars.

Other rules:
- voice_response_text: Executive audio briefing of 12–18 seconds (≈40–60 words). ALWAYS open with "Push Variant [A/B/C]." (matching recommended_variant). Then: [The single most compelling data signal that supports it] + [Time-sensitive action referencing a time window between NOW (12:14 PM) and 15:30]. Sound like a trusted senior advisor delivering a verdict. If there is prior conversation context, briefly reference it after the opening line. Example: "Push Variant B. Tuesday lunch crowd over-indexes on emotional copy by 23%. You have a 90-minute window before the 14:00 peak fades — activate now."
- recommended_variant: the single best play given ALL context (inventory status, weather, current time, segment match, merchant's stated goal). Must be one of "factual", "emotional", "urgent".
- recommendation_reasoning: 1–2 sentences explaining why this variant wins, referencing at least 2 specific signals (e.g. "Variant B is the top pick because Weekend Family's €84 avg spend aligns with your margin target, and the rainy weather strongly favours emotional comfort copy over data-driven appeals").
- est_redemptions format: "X–Y" (e.g. "18–24"), realistic from segment sizes
- est_revenue format: "€X–€Y" (e.g. "€72–€96"), realistic from segment avg spend`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");
  return JSON.parse(raw) as MerchantEngineResult;
}
