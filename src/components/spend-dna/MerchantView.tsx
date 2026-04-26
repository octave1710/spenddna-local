import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { Mic, Loader2, Users, ShoppingBasket, Send, TrendingUp, Pencil, Flame, Sparkles, Clock } from "lucide-react";
import { getMerchants, generateMerchantOffers, type Merchant, type OfferVariant } from "@/lib/merchantEngine";
import { speakText } from "@/lib/elevenlabs";
import { getOpenAI } from "@/lib/openai";
import { TodaysDecision } from "./TodaysDecision";
import { MerchantInsightCards } from "./MerchantInsightCards";

// ─── Chart data (left panel — unchanged) ────────────────────────────────────

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

// ─── Module-level merchant list (parsed once from CSV) ───────────────────────

const MERCHANTS = getMerchants();

// ─── Conversation history types + helpers ────────────────────────────────────

interface ConversationHistoryItem {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── MediaRecorder MIME type helper ─────────────────────────────────────────

function getBestMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

// ─── MicState ────────────────────────────────────────────────────────────────

type MicState = "idle" | "listening" | "transcribing" | "thinking" | "done";

// ─── Main component ──────────────────────────────────────────────────────────

export function MerchantView() {
  const [micState, setMicState] = useState<MicState>("idle");
  const [streamed, setStreamed] = useState<number>(0);
  const [showOffers, setShowOffers] = useState(false);

  // Conversation history — persists across turns, max 6 items (3 exchanges)
  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);

  // Dynamic data from LLM
  const [reasoningBullets, setReasoningBullets] = useState<string[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<OfferVariant[]>([]);
  const [recommendedVariant, setRecommendedVariant] = useState<"factual" | "emotional" | "urgent" | null>(null);
  const [recommendationReasoning, setRecommendationReasoning] = useState("");
  const [transcript, setTranscript] = useState("");

  // Text input — always available, also auto-shown on whisper fail
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState("");
  // Voice mute: true = skip ElevenLabs (default for dev/testing; flip for demo)
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false); // ref so runOfferGeneration reads live value

  // Merchant selector
  const [selectedMerchantId, setSelectedMerchantId] = useState<number>(MERCHANTS[0]?.merchant_id ?? 1);

  // Active Goals editable state
  const [goalsEditMode, setGoalsEditMode] = useState(false);
  const [rules, setRules] = useState(["Fill quiet hours", "Max 25% discount", "Pastry surplus priority"]);
  const [rulesDraft, setRulesDraft] = useState<string[]>([]);
  const [suggestedRules, setSuggestedRules] = useState<string[] | null>(null);
  const [goalsSaveToast, setGoalsSaveToast] = useState(false);
  const selectedMerchant: Merchant =
    MERCHANTS.find((m) => m.merchant_id === selectedMerchantId) ?? MERCHANTS[0];

  // Refs
  const timers = useRef<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  useEffect(() => () => reset(), []);

  // ── Offer generation (called after transcription or text submit) ────────────
  const runOfferGeneration = async (text: string) => {
    setMicState("thinking");
    setStreamed(0);
    setShowOffers(false);
    setReasoningBullets([]);
    setGeneratedVariants([]);
    setRecommendedVariant(null);
    setRecommendationReasoning("");

    try {
      // Snapshot history at call time (excludes current turn — it's the new user message)
      const historySnapshot = conversationHistory
        .slice(-6)
        .map(({ role, content }) => ({ role, content }));

      const result = await generateMerchantOffers(text, selectedMerchant, historySnapshot);

      // Append this exchange to history (trim to 6 items = 3 exchanges)
      setConversationHistory((prev) =>
        [
          ...prev,
          { role: "user" as const, content: text, timestamp: new Date() },
          { role: "assistant" as const, content: result.voice_response_text, timestamp: new Date() },
        ].slice(-6),
      );

      setReasoningBullets(result.reasoning_bullets);
      setGeneratedVariants(result.offer_variants);
      setRecommendedVariant(result.recommended_variant);
      setRecommendationReasoning(result.recommendation_reasoning);
      setMicState("done");

      // Stream bullets 250 ms apart
      result.reasoning_bullets.forEach((_, i) => {
        timers.current.push(
          window.setTimeout(() => setStreamed(i + 1), i * 250),
        );
      });
      // Show offer cards after all bullets
      timers.current.push(
        window.setTimeout(
          () => setShowOffers(true),
          result.reasoning_bullets.length * 250 + 200,
        ),
      );

      // ElevenLabs TTS — skipped when muted; reads live ref to handle mid-async toggle
      if (!isMutedRef.current && result.voice_response_text) {
        console.log("Playing voice:", result.voice_response_text.length, "chars");
        speakText(result.voice_response_text)
          .then((audio) => {
            audioRef.current = audio;
            audio.play().catch((e) => console.error("audio.play() failed:", e));
          })
          .catch((e) => console.error("speakText() failed:", e));
      } else {
        console.log("Voice skipped — muted:", isMutedRef.current, "· text length:", result.voice_response_text?.length ?? 0);
      }
    } catch (err) {
      console.error("GPT-4o error:", err);
      setMicState("idle");
    }
  };

  // ── Mic button handler ────────────────────────────────────────────────────
  const handleMic = async () => {
    // Always cancel any audio that is currently playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Second click while recording → stop and transcribe
    if (micState === "listening") {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (micState !== "idle" && micState !== "done") return;

    // Reset previous results
    reset();
    setStreamed(0);
    setShowOffers(false);
    setReasoningBullets([]);
    setGeneratedVariants([]);
    setTranscript("");
    setInputText("");
    // showTextInput is a user preference — not reset between sessions

    // Check MediaRecorder support; fall back to text input if unavailable
    if (typeof MediaRecorder === "undefined") {
      setShowTextInput(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getBestMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Release the mic immediately
        stream.getTracks().forEach((t) => t.stop());

        const fileType = mimeType.split(";")[0] || "audio/webm";
        const ext = fileType.includes("ogg") ? ".ogg" : ".webm";
        const blob = new Blob(audioChunksRef.current, { type: fileType });

        setMicState("transcribing");

        try {
          const openai = getOpenAI();
          const result = await openai.audio.transcriptions.create({
            file: new File([blob], `recording${ext}`, { type: fileType }),
            model: "whisper-1",
          });

          const text = result.text.trim();
          if (!text) {
            // Empty transcript — show text input
            setShowTextInput(true);
            setMicState("idle");
            return;
          }

          setTranscript(text);
          await runOfferGeneration(text);
        } catch (err) {
          console.error("Whisper error:", err);
          setShowTextInput(true);
          setMicState("idle");
        }
      };

      recorder.start(250);
      setMicState("listening");
    } catch (err) {
      console.error("Microphone error:", err);
      setShowTextInput(true);
      setMicState("idle");
    }
  };

  // ── Text input submit (works for both manual toggle and auto-shown on fail) ─
  const handleTextSubmit = async () => {
    const text = inputText.trim();
    if (!text) return;
    setTranscript(text);
    setInputText("");
    await runOfferGeneration(text);
  };

  const isSpinning = micState === "transcribing" || micState === "thinking";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-[1440px] mx-auto px-6 py-6 space-y-5"
    >
      {/* TODAY'S DECISION — full width */}
      <TodaysDecision merchant={selectedMerchant} />

      {/* 3 INSIGHT CARDS — full width, 3 columns */}
      <MerchantInsightCards />

      {/* MAIN GRID — dashboard + voice panel */}
      <div className="grid grid-cols-[1.85fr_1fr] gap-6">

      {/* LEFT — dashboard (unchanged) */}
      <div className="space-y-5">
        {goalsEditMode ? (
          <div className="rounded-[12px] bg-card border border-primary/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px]">📋</span>
              <h4 className="text-[13px] font-semibold tracking-tight">Edit active goals</h4>
            </div>
            <div className="space-y-2">
              {rulesDraft.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={rule}
                    onChange={(e) => {
                      const next = [...rulesDraft];
                      next[i] = e.target.value;
                      setRulesDraft(next);
                    }}
                    className="flex-1 h-8 px-2.5 rounded-[6px] text-[12.5px] bg-surface-elevated border border-border focus:border-primary/60 focus:outline-none text-foreground"
                  />
                  <button
                    onClick={() => setRulesDraft(rulesDraft.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive transition-colors text-[13px] shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setRulesDraft([...rulesDraft, ""])}
              className="text-[12px] text-primary hover:text-primary-glow transition-colors"
            >
              + Add rule
            </button>
            <div className="pt-1">
              <button
                onClick={() =>
                  setSuggestedRules([
                    "Boost Saturday mornings (23% higher conversion)",
                    "Avoid Sunday discounts (low foot traffic offsets margins)",
                  ])
                }
                className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
              >
                ✨ Suggest based on my data
              </button>
            </div>
            <AnimatePresence>
              {suggestedRules && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-1.5"
                >
                  {suggestedRules.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-[6px] bg-primary/5 border border-primary/15">
                      <span className="text-[11.5px] flex-1 text-foreground/90">{s}</span>
                      <button
                        onClick={() => {
                          setRulesDraft([...rulesDraft, s]);
                          setSuggestedRules(suggestedRules.filter((_, j) => j !== i));
                        }}
                        className="text-[11px] text-primary hover:text-primary-glow font-medium shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => { setGoalsEditMode(false); setSuggestedRules(null); }}
                className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setRules(rulesDraft.filter((r) => r.trim()));
                  setGoalsEditMode(false);
                  setSuggestedRules(null);
                  setGoalsSaveToast(true);
                  setTimeout(() => setGoalsSaveToast(false), 3500);
                }}
                className="h-8 px-4 rounded-[6px] text-[12.5px] font-medium bg-primary text-primary-foreground hover:bg-primary-glow transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[12px] bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 p-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center text-base shrink-0">
              📋
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-semibold tracking-tight">Active goals</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                  {rules.length} rules
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {rules.map((r, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-border-strong mx-1">·</span>}
                    {r}
                  </span>
                ))}
              </p>
            </div>
            <button
              onClick={() => { setGoalsEditMode(true); setRulesDraft([...rules]); setSuggestedRules(null); }}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors flex items-center justify-center shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Save toast */}
        <AnimatePresence>
          {goalsSaveToast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="fixed bottom-14 right-6 z-50 rounded-[10px] bg-card border border-success/30 px-4 py-3 shadow-2xl"
            >
              <div className="text-[13px] font-medium">Rules updated</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">
                This will influence today's decisions and tomorrow's recommendations
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* RIGHT — voice panel */}
      <div className="rounded-[12px] bg-card border border-border p-6 flex flex-col h-fit min-h-[560px]">

        {/* Merchant selector + mute toggle */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground shrink-0">Speaking as:</span>
          <select
            value={selectedMerchantId}
            onChange={(e) => setSelectedMerchantId(Number(e.target.value))}
            disabled={micState === "listening" || isSpinning}
            className="flex-1 h-8 rounded-md bg-surface-elevated border border-border text-[12.5px] px-2 text-foreground focus:outline-none focus:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {MERCHANTS.map((m) => (
              <option key={m.merchant_id} value={m.merchant_id}>
                {m.name} — {m.category}
              </option>
            ))}
          </select>
          <button
            title={isMuted ? "Voice off — click to enable" : "Voice on — click to mute"}
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              isMutedRef.current = next;
              if (next && audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
              }
            }}
            className={`shrink-0 h-8 px-2.5 rounded-md border text-[13px] transition-colors ${
              isMuted
                ? "bg-surface-elevated border-border text-muted-foreground hover:border-border-strong"
                : "bg-primary/15 border-primary/30 text-primary"
            }`}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Mic button */}
        <div className="flex flex-col items-center pt-2">
          <button
            onClick={handleMic}
            disabled={isSpinning}
            className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed ${
              micState === "idle" || micState === "done"
                ? "bg-gradient-to-br from-primary to-primary-glow animate-pulse-ring"
                : micState === "listening"
                ? "bg-destructive animate-pulse-red"
                : "bg-surface-elevated border border-border"
            }`}
          >
            {isSpinning ? (
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            ) : (
              <Mic className="h-7 w-7 text-primary-foreground" />
            )}
          </button>
          <p className="mt-5 text-[13.5px] font-medium">
            {micState === "idle" && "Tell me what to push this week"}
            {micState === "listening" && <span className="text-destructive">Listening… (tap to stop)</span>}
            {micState === "transcribing" && <span className="text-muted-foreground">Transcribing…</span>}
            {micState === "thinking" && <span className="text-muted-foreground">Analyzing 1,247 wallets…</span>}
            {micState === "done" && "Reasoning complete"}
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {micState === "idle" ? "Tap mic to speak, or type your goal" : "Powered by Spend DNA engine"}
          </p>
          {/* Always-visible text input toggle */}
          <button
            onClick={() => setShowTextInput((v) => !v)}
            className="mt-2.5 text-[11.5px] text-primary/60 hover:text-primary transition-colors"
          >
            {showTextInput ? "▲ hide text input" : "or type instead ↓"}
          </button>
        </div>

        {/* Chat history — previous completed turns (faded) + current in-flight turn */}
        {(conversationHistory.length > 0 ||
          ((micState === "done" || micState === "thinking" || micState === "transcribing") && transcript)) && (
          <div className="mt-5 flex flex-col gap-2">
            {/* Previous user turns — last 2, faded to show recency */}
            <AnimatePresence>
              {conversationHistory
                .filter((h) => h.role === "user")
                .slice(-2)
                .map((h) => (
                  <motion.div
                    key={h.timestamp.getTime()}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="self-end max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-elevated border border-border px-3.5 py-2 opacity-60"
                  >
                    <div className="text-[9.5px] text-muted-foreground/70 mb-0.5 tracking-wide">
                      {formatTime(h.timestamp)}
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-snug">"{h.content}"</p>
                  </motion.div>
                ))}
            </AnimatePresence>

            {/* Current in-flight transcript — full opacity, primary accent */}
            <AnimatePresence>
              {(micState === "done" || micState === "thinking" || micState === "transcribing") && transcript && (
                <motion.div
                  key="current"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="self-end max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/30 px-3.5 py-2.5"
                >
                  <div className="text-[10px] uppercase tracking-wider text-primary mb-1">
                    {conversationHistory.length > 0
                      ? `Turn ${Math.floor(conversationHistory.length / 2) + 1}`
                      : "Transcript"}
                  </div>
                  <p className="text-[13px] leading-snug">"{transcript}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reset conversation */}
            {conversationHistory.length > 0 && (
              <div className="flex justify-end mt-0.5">
                <button
                  onClick={() => {
                    setConversationHistory([]);
                    setTranscript("");
                  }}
                  className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  ↺ Reset conversation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text input — toggled by user OR auto-shown on whisper failure */}
        <AnimatePresence>
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                  placeholder="e.g. I have 50 croissants left for tomorrow…"
                  autoFocus
                  className="flex-1 h-9 rounded-[8px] bg-surface-elevated border border-border px-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!inputText.trim()}
                  className="h-9 px-4 rounded-[8px] bg-primary text-primary-foreground text-[12.5px] font-medium hover:bg-primary-glow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reasoning trail */}
        <div className="mt-5 flex-1">
          {micState === "idle" || micState === "listening" ? (
            <div className="h-full min-h-[140px] rounded-[12px] border border-dashed border-border flex items-center justify-center text-center px-6">
              <p className="text-[12.5px] text-muted-foreground">Tap mic or type your goal — reasoning and offers will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Reasoning trail</div>
              {reasoningBullets.slice(0, streamed).map((s, i) => (
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
              {isSpinning && (
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> thinking…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Offer variants — generative UI */}
        <AnimatePresence>
          {showOffers && generatedVariants.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Generated offers</div>
                <div className="text-[10.5px] text-muted-foreground">3 variants · pick one</div>
              </div>

              {generatedVariants.map((variant, i) => (
                <VariantCard
                  key={`${variant.style}-${i}`}
                  variant={variant}
                  index={i}
                  isRecommended={variant.style === recommendedVariant}
                />
              ))}

              {/* Agent's call */}
              {recommendationReasoning && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.36 }}
                  className="rounded-[10px] p-4 bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] uppercase tracking-wider text-primary font-medium">Agent's call</span>
                  </div>
                  <p className="text-[12.5px] text-foreground/90 leading-relaxed">{recommendationReasoning}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </div>
    </motion.div>
  );
}

// ─── Variant card — 3 visual styles matching widget_style ────────────────────

function VariantCard({ variant, index, isRecommended }: { variant: OfferVariant; index: number; isRecommended?: boolean }) {
  const label = ["A", "B", "C"][index] ?? String(index + 1);
  const delay = [0, 0.12, 0.24][index] ?? 0;

  if (variant.style === "factual") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay }}
        className="rounded-[10px] bg-white text-neutral-900 border border-neutral-200 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500">Variant {label} · Factual</span>
          <div className="flex items-center gap-1.5">
            {isRecommended && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/30 font-medium">⭐ Recommended</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-600 border border-neutral-200">Neutral</span>
          </div>
        </div>
        <h4 className="mt-2 text-[16px] font-semibold tracking-tight leading-tight">{variant.headline}</h4>
        <p className="mt-1 text-[12px] text-neutral-600">{variant.sub}</p>
        <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center text-[11px]">
          <div className="text-neutral-600">
            Est. <span className="text-neutral-900 font-medium tabular-nums">{variant.est_redemptions}</span> redemptions · <span className="text-neutral-900 font-medium tabular-nums">{variant.est_revenue}</span>
          </div>
        </div>
        <button className="mt-3 w-full h-9 rounded-[6px] bg-neutral-900 text-white text-[12.5px] font-medium hover:bg-neutral-800 transition-colors">
          Push variant {label}
        </button>
      </motion.div>
    );
  }

  if (variant.style === "emotional") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay }}
        className="rounded-[16px] p-4 relative overflow-hidden border border-warning/30"
        style={{
          background: "linear-gradient(135deg, oklch(0.78 0.16 75 / 0.35) 0%, oklch(0.7 0.18 50 / 0.25) 50%, oklch(0.62 0.22 295 / 0.15) 100%)",
        }}
      >
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-warning/30 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-warning font-medium flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Variant {label} · Emotional
            </span>
            <div className="flex items-center gap-1.5">
              {isRecommended && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/30 font-medium">⭐ Recommended</span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/40 backdrop-blur text-foreground border border-warning/30">Warm</span>
            </div>
          </div>
          <h4 className="mt-2.5 text-[17px] font-semibold tracking-tight leading-snug" style={{ fontFamily: "Georgia, serif" }}>
            {variant.headline}
          </h4>
          <p className="mt-1.5 text-[12px] text-foreground/80 italic">{variant.sub}</p>
          <div className="mt-3 pt-3 border-t border-warning/20 flex items-center text-[11px]">
            <div className="text-muted-foreground">
              Est. <span className="text-foreground font-medium tabular-nums">{variant.est_redemptions}</span> redemptions · <span className="text-warning font-medium tabular-nums">{variant.est_revenue}</span>
            </div>
          </div>
          <button className="mt-3 w-full h-9 rounded-full bg-warning text-background text-[12.5px] font-medium hover:brightness-110 transition-all shadow-[0_8px_20px_-8px_oklch(0.78_0.16_75)]">
            Push variant {label}
          </button>
        </div>
      </motion.div>
    );
  }

  // urgent
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="relative rounded-[10px] p-4 bg-gradient-to-br from-destructive/15 via-background to-primary/15 border-2 border-destructive/40"
    >
      <motion.div
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-[10px] border-2 border-destructive pointer-events-none"
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] text-destructive font-bold flex items-center gap-1.5">
            <Flame className="h-3 w-3" /> Variant {label} · Urgent
          </span>
          <div className="flex items-center gap-1.5">
            {isRecommended && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/30 font-medium">⭐ Recommended</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-destructive/20 text-destructive border border-destructive/40 font-mono uppercase tracking-wider">Scarcity</span>
          </div>
        </div>
        <h4 className="mt-2.5 text-[17px] font-bold tracking-tight leading-tight uppercase">
          {variant.headline}
        </h4>
        <p className="mt-2 text-[12px] text-foreground/80 flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-destructive" />
          {variant.sub}
        </p>
        <div className="mt-3 pt-3 border-t border-destructive/20 flex items-center text-[11px]">
          <div className="text-muted-foreground">
            Est. <span className="text-foreground font-medium tabular-nums">{variant.est_redemptions}</span> redemptions · <span className="text-success font-medium tabular-nums">{variant.est_revenue}</span>
          </div>
        </div>
        <button className="mt-3 w-full h-9 rounded-[6px] bg-destructive text-destructive-foreground text-[12.5px] font-bold uppercase tracking-wider hover:brightness-110 transition-all">
          Push variant {label}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Left-panel helpers (unchanged from Lovable scaffold) ────────────────────

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
