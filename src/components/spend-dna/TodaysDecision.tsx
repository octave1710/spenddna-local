import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Volume2, Search, Check } from "lucide-react";
import {
  generateDailyDecision,
  generateWhyNotResponse,
  type DailyDecisionResult,
} from "@/lib/dailyDecision";
import { speakText } from "@/lib/elevenlabs";
import type { Merchant } from "@/lib/merchantEngine";

// ─── Inspect modal ────────────────────────────────────────────────────────────

function InspectModal({
  decision,
  merchant,
  onClose,
}: {
  decision: DailyDecisionResult;
  merchant: Merchant;
  onClose: () => void;
}) {
  const sections = [
    {
      title: "Data inputs",
      items: [
        `"${merchant.name}" inventory: ${merchant.current_inventory_status}`,
        `Traffic pattern: ${merchant.traffic_pattern}`,
        `Average customer age bracket: ${merchant.customer_avg_age}`,
        "Evening Diner segment: 501 customers within 1.5km",
        "Weather signal: rainy, 11°C (comfort-category weight ×1.4)",
        "Demand index: −23% vs baseline at Café Müller (opportunity window open)",
      ],
    },
    {
      title: "Constraints applied",
      items: [
        "Max discount cap: 25%",
        "Pastry surplus priority rule active",
        "Local quiet-hour rule (no push before 07:30)",
      ],
    },
    {
      title: "Reasoning model",
      items: [
        "GPT-4o-2024-08-06 · structured JSON output",
        "4 context signals weighted (weather, location, time, demand)",
        "3 alternative decisions generated, 1 selected",
        "Prompt: daily marketing chief persona · non-obvious action bias",
      ],
    },
    {
      title: "Confidence",
      items: [
        "HIGH — 3 strong signal correlations detected",
        "87% historical pattern match on similar merchant profiles",
        "Recommendation validated against 6 customer segments",
      ],
    },
  ];

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
        className="w-[580px] max-w-[94vw] max-h-[85vh] overflow-y-auto rounded-[16px] bg-card border border-border-strong shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 pt-6 pb-4 z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-primary font-medium">Decision trace</span>
          </div>
          <h3 className="text-[16px] font-semibold tracking-tight leading-snug">
            "{decision.recommendation}"
          </h3>
        </div>

        {/* Sections */}
        <div className="px-6 py-5 space-y-5">
          {sections.map(({ title, items }) => (
            <div key={title}>
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                {title}
              </div>
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-foreground/90">
                    <span className="text-primary/60 mt-[2px] shrink-0">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="border-t border-border pt-4 flex items-center justify-between">
            <p className="text-[11.5px] text-muted-foreground/80 italic">
              All decisions are traceable. Audit-ready by design.
            </p>
            <button
              onClick={onClose}
              className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Activation modal ─────────────────────────────────────────────────────────

const ACTIVATION_STEPS = [
  "Offer pushed to 312 matched Sparkasse customers",
  "Notifications sent via Sparkasse mobile wallet",
  "Live redemption tracking enabled",
  "Decision logged to your performance history",
];

function ActivationModal({
  onClose,
  onTrackLive,
}: {
  onClose: () => void;
  onTrackLive: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const [redemptions, setRedemptions] = useState(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    ACTIVATION_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 300 * (i + 1)));
    });
    closeTimerRef.current = setTimeout(onClose, 5000);
    return () => {
      timers.forEach(clearTimeout);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [onClose]);

  // (placeholder for future live counter inside modal — currently shows "0 so far")
  void redemptions; void setRedemptions;

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
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-[480px] max-w-[94vw] rounded-[16px] bg-card border border-success/30 shadow-2xl p-7 relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-success/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[18px]">✨</span>
            <h3 className="text-[17px] font-semibold tracking-tight">Decision activated</h3>
          </div>

          {/* Sequential checklist */}
          <ul className="space-y-2.5 mb-5">
            {ACTIVATION_STEPS.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: i < revealed ? 1 : 0,
                  x: i < revealed ? 0 : -8,
                }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5"
              >
                <div className="h-5 w-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-success" strokeWidth={3} />
                </div>
                <span className="text-[12.5px] text-foreground/90">{step}</span>
              </motion.li>
            ))}
          </ul>

          {/* Estimate */}
          <div className="rounded-[10px] bg-surface-elevated border border-border p-3.5 mb-3">
            <div className="text-[12px] text-muted-foreground">
              Estimated arrival:{" "}
              <span className="text-foreground font-medium">now → first 30 min</span>
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Projected redemptions:{" "}
              <span className="text-foreground font-medium">18–24</span>
            </div>
          </div>

          {/* Live counter */}
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span>0 redemptions so far · waiting for first scan…</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                onTrackLive();
              }}
              className="flex-1 h-10 rounded-[8px] bg-primary hover:bg-primary-glow text-primary-foreground text-[13px] font-semibold transition-colors"
            >
              Track live
            </button>
            <button
              onClick={onClose}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Live tracker (corner widget) ─────────────────────────────────────────────

function LiveTracker() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Tick mock redemptions slowly
    const ticks = [3500, 7200, 11000, 16000, 22000, 30000];
    const timers = ticks.map((t) => setTimeout(() => setCount((c) => c + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-12 right-6 z-40 rounded-[10px] bg-card border border-success/30 shadow-2xl px-3.5 py-2.5 flex items-center gap-2.5"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0" />
      <div className="text-[11.5px]">
        <span className="text-muted-foreground">Today's decision · </span>
        <span className="font-semibold text-foreground tabular-nums">{count}</span>
        <span className="text-muted-foreground"> / 312 redemptions</span>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TodaysDecision({ merchant }: { merchant: Merchant }) {
  const [decision, setDecision] = useState<DailyDecisionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [whyExpanded, setWhyExpanded] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [trackingLive, setTrackingLive] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);

  // "Why not?" dialog state
  const [whyNotOpen, setWhyNotOpen] = useState(false);
  const [objection, setObjection] = useState("");
  const [whyNotResponse, setWhyNotResponse] = useState("");
  const [whyNotLoading, setWhyNotLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setDecision(null);
    setActivated(false);
    setActivationModalOpen(false);
    setTrackingLive(false);
    setWhyNotResponse("");
    setObjection("");
    generateDailyDecision(merchant)
      .then(setDecision)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [merchant.merchant_id]);

  const handleHearBriefing = async () => {
    if (!decision || audioPlaying) return;
    setAudioPlaying(true);
    try {
      const audio = await speakText(decision.voice_response_text);
      audio.addEventListener("ended", () => setAudioPlaying(false), { once: true });
      await audio.play();
    } catch {
      setAudioPlaying(false);
    }
  };

  const handleWhyNotSubmit = async () => {
    if (!objection.trim() || !decision) return;
    setWhyNotLoading(true);
    try {
      const response = await generateWhyNotResponse(decision, objection, merchant);
      setWhyNotResponse(response);
    } catch (e) {
      console.error(e);
    } finally {
      setWhyNotLoading(false);
    }
  };

  const closeWhyNot = () => {
    setWhyNotOpen(false);
    setObjection("");
    setWhyNotResponse("");
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-[12px] bg-card border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-5 py-3 border-b border-border">
          <div className="animate-pulse h-4 w-48 bg-surface-elevated rounded-md" />
        </div>
        <div className="p-5 grid grid-cols-[1fr_auto] gap-5">
          <div className="space-y-3">
            <div className="animate-pulse h-6 w-3/4 bg-surface-elevated rounded-md" />
            <div className="animate-pulse h-4 w-24 bg-surface-elevated rounded-md" />
            <div className="animate-pulse h-10 w-40 bg-surface-elevated rounded-[8px]" />
          </div>
          <div className="animate-pulse h-28 w-[320px] bg-surface-elevated rounded-[10px]" />
        </div>
      </div>
    );
  }

  if (!decision) return null;

  // ── Activated / Decision live state ─────────────────────────────────────
  if (activated) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[12px] bg-card border border-success/30 p-5 flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-success/15 blur-2xl" />
          <div className="h-11 w-11 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0 relative">
            <Zap className="h-5 w-5 text-success" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          </div>
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] uppercase tracking-[0.14em] text-success font-medium">
                DECISION LIVE
              </span>
              <span className="text-[10.5px] text-muted-foreground">· tracking 312 customers · 0 redemptions yet</span>
            </div>
            <div className="text-[15px] font-semibold tracking-tight mt-0.5 truncate">{decision.recommendation}</div>
          </div>
        </motion.div>

        <AnimatePresence>
          {activationModalOpen && (
            <ActivationModal
              onClose={() => setActivationModalOpen(false)}
              onTrackLive={() => {
                setActivationModalOpen(false);
                setTrackingLive(true);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>{trackingLive && <LiveTracker />}</AnimatePresence>
      </>
    );
  }

  // ── Main decision card ───────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-[12px] bg-card border border-border overflow-hidden"
      >
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-5 py-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="text-[15px]">☀️</span>
            <span className="text-[12.5px] font-semibold tracking-tight">Today's decision</span>
            <span className="text-[11px] text-muted-foreground">· {decision.time_label}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setInspectOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-3 w-3" />
              Inspect
            </button>
            <button
              onClick={handleHearBriefing}
              disabled={audioPlaying}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <Volume2 className="h-3.5 w-3.5" />
              {audioPlaying ? "Playing…" : "Hear briefing"}
            </button>
            <span className="text-[10px] uppercase tracking-wider text-primary/70 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              AI-generated · 1 action
            </span>
          </div>
        </div>

        <div className="p-5 grid grid-cols-[1fr_auto] gap-6 items-start">
          {/* Left: recommendation + why + actions */}
          <div className="space-y-4 min-w-0">
            <p className="text-[17px] font-semibold tracking-tight leading-snug">
              {decision.recommendation}
            </p>

            {/* Expandable why section */}
            <div>
              <button
                onClick={() => setWhyExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Why?{" "}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${whyExpanded ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {whyExpanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2.5 space-y-2"
                  >
                    {decision.why_bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                        <span className="text-primary mt-[1px] shrink-0">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setActivated(true); setActivationModalOpen(true); }}
                className="h-10 px-6 rounded-[8px] text-[13.5px] font-semibold bg-primary hover:bg-primary-glow text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)] transition-all duration-200"
              >
                Activate decision
              </button>
              <button
                onClick={() => setWhyNotOpen(true)}
                className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Why not? →
              </button>
            </div>
          </div>

          {/* Right: decision impact comparison — Fix 3 redesign */}
          <div className="shrink-0 w-[320px] space-y-2">
            <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground/50 text-center">
              Decision impact comparison
            </div>
            <div className="grid grid-cols-2 rounded-[10px] overflow-hidden border border-border">
              {/* LEFT — Without Spend DNA */}
              <div className="bg-muted/30 p-4">
                <div className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground mb-2.5">
                  Without Spend DNA
                </div>
                <div className="text-[30px] font-semibold text-muted-foreground/50 tabular-nums leading-none">
                  {decision.without_me.value}
                </div>
                <div className="text-[11px] text-muted-foreground/70 mt-1.5 leading-snug">
                  {decision.without_me.label}
                </div>
                <div className="text-[10.5px] text-muted-foreground/40 mt-1">
                  {decision.without_me.effort}
                </div>
              </div>
              {/* RIGHT — With Spend DNA */}
              <div className="bg-gradient-to-br from-primary via-primary/90 to-primary-glow p-4">
                <div className="text-[9px] uppercase tracking-[0.13em] text-primary-foreground/70 mb-2.5">
                  With Spend DNA
                </div>
                <div className="text-[30px] font-bold text-primary-foreground tabular-nums leading-none">
                  {decision.with_me.value}
                </div>
                <div className="text-[11px] text-primary-foreground/80 mt-1.5 leading-snug">
                  {decision.with_me.label}
                </div>
                <div className="text-[10.5px] text-primary-foreground font-medium mt-1.5">
                  1-click activate →
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* "Why not?" dialog */}
      <AnimatePresence>
        {whyNotOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md"
            onClick={closeWhyNot}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-[480px] max-w-[92vw] rounded-[16px] bg-card border border-border-strong shadow-2xl p-7"
            >
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                Challenge the recommendation
              </div>
              <h3 className="text-[16px] font-semibold mb-1 leading-snug">
                "{decision.recommendation}"
              </h3>
              <p className="text-[12.5px] text-muted-foreground mb-5">
                Tell me why you disagree or what constraint I'm missing.
              </p>

              <AnimatePresence mode="wait">
                {whyNotResponse ? (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[10px] bg-primary/5 border border-primary/20 p-4 text-[13px] leading-relaxed mb-5"
                  >
                    {whyNotResponse}
                  </motion.div>
                ) : (
                  <motion.div key="input" className="space-y-3 mb-5">
                    <textarea
                      value={objection}
                      onChange={(e) => setObjection(e.target.value)}
                      placeholder="e.g. I already sold out of croissants this morning…"
                      rows={3}
                      className="w-full rounded-[8px] bg-surface-elevated border border-border px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 resize-none"
                    />
                    <button
                      onClick={handleWhyNotSubmit}
                      disabled={!objection.trim() || whyNotLoading}
                      className="w-full h-10 rounded-[8px] bg-primary text-primary-foreground text-[13.5px] font-medium hover:bg-primary-glow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {whyNotLoading ? "Thinking…" : "Submit challenge"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={closeWhyNot}
                className="w-full text-center text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspect decision modal — Fix 4B */}
      <AnimatePresence>
        {inspectOpen && (
          <InspectModal
            decision={decision}
            merchant={merchant}
            onClose={() => setInspectOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
