"use client";

import { useId, useEffect, useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { StarField } from "./star-field";

export interface StarMapRouteProps {
  /** Origin label */
  from: string;
  /** Destination label */
  to: string;
  /** Optional coordinates [x, y] for from node */
  fromCoord?: [number, number];
  /** Optional coordinates [x, y] for to node */
  toCoord?: [number, number];
  /** Whether to animate */
  animate?: boolean;
  /** SVG width */
  width?: number;
  /** SVG height */
  height?: number;
  /** Additional class */
  className?: string;
}

/**
 * An SVG star-field map with two glowing city star-nodes joined by
 * an animated flight-arc with a travelling comet.
 * Star field includes pointer parallax for depth.
 */
export function StarMapRoute({
  from,
  to,
  fromCoord,
  toCoord,
  animate = true,
  width = 600,
  height = 300,
  className,
}: StarMapRouteProps) {
  const shouldReduce = useReducedMotion();
  const reallyAnimate = animate && !shouldReduce;
  const arcId = useId();
  const pathRef = useRef<SVGPathElement>(null);
  const cometRef = useRef<SVGCircleElement>(null);

  const fromX = fromCoord?.[0] ?? width * 0.15;
  const fromY = fromCoord?.[1] ?? height * 0.65;
  const toX = toCoord?.[0] ?? width * 0.85;
  const toY = toCoord?.[1] ?? height * 0.65;

  // Quadratic arc between the two nodes
  const midX = (fromX + toX) / 2;
  const midY = height * 0.18;
  const arcD = `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;

  // Comet progress along arc
  const progress = useMotionValue(0);
  const cometProgress = useSpring(progress, {
    stiffness: 25,
    damping: 18,
    mass: 0.5,
  });

  // Position the comet circle along the path on each frame
  const updateComet = useCallback(() => {
    const path = pathRef.current;
    const circle = cometRef.current;
    if (!path || !circle) return;
    const len = path.getTotalLength();
    const pt = path.getPointAtLength(cometProgress.get() * len);
    circle.setAttribute("cx", String(pt.x));
    circle.setAttribute("cy", String(pt.y));
  }, [cometProgress]);

  useEffect(() => {
    if (!reallyAnimate) {
      progress.set(1);
      return;
    }
    const t0 = Date.now();
    const duration = 2600;
    let raf: number;
    const update = () => {
      const elapsed = Date.now() - t0;
      const p = Math.min(elapsed / duration, 1);
      progress.set(p);
      updateComet();
      if (p < 1) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [reallyAnimate, progress, updateComet]);

  return (
    <div
      role="img"
      aria-label={`Star-map route from ${from} to ${to}`}
      className={className}
      style={{ position: "relative", width, height, overflow: "hidden", borderRadius: "0.75rem" }}
    >
      {/* Star field background with pointer parallax */}
      <StarField
        starCount={70}
        width={width}
        height={height}
        animate={reallyAnimate}
        parallax={0.6}
      />

      {/* Overlay nebula gradient */}
      <div
        className="pointer-events-none"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, var(--aurora-violet-dim, rgba(124,108,240,0.1)), transparent 70%)",
        }}
      />

      {/* SVG arc + comet + city nodes overlay */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id={`${arcId}-arc-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--aurora-teal, #3DE1C8)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--aurora-violet, #7C6CF0)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--aurora-teal, #3DE1C8)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`${arcId}-comet-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--star-yellow, #FDDA24)" stopOpacity="0" />
            <stop offset="35%" stopColor="var(--star-yellow, #FDDA24)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--star-yellow, #FDDA24)" stopOpacity="0" />
          </linearGradient>
          <filter id={`${arcId}-arc-glow`}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${arcId}-comet-glow`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${arcId}-node-glow`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Flight arc path */}
        <motion.path
          ref={pathRef}
          d={arcD}
          stroke={`url(#${arcId}-arc-grad)`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="1200"
          initial={reallyAnimate ? { strokeDashoffset: 1200 } : { strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.8, ease: "easeInOut", delay: 0.2 }}
          filter={`url(#${arcId}-arc-glow)`}
        />

        {/* Comet dot — travels along the arc */}
        <motion.circle
          ref={cometRef}
          r={4}
          cx={fromX}
          cy={fromY}
          fill={`url(#${arcId}-comet-grad)`}
          filter={`url(#${arcId}-comet-glow)`}
          initial={reallyAnimate ? { opacity: 0 } : { opacity: 0.9 }}
          animate={
            reallyAnimate
              ? { opacity: [0, 0, 1, 1, 0] }
              : { opacity: 0.9 }
          }
          transition={
            reallyAnimate
              ? {
                  duration: 2.6,
                  times: [0, 0.04, 0.12, 0.88, 1],
                  ease: "easeInOut",
                }
              : {}
          }
        />

        {/* From node — city star */}
        <motion.g
          initial={{ scale: reallyAnimate ? 0 : 1, opacity: reallyAnimate ? 0 : 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          filter={`url(#${arcId}-node-glow)`}
        >
          <circle cx={fromX} cy={fromY} r="7" fill="var(--aurora-teal, #3DE1C8)" opacity="0.25" />
          <circle cx={fromX} cy={fromY} r="3.5" fill="var(--aurora-teal, #3DE1C8)" />
          <text
            x={fromX}
            y={fromY - 14}
            textAnchor="middle"
            fill="var(--ink, #F5F3EC)"
            fontSize="13"
            fontWeight="600"
            fontFamily="var(--font-heading)"
          >
            {from}
          </text>
        </motion.g>

        {/* To node — city star */}
        <motion.g
          initial={{ scale: reallyAnimate ? 0 : 1, opacity: reallyAnimate ? 0 : 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          filter={`url(#${arcId}-node-glow)`}
        >
          <circle cx={toX} cy={toY} r="7" fill="var(--aurora-violet, #7C6CF0)" opacity="0.25" />
          <circle cx={toX} cy={toY} r="3.5" fill="var(--aurora-violet, #7C6CF0)" />
          <text
            x={toX}
            y={toY - 14}
            textAnchor="middle"
            fill="var(--ink, #F5F3EC)"
            fontSize="13"
            fontWeight="600"
            fontFamily="var(--font-heading)"
          >
            {to}
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
