import { motion } from "framer-motion";

type Mode = "citizen" | "merchant";

export function Header({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <header className="h-[60px] border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="h-full max-w-[1440px] mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight">Spend DNA</span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center bg-surface border border-border rounded-full p-1">
            {(["citizen", "merchant"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onChange(m)}
                className="relative px-5 py-1.5 text-[13px] font-medium rounded-full transition-colors duration-200"
              >
                {mode === m && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={`relative z-10 ${mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {m === "citizen" ? "Citizen View" : "Merchant View"}
                </span>
              </button>
            ))}
          </div>

          {/* DEMO MODE badge — hover for production context */}
          <div className="group relative">
            <span className="cursor-default select-none rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] border border-[#8B5CF6]/50 text-[#8B5CF6]/60 transition-colors duration-150 group-hover:border-[#8B5CF6]/80 group-hover:text-[#8B5CF6]/90">
              Demo
            </span>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 w-[300px] -translate-x-1/2 rounded-lg border border-border bg-background px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              In production, citizens and merchants access separate interfaces — Sparkasse app for citizens, B2B portal for merchants.
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-[12px] text-muted-foreground">Sparkasse · Stuttgart</span>
          <span className="text-success text-[12px]">✓</span>
        </div>
      </div>
    </header>
  );
}
