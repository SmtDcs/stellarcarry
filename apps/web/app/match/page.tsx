"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import type { MatchResult, Traveler } from "@stellarcarry/core";
import { matchTravelers } from "@stellarcarry/core";
import { seedRequests, seedTravelers } from "@/lib/seed";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { StarField } from "@/components/travel/star-field";
import { WorldStarMap } from "@/components/travel/world-star-map";
import { BoardingPassCard } from "@/components/travel/boarding-pass-card";
import { MatchFilters, applyTravelerFilters, defaultFilterState, type FilterState } from "@/components/travel/match-filters";
import { MatchSkeleton } from "@/components/Skeletons";
import type { BoardingPassMatch } from "@/components/travel/boarding-pass-card";

type EnrichedMatch = MatchResult & {
  id: string;
  account: string;
  fromCountry: string;
  toCountry: string;
  reputation: number;
  capacityG: number;
  travelDay: number;
};

export default function MatchPage() {
  const [requestIdx, setRequestIdx] = useState(0);
  const request = seedRequests[requestIdx];
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<EnrichedMatch[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

  const visible = useMemo(
    () => applyTravelerFilters(results, filters, { itemWeightG: request.itemWeightG }),
    [results, filters, request.itemWeightG],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const matches = matchTravelers(request, seedTravelers);
      const travelerMap = new Map<Traveler["id"], Traveler>(seedTravelers.map((t) => [t.id, t]));
      setResults(
        matches.map((m) => {
          const t = travelerMap.get(m.travelerId);
          return {
            ...m,
            id: m.travelerId,
            account: t?.account ?? "",
            fromCountry: t?.fromCountry ?? "",
            toCountry: t?.toCountry ?? "",
            reputation: t?.reputation ?? 0,
            capacityG: t?.capacityG ?? 0,
            travelDay: t?.travelDay ?? 0,
          };
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to match travelers");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [request]);

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden" style={{ backgroundColor: "var(--space-900, #05060A)" }}>
      <BackgroundBeams className="pointer-events-none opacity-[0.04]" />
      <StarField starCount={40} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.15 }} />

      {loading ? (
        <MatchSkeleton />
      ) : (
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="relative mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: "var(--star-yellow-dim, rgba(253,218,36,0.3))",
              backgroundColor: "var(--star-yellow-dim, rgba(253,218,36,0.07))",
              color: "var(--star-yellow, #FDDA24)",
              boxShadow: "0 0 16px var(--star-yellow-dim, rgba(253,218,36,0.07))",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            {request.fromCountry} → {request.toCountry}
          </motion.div>

          <h1
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--ink, #F5F3EC)",
            }}
          >
            Boarding
          </h1>
          <p className="mt-3 max-w-lg text-base" style={{ color: "var(--ink-dim, #8A8B96)" }}>
            Ranked carriers for request{" "}
            <span className="font-mono text-sm" style={{ color: "var(--ink, #F5F3EC)", opacity: 0.7 }}>
              {request.id}
            </span>{" "}
            ({request.itemWeightG}g, {request.rewardStroops / 1e7} XLM reward)
          </p>

          {/* Request toggle buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {seedRequests.map((r, i) => (
              <motion.button
                key={r.id}
                onClick={() => setRequestIdx(i)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                aria-label={r.fromCountry + " to " + r.toCountry}
                style={
                  i === requestIdx
                    ? {
                        borderColor: "var(--star-yellow, #FDDA24)",
                        color: "#000",
                        backgroundColor: "var(--star-yellow, #FDDA24)",
                      }
                    : {
                        borderColor: "var(--hairline, rgba(255,255,255,0.08))",
                        color: "var(--ink-dim, #8A8B96)",
                        backgroundColor: "var(--space-800, #0A0B12)",
                      }
                }
              >
                {r.fromCountry}→{r.toCountry}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Star map route */}
        <motion.div
          className="mt-10 flex justify-center"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <div className="w-full max-w-2xl rounded-xl overflow-hidden border" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))", backgroundColor: "var(--space-900, #05060A)" }}>
            <WorldStarMap from={request.fromCountry} to={request.toCountry} />
          </div>
        </motion.div>

        {/* Results or states */}
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-14 flex flex-col items-center justify-center rounded-2xl border px-8 py-20 text-center"
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
              className="mb-5"
              style={{ color: "rgba(239,68,68,0.4)" }}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <h2 className="text-xl font-semibold" style={{ color: "var(--ink-dim, #8A8B96)" }}>
              Something went wrong
            </h2>
            <p className="mt-2 max-w-sm text-sm font-mono" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.6 }}>
              {error}
            </p>
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-14 flex flex-col items-center justify-center rounded-2xl border px-8 py-20 text-center"
            style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}
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
              className="mb-5"
              style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.3 }}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
            </svg>
            <h2 className="text-xl font-semibold" style={{ color: "var(--ink-dim, #8A8B96)" }}>
              No matching travelers found
            </h2>
            <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>
              No travelers match the selected route, capacity, and timeline
              criteria. Try a different request.
            </p>
          </motion.div>
        ) : (
          <>
            <MatchFilters
              value={filters}
              onChange={setFilters}
              capacityLabel="Spare capacity"
              className="mt-6"
            />

            {visible.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-10 flex flex-col items-center justify-center rounded-2xl border px-8 py-16 text-center"
                style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}
              >
                <h2 className="text-lg font-semibold" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                  No carriers match your filters
                </h2>
                <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>
                  {results.length} carrier{results.length !== 1 ? "s" : ""} available for this route — loosen the
                  filters to see them.
                </p>
                <button
                  type="button"
                  data-testid="clear-filters"
                  onClick={() => setFilters(defaultFilterState)}
                  className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                  style={{ borderColor: "var(--star-yellow, #FDDA24)", color: "var(--star-yellow, #FDDA24)" }}
                >
                  Clear filters
                </button>
              </motion.div>
            ) : (
              <>
                <motion.div
                  className="mt-6 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--ink-dim, #8A8B96)" }}
                  >
                    {visible.length} of {results.length} carrier{results.length !== 1 ? "s" : ""}
                  </p>
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {visible.map((match, i) => {
                    const isTop = i === 0;
                    const passProps: BoardingPassMatch = {
                      variant: "match",
                      from: match.fromCountry,
                      to: match.toCountry,
                      itemWeightG: request.itemWeightG,
                      rewardStroops: request.rewardStroops,
                      reputation: match.reputation,
                      score: match.score,
                    };

                    return (
                      <motion.div
                        key={match.travelerId}
                        data-testid="match-card"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-48px" }}
                        transition={{ delay: 0.08 * i, duration: 0.5, ease: "easeOut" }}
                        className="flex justify-center"
                      >
                        <div
                          className="rounded-xl border-2 p-[2px]"
                          style={{
                            borderColor: isTop ? "var(--star-yellow, #FDDA24)" : "transparent",
                            boxShadow: isTop ? "0 0 24px var(--star-yellow-dim, rgba(253,218,36,0.10))" : "none",
                          }}
                        >
                          <BoardingPassCard {...passProps} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
