"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Spotlight } from "@/components/ui/spotlight-new";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { GlowingButton } from "@/components/ui/glowing-button";
import { FlightArc } from "@/components/travel/flight-arc";
import { StarField } from "@/components/travel/star-field";
import { BoardingPassCard } from "@/components/travel/boarding-pass-card";
import { PlaneIcon } from "@/components/brand/icons";

interface FormData {
  fromCountry: string;
  toCountry: string;
  itemWeightG: string;
  rewardXLM: string;
  deadlineDay: string;
}

interface FormErrors {
  fromCountry?: string;
  toCountry?: string;
  itemWeightG?: string;
  rewardXLM?: string;
  deadlineDay?: string;
}

const initialForm: FormData = {
  fromCountry: "",
  toCountry: "",
  itemWeightG: "",
  rewardXLM: "",
  deadlineDay: "",
};

function validate(form: FormData): FormErrors {
  const errs: FormErrors = {};

  if (!form.fromCountry.trim()) errs.fromCountry = "From country is required";
  else if (!/^[A-Za-z]{2}$/.test(form.fromCountry.trim()))
    errs.fromCountry = "Use a valid ISO country code (e.g. TR)";

  if (!form.toCountry.trim()) errs.toCountry = "To country is required";
  else if (!/^[A-Za-z]{2}$/.test(form.toCountry.trim()))
    errs.toCountry = "Use a valid ISO country code (e.g. DE)";

  const weight = Number(form.itemWeightG);
  if (!form.itemWeightG.trim()) errs.itemWeightG = "Weight is required";
  else if (!Number.isInteger(weight) || weight <= 0)
    errs.itemWeightG = "Enter a positive whole number (grams)";

  const reward = Number(form.rewardXLM);
  if (!form.rewardXLM.trim()) errs.rewardXLM = "Reward is required";
  else if (!Number.isInteger(reward) || reward <= 0)
    errs.rewardXLM = "Enter a positive whole number (XLM)";

  const deadline = Number(form.deadlineDay);
  if (!form.deadlineDay.trim()) errs.deadlineDay = "Deadline is required";
  else if (!Number.isInteger(deadline) || deadline <= 0)
    errs.deadlineDay = "Enter a positive whole number (days from today)";

  return errs;
}

const XLM_TO_STROOPS = 10_000_000;

export default function PostPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const update = (field: keyof FormData, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched.has(field)) {
      setErrors(validate(next));
    }
  };

  const blur = (field: keyof FormData) => {
    const nextTouched = new Set(touched);
    nextTouched.add(field);
    setTouched(nextTouched);
    setErrors(validate(form));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched(new Set(["fromCountry", "toCountry", "itemWeightG", "rewardXLM", "deadlineDay"]));
    if (Object.keys(errs).length === 0) {
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        setSubmitted(true);
      }, 600);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setSubmitted(false);
    setSubmitting(false);
    setTouched(new Set());
  };

  const routeFrom = form.fromCountry.trim().toUpperCase();
  const routeTo = form.toCountry.trim().toUpperCase();

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden text-ink" style={{ backgroundColor: "var(--space-800)" }}>
      <StarField starCount={40} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.10 }} />
      <Spotlight />
      <BackgroundBeams className="pointer-events-none opacity-[0.04]" />

      <div className="relative z-10 mx-auto max-w-2xl px-6 pb-24 pt-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <PlaneIcon size={18} style={{ color: "var(--star-yellow)" }} />
            <span
              className="font-display text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: "var(--ink-dim)" }}
            >
              Manifest
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">Post a request</h1>
          <p className="mt-2" style={{ color: "color-mix(in srgb, var(--ink) 50%, transparent)" }}>
            Fill in the details and your funds will be held in a Soroban escrow until delivery.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="mt-10"
            >
              <div
                className="rounded-2xl p-8 text-center border"
                style={{
                  borderColor: "var(--hairline)",
                  backgroundColor: "var(--space-700)",
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "var(--star-yellow-dim)" }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--star-yellow)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </motion.div>
                <h2 className="text-xl font-semibold">Request posted!</h2>
                <p className="mt-2" style={{ color: "color-mix(in srgb, var(--ink) 50%, transparent)" }}>
                  Travelers will see your request and can carry it for the reward.
                </p>
                <motion.div
                  className="mx-auto mt-6 max-w-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <BoardingPassCard
                    variant="request"
                    from={routeFrom}
                    to={routeTo}
                    itemWeightG={Number(form.itemWeightG)}
                    rewardStroops={Number(form.rewardXLM) * XLM_TO_STROOPS}
                    status="open"
                  />
                </motion.div>
                <div className="mt-6">
                  <GlowingButton onClick={handleReset}>Post another request</GlowingButton>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              noValidate
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-10"
            >
              <div
                className="rounded-2xl p-6 border"
                style={{
                  borderColor: "var(--hairline)",
                  backgroundColor: "var(--space-700)",
                }}
              >
                {/* Flight arc header */}
                <div className="mb-4 flex justify-center">
                  {form.fromCountry.trim() && form.toCountry.trim() ? (
                    <FlightArc
                      from={routeFrom}
                      to={routeTo}
                      animate={false}
                      width={320}
                      height={120}
                    />
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <span className="font-mono text-xs uppercase tracking-[0.15em]" style={{ color: "var(--ink-dim)" }}>
                        Route preview
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      id="fromCountry"
                      label="From country"
                      placeholder="e.g. TR"
                      value={form.fromCountry}
                      error={touched.has("fromCountry") ? errors.fromCountry : undefined}
                      onChange={(v) => update("fromCountry", v)}
                      onBlur={() => blur("fromCountry")}
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
                      id="toCountry"
                      label="To country"
                      placeholder="e.g. DE"
                      value={form.toCountry}
                      error={touched.has("toCountry") ? errors.toCountry : undefined}
                      onChange={(v) => update("toCountry", v)}
                      onBlur={() => blur("toCountry")}
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
                      id="itemWeightG"
                      label="Item weight (g)"
                      placeholder="500"
                      inputMode="numeric"
                      value={form.itemWeightG}
                      error={touched.has("itemWeightG") ? errors.itemWeightG : undefined}
                      onChange={(v) => update("itemWeightG", v)}
                      onBlur={() => blur("itemWeightG")}
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
                      id="rewardXLM"
                      label="Reward (XLM)"
                      placeholder="5"
                      inputMode="numeric"
                      value={form.rewardXLM}
                      error={touched.has("rewardXLM") ? errors.rewardXLM : undefined}
                      onChange={(v) => update("rewardXLM", v)}
                      onBlur={() => blur("rewardXLM")}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="6" x2="12" y2="12" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                      }
                    />
                    <Field
                      id="deadlineDay"
                      label="Deadline (day)"
                      placeholder="100"
                      inputMode="numeric"
                      value={form.deadlineDay}
                      error={touched.has("deadlineDay") ? errors.deadlineDay : undefined}
                      onChange={(v) => update("deadlineDay", v)}
                      onBlur={() => blur("deadlineDay")}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      }
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <GlowingButton
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Post request"
                    )}
                  </GlowingButton>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  error,
  inputMode,
  icon,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  inputMode?: "numeric";
  icon?: React.ReactNode;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}>
        {icon && (
          <motion.span
            className="inline-flex items-center"
            style={{ color: "color-mix(in srgb, var(--star-yellow) 60%, transparent)" }}
            whileHover={{ color: "var(--star-yellow)", scale: 1.15 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.span>
        )}
        {label}
      </label>
      <motion.input
        id={id}
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-lg border px-3 py-2.5 text-sm text-ink placeholder:text-white/25 outline-none transition-shadow duration-200"
        style={{
          borderColor: error ? "#ef4444" : "color-mix(in srgb, var(--star-yellow) 27%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--space-900) 60%, transparent)",
        }}
        whileFocus={{
          borderColor: error ? "#ef4444" : "var(--star-yellow)",
          boxShadow: "0 0 0 3px color-mix(in srgb, var(--star-yellow) 12%, transparent)",
          scale: 1.008,
          transition: { duration: 0.25, ease: "easeOut" },
        }}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            className="mt-1 text-xs text-red-400"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
