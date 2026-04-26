import { getOpenAI } from "./openai";
import segmentsCsv from "../../data/customer_segments.csv?raw";
import type { Merchant } from "./merchantEngine";

export interface DailyDecisionResult {
  time_label: string;
  recommendation: string;
  why_bullets: string[];
  without_me: { value: string; label: string; effort: string };
  with_me: { value: string; label: string; effort: string };
  voice_response_text: string;
}

function getSegmentsSummary(): string {
  const [, ...rows] = segmentsCsv.trim().split("\n");
  return rows
    .filter((r) => r.trim())
    .map((row) => {
      const cols = row.split(",");
      return `- ${cols[1].trim()}: ${cols[2].trim()} customers, avg spend €${cols[3].trim()}, peak: ${cols[5].trim()}`;
    })
    .join("\n");
}

export async function generateDailyDecision(
  merchant: Merchant,
): Promise<DailyDecisionResult> {
  const openai = getOpenAI();
  const segments = getSegmentsSummary();
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ];
  const dayName = dayNames[now.getDay()];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a daily marketing chief for hyperlocal Stuttgart businesses, embedded in the Sparkasse City Wallet. You surface ONE non-obvious, data-driven decision that the merchant should execute TODAY. You don't give generic advice — you give specific, time-sensitive actions tied to segment behaviour and real context signals. Your recommendations must be surprising and specific enough that the merchant couldn't have arrived at them without your data. You challenge obvious instincts.",
      },
      {
        role: "user",
        content: `Merchant: ${merchant.name} (${merchant.category})
Average customer age: ${merchant.customer_avg_age}
Traffic pattern: ${merchant.traffic_pattern}
Current inventory: ${merchant.current_inventory_status}

Stuttgart Sparkasse customer segments within 1.5km:
${segments}

Current context: Tuesday, 12:14 PM, rainy, 11°C Stuttgart Old Town.
CRITICAL — The current time is 12:14 PM (lunchtime). All recommended time windows MUST start from 12:14 PM and be within the next 1–3 hours (e.g. "12:30–14:00", "until 15:00"). Do NOT suggest evening windows or times after 15:30. The action must be executable RIGHT NOW or within the next 2 hours.

Surface ONE specific, immediately actionable decision for today. Return JSON:
{
  "time_label": "${timeLabel}",
  "recommendation": "string (1 punchy sentence ≤60 chars — name the product, segment, and time window between 12:14 and 15:00)",
  "why_bullets": ["string", "string", "string"],
  "without_me": {
    "value": "string (short number/amount only, e.g. '€8' or '+3%')",
    "label": "string (what this represents, e.g. 'Generic Instagram boost')",
    "effort": "string (effort required, e.g. '+5× manual work')"
  },
  "with_me": {
    "value": "string (short number/amount only, e.g. '€65' or '+31%')",
    "label": "string (what this represents, e.g. 'Targeted push to lunch crowd')",
    "effort": "string (effort required, e.g. '1-click activate')"
  },
  "voice_response_text": "string"
}

Rules:
- recommendation: ultra-specific — mention the actual product, the segment name, and a time window between 12:14 PM and 15:00. Make it surprising ("Push croissant amande to Senior Local at 12:30" not "run a promotion")
- why_bullets: exactly 3, each referencing a specific data signal. At least 1 must be non-obvious or counter-intuitive.
- without_me.value: short metric (€ amount or % figure only, ≤6 chars, e.g. "€8" or "+3%")
- without_me.label: what that value represents (e.g. "Generic Instagram boost")
- with_me.value: short metric projecting the uplift (e.g. "€65" or "+31%")
- with_me.label: what that value represents with Spend DNA (e.g. "Targeted push to lunch crowd")
- voice_response_text: 12–15 second midday briefing ≈35–50 words. Format: "Your decision for right now: [recommendation]. [Key signal in 1 sentence]. Window closes [time, must be before 15:30]. Activate when ready."`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");
  return JSON.parse(raw) as DailyDecisionResult;
}

export async function generateWhyNotResponse(
  decision: DailyDecisionResult,
  objection: string,
  merchant: Merchant,
): Promise<string> {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "You are a strategic retail advisor. When a merchant challenges your recommendation, engage with their concern directly and specifically. Either defend your position with data, or — if their objection reveals a valid constraint you missed — acknowledge it and suggest an adaptation. Be direct, never defensive, and always data-driven.",
      },
      {
        role: "user",
        content: `Merchant: ${merchant.name}
Today's recommendation: "${decision.recommendation}"
Key reasoning: ${decision.why_bullets.join("; ")}

The merchant says: "${objection}"

Respond in 2–3 sentences. Be direct. Reference specific data points where possible. If they have a valid point, say so and pivot.`,
      },
    ],
  });

  return (
    completion.choices[0]?.message?.content ??
    "That's a fair point — let me reconsider with that constraint in mind."
  );
}
