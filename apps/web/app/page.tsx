"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Spotlight } from "@/components/ui/spotlight-new";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { GlowingButton } from "@/components/ui/glowing-button";
import { StarField } from "@/components/travel/star-field";
import { WorldStarMap } from "@/components/travel/world-star-map";
import { BoardingPassCard } from "@/components/travel/boarding-pass-card";
import { seedRequests } from "@/lib/seed";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="relative min-h-screen flex-1 overflow-hidden text-ink" style={{ backgroundColor: "var(--space-800)" }}>
      <StarField starCount={50} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.12 }} />
      {/* hero */}
      <section className="relative">
        <Spotlight />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-12 pt-14 text-center">
          <motion.div
            className="relative mx-auto mb-6 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{
              borderColor: "color-mix(in srgb, var(--star-yellow) 40%, transparent)",
              background: "color-mix(in srgb, var(--star-yellow) 8%, transparent)",
              color: "var(--star-yellow)",
              boxShadow: "0 0 24px color-mix(in srgb, var(--star-yellow) 9%, transparent), inset 0 0 12px color-mix(in srgb, var(--star-yellow) 3%, transparent)",
            }}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ boxShadow: ["0 0 0px transparent", "0 0 18px color-mix(in srgb, var(--star-yellow) 20%, transparent)", "0 0 0px transparent"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              className="h-2 w-2 rounded-full"
              style={{
                background: "var(--star-yellow)",
                boxShadow: "0 0 8px color-mix(in srgb, var(--star-yellow) 53%, transparent)",
              }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" fill="currentColor" fillOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10h-10V2z" />
              <line x1="2" y1="12" x2="12" y2="12" />
              <line x1="2" y1="6" x2="12" y2="6" />
              <line x1="2" y1="18" x2="12" y2="18" />
            </svg>
            Soroban escrow on Stellar
          </motion.div>
          <motion.h1
            className="mx-auto max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl font-display"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
          >
            Shop the world.{" "}
            <span
              className="bg-gradient-to-r from-[#F5F3EC] via-[#FDE047] to-[#FDDA24] bg-clip-text text-transparent"
              style={{ textShadow: "0 0 80px color-mix(in srgb, var(--star-yellow) 25%, transparent)" }}
            >
              Carried by travelers,
            </span>{" "}
            secured on-chain.
          </motion.h1>
          <motion.p
            className="mx-auto mt-5 max-w-xl text-lg text-ink-dim"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            Post what you want from abroad. Travelers already headed there carry it — and your funds stay locked
            in a smart-contract escrow until you confirm delivery.
          </motion.p>

          {/* World-map route visual */}
          <motion.div
            className="mx-auto mt-10 max-w-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <WorldStarMap from="TR" to="JP" className="w-full" />
          </motion.div>

          <motion.div
            className="mt-8 flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlowingButton href="/post">Post a request</GlowingButton>
            <Link href="/travelers">
              <ShimmerButton className="px-6 py-3">Browse travelers</ShimmerButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* gradient fade divider */}
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div
          className="h-px w-full opacity-20"
          style={{
            background: "linear-gradient(90deg, transparent, var(--star-yellow), transparent)",
          }}
        />
      </div>

      {/* feed — open requests as boarding passes */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-16">
        <BackgroundBeams className="pointer-events-none opacity-[0.06]" />
        <motion.h2
          className="relative mb-6 text-xs font-semibold uppercase tracking-wider"
          style={{
            color: "color-mix(in srgb, var(--star-yellow) 67%, transparent)",
            textShadow: "0 0 12px color-mix(in srgb, var(--star-yellow) 13%, transparent)",
          }}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          Open requests
        </motion.h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {seedRequests.map((r, i) => (
            <motion.div
              key={r.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-64px" }}
              variants={cardVariants}
              transition={{ delay: 0.1 * i, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              className="flex flex-col gap-3"
            >
              <BoardingPassCard
                variant="request"
                from={r.fromCountry}
                to={r.toCountry}
                itemWeightG={r.itemWeightG}
                rewardStroops={r.rewardStroops}
                status="open"
              />
              <Link href="/post" className="block">
                <motion.button
                  className="w-full rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{
                    borderColor: "var(--hairline)",
                    color: "color-mix(in srgb, var(--ink) 85%, transparent)",
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Carry this →
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
