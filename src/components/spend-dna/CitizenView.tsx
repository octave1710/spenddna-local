import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee, ShoppingBag, Train, Utensils, Dumbbell, Music,
  Sun, Croissant, ChevronDown, MapPin, Sparkles
} from "lucide-react";

const transactions = [
  { logo: "WB", name: "Wölffer Bakery", cat: "Café", amount: -4.20, time: "Today, 8:12", icon: Coffee, color: "oklch(0.78 0.16 75)" },
  { logo: "DB", name: "Deutsche Bahn", cat: "Transit", amount: -3.80, time: "Today, 7:48", icon: Train, color: "oklch(0.7 0.16 200)" },
  { logo: "RW", name: "Rewe", cat: "Groceries", amount: -42.16, time: "Yesterday, 19:22", icon: ShoppingBag, color: "oklch(0.7 0.16 165)" },
  { logo: "MF", name: "McFit Mitte", cat: "Fitness", amount: -29.90, time: "Yesterday, 18:05", icon: Dumbbell, color: "oklch(0.65 0.22 295)" },
  { logo: "SP", name: "Spotify", cat: "Subscription", amount: -9.99, time: "Yesterday, 09:00", icon: Music, color: "oklch(0.7 0.16 165)" },
  { logo: "ST", name: "Standard Serious", cat: "Brunch", amount: -18.40, time: "Sat, 11:30", icon: Utensils, color: "oklch(0.78 0.16 75)" },
  { logo: "ED", name: "Edeka", cat: "Groceries", amount: -27.83, time: "Fri, 17:55", icon: ShoppingBag, color: "oklch(0.7 0.16 165)" },
  { logo: "FB", name: "Five Elephant", cat: "Café", amount: -5.60, time: "Fri, 08:20", icon: Coffee, color: "oklch(0.78 0.16 75)" },
];

const dna = [
  { label: "Morning Commuter", icon: Sun, score: 96 },
  { label: "Weekend Brunch", icon: Utensils, score: 88 },
  { label: "Local Foodie", icon: Croissant, score: 81 },
  { label: "Gym Regular", icon: Dumbbell, score: 74 },
];

export function CitizenView() {
  const [expanded, setExpanded] = useState(true);
  const [activated, setActivated] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-[1.5fr_1fr] gap-6"
    >
      {/* LEFT — wallet */}
      <div className="space-y-5">
        {/* balance */}
        <div className="rounded-[12px] bg-card border border-border p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-wider text-muted-foreground">Mia Schmidt · Sparkasse Stuttgart</div>
                <div className="text-[12px] text-muted-foreground/70 mt-0.5">DE89 •••• 4827</div>
              </div>
              <div className="text-[11px] px-2 py-1 rounded-md bg-success/10 text-success border border-success/20">+€312 this month</div>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-[44px] font-semibold tracking-tight tabular-nums">€4,827.30</span>
              <span className="text-muted-foreground text-sm">available</span>
            </div>
          </div>
        </div>

        {/* transactions */}
        <div className="rounded-[12px] bg-card border border-border">
          <div className="px-5 py-4 flex items-center justify-between border-b border-border">
            <h3 className="text-sm font-medium">Recent transactions</h3>
            <button className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">View all</button>
          </div>
          <div className="divide-y divide-border">
            {transactions.map((t, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-elevated/50 transition-colors duration-200 cursor-pointer">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
                  {t.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium truncate">{t.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <t.icon className="h-3 w-3" style={{ color: t.color }} />
                    <span className="text-[11.5px] text-muted-foreground">{t.cat} · {t.time}</span>
                  </div>
                </div>
                <div className="text-[14px] font-medium tabular-nums">
                  €{Math.abs(t.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DNA */}
        <div className="rounded-[12px] bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Your Spend DNA</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Updated today</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {dna.map((d) => (
              <div
                key={d.label}
                className="group rounded-[12px] border border-border bg-surface-elevated/40 p-4 hover:border-primary/40 hover:bg-surface-elevated transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="h-7 w-7 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                    <d.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{d.score}%</span>
                </div>
                <div className="mt-3 text-[13px] font-medium leading-tight">{d.label}</div>
                <div className="mt-2 h-1 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500" style={{ width: `${d.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — offer */}
      <div className="space-y-5">
        <div className="rounded-[12px] bg-card border border-border overflow-hidden">
          <div className="relative h-44 bg-gradient-to-br from-warning/30 via-warning/10 to-primary/20 flex items-center justify-center">
            <Croissant className="h-20 w-20 text-warning drop-shadow-[0_0_20px_oklch(0.78_0.16_75/0.5)]" />
            <div className="absolute top-3 left-3 text-[10px] font-medium px-2 py-1 rounded-md bg-background/70 backdrop-blur border border-border text-foreground">
              TODAY · LIMITED
            </div>
            <div className="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded-md bg-success/20 text-success border border-success/30">
              94% match
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[17px] font-semibold tracking-tight">☕ Café Müller</h3>
                <div className="flex items-center gap-1.5 mt-1 text-[12px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> 80m away · Old Town
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-surface-elevated border border-border">
              <div className="text-[13.5px] font-medium text-foreground">Cold outside? Your cappuccino is waiting.</div>
              <div className="text-[11.5px] text-muted-foreground mt-1">Cappuccino + Croissant</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">€3.50</span>
                <span className="text-sm text-muted-foreground line-through tabular-nums">€5.20</span>
                <span className="ml-auto text-[11px] text-warning">until 1:00 PM</span>
              </div>
            </div>

            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 w-full flex items-center justify-between text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Why am I getting this?</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden mt-3 space-y-2 text-[12.5px] text-muted-foreground"
                >
                  {[
                    "It's 11°C and overcast — you respond to warm offers",
                    "Café Müller traffic is LOW right now (-23%)",
                    "You've stopped twice in last 10 minutes (browsing pattern)",
                    "Match score: 94%",
                  ].map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-success mt-[1px]">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setActivated(true)}
                className={`flex-1 h-10 rounded-[8px] text-[13.5px] font-medium transition-all duration-200 ${
                  activated
                    ? "bg-success text-background"
                    : "bg-primary hover:bg-primary-glow text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]"
                }`}
              >
                {activated ? "✓ Offer activated" : "Activate offer"}
              </button>
              <button className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
                Not now
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[12px] bg-card border border-border p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary/15 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-[12.5px] font-medium">3 more offers waiting</div>
            <div className="text-[11.5px] text-muted-foreground">Curated from your Spend DNA</div>
          </div>
          <button className="text-[12px] text-primary hover:text-primary-glow transition-colors">See all →</button>
        </div>
      </div>
    </motion.div>
  );
}
