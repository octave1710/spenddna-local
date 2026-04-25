import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/spend-dna/Header";
import { ContextBar } from "@/components/spend-dna/ContextBar";
import { CitizenView } from "@/components/spend-dna/CitizenView";
import { MerchantView } from "@/components/spend-dna/MerchantView";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Spend DNA — Hyperlocal commerce powered by bank data" },
      { name: "description", content: "Spend DNA turns Sparkasse transaction data into hyperlocal offers for citizens and AI-driven audience intelligence for merchants." },
    ],
  }),
});

function Index() {
  const [mode, setMode] = useState<"citizen" | "merchant">("citizen");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header mode={mode} onChange={setMode} />
      <ContextBar />
      <AnimatePresence mode="wait">
        {mode === "citizen" ? <CitizenView key="c" /> : <MerchantView key="m" />}
      </AnimatePresence>
    </div>
  );
}
