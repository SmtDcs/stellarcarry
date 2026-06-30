// StellarCarry icon set — lucide primitives where thick enough,
// custom SVG paths where lucide is too thin for the Departures aesthetic.
// All icons accept size + className and use currentColor.

import {
  Plane,
  Globe,
  Luggage,
  BookOpen,
  ShieldCheck,
  Star,
  type LucideProps,
} from "lucide-react";

type IconProps = Omit<LucideProps, "ref">;

export function PlaneIcon(props: IconProps) {
  return <Plane {...props} />;
}

export function GlobeIcon(props: IconProps) {
  return <Globe {...props} />;
}

export function LuggageIcon(props: IconProps) {
  return <Luggage {...props} />;
}

export function PassportIcon(props: IconProps) {
  return <BookOpen {...props} />;
}

// Vault/Shield — lucide ShieldCheck with a custom lock overlay for heft
export function VaultIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Vault"
      className={className}
      {...props}
    >
      {/* Shield body */}
      <path d="M12 22s-8-4.5-8-11.8V5l8-3 8 3v5.2c0 7.3-8 11.8-8 11.8z" />
      {/* Checkmark */}
      <path d="m9 12 2 2 4-4" />
      {/* Lock body */}
      <rect x="10" y="15.5" width="4" height="3" rx="0.5" />
      {/* Lock shackle */}
      <path d="M10.5 15.5v-1.5a1.5 1.5 0 0 1 3 0v1.5" />
    </svg>
  );
}

// Star — custom shooting-star variant, bolder than lucide Star
export function StarIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Star"
      className={className}
      {...props}
    >
      {/* Four-pointed star */}
      <path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2z" />
      {/* Comet trail */}
      <path d="M19 9c1 1.5 2 4 1.5 6.5" opacity="0.5" />
      <path d="M14.5 12c1 1 1.5 2.5 1 4" opacity="0.3" />
    </svg>
  );
}
