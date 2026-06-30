"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/* ── Types ────────────────────────────────────────────────────── */

/** Maps to Soroban escrow contract states (Created→Funded→Delivered→Released|Refunded). */
export type VaultSealState =
  | "created"
  | "funded"
  | "delivered"
  | "released"
  | "refunded";

export interface VaultSealProps {
  state: VaultSealState;
  /** Amount in stroops displayed inside the seal */
  amountStroops?: number;
  /** Optional class name */
  className?: string;
}

/* ── Helpers ──────────────────────────────────────────────────── */

function formatXLM(stroops: number): string {
  return (stroops / 10_000_000).toFixed(1);
}

function stateLabel(s: VaultSealState): string {
  switch (s) {
    case "created":
      return "Created";
    case "funded":
      return "Funds Locked";
    case "delivered":
      return "Delivered";
    case "released":
      return "Released";
    case "refunded":
      return "Refunded";
  }
}

function stateAccent(s: VaultSealState): string {
  switch (s) {
    case "created":
      return "var(--ink-dim, #8A8B96)";
    case "funded":
      return "var(--aurora-violet, #7C6CF0)";
    case "delivered":
      return "var(--aurora-teal, #3DE1C8)";
    case "released":
      return "var(--star-yellow, #FDDA24)";
    case "refunded":
      return "var(--ink-dim, #8A8B96)";
  }
}

function isLocked(s: VaultSealState): boolean {
  return s === "funded";
}

function isBroken(s: VaultSealState): boolean {
  return s === "released" || s === "refunded";
}

/* ── Lock shackle SVG ─────────────────────────────────────────── */

function LockShackle({
  locked,
  broken,
  animate,
  color,
}: {
  locked: boolean;
  broken: boolean;
  animate: boolean;
  color: string;
}) {
  const shouldReduce = useReducedMotion();
  const reallyAnimate = animate && !shouldReduce;

  return (
    <motion.svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="absolute -top-7 left-1/2 -translate-x-1/2"
      initial={reallyAnimate ? { y: -10, opacity: 0 } : {}}
      animate={locked ? { y: locked ? 0 : -10, opacity: locked ? 1 : 0 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Shackle arc */}
      <motion.path
        d="M28 38V24a12 12 0 0 1 24 0v14"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        animate={
          locked && reallyAnimate
            ? {
                pathLength: [0, 1],
                opacity: [0, 1],
              }
            : broken ? { pathLength: 1, opacity: 0.2 } : { pathLength: 1, opacity: 1 }
        }
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

/* ── Component ────────────────────────────────────────────────── */

/**
 * A glowing VaultSeal — the centerpiece of the escrow lifecycle.
 * Locks visibly when funds are deposited (funded state); breaks open when
 * escrow is released or refunded.
 */
export function VaultSeal({
  state,
  amountStroops,
  className,
}: VaultSealProps) {
  const shouldReduce = useReducedMotion();
  const [prevState, setPrevState] = useState<VaultSealState>(state);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (prevState !== state) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 1200);
      setPrevState(state);
      return () => clearTimeout(t);
    }
  }, [state, prevState]);

  const accent = stateAccent(state);
  const locked = isLocked(state);
  const broken = isBroken(state);
  const reallyAnimate = animating && !shouldReduce;

  return (
    <div
      role="status"
      aria-label={`Escrow vault: ${stateLabel(state)}`}
      className={cn("relative flex flex-col items-center", className)}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute -inset-12 rounded-full pointer-events-none"
        animate={
          locked
            ? { opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }
            : { opacity: 0.15 }
        }
        transition={
          locked
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
        style={{
          background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
        }}
      />

      {/* Lock shackle */}
      <LockShackle locked={locked} broken={broken} animate={animating} color={accent} />

      {/* Seal body */}
      <motion.div
        className="relative flex flex-col items-center justify-center rounded-full border-2"
        style={{
          width: "120px",
          height: "120px",
          borderColor: accent,
          backgroundColor: `${accent}0D`,
          boxShadow: `0 0 30px ${accent}1A, inset 0 0 30px ${accent}0D`,
        }}
        animate={
          reallyAnimate
            ? { scale: [1, 1.15, 0.95, 1] }
            : {}
        }
        transition={{ duration: 0.8, ease: [0.68, -0.55, 0.27, 1.55] }}
      >
        {/* Inner seal ring */}
        <motion.div
          className="absolute inset-2 rounded-full border"
          style={{ borderColor: accent, opacity: 0.3 }}
          animate={
            locked && !shouldReduce
              ? { rotate: [0, 360] }
              : { rotate: 0 }
          }
          transition={
            locked && !shouldReduce
              ? { duration: 20, repeat: Infinity, ease: "linear" }
              : {}
          }
        />

        {/* State icon */}
        <AnimatePresence mode="wait">
          {locked ? (
            <motion.svg
              key="lock"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reallyAnimate ? { scale: 0, opacity: 0 } : {}}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </motion.svg>
          ) : broken ? (
            <motion.svg
              key="unlock"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reallyAnimate ? { rotate: -10, scale: 0.5 } : {}}
              animate={{ rotate: 0, scale: 1 }}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </motion.svg>
          ) : (
            <motion.svg
              key="pending"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reallyAnimate ? { opacity: 0 } : {}}
              animate={{ opacity: 1 }}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Amount */}
        {amountStroops != null && (
          <motion.div
            className="font-mono text-sm font-bold mt-1"
            style={{ color: "var(--ink, #F5F3EC)" }}
            animate={reallyAnimate ? { opacity: [0, 1] } : {}}
            transition={{ delay: 0.3 }}
          >
            {formatXLM(amountStroops)} XLM
          </motion.div>
        )}
      </motion.div>

      {/* State label */}
      <motion.div
        className="mt-4 text-center"
        animate={reallyAnimate ? { opacity: [0, 1], y: [5, 0] } : {}}
      >
        <div
          className="font-display text-sm font-semibold uppercase tracking-[0.15em]"
          style={{
            fontFamily: "var(--font-heading)",
            color: accent,
          }}
        >
          {stateLabel(state)}
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.2em] mt-0.5"
          style={{ color: "var(--ink-dim, #8A8B96)" }}
        >
          {locked
            ? "Secured by Soroban"
            : broken
            ? "Escrow complete"
            : "Awaiting deposit"}
        </div>
      </motion.div>
    </div>
  );
}
