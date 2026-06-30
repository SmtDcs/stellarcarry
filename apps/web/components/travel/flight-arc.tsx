"use client";

import { useEffect, useRef, useState, useId } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";

export interface FlightArcProps {
  /** Starting city label */
  from: string;
  /** Destination city label */
  to: string;
  /** SVG viewBox width (default 400) */
  width?: number;
  /** SVG viewBox height (default 160) */
  height?: number;
  /** Whether to animate the arc and comet on mount */
  animate?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * A curved flight-path arc from `from` city to `to` city, with a
 * travelling comet dot. The arc draws on enter; the comet traverses it.
 * Responsive — accepts width/height or fills its container.
 */
export function FlightArc({
  from,
  to,
  width = 400,
  height = 160,
  animate = true,
  className,
}: FlightArcProps) {
  const shouldReduce = useReducedMotion();
  const reallyAnimate = animate && !shouldReduce;
  const [drawn, setDrawn] = useState(false);
  const pathId = useId();
  const progress = useMotionValue(0);
  const cometProgress = useSpring(progress, {
    stiffness: 30,
    damping: 20,
    mass: 0.5,
  });
  const cometRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // Arc: gentle quadratic curve from left to right
  const startX = Math.round(width * 0.12);
  const endX = Math.round(width * 0.88);
  const midY = Math.round(height * 0.3);
  const baseY = Math.round(height * 0.7);
  const arcLength = Math.round(width * 1.1);
  const d = `M ${startX} ${baseY} Q ${width / 2} ${midY} ${endX} ${baseY}`;

  // Animate comet position along path via rAF
  useEffect(() => {
    if (!reallyAnimate) {
      setDrawn(true);
      progress.set(1);
      return;
    }
    const timer = setTimeout(() => setDrawn(true), 80);
    const t0 = Date.now();
    const duration = 2400;
    let raf: number;
    const update = () => {
      const elapsed = Date.now() - t0;
      const p = Math.min(elapsed / duration, 1);
      progress.set(p);
      const path = pathRef.current;
      const circle = cometRef.current;
      if (path && circle) {
        const len = path.getTotalLength();
        const cp = cometProgress.get();
        const pt = path.getPointAtLength(cp * len);
        circle.setAttribute("cx", String(pt.x));
        circle.setAttribute("cy", String(pt.y));
      }
      if (p < 1) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reallyAnimate, progress, cometProgress]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      role="img"
      aria-label={`Flight arc from ${from} to ${to}`}
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <defs>
        <linearGradient id={`${pathId}-arc`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--aurora-teal, #3DE1C8)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="var(--aurora-violet, #7C6CF0)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--aurora-teal, #3DE1C8)" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${pathId}-comet`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--star-yellow, #FDDA24)" stopOpacity="0" />
          <stop offset="40%" stopColor="var(--star-yellow, #FDDA24)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--star-yellow, #FDDA24)" stopOpacity="0" />
        </linearGradient>
        <filter id={`${pathId}-arc-glow`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${pathId}-comet-glow`}>
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Arc path — draws on enter */}
      <motion.path
        ref={pathRef}
        d={d}
        stroke={`url(#${pathId}-arc)`}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={arcLength}
        initial={reallyAnimate ? { strokeDashoffset: arcLength } : { strokeDashoffset: 0 }}
        animate={drawn ? { strokeDashoffset: 0 } : { strokeDashoffset: arcLength }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
        filter={`url(#${pathId}-arc-glow)`}
      />

      {/* Comet — travels along the arc */}
      <motion.circle
        ref={cometRef}
        r={3.5}
        cx={startX}
        cy={baseY}
        fill={`url(#${pathId}-comet)`}
        filter={`url(#${pathId}-comet-glow)`}
        initial={reallyAnimate ? { opacity: 0 } : { opacity: 0.9 }}
        animate={
          drawn && reallyAnimate
            ? { opacity: [0, 0.9, 0.9, 0] }
            : { opacity: drawn ? 0.9 : 0 }
        }
        transition={
          reallyAnimate
            ? {
                duration: 2.4,
                times: [0, 0.08, 0.88, 1],
                ease: "easeInOut",
              }
            : { duration: 0.01 }
        }
      />

      {/* City labels */}
      <text
        x={startX - 4}
        y={baseY + 22}
        textAnchor="start"
        fill="var(--ink-dim, #8A8B96)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        {from}
      </text>
      <text
        x={endX + 4}
        y={baseY + 22}
        textAnchor="end"
        fill="var(--ink-dim, #8A8B96)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        {to}
      </text>

      {/* City dots */}
      <circle cx={startX} cy={baseY} r="3" fill="var(--aurora-teal, #3DE1C8)" opacity="0.7" />
      <circle cx={endX} cy={baseY} r="3" fill="var(--aurora-violet, #7C6CF0)" opacity="0.7" />
    </svg>
  );
}
