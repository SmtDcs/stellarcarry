"use client";

import { ShootingStarLogo, Wordmark, PlaneIcon, GlobeIcon, LuggageIcon, PassportIcon, VaultIcon, StarIcon } from "@/components/brand";
import {
  StarField,
  FlightArc,
  StarMapRoute,
  WorldStarMap,
  BoardingPassCard,
  DepartureBoard,
  PassportStamp,
  PassportPage,
  VaultSeal,
} from "@/components/travel";
import type {
  BoardingPassRequest,
  BoardingPassTraveler,
  BoardingPassMatch,
  VaultSealState,
} from "@/components/travel";

/* ── Section wrapper ─────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="font-display text-lg font-bold tracking-tight mb-6 pb-3 border-b border-hairline">
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ── Sub-section ─────────────────────────────────────────────── */

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="font-mono text-xs uppercase tracking-[0.15em] mb-4 text-ink-dim">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

/* ── State badge ─────────────────────────────────────────────── */

function StateBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium mb-2 border border-hairline text-ink-dim bg-hairline-dim"
    >
      {children}
    </span>
  );
}

/* ── Sample data ─────────────────────────────────────────────── */

const requestData: BoardingPassRequest = {
  variant: "request",
  from: "TR",
  to: "DE",
  itemWeightG: 500,
  rewardStroops: 50_000_000,
  gate: "B7",
  flight: "SC401",
  status: "open",
};

const travelerData: BoardingPassTraveler = {
  variant: "traveler",
  from: "TR",
  to: "DE",
  capacityG: 1000,
  reputation: 87,
  travelDay: 50,
  flight: "SC402",
};

const matchData: BoardingPassMatch = {
  variant: "match",
  from: "TR",
  to: "DE",
  itemWeightG: 500,
  rewardStroops: 50_000_000,
  reputation: 92,
  score: 94,
};

const boardRows = [
  { label: "Status", value: "BOARDING" },
  { label: "Requests", value: "24" },
  { label: "Travelers", value: "8" },
  { label: "Escrowed", value: "1,250 XLM" },
];

const stampData = [
  { country: "TR", date: "2026-01-15", status: "DELIVERED", amountStroops: 50_000_000, counterparty: "GBUYER1ABCDEFGHIJKLM", rotation: -6 },
  { country: "DE", date: "2026-02-03", status: "DELIVERED", amountStroops: 30_000_000, counterparty: "GBUYER2ABCDEFGHIJKLM", rotation: 8 },
  { country: "FR", date: "2026-03-22", status: "DELIVERED", amountStroops: 75_000_000, counterparty: "GBUYER3ABCDEFGHIJKLM", rotation: -3 },
  { country: "JP", date: "2026-04-11", status: "DELIVERED", amountStroops: 120_000_000, counterparty: "GBUYER4ABCDEFGHIJKLM", rotation: 5 },
  { country: "US", date: "2026-05-07", status: "REFUNDED", amountStroops: 10_000_000, counterparty: "GBUYER5ABCDEFGHIJKLM", rotation: -10 },
];

const vaultStates: VaultSealState[] = [
  "created",
  "funded",
  "delivered",
  "released",
  "refunded",
];

/* ── Page ─────────────────────────────────────────────────────── */

export default function KitGalleryPage() {
  return (
    <div className="min-h-screen py-12 px-6 bg-space-800">
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <header className="mb-12">
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2 text-foreground">
            Departures · Design Kit
          </h1>
          <p className="text-sm text-ink-dim">
            All components in their states. Built from tokens in globals.css.
          </p>
        </header>

        {/* ── Brand ── */}
        <Section title="Brand">
          <SubSection title="Logo">
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <StateBadge>default</StateBadge>
                <ShootingStarLogo size={48} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <StateBadge>small</StateBadge>
                <ShootingStarLogo size={24} />
              </div>
            </div>
          </SubSection>

          <SubSection title="Wordmark">
            <div className="flex flex-col gap-4">
              <div>
                <StateBadge>default</StateBadge>
                <Wordmark />
              </div>
              <div>
                <StateBadge>with className</StateBadge>
                <Wordmark className="scale-150 origin-left" />
              </div>
            </div>
          </SubSection>

          <SubSection title="Icon Set">
            <div className="flex flex-wrap gap-6 items-center">
              {[
                { Icon: PlaneIcon, label: "Plane" },
                { Icon: GlobeIcon, label: "Globe" },
                { Icon: LuggageIcon, label: "Luggage" },
                { Icon: PassportIcon, label: "Passport" },
                { Icon: VaultIcon, label: "Vault" },
                { Icon: StarIcon, label: "Star" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon size={28} strokeWidth={1.8} className="text-foreground" />
                  <span className="text-[10px] uppercase tracking-widest text-ink-dim">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ── StarField ── */}
        <Section title="StarField">
          <SubSection title="With parallax (hover to see parallax)">
            <div className="rounded-xl overflow-hidden border border-hairline" style={{ height: 240 }}>
              <StarField starCount={100} parallax={0.8} animate />
            </div>
          </SubSection>
          <SubSection title="Static (no animation)">
            <div className="rounded-xl overflow-hidden border border-hairline" style={{ height: 240 }}>
              <StarField starCount={60} parallax={0} animate={false} />
            </div>
          </SubSection>
        </Section>

        {/* ── FlightArc ── */}
        <Section title="FlightArc">
          <SubSection title="Default (animated)">
            <FlightArc from="IST" to="BER" width={400} height={160} animate />
          </SubSection>
          <SubSection title="Static (no animation)">
            <FlightArc from="NRT" to="SFO" width={400} height={160} animate={false} />
          </SubSection>
        </Section>

        {/* ── WorldStarMap ── */}
        <Section title="WorldStarMap">
          <SubSection title="Istanbul → Tokyo (drag to pan, pinch to zoom)">
            <WorldStarMap from="TR" to="JP" />
          </SubSection>
          <SubSection title="Paris → London">
            <WorldStarMap from="FR" to="GB" />
          </SubSection>
        </Section>

        {/* ── StarMapRoute ── */}
        <Section title="StarMapRoute">
          <SubSection title="Default (animated)">
            <StarMapRoute from="Istanbul" to="Berlin" animate width={600} height={300} />
          </SubSection>
          <SubSection title="Static (no animation)">
            <StarMapRoute from="Tokyo" to="San Francisco" animate={false} width={600} height={300} />
          </SubSection>
          <SubSection title="Custom coords">
            <StarMapRoute
              from="Paris"
              to="London"
              fromCoord={[80, 180]}
              toCoord={[500, 100]}
              animate={false}
              width={600}
              height={300}
            />
          </SubSection>
        </Section>

        {/* ── BoardingPassCard ── */}
        <Section title="BoardingPassCard">
          <SubSection title="Request variant">
            <StateBadge>open</StateBadge>
            <BoardingPassCard {...requestData} />
          </SubSection>

          <SubSection title="Request variant (in-transit)">
            <StateBadge>in-transit</StateBadge>
            <BoardingPassCard {...requestData} status="in-transit" />
          </SubSection>

          <SubSection title="Traveler variant">
            <StateBadge>traveler</StateBadge>
            <BoardingPassCard {...travelerData} />
          </SubSection>

          <SubSection title="Match variant">
            <StateBadge>match</StateBadge>
            <BoardingPassCard {...matchData} />
          </SubSection>

          <SubSection title="With custom stub content">
            <StateBadge>custom stub</StateBadge>
            <BoardingPassCard
              {...requestData}
              stubContent={
                <div className="text-center space-y-1">
                  <div className="font-display text-lg font-bold text-star">
                    A+
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-ink-dim">Priority</div>
                </div>
              }
            />
          </SubSection>

          <SubSection title="Empty (no requests)">
            <StateBadge>empty</StateBadge>
            <div
              role="article"
              aria-label="No boarding passes"
              className="relative w-full max-w-md rounded-xl border border-hairline bg-space-900 p-8"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ink-dim, #8A8B96)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-40"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <p className="font-mono text-sm text-ink-dim">
                  No requests yet
                </p>
                <p className="text-xs text-ink-dim opacity-60">
                  Create a request to see your boarding pass
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Loading skeleton">
            <StateBadge>loading</StateBadge>
            <div className="relative w-full max-w-md rounded-xl border border-hairline bg-space-900 overflow-hidden">
              <div className="flex">
                <div className="flex-1 p-5 pr-2 space-y-3">
                  <div className="h-3 w-24 bg-hairline-dim rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-7 w-40 bg-hairline-dim rounded animate-pulse" />
                    <div className="h-3 w-36 bg-hairline-dim rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <div className="h-2 w-12 bg-hairline-dim rounded animate-pulse" />
                      <div className="h-4 w-16 bg-hairline-dim rounded animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-12 bg-hairline-dim rounded animate-pulse" />
                      <div className="h-4 w-20 bg-hairline-dim rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-end gap-[1px] h-8">
                      {Array.from({ length: 28 }, (_, i) => (
                        <div
                          key={i}
                          className="w-[2px] rounded-t-sm bg-hairline-dim animate-pulse"
                          style={{
                            height: `${20 + (i % 5) * 8}%`,
                            animationDelay: `${i * 40}ms`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-1 h-2 w-32 bg-hairline-dim rounded animate-pulse" />
                  </div>
                </div>
                <div className="relative flex flex-col items-center justify-center w-[2px]">
                  <div className="absolute inset-y-0 w-px bg-hairline-dim" />
                  <div className="absolute -left-[5px] top-4 h-[10px] w-[10px] rounded-full bg-space-800 border border-hairline" />
                  <div className="absolute -left-[5px] bottom-4 h-[10px] w-[10px] rounded-full bg-space-800 border border-hairline" />
                </div>
                <div className="flex flex-col items-center justify-center w-[90px] p-4 space-y-3">
                  <div className="h-5 w-14 bg-hairline-dim rounded-full animate-pulse" />
                  <div className="space-y-1 text-center">
                    <div className="h-7 w-12 bg-hairline-dim rounded animate-pulse mx-auto" />
                    <div className="h-2 w-10 bg-hairline-dim rounded animate-pulse mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </SubSection>
        </Section>

        {/* ── DepartureBoard ── */}
        <Section title="DepartureBoard">
          <SubSection title="Default board">
            <DepartureBoard rows={boardRows} />
          </SubSection>
          <SubSection title="Empty board (no active escrows)">
            <StateBadge>empty</StateBadge>
            <DepartureBoard
              rows={[
                { label: "Status", value: "---------" },
                { label: "Requests", value: "---" },
                { label: "Travelers", value: "---" },
                { label: "Escrowed", value: "-----------" },
              ]}
            />
          </SubSection>
        </Section>

        {/* ── PassportStamp ── */}
        <Section title="PassportStamp">
          <SubSection title="Individual stamps">
            <div className="flex flex-wrap gap-6">
              {stampData.map((stamp, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <StateBadge>{stamp.status}</StateBadge>
                  <PassportStamp
                    country={stamp.country}
                    date={stamp.date}
                    status={stamp.status}
                    amountStroops={stamp.amountStroops}
                    counterparty={stamp.counterparty}
                    rotation={stamp.rotation}
                    animate={false}
                  />
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ── PassportPage ── */}
        <Section title="PassportPage">
          <SubSection title="With stamps">
            <PassportPage
              stamps={stampData}
              owner="GUSER1ABCDEFGHIJKLMNOP"
              score={87}
            />
          </SubSection>
          <SubSection title="Empty (no stamps)">
            <PassportPage stamps={[]} owner="GUSER1ABCDEFGHIJKLMNOP" score={0} />
          </SubSection>
        </Section>

        {/* ── VaultSeal ── */}
        <Section title="VaultSeal">
          <SubSection title="Uninitialized (no escrow)">
            <StateBadge>uninitialized</StateBadge>
            <div className="flex flex-col items-center">
              <div
                role="status"
                aria-label="No escrow vault"
                className="relative flex flex-col items-center"
              >
                <div
                  className="flex flex-col items-center justify-center rounded-full border-2 border-dashed"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderColor: "var(--hairline, rgba(255,255,255,0.08))",
                    backgroundColor: "var(--hairline-dim, rgba(255,255,255,0.04))",
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--ink-dim, #8A8B96)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-30"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="mt-4 text-center">
                  <div
                    className="font-display text-sm font-semibold uppercase tracking-[0.15em]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "var(--ink-dim, #8A8B96)",
                    }}
                  >
                    No Escrow
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-[0.2em] mt-0.5"
                    style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.6 }}
                  >
                    Create a request to begin
                  </div>
                </div>
              </div>
            </div>
          </SubSection>

          <SubSection title="Escrow lifecycle">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {vaultStates.map((s) => (
              <div key={s} className="flex flex-col items-center">
                <StateBadge>{s}</StateBadge>
                <VaultSeal
                  state={s}
                  amountStroops={s !== "created" ? 50_000_000 : undefined}
                />
              </div>
            ))}
          </div>
          </SubSection>
        </Section>

        {/* ── Footer ── */}
        <footer className="mt-20 pt-8 border-t border-hairline text-center">
          <p className="text-xs text-ink-dim">
            Departures design system · StellarCarry · All tokens from globals.css
          </p>
        </footer>
      </div>
    </div>
  );
}
