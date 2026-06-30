"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

type Step = {
  title: string;
  description: string;
  icon: string;
  content: string;
};

const STEPS: Step[] = [
  {
    title: "Connect Wallet",
    description: "Install Freighter & connect to Stellar Testnet",
    icon: "🔗",
    content: "Get the Freighter browser extension from freighter.app, set it to Testnet, and fund your wallet with test XLM via Friendbot at laboratory.stellar.org.",
  },
  {
    title: "Post a Request",
    description: "Tell travelers what you need from abroad",
    icon: "📦",
    content: "Go to the Post page to create a delivery request. Enter the origin and destination countries, item weight, reward amount, and deadline. Your request appears as a boarding pass.",
  },
  {
    title: "Match & Escrow",
    description: "Find a traveler and lock funds in escrow",
    icon: "🤝",
    content: "Use the Match page to find the best traveler for your request. The Escrow page shows the full lifecycle — funds are locked in a Soroban smart contract on Stellar testnet until delivery is confirmed.",
  },
];

type OnboardingWizardProps = {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
};

export function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    setStep(0);
    setDirection(1);
  }, [open]);

  const current = STEPS[step];
  if (!current) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg pb-safe sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:pb-0"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div
              className="relative mx-4 rounded-2xl border p-6 shadow-2xl sm:mx-0 sm:w-[420px]"
              style={{
                borderColor: "var(--hairline, rgba(255,255,255,0.08))",
                backgroundColor: "var(--space-800, #0A0B12)",
              }}
            >
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-6">
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 rounded-full"
                    style={{
                      backgroundColor: i <= step ? "var(--star-yellow, #FDDA24)" : "var(--hairline, rgba(255,255,255,0.08))",
                    }}
                    animate={{ width: i === step ? 24 : 8 }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 30 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl">{current.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--ink, #F5F3EC)" }}>
                        {current.title}
                      </h3>
                      <p className="text-[11px]" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                        {current.description}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                    {current.content}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="text-xs font-medium"
                  style={{ color: "var(--ink-dim, #8A8B96)" }}
                >
                  Skip
                </button>
                <div className="flex gap-2">
                  {step > 0 && (
                    <button
                      onClick={() => { setDirection(-1); setStep(step - 1); }}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      style={{
                        borderColor: "var(--hairline, rgba(255,255,255,0.08))",
                        color: "var(--ink-dim, #8A8B96)",
                      }}
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (step < STEPS.length - 1) {
                        setDirection(1);
                        setStep(step + 1);
                      } else {
                        onComplete();
                      }
                    }}
                    className="rounded-lg px-4 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--star-yellow, #FDDA24)",
                      color: "var(--space-900, #05060A)",
                    }}
                  >
                    {step === STEPS.length - 1 ? "Get Started" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function OnboardingTrigger() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const val = localStorage.getItem("onboarding-complete");
    if (val === "true") setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-lg",
        )}
        style={{
          borderColor: "var(--star-yellow-dim, rgba(253,218,36,0.25))",
          backgroundColor: "var(--space-800, #0A0B12)",
          color: "var(--star-yellow, #FDDA24)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(253,218,36,0)",
            "0 0 0 8px rgba(253,218,36,0)",
            "0 0 0 0 rgba(253,218,36,0)",
          ],
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <span>🚀</span>
        <span>Quick Tour</span>
      </motion.button>

      <OnboardingWizard
        open={open}
        onClose={() => setOpen(false)}
        onComplete={() => {
          setOpen(false);
          setDismissed(true);
          localStorage.setItem("onboarding-complete", "true");
        }}
      />
    </>
  );
}
