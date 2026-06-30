"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/* ── PassportStamp ────────────────────────────────────────────── */

export interface PassportStampProps {
  /** Country code (e.g. TR, DE) */
  country: string;
  /** Date string */
  date: string;
  /** Random rotation offset (-15 to 15 degrees) */
  rotation?: number;
  /** Stamp text line (e.g. "DELIVERED", "APPROVED") */
  status?: string;
  /** Amount in stroops */
  amountStroops?: number;
  /** Counterparty address (shown truncated) */
  counterparty?: string;
  /** Whether to animate the stamp "thunk" on mount */
  animate?: boolean;
  className?: string;
}

function formatXLM(stroops: number): string {
  return (stroops / 10_000_000).toFixed(1);
}

/**
 * A passport stamp — ink-textured, rotated, with a "thunk" animation
 * when a delivery confirms. Stamps carry country, date, status, and
 * counterparty info.
 */
export function PassportStamp({
  country,
  date,
  rotation,
  status = "DELIVERED",
  amountStroops,
  counterparty,
  animate = true,
  className,
}: PassportStampProps) {
  const shouldReduce = useReducedMotion();
  const [stamped, setStamped] = useState(!animate);
  const reallyAnimate = animate && !shouldReduce;

  const handleClick = useCallback(() => {
    if (!stamped) setStamped(true);
  }, [stamped]);

  useEffect(() => {
    if (!reallyAnimate) {
      setStamped(true);
      return;
    }
    const timer = setTimeout(() => setStamped(true), 300);
    return () => clearTimeout(timer);
  }, [reallyAnimate]);

  const rot = rotation ?? ((Math.random() * 20) - 10);

  return (
    <motion.div
      role="img"
      aria-label={`Passport stamp: ${country} ${status} ${date}`}
      className={cn("relative inline-flex cursor-pointer select-none", className)}
      onClick={handleClick}
      initial={
        reallyAnimate
          ? { scale: 1.8, rotate: rot, opacity: 0 }
          : { scale: 1, rotate: rot, opacity: 1 }
      }
      animate={stamped ? { scale: 1, rotate: rot, opacity: 1 } : {}}
      transition={
        reallyAnimate
          ? {
              duration: 0.6,
              ease: [0.68, -0.55, 0.27, 1.55],
              times: [0, 0.6, 0.85, 1],
            }
          : { duration: 0.01 }
      }
    >
      {/* Ink texture ring */}
      <div
        className="relative rounded-full border-2 p-4 min-w-[120px] min-h-[120px] flex flex-col items-center justify-center gap-1 text-center"
        style={{
          borderColor: "var(--aurora-violet, #7C6CF0)",
          backgroundColor: "rgba(124, 108, 240, 0.06)",
          boxShadow: "inset 0 0 30px rgba(124, 108, 240, 0.08)",
          // Ink bleed effect
          filter: "url(#passport-ink-bleed)",
        }}
      >
        {/* Country code — large */}
        <div
          className="font-display text-xl font-bold tracking-widest leading-tight"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--aurora-violet, #7C6CF0)",
            textShadow: "0 0 6px rgba(124, 108, 240, 0.3)",
          }}
        >
          {country}
        </div>

        {/* Status */}
        <div
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: "var(--ink-dim, #8A8B96)" }}
        >
          {status}
        </div>

        {/* Date */}
        <div
          className="text-[9px] uppercase tracking-widest"
          style={{ color: "var(--ink-dim, #8A8B96)" }}
        >
          {date}
        </div>

        {/* Amount */}
        {amountStroops != null && (
          <div
            className="text-[9px] font-mono font-semibold mt-0.5"
            style={{ color: "var(--star-yellow, #FDDA24)" }}
          >
            {formatXLM(amountStroops)} XLM
          </div>
        )}

        {/* Counterparty */}
        {counterparty && (
          <div
            className="text-[8px] font-mono mt-0.5 truncate max-w-[100px]"
            style={{ color: "var(--ink-dim, #8A8B96)" }}
          >
            {counterparty.slice(0, 4)}…{counterparty.slice(-4)}
          </div>
        )}
      </div>

      {/* Ink bleed SVG filter (hidden) */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="passport-ink-bleed">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
}

/* ── PassportPage ─────────────────────────────────────────────── */

export interface PassportPageProps {
  /** Array of stamp data */
  stamps: PassportStampProps[];
  /** Passport owner name */
  owner?: string;
  /** Reputation score */
  score?: number;
  className?: string;
}

/**
 * A passport page that collects passport stamps — used for reputation
 * and delivery history. Stamps are laid out on a paper-textured page
 * with a faint grid pattern.
 */
export function PassportPage({
  stamps,
  owner,
  score,
  className,
}: PassportPageProps) {
  return (
    <div
      role="region"
      aria-label="Passport page"
      className={cn(
        "relative w-full max-w-md mx-auto rounded-xl overflow-hidden border border-hairline",
        className
      )}
      style={{
        backgroundColor: "var(--space-900, #05060A)",
      }}
    >
      {/* Paper texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.5) 1px, rgba(255,255,255,0.5) 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.5) 1px, rgba(255,255,255,0.5) 2px)`,
        }}
      />

      {/* Page header */}
      <div className="relative p-6 pb-3 border-b border-hairline">
        <div className="flex items-center justify-between">
          <div>
            <div
              className="font-display text-xs uppercase tracking-[0.3em]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--ink-dim, #8A8B96)",
              }}
            >
              StellarCarry
            </div>
            <div
              className="font-display text-lg font-bold tracking-tight mt-0.5"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--ink, #F5F3EC)",
              }}
            >
              Passport
            </div>
          </div>
          {score != null && (
            <div className="text-right">
              <div
                className="font-display text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--star-yellow, #FDDA24)",
                }}
              >
                {score}
              </div>
              <div
                className="text-[9px] uppercase tracking-[0.2em]"
                style={{ color: "var(--ink-dim, #8A8B96)" }}
              >
                Reputation
              </div>
            </div>
          )}
        </div>
        {owner && (
          <div
            className="mt-2 font-mono text-[11px]"
            style={{ color: "var(--ink-dim, #8A8B96)" }}
          >
            {owner}
          </div>
        )}
      </div>

      {/* Stamp grid */}
      <div className="relative p-6">
        {stamps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-dim, #8A8B96)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-40"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
            <span
              className="text-sm"
              style={{ color: "var(--ink-dim, #8A8B96)" }}
            >
              No stamps yet
            </span>
            <span
              className="text-xs mt-1"
              style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.6 }}
            >
              Complete a delivery to earn your first stamp
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stamps.map((stamp, i) => (
              <PassportStamp key={i} {...stamp} animate={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
