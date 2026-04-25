import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { Mic, Loader2, Users, ShoppingBasket, Send, TrendingUp, Pencil, Flame, Sparkles, Clock } from "lucide-react";

const segmentsData = [
  { name: "Morning Commuter", value: 412 },
  { name: "Weekend Family", value: 289 },
  { name: "Evening Diner", value: 501 },
  { name: "Gym Regular", value: 178 },
  { name: "Senior Local", value: 134 },
  { name: "Tourist", value: 89 },
];
const SEG_COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#60A5FA", "#F472B6", "#A78BFA"];

const hourlyData = [
  { h: "6", v: 22 }, { h: "7", v: 58 }, { h: "8", v: 142 }, { h: "9", v: 96 },
  { h: "10", v: 64 }, { h: "11", v: 78 }, { h: "12", v: 138 }, { h: "13", v: 102 },
  { h: "14", v: 70 }, { h: "15", v: 58 }, { h: "16", v: 72 }, { h: "17", v: 94 },
  { h: "18", v: 118 }, { h: "19", v: 156 }, { h: "20", v: 110 }, { h: "21", v: 64 },
];

const weeklyData = [
  { d: "Mon", v: 312 }, { d: "Tue", v: 298 }, { d: "Wed", v: 334 },
  { d: "Thu", v: 321 }, { d: "Fri", v: 356 }, { d: "Sat", v: 218 }, { d: "Sun", v: 184 },
];

const categoryData = [
  { name: "Pastry", value: 35 },
  { name: "Coffee", value: 28 },
  { name: "Sandwich", value: 18 },
  { name: "Cake", value: 12 },
  { name: "Other", value: 7 },
];

const reasoningSteps = [
  "Found 1,247 Sparkasse customers within 1.2km",
  "Filtered: 312 with morning pastry pattern",
  "Cross-referenced weather: rainy → −8% redemption",
  "Identified 3 high-match segments",
  "Generated 3 offer variants",
];

const offerVariants = [
  {
    label: "Variant A", tag: "Morning Commuter",
    text: "2 viennoiseries + Coffee — €4.50 (was €7) · 7–9am",
    redemptions: 84, revenue: "€378",
  },
  {
    label: "Variant B", tag: "Weekend Family",
    text: "Family box: 6 pastries — €12 (save 25%) · Sat-Sun",
    redemptions: 41, revenue: "€492",
  },
  {
    label: "Variant C", tag: "Senior Local",
    text: "Coffee + pastry combo — €3.20 · all-day Tuesday",
    redemptions: 62, revenue: "€198",
  },
];

type MicState = "idle" | "listening" | "thinking" | "done";

export function MerchantView() {
  const [micState, setMicState] = useState<MicState>("idle");
  const [streamed, setStreamed] = useState<number>(0);
  const [showOffers, setShowOffers] = useState(false);
  const timers = useRef<number[]>([]);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => reset(), []);

  const handleMic = () => {
    if (micState !== "idle" && micState !== "done") return;
    reset();
    setStreamed(0);
    setShowOffers(false);
    setMicState("listening");
    timers.current.push(window.setTimeout(() => setMicState("thinking"), 3000));
    timers.current.push(window.setTimeout(() => {
      setMicState("done");
      reasoningSteps.forEach((_, i) => {
        timers.current.push(window.setTimeout(() => setStreamed(i + 1), i * 250));
      });
      timers.current.push(window.setTimeout(() => setShowOffers(true), reasoningSteps.length * 250 + 200));
    }, 5000));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-[1.85fr_1fr] gap-6"
    >
      {/* LEFT — dashboard */}
      <div className="space-y-5">
        {/* Active goals / merchant rules */}
        <div className="rounded-[12px] bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 p-4 flex items-center gap-4">
          <div className="h-9 w-9 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center text-base shrink-0">
            📋
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-semibold tracking-tight">Active goals</h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">3 rules</span>
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Fill quiet hours <span className="text-border-strong">·</span> Max 25% discount <span className="text-border-strong">·</span> Pastry surplus priority
            </p>
          </div>
          <button className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors flex items-center justify-center shrink-0">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Kpi label="Customers in 1.5km" value="1,247" delta="+4.2%" icon={Users} />
          <Kpi label="Active buyers" value="312" delta="+1.8%" icon={TrendingUp} />
          <Kpi label="Avg basket" value="€18.40" delta="+€0.60" icon={ShoppingBasket} />
          <Kpi label="This week pushed" value="12 offers" delta="3 active" neutral icon={Send} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard title="Customer segments" subtitle="6 cohorts · last 30d">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={segmentsData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                  {segmentsData.map((_, i) => <Cell key={i} fill={SEG_COLORS[i]} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <Legend items={segmentsData.map((s, i) => ({ name: s.name, color: SEG_COLORS[i], value: s.value }))} />
          </ChartCard>

          <ChartCard title="Time-of-day demand" subtitle="Visits per hour">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={hourlyData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.27 0.006 285)" vertical={false} />
                <XAxis dataKey="h" tick={{ fill: "oklch(0.71 0.01 285)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.71 0.01 285)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "oklch(0.62 0.22 295 / 0.08)" }} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                  {hourlyData.map((d, i) => (
                    <Cell key={i} fill={d.v > 130 ? "#8B5CF6" : "oklch(0.62 0.22 295 / 0.45)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Weekly traffic" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={weeklyData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.27 0.006 285)" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "oklch(0.71 0.01 285)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.71 0.01 285)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <defs>
                  <linearGradient id="lg" x1="0" x2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="v" stroke="url(#lg)" strokeWidth={2.5} dot={{ r: 3, fill: "#8B5CF6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Category mix" subtitle="Share of revenue">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                  {categoryData.map((_, i) => <Cell key={i} fill={SEG_COLORS[i]} />)}
                </Pie>
                <Tooltip content={<ChartTip suffix="%" />} />
              </PieChart>
            </ResponsiveContainer>
            <Legend items={categoryData.map((s, i) => ({ name: s.name, color: SEG_COLORS[i], value: `${s.value}%` }))} />
          </ChartCard>
        </div>
      </div>

      {/* RIGHT — voice */}
      <div className="rounded-[12px] bg-card border border-border p-6 flex flex-col h-fit min-h-[560px]">
        <div className="flex flex-col items-center pt-4">
          <button
            onClick={handleMic}
            className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-200 ${
              micState === "idle" || micState === "done"
                ? "bg-gradient-to-br from-primary to-primary-glow animate-pulse-ring"
                : micState === "listening"
                ? "bg-destructive animate-pulse-red"
                : "bg-surface-elevated border border-border"
            }`}
          >
            {micState === "thinking" ? (
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            ) : (
              <Mic className="h-7 w-7 text-primary-foreground" />
            )}
          </button>
          <p className="mt-5 text-[13.5px] font-medium">
            {micState === "idle" && "Tell me what to push this week"}
            {micState === "listening" && <span className="text-destructive">Listening…</span>}
            {micState === "thinking" && <span className="text-muted-foreground">Analyzing 1,247 wallets…</span>}
            {micState === "done" && "Reasoning complete"}
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {micState === "idle" ? "Tap the mic to speak" : "Powered by Spend DNA engine"}
          </p>
        </div>

        {/* transcript */}
        <AnimatePresence>
          {micState === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6 self-end max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/30 px-3.5 py-2.5"
            >
              <div className="text-[10px] uppercase tracking-wider text-primary mb-1">Transcript · FR</div>
              <p className="text-[13px] leading-snug">"J'ai 50 viennoiseries qui restent demain matin"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* reasoning */}
        <div className="mt-5 flex-1">
          {micState === "idle" || micState === "listening" ? (
            <div className="h-full min-h-[140px] rounded-[12px] border border-dashed border-border flex items-center justify-center text-center px-6">
              <p className="text-[12.5px] text-muted-foreground">Your reasoning trail and offers will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Reasoning trail</div>
              {reasoningSteps.slice(0, streamed).map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 text-[12.5px]"
                >
                  <span className="text-success mt-[1px]">✓</span>
                  <span className="text-foreground/90">{s}</span>
                </motion.div>
              ))}
              {micState === "thinking" && (
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> thinking…
                </div>
              )}
            </div>
          )}
        </div>

        {/* offer variants */}
        <AnimatePresence>
          {showOffers && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 space-y-2.5"
            >
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Offer variants</div>
              {offerVariants.map((o, i) => (
                <motion.div
                  key={o.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="rounded-[12px] border border-border bg-surface-elevated/60 p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-medium text-primary">{o.label}</span>
                    <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground">{o.tag}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-snug">{o.text}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px]">
                    <span className="text-muted-foreground">Proj. <span className="text-foreground tabular-nums">{o.redemptions}</span> redemptions</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-success tabular-nums">{o.revenue}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          disabled={!showOffers}
          className={`mt-5 w-full h-10 rounded-[8px] text-[13.5px] font-medium border transition-all duration-200 ${
            showOffers
              ? "bg-surface-elevated border-primary/40 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
              : "bg-surface border-border text-muted-foreground/60 cursor-not-allowed"
          }`}
        >
          Generate Brief
        </button>
      </div>
    </motion.div>
  );
}

function Kpi({ label, value, delta, icon: Icon, neutral }: {
  label: string; value: string; delta: string; icon: React.ComponentType<{ className?: string }>; neutral?: boolean;
}) {
  return (
    <div className="rounded-[12px] bg-card border border-border p-4 hover:border-border-strong transition-colors duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-muted-foreground">{label}</span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="mt-2 text-[24px] font-semibold tracking-tight tabular-nums">{value}</div>
      <div className={`mt-1 text-[11px] ${neutral ? "text-muted-foreground" : "text-success"}`}>{delta}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-card border border-border p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-[13px] font-medium">{title}</h4>
        <span className="text-[10.5px] text-muted-foreground">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

function ChartTip({ active, payload, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-md bg-background border border-border-strong px-2.5 py-1.5 text-[11.5px] shadow-xl">
      <div className="text-muted-foreground">{p.name || p.payload?.name || p.payload?.h || p.payload?.d}</div>
      <div className="text-foreground font-medium tabular-nums">{p.value}{suffix}</div>
    </div>
  );
}

function Legend({ items }: { items: { name: string; color: string; value: number | string }[] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-2 text-[11px]">
          <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
          <span className="text-muted-foreground truncate flex-1">{it.name}</span>
          <span className="text-foreground tabular-nums">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
