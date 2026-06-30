"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

/* ── Data types ───────────────────────────────────────────────── */

export interface BoardingPassRequest {
  variant: "request";
  from: string;
  to: string;
  itemWeightG: number;
  rewardStroops: number;
  gate?: string;
  flight?: string;
  status?: "open" | "matched" | "in-transit";
}

export interface BoardingPassTraveler {
  variant: "traveler";
  from: string;
  to: string;
  capacityG: number;
  reputation: number;
  travelDay: number;
  flight?: string;
}

export interface BoardingPassMatch {
  variant: "match";
  from: string;
  to: string;
  itemWeightG: number;
  rewardStroops: number;
  reputation: number;
  score?: number;
}

export type BoardingPassCardProps = (
  | BoardingPassRequest
  | BoardingPassTraveler
  | BoardingPassMatch
) & {
  className?: string;
  /** Custom right-stub slot */
  stubContent?: ReactNode;
};

/* ── Helpers ──────────────────────────────────────────────────── */

function formatStroops(stroops: number): string {
  const xlm = stroops / 10_000_000;
  if (xlm >= 1) return `${xlm.toFixed(1)} XLM`;
  return `${stroops.toLocaleString()} str`;
}

function stroopBarcode(stroops: number, count = 28): number[] {
  const bars: number[] = [];
  const s = stroops.toString();
  for (let i = 0; i < count; i++) {
    const charCode = s.charCodeAt(i % s.length);
    bars.push((charCode % 40) + 10);
  }
  return bars;
}

/* ── Component ────────────────────────────────────────────────── */

/**
 * A premium two-panel boarding-pass card split by a perforated tear edge.
 * Left panel: route, gate, weight, reward, stroop barcode.
 * Right stub: status, score, or custom content.
 * 3D tilt + glow on hover.
 */
export function BoardingPassCard(props: BoardingPassCardProps) {
  const shouldReduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothX = useSpring(mouseX, { stiffness: 200, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 200, damping: 30 });

  const rotateX = useMotionTemplate`${useSpring(
    useMotionValue(0),
    { stiffness: 200, damping: 30 }
  )}`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handlePointerLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const tiltRotateX = useMotionValue(0);
  const tiltRotateY = useMotionValue(0);

  const handleTilt = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerMove(e);
    if (shouldReduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltRotateY.set(x * 8);
    tiltRotateX.set(-y * 8);
  };

  const handleTiltLeave = () => {
    handlePointerLeave();
    tiltRotateX.set(0);
    tiltRotateY.set(0);
  };

  const {
    variant,
    from,
    to,
    className,
    stubContent,
  } = props;

  const route = `${from} → ${to}`;
  let gate = "A12";
  let flight = "SC401";
  let weightLabel = "";
  let rewardLabel = "";
  let statusText = "OPEN";
  let scoreText = "";
  const bars: number[] = stroopBarcode(0);

  if (variant === "request") {
    gate = props.gate ?? gate;
    flight = props.flight ?? flight;
    weightLabel = `${(props.itemWeightG / 1000).toFixed(1)} kg`;
    rewardLabel = formatStroops(props.rewardStroops);
    statusText = (props.status ?? "open").toUpperCase().replace(/-/g, " ");
  } else if (variant === "traveler") {
    weightLabel = `${(props.capacityG / 1000).toFixed(1)} kg cap`;
    rewardLabel = `Day ${props.travelDay}`;
    scoreText = `${props.reputation}%`;
    gate = `T${props.travelDay}`;
    flight = props.flight ?? "SC402";
  } else if (variant === "match") {
    weightLabel = `${(props.itemWeightG / 1000).toFixed(1)} kg`;
    rewardLabel = formatStroops(props.rewardStroops);
    scoreText = props.score != null ? `${props.score}%` : `${props.reputation}%`;
    statusText = "MATCHED";
  }

  return (
    <motion.div
      ref={cardRef}
      role="article"
      aria-label={`Boarding pass: ${route}`}
      className={cn(
        "group relative w-full max-w-md cursor-default select-none",
        "font-mono",
        className
      )}
      onPointerMove={handleTilt}
      onPointerLeave={handleTiltLeave}
      style={{
        rotateX: tiltRotateX,
        rotateY: tiltRotateY,
        transformStyle: "preserve-3d",
        perspective: 600,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      {/* Hover glow */}
      <motion.div
        className="pointer-events-none absolute -inset-4 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${smoothX.get() * 100}% ${smoothY.get() * 100}%,
              var(--star-yellow-dim, rgba(253,218,36,0.12)),
              transparent 60%
            )
          `,
        }}
      />

      {/* Card body */}
      <div
        className={cn(
          "relative flex overflow-hidden rounded-xl border border-hairline",
          "bg-space-900 shadow-2xl"
        )}
      >
        {/* Paper texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* ── Left panel ── */}
        <div className="relative flex-1 p-5 pr-2 space-y-3">
          {/* Airline header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l1.5 5L19 8l-5.5 1L12 14l-1.5-5L5 8l5.5-1L12 2z" fill="var(--star-yellow, #FDDA24)" />
              </svg>
              <span className="text-xs font-semibold tracking-widest text-ink-dim">
                STELLARCARRY
              </span>
            </div>
          </div>

          {/* Route — large display type */}
          <div>
            <div className="font-display text-2xl font-bold tracking-tight text-ink" style={{ fontFamily: "var(--font-heading)" }}>
              {from} <span className="text-ink-dim">→</span> {to}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">
              Flight {flight} &nbsp;·&nbsp; Gate {gate}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
            <InfoRow label="WEIGHT" value={weightLabel} />
            {variant === "request" || variant === "match" ? (
              <InfoRow label="REWARD" value={rewardLabel} accent />
            ) : (
              <InfoRow label="TRAVEL" value={rewardLabel} />
            )}
            {variant === "match" && (
              <InfoRow label="SCORE" value={scoreText} accent />
            )}
          </div>

          {/* Stroop barcode */}
          <div className="pt-2">
            <div className="flex items-end gap-[1px] h-8">
              {stroopBarcode(
                variant === "request" || variant === "match"
                  ? (props as BoardingPassRequest | BoardingPassMatch).rewardStroops
                  : 0
              ).map((h, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: `var(--ink-dim, #8A8B96)`,
                    opacity: 0.35 + (i % 3) * 0.1,
                  }}
                />
              ))}
            </div>
            <div className="mt-1 font-mono text-[9px] text-ink-dim tracking-widest">
              {variant === "request" ? (props as BoardingPassRequest).rewardStroops.toLocaleString() : variant === "match" ? (props as BoardingPassMatch).rewardStroops.toLocaleString() : "••••••••"} STROOPS
            </div>
          </div>
        </div>

        {/* ── Perforated tear edge ── */}
        <div className="relative flex flex-col items-center justify-center w-[2px]">
          {/* Dashed line */}
          <div
            className="absolute inset-y-0 w-px"
            style={{
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                var(--hairline, rgba(255,255,255,0.08)) 0px,
                var(--hairline, rgba(255,255,255,0.08)) 5px,
                transparent 5px,
                transparent 10px
              )`,
            }}
          />
          {/* Notch circles */}
          <div className="absolute -left-[5px] top-4 h-[10px] w-[10px] rounded-full bg-space-800 border border-hairline" />
          <div className="absolute -left-[5px] bottom-4 h-[10px] w-[10px] rounded-full bg-space-800 border border-hairline" />
        </div>

        {/* ── Right stub ── */}
        <div className="flex flex-col items-center justify-center w-[90px] p-4 space-y-3">
          {stubContent || (
            <>
              <div
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]",
                  statusText === "OPEN"
                    ? "bg-aurora-teal/10 text-aurora-teal"
                    : statusText === "IN TRANSIT"
                    ? "bg-aurora-violet/10 text-aurora-violet"
                    : statusText === "MATCHED"
                    ? "bg-star-yellow/10 text-star"
                    : "bg-muted text-ink-dim"
                )}
                style={{
                  backgroundColor:
                    statusText === "MATCHED"
                      ? "var(--star-yellow-dim, rgba(253,218,36,0.12))"
                      : statusText === "IN TRANSIT"
                      ? "var(--aurora-violet-dim, rgba(124,108,240,0.1))"
                      : "var(--aurora-teal-dim, rgba(61,225,200,0.1))",
                }}
              >
                <span
                  style={{
                    color:
                      statusText === "MATCHED"
                        ? "var(--star-yellow, #FDDA24)"
                        : statusText === "IN TRANSIT"
                        ? "var(--aurora-violet, #7C6CF0)"
                        : "var(--aurora-teal, #3DE1C8)",
                  }}
                >
                  {statusText}
                </span>
              </div>
              {scoreText && (
                <div className="text-center">
                  <div className="font-display text-xl font-bold text-star" style={{ fontFamily: "var(--font-heading)" }}>
                    {scoreText}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-ink-dim">
                    Score
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.15em] text-ink-dim mb-0.5">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-sm",
          accent ? "text-star" : "text-ink"
        )}
        style={accent ? { color: "var(--star-yellow, #FDDA24)" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
