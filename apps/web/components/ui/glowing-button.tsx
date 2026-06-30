"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { motion } from "motion/react";
import Link from "next/link";

const STELLAR = "#FDDA24";

const MotionLink = motion(Link);

const baseClasses =
  "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-black shadow-[0_8px_40px_-8px_rgba(253,218,36,0.5)] transition-colors";
const hoverShadow = "0 12px 48px -8px rgba(253,218,36,0.6)";
const spring = { type: "spring" as const, stiffness: 400, damping: 17 };

export function GlowingButton({
  children,
  onClick,
  href,
  disabled,
  className,
  type,
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  [key: string]: unknown;
}) {
  const cls = className ? `${baseClasses} ${className}` : baseClasses;

  const motionProps = {
    className: cls,
    style: { background: STELLAR, opacity: disabled ? 0.5 : 1 },
    whileHover: disabled ? undefined : { scale: 1.03, boxShadow: hoverShadow },
    whileTap: disabled ? undefined : { scale: 0.98 },
    transition: spring,
  };

  if (href) {
    return (
      <MotionLink
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(motionProps as any)}
        href={href}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(rest as any)}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(motionProps as any)}
      onClick={onClick}
      disabled={disabled}
      type={type ?? "button"}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}
