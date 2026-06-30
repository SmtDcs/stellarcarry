"use client";

import { type ReactNode } from "react";

/* ── Types ─────────────────────────────────────────────────────── */

export type SortKey = "reputation" | "soonest" | "capacity";

export interface FilterState {
  /** Minimum reputation floor (0 = any). */
  minReputation: 0 | 70 | 90;
  /** Minimum capacity headroom in grams (0 = any). On /match this is spare
   *  capacity over the item weight; on /travelers it's min total capacity. */
  minSpareG: 0 | 250 | 1000;
  sort: SortKey;
  /** Free-text search over traveler account / id (case-insensitive). */
  search: string;
}

export const defaultFilterState: FilterState = {
  minReputation: 0,
  minSpareG: 0,
  sort: "reputation",
  search: "",
};

/** Minimal shape the filters operate on — both `Traveler` and an enriched match satisfy it. */
export interface FilterableTraveler {
  id: string;
  account: string;
  reputation: number;
  capacityG: number;
  travelDay: number;
}

/**
 * Pure, deterministic filter + sort applied on top of the matching engine's output.
 * Never changes qualification (route/capacity/deadline) — that stays in `matchTravelers`.
 *
 * @param items - already-qualified/ranked carriers (or the raw traveler directory)
 * @param state - the active filter state
 * @param opts.itemWeightG - when provided, `minSpareG` is measured as headroom over this
 *   weight (spare capacity); when omitted, `minSpareG` is a min total-capacity threshold.
 */
export function applyTravelerFilters<T extends FilterableTraveler>(
  items: T[],
  state: FilterState,
  opts?: { itemWeightG?: number },
): T[] {
  const weight = opts?.itemWeightG ?? 0;
  const q = state.search.trim().toLowerCase();

  const filtered = items.filter((t) => {
    if (t.reputation < state.minReputation) return false;
    const effectiveCapacity = t.capacityG - weight;
    if (effectiveCapacity < state.minSpareG) return false;
    if (q && !(t.account.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))) return false;
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (state.sort === "soonest") {
      if (a.travelDay !== b.travelDay) return a.travelDay - b.travelDay;
    } else if (state.sort === "capacity") {
      if (a.capacityG !== b.capacityG) return b.capacityG - a.capacityG;
    }
    // Default + tie-break mirrors the engine: reputation desc, travelDay asc, id asc.
    if (b.reputation !== a.reputation) return b.reputation - a.reputation;
    if (a.travelDay !== b.travelDay) return a.travelDay - b.travelDay;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return sorted;
}

/* ── UI ────────────────────────────────────────────────────────── */

function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium font-mono transition-colors"
      style={
        active
          ? {
              borderColor: "var(--star-yellow, #FDDA24)",
              backgroundColor: "var(--star-yellow, #FDDA24)",
              color: "#000",
            }
          : {
              borderColor: "var(--hairline, rgba(255,255,255,0.08))",
              backgroundColor: "var(--space-800, #0A0B12)",
              color: "var(--ink-dim, #8A8B96)",
            }
      }
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--ink-dim, #8A8B96)" }}
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

export interface MatchFiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** Label for the capacity group (e.g. "Spare capacity" on /match, "Capacity" on /travelers). */
  capacityLabel?: string;
  className?: string;
}

/** Departures-themed filter + sort bar shared by /match and /travelers. */
export function MatchFilters({ value, onChange, capacityLabel = "Spare capacity", className }: MatchFiltersProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <div
      className={`flex flex-wrap items-end gap-x-8 gap-y-4 rounded-xl border p-4 ${className ?? ""}`}
      style={{
        borderColor: "var(--hairline, rgba(255,255,255,0.08))",
        backgroundColor: "var(--space-900, #05060A)",
      }}
      role="group"
      aria-label="Filter and sort carriers"
    >
      <Group label="Min reputation">
        {([0, 70, 90] as const).map((r) => (
          <Chip
            key={r}
            testId={`filter-rep-${r}`}
            active={value.minReputation === r}
            onClick={() => set({ minReputation: r })}
          >
            {r === 0 ? "Any" : `${r}+`}
          </Chip>
        ))}
      </Group>

      <Group label={capacityLabel}>
        {([0, 250, 1000] as const).map((g) => (
          <Chip
            key={g}
            testId={`filter-spare-${g}`}
            active={value.minSpareG === g}
            onClick={() => set({ minSpareG: g })}
          >
            {g === 0 ? "Any" : g >= 1000 ? `${g / 1000}kg+` : `${g}g+`}
          </Chip>
        ))}
      </Group>

      <Group label="Sort by">
        {(
          [
            { k: "reputation", label: "Best rep" },
            { k: "soonest", label: "Soonest" },
            { k: "capacity", label: "Capacity" },
          ] as const
        ).map(({ k, label }) => (
          <Chip key={k} testId={`filter-sort-${k}`} active={value.sort === k} onClick={() => set({ sort: k })}>
            {label}
          </Chip>
        ))}
      </Group>

      <div className="flex flex-1 flex-col gap-2" style={{ minWidth: "180px" }}>
        <label
          htmlFor="filter-search"
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--ink-dim, #8A8B96)" }}
        >
          Search carrier
        </label>
        <input
          id="filter-search"
          data-testid="filter-search"
          type="text"
          value={value.search}
          placeholder="account or id…"
          onChange={(e) => set({ search: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none placeholder:text-white/25"
          style={{
            borderColor: "var(--hairline, rgba(255,255,255,0.08))",
            backgroundColor: "var(--space-800, #0A0B12)",
            color: "var(--ink, #F5F3EC)",
          }}
        />
      </div>
    </div>
  );
}
