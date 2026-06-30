"use client";

import { useMemo, useRef, useCallback, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

export interface StarFieldProps {
  starCount?: number;
  width?: number | "100%";
  height?: number | "100%";
  animate?: boolean;
  /** Parallax strength on pointer move (0 = off, recommended: 0.3–1) */
  parallax?: number;
  /** Deterministic seed so SSR and client render identical stars */
  seed?: number;
  className?: string;
  style?: CSSProperties;
}

/** mulberry32 — tiny deterministic PRNG (stable across SSR/client). */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A dense deep-space star-field with slow twinkle + optional pointer parallax.
 * Each star is a small round dot positioned by percentage (so it stays perfectly
 * circular at any aspect ratio). Twinkle runs on cheap CSS keyframes, so the field
 * scales to many hundreds of stars without per-element animation overhead.
 */
export function StarField({
  starCount = 80,
  width = "100%",
  height = "100%",
  animate = true,
  parallax = 0,
  seed = 1,
  className,
  style,
}: StarFieldProps) {
  const shouldReduce = useReducedMotion();
  const reallyAnimate = animate && !shouldReduce;
  const hasParallax = parallax > 0 && reallyAnimate;
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!hasParallax || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [hasParallax, mouseX, mouseY],
  );

  const handlePointerLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 30 });

  const parallaxStrength = parallax * 14;
  const layerX = useTransform(smoothX, (v) => v * parallaxStrength);
  const layerY = useTransform(smoothY, (v) => v * parallaxStrength);

  const stars = useMemo(() => {
    const rng = makeRng(seed * 2654435761);
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      left: Math.round(rng() * 10000) / 100,
      top: Math.round(rng() * 10000) / 100,
      // Small, crisp dots: ~1.0px–3.0px
      size: Math.round((rng() * 2.0 + 1.0) * 100) / 100,
      baseOpacity: Math.round((rng() * 0.4 + 0.55) * 100) / 100,
      delay: Math.round(rng() * 600) / 100,
      duration: Math.round((rng() * 2.4 + 2.2) * 100) / 100,
    }));
  }, [starCount, seed]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Star field background"
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          x: hasParallax ? layerX : 0,
          y: hasParallax ? layerY : 0,
          scale: hasParallax ? 1.07 : 1,
        }}
      >
        {stars.map((star) => (
          <span
            key={star.id}
            style={{
              position: "absolute",
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              borderRadius: "9999px",
              backgroundColor: "var(--ink, #F5F3EC)",
              boxShadow: `0 0 ${(star.size * 2).toFixed(1)}px rgba(245,243,236,0.75)`,
              opacity: star.baseOpacity,
              animation: reallyAnimate
                ? `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`
                : undefined,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
