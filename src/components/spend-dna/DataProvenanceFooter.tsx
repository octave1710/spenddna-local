import { useState } from "react";

const METRICS = [
  {
    value: "1,247",
    label: "Sparkasse cardholders",
    tooltip:
      "Active Sparkasse customers in Stuttgart Old Town whose anonymized spend patterns train the recommendation engine",
  },
  {
    value: "14,832",
    label: "transactions",
    tooltip:
      "Anonymized transactions analyzed over the past 90 days across all 6 customer segments",
  },
  {
    value: "6",
    label: "customer segments",
    tooltip:
      "Behavioral clusters: Morning Commuter · Weekend Family · Evening Diner · Gym Regular · Senior Local · Tourist",
  },
  {
    value: "4",
    label: "live context signals",
    tooltip:
      "Weather (rainy, 11°C) · Location (Stuttgart Old Town) · Time of day (lunchtime) · Demand index (−23% at Café Müller)",
  },
  {
    value: "GPT-4o",
    label: "reasoning",
    tooltip:
      "OpenAI GPT-4o-2024-08-06 · structured JSON output · response_format json_object · 4 context signals weighted",
  },
];

function MetricChip({
  metric,
}: {
  metric: (typeof METRICS)[number];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[11px] text-white/60 hover:text-white/90"
      >
        <span className="font-semibold text-white/90">{metric.value}</span>
        <span>{metric.label}</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 px-3 py-2 rounded-[8px] bg-background border border-border shadow-2xl text-[11px] text-muted-foreground leading-relaxed z-50 whitespace-normal text-center pointer-events-none">
          {metric.tooltip}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  );
}

export function DataProvenanceFooter() {
  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="h-8 bg-background/95 border-t border-border/50 flex items-center justify-center gap-1.5 px-6 overflow-hidden">
      <span className="text-[10px] text-muted-foreground/50 shrink-0">Powered by:</span>
      {METRICS.map((m) => (
        <MetricChip key={m.label} metric={m} />
      ))}
      <span className="text-[10px] text-muted-foreground/40 shrink-0 ml-1">
        · Updated {timestamp}
      </span>
    </div>
  );
}
