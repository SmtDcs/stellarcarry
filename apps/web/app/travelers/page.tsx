"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Spotlight } from "@/components/ui/spotlight-new";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { GlowingButton } from "@/components/ui/glowing-button";
import { BoardingPassCard } from "@/components/travel/boarding-pass-card";
import { StarField } from "@/components/travel/star-field";
import { MatchFilters, applyTravelerFilters, defaultFilterState, type FilterState } from "@/components/travel/match-filters";
import { PlaneIcon } from "@/components/brand/icons";
import { seedTravelers } from "@/lib/seed";
import type { Traveler } from "@stellarcarry/core";

interface AddForm {
  fromCountry: string;
  toCountry: string;
  travelDay: string;
  capacityG: string;
  reputation: string;
}

const initialAdd: AddForm = {
  fromCountry: "",
  toCountry: "",
  travelDay: "",
  capacityG: "",
  reputation: "",
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function TravelersPage() {
  const [travelers, setTravelers] = useState<Traveler[]>(seedTravelers);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(initialAdd);
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

  const visible = useMemo(() => applyTravelerFilters(travelers, filters), [travelers, filters]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const day = Number(addForm.travelDay);
    const cap = Number(addForm.capacityG);
    const rep = Number(addForm.reputation);
    if (
      !addForm.fromCountry.trim() ||
      !addForm.toCountry.trim() ||
      !Number.isInteger(day) ||
      day <= 0 ||
      !Number.isInteger(cap) ||
      cap <= 0 ||
      !Number.isInteger(rep) ||
      rep < 0 ||
      rep > 100
    ) {
      return;
    }

    const next: Traveler = {
      id: `t${travelers.length + 1}`,
      account: `GUSER${travelers.length + 1}`,
      fromCountry: addForm.fromCountry.trim(),
      toCountry: addForm.toCountry.trim(),
      travelDay: day,
      capacityG: cap,
      reputation: rep,
    };

    setTravelers((prev) => [...prev, next]);
    setAddForm(initialAdd);
    setAdding(false);
  };

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden text-ink" style={{ backgroundColor: "var(--space-800)" }}>
      <StarField starCount={40} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.10 }} />
      <Spotlight />
      <BackgroundBeams className="pointer-events-none opacity-[0.04]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-14">
        {/* header */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PlaneIcon size={18} style={{ color: "var(--star-yellow)" }} />
              <span
                className="font-display text-xs font-semibold uppercase tracking-[0.25em]"
                style={{ color: "var(--ink-dim)" }}
              >
                Departures
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">Travelers</h1>
            <p className="mt-2" style={{ color: "color-mix(in srgb, var(--ink) 50%, transparent)" }}>
              Browse travelers who can carry your items across borders.
            </p>
          </div>
          <GlowingButton onClick={() => setAdding((a) => !a)}>
            {adding ? "Cancel" : "Add traveler"}
          </GlowingButton>
        </motion.div>

        {/* add traveler form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 overflow-hidden"
            >
              <div
                className="rounded-2xl p-6 border"
                style={{
                  borderColor: "var(--hairline)",
                  backgroundColor: "var(--space-700)",
                }}
              >
                <form onSubmit={handleAdd} noValidate className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      id="t-from"
                      label="From country"
                      placeholder="e.g. TR"
                      value={addForm.fromCountry}
                      onChange={(v) => setAddForm((f) => ({ ...f, fromCountry: v }))}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 2a10 10 0 1 0 10 10H12V2z" fill="currentColor" fillOpacity="0.2" />
                          <path d="M12 2a10 10 0 0 1 10 10h-10V2z" />
                          <line x1="2" y1="12" x2="12" y2="12" />
                          <line x1="2" y1="6" x2="12" y2="6" />
                          <line x1="2" y1="18" x2="12" y2="18" />
                        </svg>
                      }
                    />
                    <Field
                      id="t-to"
                      label="To country"
                      placeholder="e.g. DE"
                      value={addForm.toCountry}
                      onChange={(v) => setAddForm((f) => ({ ...f, toCountry: v }))}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 2a10 10 0 1 0 10 10H12V2z" fill="currentColor" fillOpacity="0.2" />
                          <path d="M12 2a10 10 0 0 1 10 10h-10V2z" />
                          <line x1="2" y1="12" x2="12" y2="12" />
                          <line x1="2" y1="6" x2="12" y2="6" />
                          <line x1="2" y1="18" x2="12" y2="18" />
                        </svg>
                      }
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field
                      id="t-day"
                      label="Travel day"
                      placeholder="50"
                      inputMode="numeric"
                      value={addForm.travelDay}
                      onChange={(v) => setAddForm((f) => ({ ...f, travelDay: v }))}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      }
                    />
                    <Field
                      id="t-cap"
                      label="Capacity (g)"
                      placeholder="1000"
                      inputMode="numeric"
                      value={addForm.capacityG}
                      onChange={(v) => setAddForm((f) => ({ ...f, capacityG: v }))}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20.8V4.2" />
                          <path d="M5 4.2c1.5 2 3.5 3.5 7 3.5s5.5-1.5 7-3.5" />
                          <path d="M12 4.2c-1 0-2-.5-2.5-1" />
                          <path d="M12 4.2c1 0 2-.5 2.5-1" />
                        </svg>
                      }
                    />
                    <Field
                      id="t-rep"
                      label="Reputation (0–100)"
                      placeholder="80"
                      inputMode="numeric"
                      value={addForm.reputation}
                      onChange={(v) => setAddForm((f) => ({ ...f, reputation: v }))}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      }
                    />
                  </div>
                  <GlowingButton type="submit" className="w-full">
                    Add traveler
                  </GlowingButton>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* filters + travelers grid or empty state */}
        <div className="mt-10">
          {travelers.length > 0 && (
            <MatchFilters value={filters} onChange={setFilters} capacityLabel="Capacity" className="mb-6" />
          )}
          <motion.h2
            className="mb-6 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--ink-dim)" }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {visible.length} of {travelers.length} traveler{travelers.length !== 1 ? "s" : ""}
          </motion.h2>

          {travelers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
              style={{ borderColor: "color-mix(in srgb, var(--star-yellow) 13%, transparent)" }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--star-yellow)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                opacity={0.4}
                className="mb-4"
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
              <p className="text-lg font-medium" style={{ color: "color-mix(in srgb, var(--ink) 50%, transparent)" }}>No travelers yet</p>
              <p className="mt-1 text-sm" style={{ color: "color-mix(in srgb, var(--ink) 30%, transparent)" }}>
                Add the first traveler using the button above.
              </p>
            </motion.div>
          ) : visible.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border py-16 text-center"
              style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}
            >
              <p className="text-lg font-medium" style={{ color: "color-mix(in srgb, var(--ink) 50%, transparent)" }}>
                No travelers match your filters
              </p>
              <button
                type="button"
                data-testid="clear-filters"
                onClick={() => setFilters(defaultFilterState)}
                className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                style={{ borderColor: "var(--star-yellow, #FDDA24)", color: "var(--star-yellow, #FDDA24)" }}
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  transition={{ delay: 0.08 * i, duration: 0.45, ease: "easeOut" }}
                  whileHover={{ y: -2 }}
                >
                  <BoardingPassCard
                    variant="traveler"
                    from={t.fromCountry}
                    to={t.toCountry}
                    capacityG={t.capacityG}
                    reputation={t.reputation}
                    travelDay={t.travelDay}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  inputMode,
  icon,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  inputMode?: "numeric";
  icon?: React.ReactNode;
  onChange: (v: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}>
        {icon && <span style={{ color: "color-mix(in srgb, var(--ink) 40%, transparent)" }}>{icon}</span>}
        {label}
      </label>
      <motion.input
        id={id}
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2.5 text-sm text-ink placeholder:text-white/25 outline-none"
        style={{
          borderColor: "color-mix(in srgb, var(--star-yellow) 27%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--space-900) 60%, transparent)",
        }}
        whileFocus={{ borderColor: "var(--star-yellow)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--star-yellow) 9%, transparent)" }}
      />
    </motion.div>
  );
}
