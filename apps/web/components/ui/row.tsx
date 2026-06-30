import type { ReactNode } from "react";

const STELLAR = "#FDDA24";

export function Row({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="inline-flex items-center gap-1.5 text-white/45">
        {icon}
        {label}
      </span>
      <span
        className={accent ? "font-semibold" : "text-white/90"}
        style={accent ? { color: STELLAR } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
