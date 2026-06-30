"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/* ── Split-flap cell ──────────────────────────────────────────── */

interface SplitFlapCellProps {
  value: string;
  prevValue: string;
  flipped: boolean;
  /** Monospace character width hint */
  charWidth?: "narrow" | "normal" | "wide";
}

function SplitFlapCell({ value, prevValue, flipped, charWidth = "normal" }: SplitFlapCellProps) {
  const shouldReduce = useReducedMotion();
  const widthClass =
    charWidth === "narrow"
      ? "w-[18px]"
      : charWidth === "wide"
      ? "w-[32px]"
      : "w-[24px]";

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center h-12 mx-px",
        widthClass
      )}
      style={{ perspective: "200px" }}
    >
      <motion.span
        className="absolute inset-0 flex items-center justify-center rounded-sm"
        style={{
          backgroundColor: "var(--space-700, #10131C)",
          color: "var(--ink, #F5F3EC)",
          fontFamily: "var(--font-mono)",
          fontSize: "1.25rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          border: "1px solid var(--hairline, rgba(255,255,255,0.08))",
          transformOrigin: "center center -0.5px",
          transformStyle: "preserve-3d",
        }}
        animate={
          flipped && !shouldReduce
            ? {
                rotateX: [0, -120, -120, 0],
                filter: [
                  "brightness(1)",
                  "brightness(0.4)",
                  "brightness(0.4)",
                  "brightness(1)",
                ],
              }
            : { rotateX: 0, filter: "brightness(1)" }
        }
        transition={
          flipped && !shouldReduce
            ? { duration: 0.45, times: [0, 0.45, 0.55, 1], ease: "easeInOut" }
            : { duration: 0.01 }
        }
        key={value + (flipped ? "-a" : "-b")}
      >
        {flipped ? prevValue : value}
      </motion.span>
      {/* Shadow line at center */}
      <span
        className="absolute inset-x-0 top-1/2 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(0,0,0,0.4), transparent)",
        }}
      />
    </span>
  );
}

/* ── Board row ────────────────────────────────────────────────── */

export interface DepartureBoardRow {
  label: string;
  value: string;
}

/* ── Full board ───────────────────────────────────────────────── */

export interface DepartureBoardProps {
  rows: DepartureBoardRow[];
  className?: string;
}

/**
 * A split-flap airport departure board. Each row has a label and a
 * value that flips when it changes. Flaps flip on value change with
 * a satisfying mechanical animation.
 */
export function DepartureBoard({ rows, className }: DepartureBoardProps) {
  const [prevRows, setPrevRows] = useState<Map<string, string>>(new Map());
  const [flippedKeys, setFlippedKeys] = useState<Set<string>>(new Set());
  const flipTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const newFlipped = new Set<string>();
    const newPrev = new Map(prevRows);

    for (const row of rows) {
      const prev = prevRows.get(row.label);
      if (prev !== undefined && prev !== row.value) {
        newFlipped.add(row.label);
        // Clear flip after animation
        const t = setTimeout(() => {
          setFlippedKeys((prev) => {
            const next = new Set(prev);
            next.delete(row.label);
            return next;
          });
        }, 500);
        flipTimeouts.current.set(row.label, t);
      }
      newPrev.set(row.label, row.value);
    }

    if (newFlipped.size > 0) {
      setFlippedKeys(newFlipped);
    }
    setPrevRows(newPrev);

    return () => {
      flipTimeouts.current.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <div
      role="list"
      aria-label="Departure board"
      className={cn(
        "inline-flex flex-col gap-0 rounded-xl border border-hairline p-5",
        className
      )}
      style={{
        backgroundColor: "var(--space-900, #05060A)",
      }}
    >
      {/* Board header */}
      <div
        className="flex items-center gap-3 pb-3 mb-3 border-b"
        style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--star-yellow, #FDDA24)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l1.5 5L19 8l-5.5 1L12 14l-1.5-5L5 8l5.5-1L12 2z" />
        </svg>
        <span
          className="font-display text-xs font-semibold uppercase tracking-[0.25em]"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--ink-dim, #8A8B96)",
          }}
        >
          Departures
        </span>
      </div>

      {/* Rows */}
      {rows.map((row) => {
        const prevVal = prevRows.get(row.label) ?? row.value;
        const flipped = flippedKeys.has(row.label);

        return (
          <div
            key={row.label}
            role="listitem"
            className="flex items-center justify-between gap-6 py-2"
          >
            <span
              className="font-mono text-xs uppercase tracking-[0.15em] min-w-[100px]"
              style={{ color: "var(--ink-dim, #8A8B96)" }}
            >
              {row.label}
            </span>
            <div className="flex items-center">
              {row.value.split("").map((char, i) => (
                <SplitFlapCell
                  key={`${row.label}-${i}-${char}`}
                  value={char}
                  prevValue={flipped ? (prevVal[i] ?? char) : char}
                  flipped={flipped}
                  charWidth={char === " " ? "narrow" : /[il1.,:;']/.test(char) ? "narrow" : /[mwMW]/.test(char) ? "wide" : "normal"}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
