"use client";

import { motion } from "motion/react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Spotlight } from "@/components/ui/spotlight-new";
import { useReputation } from "@/hooks/useReputation";
import { PassportPage } from "@/components/travel/passport-stamp";
import { StarField } from "@/components/travel/star-field";
import { DepartureBoard } from "@/components/travel/departure-board";
import type { PassportStampProps } from "@/components/travel/passport-stamp";
import { ReputationSkeleton } from "@/components/Skeletons";

function parseCountry(description: string): string {
  const parts = description.split(" — ");
  if (parts.length < 2) return "??";
  const route = parts[1].trim();
  const routeParts = route.split(" to ");
  return routeParts.length === 2 ? routeParts[1].trim() : route.split(" ").pop() ?? "??";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_MAP: Record<string, string> = {
  "released": "DELIVERED",
  "delivered": "DELIVERED",
  "refunded": "REFUNDED",
};

export function ReputationContent() {
  const { data, isLoading, error, refresh } = useReputation();

  if (error) {
    return (
      <div className="relative min-h-screen flex-1 overflow-hidden" style={{ backgroundColor: "var(--space-900, #05060A)" }}>
        <StarField starCount={30} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.08 }} />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border p-12"
            style={{
              borderColor: "rgba(239,68,68,0.2)",
              backgroundColor: "rgba(239,68,68,0.04)",
            }}
            role="alert"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4"
              style={{ color: "rgba(239,68,68,0.4)" }}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <h2 className="text-xl font-semibold" style={{ color: "var(--ink-dim, #8A8B96)" }}>Failed to load reputation</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.6 }}>{error}</p>
            <button
              onClick={refresh}
              className="mt-6 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
              style={{
                borderColor: "var(--hairline, rgba(255,255,255,0.08))",
                color: "var(--ink-dim, #8A8B96)",
                backgroundColor: "var(--space-800, #0A0B12)",
              }}
            >
              Try again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ReputationSkeleton />;
  }

  if (!data) {
    return (
      <div className="relative min-h-screen flex-1 overflow-hidden" style={{ backgroundColor: "var(--space-900, #05060A)" }}>
        <StarField starCount={30} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.08 }} />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-2xl border p-12"
            style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--star-yellow, #FDDA24)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4 opacity-40"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <h2 className="text-xl font-semibold" style={{ color: "var(--ink-dim, #8A8B96)" }}>No reputation data available</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>
              Complete deliveries to build your on-chain reputation.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  const { address, score, completedDeliveries, history } = data;

  const stamps: PassportStampProps[] = history.map((item) => ({
    country: parseCountry(item.description),
    date: formatDate(item.createdAt),
    status: STATUS_MAP[item.status] ?? "DELIVERED",
    amountStroops: item.amountStroops,
    counterparty: item.counterparty,
  }));

  const earnedAmount = (
    history
      .filter((h) => h.status !== "refunded")
      .reduce((sum, h) => sum + h.amountStroops, 0) /
    10_000_000
  ).toFixed(1);

  const boardRows = [
    { label: "SCORE", value: `  ${score}/100` },
    { label: "DELIVERIES", value: `${completedDeliveries}` },
    { label: "EARNED", value: `${earnedAmount} XLM` },
  ];

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden" style={{ backgroundColor: "var(--space-900, #05060A)" }}>
      <StarField starCount={40} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.12 }} />
      <Spotlight />
      <BackgroundBeams className="pointer-events-none opacity-[0.04]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-14">
        {/* ————— Header ————— */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="relative mx-auto mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: "var(--star-yellow-dim, rgba(253,218,36,0.4))",
              backgroundColor: "var(--star-yellow-dim, rgba(253,218,36,0.08))",
              color: "var(--star-yellow, #FDDA24)",
              boxShadow: "0 0 24px var(--star-yellow-dim, rgba(253,218,36,0.09)), inset 0 0 12px var(--star-yellow-dim, rgba(253,218,36,0.03))",
            }}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <motion.span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: "var(--star-yellow, #FDDA24)",
                boxShadow: "0 0 8px var(--star-yellow, rgba(253,218,36,0.5))",
              }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            Traveler Profile
          </motion.div>

          <motion.h1
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-heading)", color: "var(--ink, #F5F3EC)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <span
              className="bg-gradient-to-r from-white via-[#FDE047] to-[#FDDA24] bg-clip-text text-transparent"
              style={{ textShadow: "0 0 80px rgba(253,218,36,0.25)" }}
            >
              Reputation
            </span>
          </motion.h1>
        </motion.div>

        {/* ————— Departure Board Stats ————— */}
        <motion.div
          className="mb-10 flex justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <DepartureBoard rows={boardRows} />
        </motion.div>

        {/* ————— Passport Page ————— */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-48px" }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <PassportPage
            stamps={stamps}
            owner={address}
            score={score}
          />
        </motion.div>
      </div>
    </div>
  );
}
