"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { EscrowState, EscrowClient } from "@stellarcarry/core";
import { isConnected, getAddress, setAllowed, isBrowser } from "@stellar/freighter-api";
import { EscrowStepper } from "@/components/EscrowStepper";
import { VaultSeal } from "@/components/travel/vault-seal";
import { StarField } from "@/components/travel/star-field";
import type { VaultSealState } from "@/components/travel/vault-seal";
import { cn } from "@/lib/utils";

const CONTRACT_ID = "CCRMSOOFXVD34F5RBDYI5X6DZ2Z5XJIV2GEWTRAP5T6NBXFPXYPDNJFC";

type WalletStatus = "idle" | "not-installed" | "disconnected" | "connected";

type ActionResult = {
  label: string;
  xdr: string;
  success: boolean;
  error?: { type: string; message: string };
  simulation?: Record<string, unknown>;
  txHash?: string;
};

type ErrorType = "auth" | "state" | "deadline" | "sequence" | "funds" | "not_found" | "validation" | "unknown";

const ERROR_LABELS: Record<ErrorType, { title: string; icon: string }> = {
  auth: { title: "Authorization Error", icon: "🔐" },
  state: { title: "State Transition Error", icon: "🚫" },
  deadline: { title: "Deadline Not Met", icon: "⏰" },
  sequence: { title: "Sequence Error", icon: "🔢" },
  funds: { title: "Insufficient Funds", icon: "💰" },
  not_found: { title: "Not Found", icon: "🔍" },
  validation: { title: "Validation Error", icon: "⚠️" },
  unknown: { title: "Unexpected Error", icon: "❌" },
};

function escrowStateToVault(state: EscrowState): VaultSealState {
  switch (state) {
    case EscrowState.Created: return "created";
    case EscrowState.Funded: return "funded";
    case EscrowState.Delivered: return "delivered";
    case EscrowState.Released: return "released";
    case EscrowState.Refunded: return "refunded";
  }
}

export function EscrowContent() {
  const searchParams = useSearchParams();
  const initialParam = searchParams.get("state");
  const initialFromParam = initialParam && Object.values(EscrowState).includes(initialParam as EscrowState)
    ? (initialParam as EscrowState)
    : EscrowState.Created;

  const [currentState, setCurrentState] = useState<EscrowState>(initialFromParam);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("idle");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>("unknown");

  const escrowClient = useMemo(
    () => new EscrowClient({ contractId: CONTRACT_ID }),
    [],
  );

  const detectWallet = useCallback(async () => {
    try {
      if (
        typeof window === "undefined" ||
        !isBrowser
      ) {
        setWalletStatus("not-installed");
        return;
      }
      const connected = await isConnected();
      if (!connected.isConnected) {
        setWalletStatus("disconnected");
        return;
      }
      const addr = await getAddress();
      if (addr.error || !addr.address) {
        setWalletStatus("disconnected");
        return;
      }
      setWalletAddress(addr.address);
      setWalletStatus("connected");
    } catch {
      setWalletStatus("not-installed");
    }
  }, []);

  useEffect(() => {
    detectWallet();
  }, [detectWallet]);

  const handleConnect = useCallback(async () => {
    try {
      await setAllowed();
      const addr = await getAddress();
      if (addr.error || !addr.address) {
        setWalletStatus("disconnected");
        return;
      }
      setWalletAddress(addr.address);
      setWalletStatus("connected");
    } catch {
      setWalletStatus("disconnected");
    }
  }, []);

  const simulateAction = useCallback(
    async (action: string, params: Record<string, unknown>) => {
      const sourcePubKey = walletStatus === "connected"
        ? walletAddress
        : "GBV2PPK4XHMQVX4GJDPCSKYHU7HMMT4Q5OTWEWYVIHXSL22LA2535P5B";

      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sourcePubKey, params }),
      });

      return res.json() as Promise<{
        success: boolean;
        xdr?: string;
        simulation?: Record<string, unknown>;
        error?: { type: string; message: string };
      }>;
    },
    [walletStatus, walletAddress],
  );

  const handleFund = useCallback(async () => {
    setActiveAction("fund");
    setError(null);

    try {
      const result = await simulateAction("fund", { escrowId: "0" });
      setResults((prev) => [{ label: "Fund Escrow", xdr: result.xdr ?? "", success: result.success, simulation: result.simulation, error: result.error }, ...prev]);

      if (result.success) {
        setCurrentState(EscrowState.Funded);
      } else if (result.error) {
        setError(result.error.message);
        setErrorType(result.error.type as ErrorType);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setErrorType("unknown");
    } finally {
      setActiveAction(null);
    }
  }, [simulateAction]);

  const handleConfirmDelivery = useCallback(async () => {
    setActiveAction("confirmDelivery");
    setError(null);

    try {
      const result = await simulateAction("confirm_delivery", { escrowId: "0" });
      setResults((prev) => [{ label: "Confirm Delivery", xdr: result.xdr ?? "", success: result.success, simulation: result.simulation, error: result.error }, ...prev]);

      if (result.success) {
        setCurrentState(EscrowState.Delivered);
      } else if (result.error) {
        setError(result.error.message);
        setErrorType(result.error.type as ErrorType);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setErrorType("unknown");
    } finally {
      setActiveAction(null);
    }
  }, [simulateAction]);

  const handleRelease = useCallback(async () => {
    setActiveAction("release");
    setError(null);

    try {
      const result = await simulateAction("release", { escrowId: "0" });
      setResults((prev) => [{ label: "Release Funds", xdr: result.xdr ?? "", success: result.success, simulation: result.simulation, error: result.error }, ...prev]);

      if (result.success) {
        setCurrentState(EscrowState.Released);
      } else if (result.error) {
        setError(result.error.message);
        setErrorType(result.error.type as ErrorType);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setErrorType("unknown");
    } finally {
      setActiveAction(null);
    }
  }, [simulateAction]);

  const handleRefund = useCallback(async () => {
    setActiveAction("refund");
    setError(null);

    try {
      const result = await simulateAction("refund", { escrowId: "0" });
      setResults((prev) => [{ label: "Refund", xdr: result.xdr ?? "", success: result.success, simulation: result.simulation, error: result.error }, ...prev]);

      if (result.success) {
        setCurrentState(EscrowState.Refunded);
      } else if (result.error) {
        setError(result.error.message);
        setErrorType(result.error.type as ErrorType);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setErrorType("unknown");
    } finally {
      setActiveAction(null);
    }
  }, [simulateAction]);

  const isTerminal =
    currentState === EscrowState.Released || currentState === EscrowState.Refunded;

  const stateLabels: Record<EscrowState, string> = {
    [EscrowState.Created]: "Awaiting deposit — escrow created",
    [EscrowState.Funded]: "Funds locked — waiting for delivery",
    [EscrowState.Delivered]: "Delivered — ready for release",
    [EscrowState.Released]: "Released — funds sent to traveler",
    [EscrowState.Refunded]: "Refunded — funds returned to buyer",
  };

  const actionButtons = useMemo(() => [
    {
      key: "fund",
      label: "Fund Escrow",
      validStates: [EscrowState.Created],
      role: "buyer" as const,
      handler: handleFund,
      icon: "📥",
    },
    {
      key: "confirmDelivery",
      label: "Confirm Delivery",
      validStates: [EscrowState.Funded],
      role: "buyer" as const,
      handler: handleConfirmDelivery,
      icon: "✅",
    },
    {
      key: "release",
      label: "Release Funds",
      validStates: [EscrowState.Delivered],
      role: "traveler" as const,
      handler: handleRelease,
      icon: "💸",
    },
    {
      key: "refund",
      label: "Refund",
      validStates: [EscrowState.Funded],
      role: "buyer" as const,
      handler: handleRefund,
      variant: "danger" as const,
      icon: "↩️",
    },
  ], [handleFund, handleConfirmDelivery, handleRelease, handleRefund]);

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden" style={{ backgroundColor: "var(--space-900, #05060A)" }}>
      <StarField starCount={30} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.10 }} />
      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-16 pt-14">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium"
            style={{
              borderColor: "var(--star-yellow-dim, rgba(253,218,36,0.25))",
              backgroundColor: "var(--star-yellow-dim, rgba(253,218,36,0.06))",
              color: "var(--star-yellow, #FDDA24)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--star-yellow, #FDDA24)" }} />
            Testnet — {CONTRACT_ID.slice(0, 8)}...{CONTRACT_ID.slice(-6)}
          </div>
          <h1
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-heading)", color: "var(--ink, #F5F3EC)" }}
          >
            The{" "}
            <span
              className="bg-gradient-to-r from-white via-[#FDE047] to-[#FDDA24] bg-clip-text text-transparent"
            >
              Vault
            </span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-dim, #8A8B96)" }}>
            {stateLabels[currentState]}
          </p>
        </motion.div>

        {/* Vault Seal */}
        <motion.div
          className="mb-10 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <VaultSeal state={escrowStateToVault(currentState)} amountStroops={50_000_000} />
        </motion.div>

        {/* Stepper Card */}
        <motion.div
          className="mb-8 rounded-2xl border p-6"
          style={{
            borderColor: "var(--hairline, rgba(255,255,255,0.08))",
            backgroundColor: "var(--space-800, #0A0B12)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--star-yellow, #FDDA24)", opacity: 0.7 }}>
            State Machine
          </h2>
          <EscrowStepper currentState={currentState} />
        </motion.div>

        {/* Error display with typed errors */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "rgba(239,68,68,0.25)",
                  backgroundColor: "rgba(239,68,68,0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{ERROR_LABELS[errorType].icon}</span>
                  <h3 className="text-sm font-semibold" style={{ color: "rgba(248,113,113,0.95)" }}>
                    {ERROR_LABELS[errorType].title}
                  </h3>
                  <span className="rounded border px-1.5 py-0.5 text-[9px] font-mono uppercase" style={{ borderColor: "rgba(239,68,68,0.2)", color: "rgba(248,113,113,0.6)" }}>
                    {errorType}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(248,113,113,0.8)" }}>
                  {error}
                </p>
                <div className="mt-3 text-[10px]" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>
                  Tip: Check wallet authorization, escrow state, or contract parameters
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {!isTerminal && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--star-yellow, #FDDA24)", opacity: 0.7 }}>
              Actions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {actionButtons.map((btn) => {
                const enabled = (btn.validStates as readonly EscrowState[]).includes(currentState);
                const isActive = activeAction === btn.key;
                const isDanger = "variant" in btn;

                return (
                  <motion.button
                    key={btn.key}
                    data-testid={`escrow-action-${btn.key}`}
                    disabled={!enabled || activeAction !== null}
                    onClick={btn.handler}
                    whileHover={enabled ? { scale: 1.02 } : undefined}
                    whileTap={enabled ? { scale: 0.98 } : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl border px-5 py-4 text-left text-sm font-medium transition-all duration-300",
                      !enabled && "cursor-not-allowed opacity-30",
                    )}
                    style={{
                      borderColor: enabled && !isDanger ? "var(--star-yellow, #FDDA24)" : enabled && isDanger ? "rgba(239,68,68,0.3)" : "var(--hairline, rgba(255,255,255,0.08))",
                      backgroundColor: enabled && !isDanger ? "var(--star-yellow-dim, rgba(253,218,36,0.05))" : enabled && isDanger ? "rgba(239,68,68,0.05)" : "var(--space-800, #0A0B12)",
                    }}
                    aria-label={btn.label}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: "var(--star-yellow-dim, rgba(253,218,36,0.05))" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                    <span className="shrink-0 text-lg">{btn.icon}</span>
                    <div>
                      <span style={{ color: !enabled ? "var(--ink-dim, #8A8B96)" : "var(--ink, #F5F3EC)" }}>
                        {btn.label}
                      </span>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.6 }}>
                        {btn.role === "buyer" ? "Buyer" : "Traveler"}
                        {!enabled ? ` — needs ${btn.validStates.join(" / ")}` : ""}
                      </p>
                    </div>
                    {isActive && (
                      <motion.span
                        className="ml-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <span className="text-sm">⏳</span>
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Terminal state */}
        {isTerminal && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div
              className="rounded-2xl border p-6 text-center"
              style={{
                borderColor: currentState === EscrowState.Released ? "var(--aurora-teal, #3DE1C8)" : "rgba(239,68,68,0.2)",
                backgroundColor: currentState === EscrowState.Released ? "rgba(61,225,200,0.05)" : "rgba(239,68,68,0.05)",
              }}
            >
              <span className="text-sm font-semibold"
                style={{ color: currentState === EscrowState.Released ? "var(--aurora-teal, #3DE1C8)" : "rgba(248,113,113,0.9)" }}
              >
                {currentState === EscrowState.Released
                  ? "Funds have been released to the traveler. This escrow is complete."
                  : "Funds have been refunded to the buyer. This escrow is closed."}
              </span>
            </div>
          </motion.div>
        )}

        {/* Transaction Results Panel */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--star-yellow, #FDDA24)", opacity: 0.7 }}>
                Simulation Results ({results.length})
              </h2>
              <div className="space-y-3">
                {results.map((r, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: r.success ? "var(--aurora-teal-dim, rgba(61,225,200,0.2))" : "rgba(239,68,68,0.2)",
                      backgroundColor: "var(--space-800, #0A0B12)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={r.success ? "text-green-400" : "text-red-400"}>
                        {r.success ? "✓" : "✗"}
                      </span>
                      <span className="text-xs font-medium" style={{ color: "var(--ink, #F5F3EC)" }}>
                        {r.label}
                      </span>
                      <span className="rounded border px-1 py-0.5 text-[9px] font-mono" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.08))", color: "var(--ink-dim, #8A8B96)" }}>
                        {r.success ? "PASSED" : (r.error?.type ?? "FAILED")}
                      </span>
                    </div>

                    {r.error && (
                      <div className="mb-2 rounded-lg border px-3 py-2 text-xs"
                        style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.03)" }}>
                        <span className="font-semibold" style={{ color: "rgba(248,113,113,0.8)" }}>
                          {ERROR_LABELS[r.error.type as ErrorType]?.title ?? r.error.type}:
                        </span>
                        <span className="ml-1" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                          {r.error.message}
                        </span>
                      </div>
                    )}

                    {r.simulation && r.success && (
                      <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
                        {(r.simulation as Record<string, unknown>).minResourceFee != null && (
                          <div className="rounded border px-2 py-1" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.06))" }}>
                            <span style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>Fee: </span>
                            <span style={{ color: "var(--ink-dim, #8A8B96)" }}>{(Number((r.simulation as Record<string, unknown>).minResourceFee) / 10_000_000).toFixed(4)} XLM</span>
                          </div>
                        )}
                        {((r.simulation as Record<string, unknown>).cost as Record<string, unknown>)?.cpuInsns != null && (
                          <div className="rounded border px-2 py-1" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.06))" }}>
                            <span style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>CPU: </span>
                            <span style={{ color: "var(--ink-dim, #8A8B96)" }}>{String(((r.simulation as Record<string, unknown>).cost as Record<string, unknown>).cpuInsns)} insns</span>
                          </div>
                        )}
                        {((r.simulation as Record<string, unknown>).cost as Record<string, unknown>)?.memBytes != null && (
                          <div className="rounded border px-2 py-1" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.06))" }}>
                            <span style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>RAM: </span>
                            <span style={{ color: "var(--ink-dim, #8A8B96)" }}>{String(((r.simulation as Record<string, unknown>).cost as Record<string, unknown>).memBytes)}B</span>
                          </div>
                        )}
                        {(r.simulation as Record<string, unknown>).latestLedger != null && (
                          <div className="rounded border px-2 py-1" style={{ borderColor: "var(--hairline, rgba(255,255,255,0.06))" }}>
                            <span style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>Ledger: </span>
                            <span style={{ color: "var(--ink-dim, #8A8B96)" }}>{String((r.simulation as Record<string, unknown>).latestLedger)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {r.xdr && (
                      <details className="mt-2">
                        <summary className="text-[9px] cursor-pointer" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.4 }}>
                          XDR
                        </summary>
                        <code className="block mt-1 text-[9px] break-all select-all" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.3 }}>
                          {r.xdr.slice(0, 200)}{r.xdr.length > 200 ? "..." : ""}
                        </code>
                      </details>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet status */}
        <motion.div
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {walletStatus === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-9 w-28 rounded-lg animate-pulse" style={{ backgroundColor: "var(--space-800, #0A0B12)" }} />
            )}
            {walletStatus === "not-installed" && (
              <motion.span key="not-installed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.5 }}>
                Freighter not installed — simulation mode
              </motion.span>
            )}
            {walletStatus === "disconnected" && (
              <motion.button key="disconnected" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleConnect}
                className="rounded-lg border px-4 py-2 text-xs font-medium"
                style={{ borderColor: "var(--star-yellow-dim, rgba(253,218,36,0.2))", color: "var(--star-yellow, #FDDA24)", backgroundColor: "var(--star-yellow-dim, rgba(253,218,36,0.04))" }}>
                Connect wallet
              </motion.button>
            )}
            {walletStatus === "connected" && (
              <motion.span key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-lg border px-3 py-2 text-xs font-mono"
                style={{ borderColor: "var(--aurora-teal, #3DE1C8)", color: "var(--aurora-teal, #3DE1C8)", backgroundColor: "rgba(61,225,200,0.05)" }}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-[10px]" style={{ color: "var(--ink-dim, #8A8B96)", opacity: 0.4 }}>
            testnet — {CONTRACT_ID.slice(0, 8)}...
          </span>
        </motion.div>
      </section>
    </div>
  );
}
