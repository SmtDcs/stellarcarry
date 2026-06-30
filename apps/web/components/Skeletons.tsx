"use client";

import { cn } from "@/lib/utils";

const STELLAR = "#FDDA24";

function Pulse({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg", className)} style={{ background: `${STELLAR}08` }} />
  );
}

export function ReputationSkeleton() {
  return (
    <div
      className="relative min-h-screen flex-1 overflow-hidden"
      style={{ backgroundColor: "var(--space-900, #05060A)" }}
      role="status"
      aria-label="Loading reputation profile"
    >
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-14">
        <div className="mb-12 text-center">
          <Pulse className="mx-auto mb-4 h-6 w-40" />
          <Pulse className="mx-auto mb-3 h-10 w-64" />
          <Pulse className="mx-auto h-4 w-56" />
        </div>
        <div className="mb-12 grid gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border p-6" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}>
              <Pulse className="mb-3 h-3 w-20" />
              <Pulse className="h-9 w-16" />
            </div>
          ))}
        </div>
        <div>
          <Pulse className="mb-4 h-4 w-32" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border p-5" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Pulse className="h-4 w-48" />
                    <Pulse className="h-3 w-32" />
                  </div>
                  <Pulse className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-4 flex gap-4">
                  <Pulse className="h-3 w-20" />
                  <Pulse className="h-3 w-24" />
                  <Pulse className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MatchSkeleton() {
  return (
    <div
      className="relative min-h-screen flex-1 overflow-hidden"
      style={{ backgroundColor: "var(--space-900, #05060A)" }}
      role="status"
      aria-label="Loading match results"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="mb-3">
          <Pulse className="h-6 w-32 rounded-full" />
        </div>
        <Pulse className="mb-2 h-12 w-64" />
        <Pulse className="mb-8 h-5 w-80" />
        <div className="mb-10 flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Pulse key={i} className="h-9 w-24 rounded-lg" />
          ))}
        </div>
        <Pulse className="h-24 w-full max-w-lg rounded-xl" />
        <div className="mt-4">
          <Pulse className="mb-3 h-4 w-32" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border p-6" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}>
              <Pulse className="mb-3 h-8 w-24" />
              <Pulse className="mb-2 h-4 w-40" />
              <Pulse className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EscrowSkeleton() {
  return (
    <div
      className="relative min-h-screen flex-1 overflow-hidden"
      style={{ backgroundColor: "var(--space-900, #05060A)" }}
      role="status"
      aria-label="Loading escrow dashboard"
    >
      <div className="relative z-10 mx-auto max-w-2xl px-6 pb-16 pt-14">
        <div className="mb-10 text-center">
          <Pulse className="mx-auto mb-2 h-6 w-32 rounded-full" />
          <Pulse className="mx-auto mb-2 h-10 w-56" />
          <Pulse className="mx-auto h-4 w-48" />
        </div>
        <div className="mb-10 flex justify-center">
          <Pulse className="h-44 w-44 rounded-full" />
        </div>
        <div className="mb-8 rounded-2xl border p-6" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }}>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div><Pulse className="mb-1.5 h-3 w-16" /><Pulse className="h-5 w-20" /></div>
            <div><Pulse className="mb-1.5 h-3 w-16" /><Pulse className="h-5 w-20" /></div>
            <div><Pulse className="mb-1.5 h-3 w-16" /><Pulse className="h-5 w-24" /></div>
            <div><Pulse className="mb-1.5 h-3 w-16" /><Pulse className="h-5 w-28" /></div>
          </div>
          <div className="border-t mb-6" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))" }} />
          <Pulse className="h-16 w-full" />
        </div>
        <div className="mb-8">
          <Pulse className="mb-3 h-4 w-16" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Pulse key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
