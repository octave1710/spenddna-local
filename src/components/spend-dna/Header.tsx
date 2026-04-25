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

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-[12px] text-muted-foreground">Sparkasse account connected</span>
          <span className="text-success text-[12px]">✓</span>
        </div>
      </div>
    </header>
  );
}
