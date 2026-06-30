"use client";

import { useId, useMemo, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { geoEquirectangular, geoPath, geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import countries110m from "world-atlas/countries-110m.json";

/* ── Geography (parsed + projected once, full world) ───────────── */

const VIEW_W = 1000;
const VIEW_H = 500;

const projection = geoEquirectangular()
  .scale(VIEW_W / (2 * Math.PI))
  .translate([VIEW_W / 2, VIEW_H / 2]);

const land: FeatureCollection<Geometry> = feature(
  countries110m as unknown as Topology,
  (countries110m as unknown as Topology).objects.countries,
) as FeatureCollection<Geometry>;

const LAND_PATH = geoPath(projection)(land) ?? "";

function project(lng: number, lat: number): [number, number] {
  return projection([lng, lat]) ?? [VIEW_W / 2, VIEW_H / 2];
}

/** Representative city [lng, lat] for each route country code. */
const CITY: Record<string, { lng: number; lat: number; name: string }> = {
  TR: { lng: 28.98, lat: 41.01, name: "Istanbul" },
  DE: { lng: 13.4, lat: 52.52, name: "Berlin" },
  US: { lng: -74.0, lat: 40.71, name: "New York" },
  JP: { lng: 139.69, lat: 35.69, name: "Tokyo" },
  FR: { lng: 2.35, lat: 48.86, name: "Paris" },
  GB: { lng: -0.13, lat: 51.51, name: "London" },
  KR: { lng: 126.98, lat: 37.57, name: "Seoul" },
};

const AMBIENT_CITIES: [number, number][] = [
  [55.27, 25.2], [103.82, 1.35], [-46.63, -23.55], [151.21, -33.87],
  [3.38, 6.52], [72.87, 19.07], [-99.13, 19.43], [31.24, 30.04],
  [37.62, 55.75], [-118.24, 34.05], [116.4, 39.9], [18.42, -33.92],
  [-58.38, -34.6], [100.5, 13.75], [12.5, 41.9], [77.21, 28.61],
].map(([lng, lat]) => project(lng, lat));

/** mulberry32 — deterministic PRNG (stable across SSR/client). */
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

/** Random "city light" stars placed on LAND only (not oceans), rendered as <circle>s. */
const BG_STARS = (() => {
  const rng = makeRng(20260628);
  const stars: { cx: number; cy: number; r: number; oMin: number; oMax: number; dur: number; delay: number }[] = [];
  let attempts = 0;
  while (stars.length < 130 && attempts < 5000) {
    attempts++;
    const lng = rng() * 360 - 180;
    const lat = rng() * 150 - 60; // bias away from the poles
    if (!geoContains(land, [lng, lat])) continue; // keep land points only
    const [cx, cy] = project(lng, lat);
    const oMin = Math.round((rng() * 0.25 + 0.2) * 100) / 100;
    stars.push({
      cx: Math.round(cx * 10) / 10,
      cy: Math.round(cy * 10) / 10,
      r: Math.round((rng() * 1.0 + 0.6) * 100) / 100,
      oMin,
      oMax: Math.round(Math.min(1, oMin + rng() * 0.4 + 0.45) * 100) / 100,
      dur: Math.round((rng() * 2.6 + 2.4) * 100) / 100,
      delay: Math.round(rng() * 600) / 100,
    });
  }
  return stars;
})();

function cityFor(code: string): { lng: number; lat: number; name: string } {
  return CITY[code] ?? { lng: 0, lat: 20, name: code };
}

/* ── Component ─────────────────────────────────────────────────── */

export interface WorldStarMapProps {
  /** Origin country code (e.g. "TR") */
  from: string;
  /** Destination country code (e.g. "DE") */
  to: string;
  animate?: boolean;
  className?: string;
}

/**
 * A real world map rendered as a star chart: continents are faint constellations,
 * cities glow as stars on land, and the route's origin/destination are joined by a
 * luminous flight-arc with a travelling comet. Static (no pan/zoom) for performance.
 */
export function WorldStarMap({ from, to, animate = true, className }: WorldStarMapProps) {
  const shouldReduce = useReducedMotion();
  const reallyAnimate = animate && !shouldReduce;
  const gradId = useId();
  const glowId = useId();

  const fromCity = cityFor(from);
  const toCity = cityFor(to);

  const route = useMemo(() => {
    const [fx, fy] = project(fromCity.lng, fromCity.lat);
    const [tx, ty] = project(toCity.lng, toCity.lat);
    const ax = (fx + tx) / 2;
    const ay = (fy + ty) / 2 - Math.max(40, Math.abs(tx - fx) * 0.28);
    const xs: number[] = [];
    const ys: number[] = [];
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const mt = 1 - t;
      xs.push(mt * mt * fx + 2 * mt * t * ax + t * t * tx);
      ys.push(mt * mt * fy + 2 * mt * t * ay + t * t * ty);
    }
    return { fx, fy, tx, ty, arcD: `M ${fx} ${fy} Q ${ax} ${ay} ${tx} ${ty}`, comet: { xs, ys } };
  }, [fromCity, toCity]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height="auto"
        role="img"
        aria-label={`Route from ${fromCity.name} to ${toCity.name} on a world map`}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--aurora-teal, #3DE1C8)" />
            <stop offset="100%" stopColor="var(--aurora-violet, #7C6CF0)" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Continents — faint constellation outlines */}
        <path
          d={LAND_PATH}
          fill="color-mix(in srgb, var(--ink, #F5F3EC) 5%, transparent)"
          stroke="color-mix(in srgb, var(--ink, #F5F3EC) 16%, transparent)"
          strokeWidth={0.5}
        />

        {/* Random background stars — on land */}
        {BG_STARS.map((s, i) => (
          <circle
            key={`bg-${i}`}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="var(--ink, #F5F3EC)"
            opacity={s.oMin}
            style={
              reallyAnimate
                ? ({
                    // Negative delay starts each star mid-cycle, so they don't all flash full-bright at load.
                    animation: `star-blink ${s.dur}s ease-in-out -${s.delay}s infinite`,
                    "--star-o-min": s.oMin,
                    "--star-o-max": s.oMax,
                  } as CSSProperties)
                : undefined
            }
          />
        ))}

        {/* Ambient city stars (yellow) */}
        {AMBIENT_CITIES.map(([x, y], i) => (
          <circle key={`a-${i}`} cx={x} cy={y} r={1.8} fill="var(--star-yellow, #FDDA24)" opacity={0.6} />
        ))}

        {/* Flight arc (glow filter is fine here — drawn once, then static) */}
        <motion.path
          d={route.arcD}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={1.8}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          initial={reallyAnimate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.9 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={reallyAnimate ? { duration: 1.6, ease: "easeInOut" } : {}}
        />

        {/* Travelling comet — no filter (animated; a per-frame SVG filter is costly) */}
        {reallyAnimate && (
          <motion.circle
            r={2.4}
            fill="var(--ink, #F5F3EC)"
            animate={{ cx: route.comet.xs, cy: route.comet.ys, opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut", delay: 1.4 }}
          />
        )}

        {/* Endpoint city stars — from-label above, to-label below so they never collide. */}
        {(
          [
            { x: route.fx, y: route.fy, color: "var(--aurora-teal, #3DE1C8)", label: from, name: fromCity.name, dy: -12 },
            { x: route.tx, y: route.ty, color: "var(--aurora-violet, #7C6CF0)", label: to, name: toCity.name, dy: 20 },
          ] as const
        ).map((node) => (
          <g key={node.label}>
            <circle cx={node.x} cy={node.y} r={3.6} fill={node.color} filter={`url(#${glowId})`} />
            <circle cx={node.x} cy={node.y} r={1.5} fill="var(--ink, #F5F3EC)" />
            <text
              x={node.x}
              y={node.y + node.dy}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="var(--ink, #F5F3EC)"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
            >
              {node.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
