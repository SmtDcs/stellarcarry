// StellarCarry shooting-star mark — a star spark whose tail curves into
// a flight-path arc, rendered in var(--star-yellow). Custom (not the
// official Stellar logo) to avoid trademark.

export function ShootingStarLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="StellarCarry logo"
      className={className}
    >
      {/* Flight-path arc — the comet's trail sweeping upward */}
      <path
        d="M6 34 C6 22, 18 10, 30 12 C38 13.5, 42 20, 42 28"
        stroke="var(--star-yellow, #FDDA24)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {/* Inner accent arc */}
      <path
        d="M10 32 C10 24, 20 14, 30 16 C36 17.5, 39 22, 39 28"
        stroke="var(--star-yellow, #FDDA24)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />
      {/* Shooting star head — a four-pointed star */}
      <path
        d="M34 9 L35.5 13 L39.5 14 L35.5 15 L34 19 L32.5 15 L28.5 14 L32.5 13 Z"
        fill="var(--star-yellow, #FDDA24)"
      />
      {/* Star glow */}
      <circle cx="34" cy="14" r="4" fill="var(--star-yellow, #FDDA24)" opacity="0.15" />
    </svg>
  );
}

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return <ShootingStarLogo size={size} className={className} />;
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Logo size={28} />
      <span className="font-display text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
        Stellar<span style={{ color: "var(--star-yellow, #FDDA24)" }}>Carry</span>
      </span>
    </div>
  );
}
