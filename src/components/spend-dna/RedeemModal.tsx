import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Check, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onRedeem: () => void;
}

export function RedeemModal({ open, onClose, onRedeem }: Props) {
  const [stage, setStage] = useState<"qr" | "success">("qr");
  const [seconds, setSeconds] = useState(12 * 60);

  // reset on open
  useEffect(() => {
    if (open) {
      setStage("qr");
      setSeconds(12 * 60);
    }
  }, [open]);

  // countdown
  useEffect(() => {
    if (!open || stage !== "qr") return;
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [open, stage]);

  // auto close after success
  useEffect(() => {
    if (stage !== "success") return;
    const id = window.setTimeout(onClose, 2000);
    return () => clearTimeout(id);
  }, [stage, onClose]);

  const handleRedeem = () => {
    onRedeem();
    setStage("success");
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[420px] max-w-[92vw] rounded-[16px] bg-card border border-border-strong shadow-2xl overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {stage === "qr" ? (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="p-7"
                >
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-success">● Live offer</div>
                    <h2 className="mt-2 text-[20px] font-semibold tracking-tight">Offer activated</h2>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">Café Müller · 80m away</p>
                  </div>

                  <div className="mt-5 flex justify-center">
                    <div className="p-3 rounded-[12px] bg-white">
                      <QRCodeSVG
                        value="CITYWALLET-MIA-CAFEMULLER-2026-04-25"
                        size={180}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#0A0A0B"
                      />
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Valid for</div>
                    <div className="mt-1 text-[28px] font-semibold tracking-tight tabular-nums text-foreground">
                      {mm}:{ss}
                    </div>
                    <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed">
                      Show this at checkout — <span className="text-success font-medium">€1.70 cashback</span> to your Sparkasse account
                    </p>
                  </div>

                  <button
                    onClick={handleRedeem}
                    className="mt-5 w-full h-11 rounded-[8px] bg-primary hover:bg-primary-glow text-primary-foreground text-[13.5px] font-medium transition-all duration-200 shadow-[0_8px_24px_-8px_var(--primary)]"
                  >
                    Mark as redeemed
                  </button>
                  <button
                    onClick={onClose}
                    className="mt-2 w-full text-center text-[12.5px] text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.05 }}
                    className="mx-auto h-20 w-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center relative"
                  >
                    <motion.span
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full bg-success/30"
                    />
                    <Check className="h-10 w-10 text-success" strokeWidth={2.6} />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="mt-5 text-[19px] font-semibold tracking-tight"
                  >
                    Redeemed at Café Müller
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26 }}
                    className="mt-1.5 text-[13px] text-muted-foreground"
                  >
                    <span className="text-success font-medium">€1.70</span> credited to your Sparkasse account
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
