import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";

// ─── Learning Library ─────────────────────────────────────────────────────────

const BASE_LEARNINGS = [
  {
    icon: "⏰",
    text: "Tuesday lunch pushes outperform Monday by 23%",
    confidence: "MEDIUM" as const,
    applied: 12,
    lift: undefined,
  },
  {
    icon: "🌧️",
    text: "Rainy day chocolate offers convert 31% better",
    confidence: "HIGH" as const,
    applied: 8,
    lift: "+31%",
  },
  {
    icon: "📍",
    text: "Offers within 150m radius see 2.1× more walk-in conversions",
    confidence: "HIGH" as const,
    applied: 6,
    lift: "+110%",
  },
];

const JUST_ADDED_LEARNING = {
  icon: "💡",
  text: "Senior Local segment responds 1.4× better when offer references weather context",
  confidence: "HIGH" as const,
  applied: 5,
  lift: "+18%",
  justAdded: true,
};

function LearningLibraryModal({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState<Set<number>>(new Set([0]));
  const allLearnings = [JUST_ADDED_LEARNING, ...BASE_LEARNINGS];

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
        className="w-[520px] max-w-[94vw] rounded-[16px] bg-card border border-border-strong shadow-2xl p-6"
      >
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">📚 Learning Library</div>
        <h3 className="text-[17px] font-semibold mb-1">Insights captured from your decisions</h3>
        <p className="text-[12px] text-muted-foreground mb-5">
          These compound. Every decision feeds the next one.
        </p>
        <div className="space-y-3">
          {allLearnings.map((l, i) => (
            <motion.div
              key={i}
              initial={i === 0 ? { opacity: 0, y: -6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i === 0 ? 0.05 : 0 }}
              className={`rounded-[10px] border p-3.5 ${
                i === 0
                  ? "bg-success/5 border-success/25"
                  : "bg-surface-elevated border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-[15px] mt-0.5 shrink-0">{l.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {i === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success border border-success/30 font-medium">
                        ✨ Just added
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        l.confidence === "HIGH"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-warning/10 text-warning border border-warning/20"
                      }`}
                    >
                      {l.confidence}
                    </span>
                    <span className="text-[10.5px] text-muted-foreground">
                      applied {l.applied}×
                      {l.lift && (
                        <span className="text-success ml-1">· {l.lift} avg lift</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-foreground/90 leading-snug">{l.text}</p>
                </div>
                {saved.has(i) ? (
                  <div className="shrink-0 h-7 px-2.5 rounded-[6px] bg-success/10 border border-success/25 flex items-center gap-1 text-[10.5px] font-medium text-success">
                    <Check className="h-3 w-3" />
                    Saved to good-practice DB
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setSaved((prev) => {
                        const next = new Set(prev);
                        next.add(i);
                        return next;
                      })
                    }
                    className="shrink-0 h-7 px-3 rounded-[6px] bg-primary hover:bg-primary-glow text-primary-foreground text-[11.5px] font-medium transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 text-center mt-5 italic">
          These insights compound. Every decision feeds the next one.
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Win-back result (stateful) ───────────────────────────────────────────────

function WinBackResult() {
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "compact">("idle");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSend = () => {
    setSendState("sending");
    setProgress(0);
    const start = Date.now();
    const duration = 1500;
    timerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        setSendState("sent");
        setTimeout(() => setSendState("compact"), 4000);
      }
    }, 16);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  if (sendState === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-3 p-3 rounded-[8px] bg-surface-elevated border border-border flex items-center gap-2"
      >
        <Check className="h-3.5 w-3.5 text-success shrink-0" />
        <span className="text-[12px] text-muted-foreground">12 win-back offers active · 0 redeemed yet</span>
      </motion.div>
    );
  }

  if (sendState === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-3 rounded-[8px] bg-success/5 border border-success/25 space-y-2"
      >
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success shrink-0" />
          <span className="text-[12.5px] font-medium text-success">Sent to 12 customers via Sparkasse wallet</span>
        </div>
        <div className="text-[11.5px] text-muted-foreground">3 high-priority delivery · Expected within 5 minutes</div>
        <button className="text-[11.5px] text-primary hover:text-primary-glow transition-colors font-medium">
          Track responses live →
        </button>
      </motion.div>
    );
  }

  if (sendState === "sending") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-3 rounded-[8px] bg-primary/5 border border-primary/20 space-y-2"
      >
        <div className="text-[11.5px] text-muted-foreground">Sending to 12 customers via Sparkasse wallet…</div>
        <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 p-3 rounded-[8px] bg-primary/5 border border-primary/20"
    >
      <div className="text-[10px] uppercase tracking-wider text-primary mb-1.5 font-medium">
        Win-back offer ready
      </div>
      <div className="text-[12.5px] font-medium leading-snug">
        "We miss you — 20% off your next visit, valid until Sunday."
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5">
        Targeting: Marie L. · Klaus B. · Sophie M. · Push via Sparkasse wallet
      </div>
      <button
        onClick={handleSend}
        className="mt-2 text-[11.5px] text-primary hover:text-primary-glow transition-colors font-medium"
      >
        Send now →
      </button>
    </motion.div>
  );
}

// ─── Coordinate modal ─────────────────────────────────────────────────────────

function CoordinateModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [customText, setCustomText] = useState(
    "Proposing a coordinated push for the 11:30–13:30 lunch window. Let me know your availability."
  );

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
        className="w-[480px] max-w-[94vw] rounded-[16px] bg-card border border-border-strong shadow-2xl p-6"
      >
        {sent ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-success" />
            </div>
            <div className="text-[15px] font-semibold mb-1">Proposal sent to 2 merchants</div>
            <div className="text-[12.5px] text-muted-foreground mb-5">
              Wölffer Bäckerei and Florist Thuiller have been notified. Typical response time: 20 minutes.
            </div>
            <button onClick={onClose} className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
              Close
            </button>
          </motion.div>
        ) : (
          <>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">🤝 Coordinate with neighborhood merchants</div>
            <h3 className="text-[16px] font-semibold mb-1 leading-snug">
              Coordinated push for 11:30–13:30 window
            </h3>
            <p className="text-[12.5px] text-muted-foreground mb-4">
              Propose a joint offer push with Wölffer Bäckerei + Florist Thuiller targeting the lunch crowd.
            </p>

            {/* Impact preview */}
            <div className="rounded-[10px] bg-surface-elevated border border-border p-3.5 mb-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-success font-medium">↗</span>
                <span>Combined audience: <strong>1,847 customers</strong> reached</span>
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-primary font-medium">€</span>
                <span>Projected combined uplift: <strong>€420</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span>↻</span>
                <span>Cross-referral rate on past joint pushes: 34%</span>
              </div>
            </div>

            {/* Customize */}
            <AnimatePresence>
              {showCustomize && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mb-4"
                >
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    rows={3}
                    className="w-full rounded-[8px] bg-surface-elevated border border-border px-3 py-2.5 text-[12.5px] text-foreground focus:outline-none focus:border-primary/60 resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSent(true)}
                className="flex-1 h-10 rounded-[8px] text-[13.5px] font-semibold bg-primary hover:bg-primary-glow text-primary-foreground transition-colors"
              >
                Send proposal
              </button>
              <button
                onClick={() => setShowCustomize((v) => !v)}
                className="h-10 px-4 rounded-[8px] text-[12.5px] border border-border hover:bg-surface-elevated transition-colors"
              >
                Customize
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function MerchantInsightCards() {
  const [showWinBack, setShowWinBack] = useState(false);
  const [showLearningLibrary, setShowLearningLibrary] = useState(false);
  const [showCoordinateModal, setShowCoordinateModal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-5">
        {/* ── Card 1 — Yesterday's Recap ─────────────────────────────────── */}
        <div className="rounded-[12px] bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px]">📊</span>
            <span className="text-[12px] font-semibold tracking-tight">Yesterday's decision · recap</span>
          </div>
          <div className="space-y-1.5 text-[12px] text-muted-foreground">
            <div className="flex items-start gap-1.5">
              <span className="text-muted-foreground/50 shrink-0 mt-[1px]">↗</span>
              <span>
                Pushed: <span className="text-foreground">Variant B</span> · Croissants to Weekend Family
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-success shrink-0 mt-[1px]">✓</span>
              <span>
                Result: <span className="text-foreground font-medium">19 redemptions</span>{" "}
                <span className="text-muted-foreground/60">(projected: 22–28)</span>
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-success shrink-0 mt-[1px]">€</span>
              <span>
                Net: <span className="text-foreground font-semibold">€141 incremental revenue</span>
              </span>
            </div>
          </div>
          <div className="mt-3 p-2.5 rounded-[8px] bg-warning/10 border border-warning/20">
            <p className="text-[11.5px] leading-relaxed">
              <span className="font-semibold">💡 Insight unlocked:</span>{" "}
              <span className="text-muted-foreground">
                Senior Local segment responds 1.4× better when offer references weather context
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowLearningLibrary(true)}
            className="mt-3 text-[12px] text-primary hover:text-primary-glow transition-colors"
          >
            Apply this learning today →
          </button>
        </div>

        {/* ── Card 2 — Churn Alert ───────────────────────────────────────── */}
        <div className="rounded-[12px] bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px]">🔴</span>
            <span className="text-[12px] font-semibold tracking-tight">Customers slipping away</span>
            <span className="ml-auto h-5 w-5 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center shrink-0">
              <AlertCircle className="h-3 w-3 text-destructive" />
            </span>
          </div>
          <div className="space-y-1 text-[12px] text-muted-foreground mb-3">
            <div>
              <span className="text-foreground font-medium">12 regulars</span> haven't visited in 21+ days
            </div>
            <div>
              Including <span className="text-foreground">3 high-value: avg €87/month</span>
            </div>
          </div>
          <div className="space-y-2 mb-3">
            {[
              { name: "Marie L.", detail: "last visit 28d ago · 3×/week regular" },
              { name: "Klaus B.", detail: "24d ago · croissant lover" },
              { name: "Sophie M.", detail: "22d ago · weekend brunch" },
            ].map(({ name, detail }) => (
              <div key={name} className="flex items-center gap-2 text-[11.5px]">
                <div className="h-5 w-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[9px] text-muted-foreground font-medium shrink-0">
                  {name[0]}
                </div>
                <span className="font-medium text-foreground">{name}</span>
                <span className="text-muted-foreground/70">{detail}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowWinBack((v) => !v)}
            className="w-full h-8 rounded-[6px] text-[12px] font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-colors"
          >
            {showWinBack ? "Hide win-back offer" : "Generate win-back offer"}
          </button>
          <AnimatePresence>{showWinBack && <WinBackResult key="winback" />}</AnimatePresence>
        </div>

        {/* ── Card 3 — Neighborhood Pulse ────────────────────────────────── */}
        <div className="rounded-[12px] bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px]">👥</span>
            <span className="text-[12px] font-semibold tracking-tight">Neighborhood pulse · live</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
          </div>
          <div className="space-y-3">
            {[
              {
                icon: "🥐",
                text: "Wölffer Bäckerei pushed a counter-offer at 11:30",
                sub: "47% segment overlap with your customer base",
              },
              {
                icon: "🌸",
                text: "Florist Thuiller has surplus tulips today",
                sub: "Could pair with your brunch crowd as a gift upsell",
              },
              {
                icon: "☕",
                text: "Café Lumière sees unusually high tourist traffic",
                sub: "Low English-menu overlap — opportunity for referrals",
              },
            ].map(({ icon, text, sub }, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-md bg-surface-elevated border border-border flex items-center justify-center text-[13px] shrink-0">
                  {icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] text-foreground leading-snug">{text}</div>
                  <div className="text-[11px] text-muted-foreground">{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowCoordinateModal(true)}
            className="mt-3 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Coordinate offer with neighbors →
          </button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showLearningLibrary && (
          <LearningLibraryModal onClose={() => setShowLearningLibrary(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCoordinateModal && (
          <CoordinateModal onClose={() => setShowCoordinateModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
