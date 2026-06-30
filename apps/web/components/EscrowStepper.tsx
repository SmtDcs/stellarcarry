"use client";

import { motion } from "motion/react";
import { EscrowState } from "@stellarcarry/core";
import { cn } from "@/lib/utils";

const STELLAR = "#FDDA24";

const STEPS = [
  { state: EscrowState.Created, label: "Created" },
  { state: EscrowState.Funded, label: "Funded" },
  { state: EscrowState.Delivered, label: "Delivered" },
  { state: EscrowState.Released, label: "Released" },
] as const;

const REFUNDED_STEP = { state: EscrowState.Refunded, label: "Refunded" };

const stateOrder: Record<EscrowState, number> = {
  [EscrowState.Created]: 0,
  [EscrowState.Funded]: 1,
  [EscrowState.Delivered]: 2,
  [EscrowState.Released]: 3,
  [EscrowState.Refunded]: -1, // branch
};

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Dot({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-500",
        active && "border-[#FDDA24] bg-[#FDDA24]/15",
        completed && !active && "border-[#FDDA24]/60 bg-[#FDDA24]/10",
        !active && !completed && "border-white/15 bg-transparent",
      )}
    >
      {completed && !active && (
        <motion.span
          className="text-[#FDDA24]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <CheckIcon />
        </motion.span>
      )}
      {active && (
        <motion.span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: STELLAR, boxShadow: `0 0 12px ${STELLAR}99` }}
          layoutId="stepper-active-dot"
        />
      )}
    </div>
  );
}

function Connector({
  active,
  completed,
  isRefundBranch,
}: {
  active: boolean;
  completed: boolean;
  isRefundBranch?: boolean;
}) {
  return (
    <div
      className={cn(
        "h-0.5 flex-1 min-w-[24px] transition-colors duration-500",
        isRefundBranch && "rotate-45 origin-left scale-x-[1.15]",
        completed && !isRefundBranch && "bg-[#FDDA24]/50",
        completed && isRefundBranch && "bg-red-500/50",
        active && "bg-[#FDDA24]",
        !active && !completed && "bg-white/10",
      )}
    >
      {active && (
        <motion.div
          className="h-full bg-[#FDDA24]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

function LabelText({
  label,
  active,
  completed,
  refunded,
}: {
  label: string;
  active: boolean;
  completed: boolean;
  refunded?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium transition-colors duration-500 whitespace-nowrap",
        active && "text-[#FDDA24]",
        completed && !active && "text-[#FDDA24]/70",
        !active && !completed && "text-white/30",
        refunded && "text-red-400/80",
      )}
    >
      {label}
    </span>
  );
}

export function EscrowStepper({ currentState }: { currentState: EscrowState }) {
  const isRefunded = currentState === EscrowState.Refunded;
  const currentIdx = stateOrder[currentState];

  return (
    <div className="relative">
      {/* Main path: Created — Funded — Delivered — Released */}
      <div className="flex items-center gap-0 px-2">
        {STEPS.map((step, i) => {
          const active = currentIdx === i;
          const completed = currentIdx > i;

          return (
            <div key={step.state} className="flex items-center gap-0 flex-1 last:flex-[0_0_auto]">
              <motion.div
                className="flex flex-col items-center gap-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
              >
                <Dot active={active} completed={completed} />
                <LabelText label={step.label} active={active} completed={completed} />
              </motion.div>
              {i < STEPS.length - 1 && (
                <Connector
                  active={active}
                  completed={completed}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Refund branch — splits downward from Funded */}
      <div className="relative mt-4 flex items-start">
        {/* Diagonal line from Funded to Refunded */}
        <div className="ml-[calc(25%+16px)] flex items-start">
          <svg
            width="80"
            height="56"
            viewBox="0 0 80 56"
            className="-mt-1"
            aria-hidden="true"
          >
            {/* vertical down */}
            <line
              x1="0" y1="0" x2="0" y2="28"
              stroke={isRefunded ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              strokeWidth="2"
            />
            {/* horizontal to the Refunded dot */}
            <line
              x1="0" y1="28" x2="60" y2="28"
              stroke={isRefunded ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              strokeWidth="2"
            />
            {/* dot connection indicator */}
            {isRefunded && (
              <>
                <motion.line
                  x1="0" y1="0" x2="0" y2="28"
                  stroke="rgba(239,68,68,0.8)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
                <motion.line
                  x1="0" y1="28" x2="60" y2="28"
                  stroke="rgba(239,68,68,0.8)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut", delay: 0.4 }}
                />
              </>
            )}
          </svg>

          {/* Refunded step */}
          <motion.div
            className="-ml-4 -mt-4 flex flex-col items-center gap-1.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-500",
                isRefunded && "border-red-500/70 bg-red-500/15",
                !isRefunded && "border-white/10 bg-transparent",
              )}
            >
              {isRefunded && (
                <motion.span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: "#EF4444", boxShadow: "0 0 12px rgba(239,68,68,0.6)" }}
                  layoutId="stepper-refund-dot"
                />
              )}
            </div>
            <LabelText
              label={REFUNDED_STEP.label}
              active={isRefunded}
              completed={isRefunded}
              refunded
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
