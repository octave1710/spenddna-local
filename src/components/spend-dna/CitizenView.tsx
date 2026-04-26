import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee, ShoppingBag, Train, Utensils, Dumbbell, Music,
  Sun, Croissant, ChevronDown, MapPin, Sparkles, Check, Clock, Flame,
} from "lucide-react";
import { RedeemModal } from "./RedeemModal";
import {
  generateOffer,
  generateAlternativeOffers,
  type OfferEngineResult,
  type TodayOffer,
  type DnaPill,
} from "@/lib/generateOffer";
import { parseTransactions, type Transaction } from "@/lib/parseTransactions";

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

function getMerchantIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("café") || n.includes("cafe") || n.includes("coffee") || n.includes("espresso") || n.includes("müller")) return Coffee;
  if (n.includes("bakery") || n.includes("bäckerei") || n.includes("wölffer") || n.includes("konditor") || n.includes("stengel")) return Croissant;
  if (n.includes("restaurant") || n.includes("mario") || n.includes("block") || n.includes("standard") || n.includes("feinkost")) return Utensils;
  if (n.includes("gym") || n.includes("fit")) return Dumbbell;
  if (n.includes("rewe") || n.includes("edeka") || n.includes("aldi") || n.includes("grocery")) return ShoppingBag;
  if (n.includes("bahn") || n.includes("transit")) return Train;
  if (n.includes("spotify") || n.includes("music")) return Music;
  return Sparkles;
}

function getDnaIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("morning") || l.includes("commut")) return Sun;
  if (l.includes("gym") || l.includes("fit") || l.includes("sport")) return Dumbbell;
  if (l.includes("brunch") || l.includes("diner") || l.includes("dining") || l.includes("foodie")) return Utensils;
  if (l.includes("café") || l.includes("cafe") || l.includes("coffee") || l.includes("bakery") || l.includes("pastry")) return Croissant;
  if (l.includes("local") || l.includes("weekend")) return Utensils;
  if (l.includes("transit") || l.includes("transport")) return Train;
  if (l.includes("subscription") || l.includes("digital")) return Music;
  return Sparkles;
}

// ─── DNA pill evidence helper ────────────────────────────────────────────────

function getPillEvidence(pill: DnaPill): [string, string, string] {
  const extra: Record<string, [string, string]> = {
    "Local-first": [
      "You chose independent cafés over chains in 76% of coffee visits",
      "3 of your top 5 merchants have been in Stuttgart Old Town for 10+ years",
    ],
    "Routine-anchored": [
      "Your weekday morning visits show 92% time consistency (±8 minutes)",
      "You revisit the same merchant 4.2× before exploring a new one",
    ],
    "Convenience-driven": [
      "Average walk distance to your merchants: 180m vs 420m area median",
      "82% of transactions happen within a 5-minute walk from your usual route",
    ],
    "Discovery-oriented": [
      "You've tried 14 unique merchants over the past 90 days",
      "2 of your current regulars started as spontaneous first visits",
    ],
    "Value-conscious": [
      "You visit the same merchant 1.8× more often when there's an active offer",
      "Average discount on your last 10 redemptions: 22%",
    ],
    "Wellness-focused": [
      "28% of your transactions are at wellness, organic, or fitness venues",
      "You consistently choose lighter-menu options during weekday lunches",
    ],
    "Sustainability": [
      "You prefer shops with eco or organic certifications when available",
      "3 of your top merchants are certified sustainable or zero-waste",
    ],
    "Experience-seeker": [
      "You've visited 6 distinct new venues in the past 90 days",
      "Evening transactions cluster around cultural and dining experiences",
    ],
  };
  const [a, b] = extra[pill.label] ?? [
    `Your transaction history shows strong "${pill.label}" alignment over 90 days`,
    "Consistent behavioral patterns detected across multiple merchant categories",
  ];
  return [pill.explanation, a, b];
}

// ─── DNA Pill transparency panel ────────────────────────────────────────────

function DnaPillPanel({
  pill,
  settings,
  onSave,
  onClose,
}: {
  pill: DnaPill;
  settings: { importance: number; hidden: boolean };
  onSave: (s: { importance: number; hidden: boolean }) => void;
  onClose: () => void;
}) {
  const [hidden, setHidden] = useState(settings.hidden);
  const evidence = getPillEvidence(pill);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-[440px] max-w-[92vw] rounded-[16px] bg-card border border-border-strong shadow-2xl p-7"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-[20px]">
            {pill.emoji ?? "✨"}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Why we think you're</div>
            <h3 className="text-[17px] font-semibold tracking-tight">{pill.label}</h3>
          </div>
        </div>

        {/* Evidence bullets */}
        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2.5">Evidence from your transactions</div>
          <ul className="space-y-2">
            {evidence.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-foreground/90">
                <span className="text-primary mt-[1px] shrink-0">✓</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Score explanation */}
        <div className="mb-4 px-3 py-2.5 rounded-[8px] bg-surface-elevated border border-border">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            This score is calculated from your real spending behavior over 90 days. Update your purchases, update your DNA.
          </p>
        </div>

        {/* Hide toggle */}
        {/* Hide button — instant save */}
        <div className="border-t border-border pt-4 mb-4">
          {hidden ? (
            <div className="w-full h-10 rounded-[8px] bg-success/10 border border-success/25 flex items-center justify-center gap-2 text-[12.5px] font-medium text-success">
              <Check className="h-4 w-4" />
              Hidden — won't influence offers anymore
            </div>
          ) : (
            <button
              onClick={() => {
                setHidden(true);
                onSave({ importance: settings.importance, hidden: true });
              }}
              className="w-full h-10 rounded-[8px] border border-border bg-surface-elevated hover:border-primary/40 hover:bg-surface-elevated/80 transition-colors text-[12.5px] font-medium text-foreground"
            >
              Hide this trait from my recommendations
            </button>
          )}
        </div>

        {/* Behind this score — Fix 4C */}
        <div className="border-t border-border pt-4 mb-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2.5">Behind this score</div>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
            {[
              "89 transactions analyzed",
              "4 merchant categories tracked",
              "87% pattern consistency detected",
              "1,246 similar profiles (anonymized)",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <span className="text-primary/60 shrink-0">·</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy footer */}
        <p className="text-center text-[11px] text-muted-foreground/70 leading-relaxed">
          🔒 Your data stays in your Sparkasse account. Never sold, never shared.
        </p>
      </motion.div>
    </motion.div>
  );
}

function getExpiryLabel(minutes: number): string {
  const exp = new Date(Date.now() + minutes * 60000);
  const h = exp.getHours() % 12 || 12;
  const m = String(exp.getMinutes()).padStart(2, "0");
  const period = exp.getHours() >= 12 ? "PM" : "AM";
  return `until ${h}:${m} ${period}`;
}

// ─── Receipt modal ──────────────────────────────────────────────────────────

function ReceiptModal({
  offer,
  cashback,
  onClose,
}: {
  offer: TodayOffer;
  cashback: number;
  onClose: () => void;
}) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] max-w-[94vw] rounded-[16px] bg-card border border-border-strong shadow-2xl p-7"
      >
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Receipt</div>
        <h3 className="text-[17px] font-semibold mb-4 leading-snug">{offer.merchant_name}</h3>

        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>Today, {time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items</span>
            <span className="text-right">{offer.sub_text}</span>
          </div>

          <div className="h-px bg-border my-3" />

          <div className="flex justify-between">
            <span className="text-muted-foreground">Original price</span>
            <span className="tabular-nums">€{offer.original_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Spend DNA discount</span>
            <span className="tabular-nums text-success">−€{(offer.original_price - offer.discount_price).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Final price</span>
            <span className="tabular-nums">€{offer.discount_price.toFixed(2)}</span>
          </div>

          <div className="h-px bg-border my-3" />

          <div className="flex justify-between">
            <span className="text-muted-foreground">Cashback to your account</span>
            <span className="tabular-nums text-success font-semibold">+€{cashback.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Match score</span>
            <span className="tabular-nums">{offer.match_score}%</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center mb-1">
            Powered by Spend DNA · Sparkasse Stuttgart
          </p>
          <p className="text-[11px] text-muted-foreground/70 text-center italic">
            Saved to your transaction history · also visible in your Sparkasse app
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full h-9 rounded-[8px] bg-surface-elevated hover:bg-primary hover:text-primary-foreground text-[12.5px] font-medium border border-border hover:border-primary transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Transaction history modal ───────────────────────────────────────────────

function categoryEmoji(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes("café") || c.includes("cafe") || c.includes("coffee")) return "☕";
  if (c.includes("bakery") || c.includes("bäckerei") || c.includes("pastry")) return "🥐";
  if (c.includes("grocer")) return "🛒";
  if (c.includes("restaurant") || c.includes("brunch") || c.includes("dining")) return "🍽️";
  if (c.includes("transit") || c.includes("bahn")) return "🚆";
  if (c.includes("fitness") || c.includes("gym")) return "🏋️";
  if (c.includes("subscription") || c.includes("music")) return "🎵";
  if (c.includes("retail") || c.includes("shop")) return "🛍️";
  if (c.includes("flower") || c.includes("florist")) return "🌸";
  if (c.includes("pharm")) return "💊";
  return "💳";
}

function TransactionHistoryModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const allTxns = parseTransactions();
  const total = allTxns.reduce((sum, t) => sum + t.amount_eur, 0);
  const filter = search.trim().toLowerCase();
  const filtered: Transaction[] = filter
    ? allTxns.filter(
        (t) =>
          t.merchant_name.toLowerCase().includes(filter) ||
          t.category.toLowerCase().includes(filter),
      )
    : allTxns;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-[640px] max-w-[94vw] max-h-[85vh] rounded-[16px] bg-card border border-border-strong shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Transaction history · last 90 days</div>
          <h3 className="text-[16px] font-semibold mb-2">Mia Schmidt · Sparkasse Stuttgart</h3>
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground flex-wrap">
            <span className="font-medium text-foreground tabular-nums">{allTxns.length} transactions</span>
            <span>·</span>
            <span className="font-medium text-foreground tabular-nums">€{total.toFixed(2)} net</span>
            <span>·</span>
            <span>Spend DNA analyzed all of these to build your profile</span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search merchant or category…"
            className="mt-3 w-full h-9 px-3 rounded-[8px] text-[12.5px] bg-surface-elevated border border-border focus:border-primary/60 focus:outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-muted-foreground">No transactions match "{search}"</div>
          ) : (
            filtered.map((t, i) => (
              <div key={i} className="px-6 py-2.5 flex items-center gap-3 hover:bg-surface-elevated/50 transition-colors">
                <div className="h-8 w-8 rounded-md bg-surface-elevated border border-border flex items-center justify-center text-[14px] shrink-0">
                  {categoryEmoji(t.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{t.merchant_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.category} · {t.weekday} {t.date} · {t.time_of_day}
                  </div>
                </div>
                <div className="text-[13px] font-medium tabular-nums shrink-0">
                  €{t.amount_eur.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">
            Showing <span className="text-foreground">{filtered.length}</span> of {allTxns.length}
          </div>
          <button
            onClick={onClose}
            className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CitizenView() {
  const [expanded, setExpanded] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [balance, setBalance] = useState(4827.30);
  const [offerData, setOfferData] = useState<OfferEngineResult | null>(null);
  const [loading, setLoading] = useState(true);

  // DNA transparency panel
  const [activePill, setActivePill] = useState<DnaPill | null>(null);
  const [pillSettings, setPillSettings] = useState<
    Record<string, { importance: number; hidden: boolean }>
  >({});

  // Alternatives feed
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<TodayOffer[] | null>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  // Receipt + transaction-history modals
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    generateOffer()
      .then(setOfferData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const offer = offerData?.today_offer;
  const cashback = offer
    ? parseFloat((offer.original_price - offer.discount_price).toFixed(2))
    : 1.70;

  const handleRedeem = () => {
    setRedeemed(true);
    setBalance((b) => parseFloat((b + cashback).toFixed(2)));
  };

  const handleLoadAlternatives = async () => {
    if (alternatives) {
      setShowAlternatives((v) => !v);
      return;
    }
    setShowAlternatives(true);
    setLoadingAlternatives(true);
    try {
      const alts = await generateAlternativeOffers();
      setAlternatives(alts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleSwitchOffer = (alt: TodayOffer) => {
    if (offerData) setOfferData({ ...offerData, today_offer: alt });
    setShowAlternatives(false);
    setAlternatives(null);
  };

  return (
    <>
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
                <div className="relative group">
                  <div className="text-[11px] px-2 py-1 rounded-md bg-success/10 text-success border border-success/20 flex items-center gap-1 cursor-help">
                    <span>💰</span>
                    <span>+€312 saved this month via Spend DNA</span>
                  </div>
                  <div className="absolute right-0 top-full mt-1.5 w-60 px-3 py-2 rounded-[8px] bg-background border border-border shadow-2xl text-[11px] text-muted-foreground leading-relaxed z-50 whitespace-normal opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                    Total cashback credited from Spend DNA-powered offers this month.
                    <span className="absolute right-4 bottom-full border-4 border-transparent border-b-border" />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <motion.span
                  key={balance}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-[44px] font-semibold tracking-tight tabular-nums"
                >
                  €{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.span>
                <span className="text-muted-foreground text-sm">available</span>
              </div>
            </div>
          </div>

          {/* transactions */}
          <div className="rounded-[12px] bg-card border border-border">
            <div className="px-5 py-4 flex items-center justify-between border-b border-border">
              <h3 className="text-sm font-medium">Recent transactions</h3>
              <button
                onClick={() => setHistoryOpen(true)}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
              </button>
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
              <span className="text-[11px] text-muted-foreground">
                {loading ? "Analyzing…" : "Updated today"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-[12px] border border-border bg-surface-elevated/40 p-4 h-[88px]"
                    />
                  ))
                : (offerData?.spend_dna ?? []).map((d) => {
                    const isHidden = pillSettings[d.label]?.hidden ?? false;
                    return (
                      <div
                        key={d.label}
                        onClick={() => setActivePill(d)}
                        className={`group relative rounded-[12px] border border-border bg-surface-elevated/40 p-4 hover:border-primary/40 hover:bg-surface-elevated transition-all duration-200 cursor-pointer ${isHidden ? "opacity-40 grayscale" : ""}`}
                      >
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-52 px-3 py-2 rounded-[8px] bg-card border border-border-strong shadow-xl text-[11px] text-muted-foreground leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 text-center whitespace-normal">
                          {isHidden ? "Hidden from profile · click to edit" : (d.explanation ?? d.label)}
                          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border-strong" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center text-[16px] leading-none">
                            {d.emoji ?? "✨"}
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums">{d.score}%</span>
                        </div>
                        <div className="mt-3 text-[13px] font-medium leading-tight">{d.label}</div>
                        <div className="mt-2 h-1 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500"
                            style={{ width: `${d.score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>

        {/* RIGHT — offer */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {redeemed ? (
              <motion.div
                key="redeemed"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[12px] bg-card border border-success/30 overflow-hidden relative"
              >
                <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-success/15 blur-3xl" />
                <div className="relative p-5 flex items-start gap-4">
                  <div className="h-11 w-11 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                    <Check className="h-5 w-5 text-success" strokeWidth={2.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] uppercase tracking-[0.14em] text-success font-medium">Redeemed today</span>
                      <span className="text-[10.5px] text-muted-foreground">· 12:14 PM</span>
                    </div>
                    <h3 className="mt-1 text-[16px] font-semibold tracking-tight">
                      {offer?.merchant_name ?? "Café Müller"}
                    </h3>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">
                      <span className="text-success font-medium">€{cashback.toFixed(2)} cashback</span> credited to your Sparkasse account
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <div className="h-px bg-border my-1" />
                  <div className="flex items-center justify-between pt-3 text-[11.5px] text-muted-foreground">
                    <span>Powered by Spend DNA · {offer?.match_score ?? 94}% match</span>
                    <button
                      onClick={() => setReceiptOpen(true)}
                      className="text-primary hover:text-primary-glow transition-colors"
                    >
                      View receipt
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-[12px] bg-card border border-border overflow-hidden"
              >
                <div className="animate-pulse h-44 bg-surface-elevated/60" />
                <div className="p-5 space-y-3">
                  <div className="animate-pulse h-5 w-2/3 rounded-md bg-surface-elevated" />
                  <div className="animate-pulse h-4 w-1/3 rounded-md bg-surface-elevated" />
                  <div className="animate-pulse h-16 w-full rounded-lg bg-surface-elevated" />
                  <div className="animate-pulse h-10 w-full rounded-[8px] bg-surface-elevated mt-4" />
                </div>
              </motion.div>
            ) : offer ? (
              <motion.div
                key="offer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <OfferCard
                  offer={offer}
                  expanded={expanded}
                  onToggleExpand={() => setExpanded((v) => !v)}
                  onActivate={() => setModalOpen(true)}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div
            onClick={handleLoadAlternatives}
            className="rounded-[12px] bg-card border border-border p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-surface-elevated transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
              {loadingAlternatives ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium">
                {loadingAlternatives
                  ? "Finding alternatives…"
                  : redeemed
                    ? "3 alternative offers"
                    : "3 more offers waiting"}
              </div>
              <div className="text-[11.5px] text-muted-foreground">
                {redeemed
                  ? "Already redeemed today's pick? Save these for tomorrow"
                  : "Curated from your Spend DNA"}
              </div>
            </div>
            <button className="text-[12px] text-primary hover:text-primary-glow transition-colors shrink-0">
              {showAlternatives ? "Hide ↑" : "See all →"}
            </button>
          </div>

          {/* Alternatives feed */}
          <AnimatePresence>
            {showAlternatives && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  {loadingAlternatives
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-[10px] border border-border bg-card p-4 h-24" />
                      ))
                    : (alternatives ?? []).map((alt, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.22 }}
                          className="rounded-[10px] border border-border bg-card p-4 flex items-center gap-4"
                        >
                          <div className="h-9 w-9 rounded-md bg-surface-elevated border border-border flex items-center justify-center shrink-0 text-[18px]">
                            {(() => {
                              const n = alt.merchant_name.toLowerCase();
                              if (n.includes("café") || n.includes("cafe") || n.includes("kaffee") || n.includes("müller")) return "☕";
                              if (n.includes("bäckerei") || n.includes("bakery") || n.includes("wölffer")) return "🥐";
                              if (n.includes("florist") || n.includes("blumen")) return "🌸";
                              if (n.includes("restaurant") || n.includes("ristorante") || n.includes("bistro")) return "🍽️";
                              return "🛍️";
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13.5px] font-semibold truncate">{alt.merchant_name}</span>
                              <span className="text-[10.5px] text-success shrink-0">{alt.match_score}% match</span>
                            </div>
                            <div className="text-[12px] text-muted-foreground truncate">{alt.headline_emotional}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[13px] font-semibold">€{alt.discount_price.toFixed(2)}</span>
                              <span className="text-[11px] text-muted-foreground line-through">€{alt.original_price.toFixed(2)}</span>
                              <span className="text-[11px] text-muted-foreground">· {alt.distance_m}m away</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSwitchOffer(alt)}
                            className="shrink-0 h-8 px-3 rounded-[6px] text-[11.5px] font-medium bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/25 transition-all duration-200"
                          >
                            Switch
                          </button>
                        </motion.div>
                      ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <RedeemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRedeem={handleRedeem}
        merchantName={offer?.merchant_name}
        distanceM={offer?.distance_m}
        cashback={cashback}
        matchScore={offer?.match_score}
      />

      {/* DNA Transparency Panel */}
      <AnimatePresence>
        {activePill && (
          <DnaPillPanel
            pill={activePill}
            settings={pillSettings[activePill.label] ?? { importance: activePill.score, hidden: false }}
            onSave={(s) => setPillSettings((prev) => ({ ...prev, [activePill.label]: s }))}
            onClose={() => setActivePill(null)}
          />
        )}
      </AnimatePresence>

      {/* Receipt modal */}
      <AnimatePresence>
        {receiptOpen && offer && (
          <ReceiptModal
            offer={offer}
            cashback={cashback}
            onClose={() => setReceiptOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Full transaction-history modal */}
      <AnimatePresence>
        {historyOpen && <TransactionHistoryModal onClose={() => setHistoryOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Offer card — 3 visual styles driven by widget_style ────────────────────

function OfferCard({
  offer,
  expanded,
  onToggleExpand,
  onActivate,
}: {
  offer: TodayOffer;
  expanded: boolean;
  onToggleExpand: () => void;
  onActivate: () => void;
}) {
  const Icon = getMerchantIcon(offer.merchant_name);
  const expiryLabel = getExpiryLabel(offer.expiry_minutes);

  const ReasonsAccordion = (
    <>
      <button
        onClick={onToggleExpand}
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
            {offer.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-success mt-[1px]">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </>
  );

  const ValuesMatchPills = offer.values_match?.length ? (
    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
      <span className="text-[11px] text-muted-foreground/80">Aligned with:</span>
      {offer.values_match.map((v, i) => (
        <span
          key={i}
          className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
        >
          {v}
        </span>
      ))}
    </div>
  ) : null;

  // ── COZY — warm, familiar, comfort-driven ──────────────────────────────────
  if (offer.widget_style === "cozy") {
    return (
      <div className="rounded-[12px] bg-card border border-border overflow-hidden">
        <div className="relative h-44 bg-gradient-to-br from-warning/30 via-warning/10 to-primary/20 flex items-center justify-center">
          <Icon className="h-20 w-20 text-warning drop-shadow-[0_0_20px_oklch(0.78_0.16_75/0.5)]" />
          <div className="absolute top-3 left-3 text-[10px] font-medium px-2 py-1 rounded-md bg-background/70 backdrop-blur border border-border text-foreground">
            TODAY · LIMITED
          </div>
          <div className="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded-md bg-success/20 text-success border border-success/30">
            {offer.match_score}% match
          </div>
        </div>
        <div className="p-5">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight">{offer.merchant_name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {offer.distance_m}m away · Old Town
            </div>
            {ValuesMatchPills}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-surface-elevated border border-border">
            <div className="text-[13.5px] font-medium text-foreground" style={{ fontFamily: "Georgia, serif" }}>
              {offer.headline_emotional}
            </div>
            <div className="text-[11.5px] text-muted-foreground mt-1">{offer.sub_text}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">€{offer.discount_price.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through tabular-nums">€{offer.original_price.toFixed(2)}</span>
              <span className="ml-auto text-[11px] text-warning">{expiryLabel}</span>
            </div>
          </div>
          {ReasonsAccordion}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onActivate}
              className="flex-1 h-10 rounded-[8px] text-[13.5px] font-medium transition-all duration-200 bg-primary hover:bg-primary-glow text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]"
            >
              Activate offer
            </button>
            <button className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── URGENT — scarcity, time-pressure, pulsing red ─────────────────────────
  if (offer.widget_style === "urgent") {
    return (
      <div className="relative rounded-[12px] overflow-hidden bg-gradient-to-br from-destructive/15 via-background to-primary/15 border-2 border-destructive/40">
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-[10px] border-2 border-destructive pointer-events-none"
        />
        <div className="relative h-44 bg-gradient-to-br from-destructive/20 via-destructive/5 to-background flex items-center justify-center">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-destructive/20 blur-2xl" />
          <Icon className="h-20 w-20 text-destructive drop-shadow-[0_0_20px_oklch(0.65_0.24_25/0.5)]" />
          <div className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-md bg-destructive/20 text-destructive border border-destructive/40 uppercase tracking-wider flex items-center gap-1">
            <Flame className="h-3 w-3" /> Expiring soon
          </div>
          <div className="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded-md bg-success/20 text-success border border-success/30">
            {offer.match_score}% match
          </div>
        </div>
        <div className="relative p-5">
          <div>
            <h3 className="text-[17px] font-bold tracking-tight uppercase">{offer.merchant_name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {offer.distance_m}m away · Old Town
            </div>
            {ValuesMatchPills}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="text-[13.5px] font-bold text-destructive uppercase tracking-wide">
              {offer.headline_emotional}
            </div>
            <div className="text-[11.5px] text-muted-foreground mt-1">{offer.sub_text}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-destructive">€{offer.discount_price.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through tabular-nums">€{offer.original_price.toFixed(2)}</span>
              <span className="ml-auto text-[11px] text-destructive flex items-center gap-1">
                <Clock className="h-3 w-3" />{expiryLabel}
              </span>
            </div>
          </div>
          {ReasonsAccordion}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onActivate}
              className="flex-1 h-10 rounded-[8px] text-[13.5px] font-bold uppercase tracking-wide transition-all duration-200 bg-destructive hover:brightness-110 text-destructive-foreground"
            >
              Activate now
            </button>
            <button className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FACTUAL — clean, data-first, value-driven ─────────────────────────────
  return (
    <div className="rounded-[12px] bg-white dark:bg-card border border-neutral-200 dark:border-border overflow-hidden">
      <div className="h-44 bg-neutral-50 dark:bg-surface-elevated flex items-center justify-center relative">
        <Icon className="h-16 w-16 text-neutral-300 dark:text-muted-foreground/50" />
        <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-[0.14em] px-2 py-1 rounded-md bg-neutral-100 dark:bg-surface-elevated border border-neutral-200 dark:border-border text-neutral-500 dark:text-muted-foreground">
          Value pick
        </div>
        <div className="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded-md bg-success/20 text-success border border-success/30">
          {offer.match_score}% match
        </div>
      </div>
      <div className="p-5">
        <div>
          <h3 className="text-[17px] font-semibold tracking-tight text-neutral-900 dark:text-foreground">{offer.merchant_name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-neutral-500 dark:text-muted-foreground">
            <MapPin className="h-3 w-3" /> {offer.distance_m}m away · Old Town
          </div>
          {ValuesMatchPills}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-neutral-100 dark:bg-surface-elevated border border-neutral-200 dark:border-border">
          <div className="text-[13.5px] font-medium text-neutral-800 dark:text-foreground font-mono">
            {offer.headline_emotional}
          </div>
          <div className="text-[11.5px] text-neutral-500 dark:text-muted-foreground mt-1">{offer.sub_text}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-neutral-900 dark:text-foreground">€{offer.discount_price.toFixed(2)}</span>
            <span className="text-sm text-neutral-400 line-through tabular-nums">€{offer.original_price.toFixed(2)}</span>
            <span className="ml-auto text-[11px] text-neutral-500 dark:text-muted-foreground">{expiryLabel}</span>
          </div>
        </div>
        {ReasonsAccordion}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onActivate}
            className="flex-1 h-10 rounded-[8px] text-[13.5px] font-medium transition-all duration-200 bg-neutral-900 dark:bg-primary hover:bg-neutral-700 dark:hover:bg-primary-glow text-white dark:text-primary-foreground"
          >
            Activate offer
          </button>
          <button className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
