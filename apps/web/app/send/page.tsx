"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { isConnected, getAddress, setAllowed, signTransaction } from "@stellar/freighter-api";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { StarField } from "@/components/travel/star-field";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const STELLAR = "#FDDA24";

type TxState =
  | "idle"
  | "confirming"
  | "building"
  | "sent"
  | "error";

export default function SendPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletReady, setWalletReady] = useState(false);
  const [walletChecking, setWalletChecking] = useState(true);

  const [destination, setDestination] = useState("");
  const [amountXlm, setAmountXlm] = useState("");
  const [memo, setMemo] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const detectWallet = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;
      const conn = await isConnected();
      if (!conn.isConnected) {
        setWalletReady(false);
        setWalletChecking(false);
        return;
      }
      const addr = await getAddress();
      if (addr.error || !addr.address) {
        setWalletReady(false);
        setWalletChecking(false);
        return;
      }
      setWalletAddress(addr.address);
      setWalletReady(true);
    } catch {
      setWalletReady(false);
    } finally {
      setWalletChecking(false);
    }
  }, []);

  useEffect(() => {
    detectWallet();
  }, [detectWallet]);

  const handleConnect = useCallback(async () => {
    try {
      await setAllowed();
      const addr = await getAddress();
      if (addr.error || !addr.address) return;
      setWalletAddress(addr.address);
      setWalletReady(true);
    } catch {}
  }, []);

  const handleSend = useCallback(async () => {
    if (!amountXlm || !destination) return;

    setTxState("confirming");
    setTxHash("");
    setErrorMsg("");

    const parsed = Number(amountXlm);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg("Enter a valid positive XLM amount");
      setTxState("error");
      return;
    }

    const stroops = Math.round(parsed * 1e7);
    const memoStr = memo.trim() || undefined;

    try {
      setTxState("building");

      const acctRes = await fetch(`${HORIZON_TESTNET}/accounts/${walletAddress}`);
      if (!acctRes.ok) {
        setErrorMsg("Account not found on testnet. Fund it at https://laboratory.stellar.org");
        setTxState("error");
        return;
      }
      const acctData = await acctRes.json();
      const sequence = acctData.sequence;

      const xdrRes = await fetch("/api/build-send-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePubKey: walletAddress,
          destination,
          amountStroops: stroops,
          memo: memoStr,
          sequence,
        }),
      });

      const xdrData = await xdrRes.json();

      if (!xdrRes.ok || !xdrData.xdr) {
        setErrorMsg(xdrData.error || "Failed to build transaction");
        setTxState("error");
        return;
      }

      const signed = await signTransaction(xdrData.xdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      if (!signed.signedTxXdr) {
        setErrorMsg("Transaction signing was cancelled or failed");
        setTxState("error");
        return;
      }

      const submitRes = await fetch(`${HORIZON_TESTNET}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ tx: signed.signedTxXdr }),
      });

      const submitData = await submitRes.json();

      if (!submitRes.ok) {
        const extras = (submitData as any)?.extras;
        const txCode = extras?.result_codes?.transaction;
        const opCodes = extras?.result_codes?.operations;
        const detail = [txCode, opCodes ? JSON.stringify(opCodes) : "", submitData.detail]
          .filter(Boolean)
          .join(" — ");
        setErrorMsg(detail || "Transaction failed");
        setTxState("error");
        return;
      }

      const hash = (submitData as { hash: string }).hash || "";
      setTxHash(hash);
      setTxState("sent");
    } catch {
      setErrorMsg("Unexpected error during transaction");
      setTxState("error");
    }
  }, [amountXlm, destination, memo, walletAddress]);

  const handleReset = useCallback(() => {
    setDestination("");
    setAmountXlm("");
    setMemo("");
    setTxState("idle");
    setTxHash("");
    setErrorMsg("");
  }, []);

  return (
    <div
      className="relative min-h-screen flex-1 overflow-hidden"
      style={{ backgroundColor: "var(--space-900, #05060A)" }}
    >
      <BackgroundBeams className="pointer-events-none opacity-[0.04]" />
      <StarField starCount={30} animate className="absolute inset-0 pointer-events-none" style={{ opacity: 0.1 }} />

      <div className="relative z-10 mx-auto max-w-lg px-6 pb-24 pt-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="relative mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: "rgba(253,218,36,0.3)",
              backgroundColor: "rgba(253,218,36,0.07)",
              color: STELLAR,
              boxShadow: "0 0 16px rgba(253,218,36,0.07)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Stellar Testnet
          </motion.div>

          <h1
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-heading)", color: "var(--ink, #F5F3EC)" }}
          >
            Send XLM
          </h1>
          <p className="mt-3 max-w-lg text-base" style={{ color: "var(--ink-dim, #8A8B96)" }}>
            Send XLM to any Stellar testnet address. All transactions are on testnet — no real value.
          </p>
        </motion.div>

        {/* Wallet state */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {walletChecking ? (
            <div className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(253,218,36,0.04)" }} />
          ) : walletReady ? (
            <div
              className="flex items-center gap-3 rounded-xl border px-5 py-4"
              style={{
                borderColor: "rgba(16,185,129,0.25)",
                background: "rgba(16,185,129,0.06)",
              }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-mono font-medium text-emerald-400">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              </span>
              <span className="ml-auto text-xs text-emerald-500/60">Connected</span>
            </div>
          ) : (
            <motion.button
              onClick={handleConnect}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl border px-5 py-4 text-center text-sm font-medium transition-colors"
              style={{
                borderColor: `${STELLAR}33`,
                color: `${STELLAR}cc`,
                background: `${STELLAR}0d`,
              }}
              aria-label="Connect Freighter wallet"
            >
              Connect Freighter wallet to send
            </motion.button>
          )}
        </motion.div>

        {/* Form */}
        {walletReady && (
          <motion.div
            className="mt-8 space-y-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <label className="block">
              <span className="text-sm font-medium" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                Destination Address
              </span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="G..."
                disabled={txState === "confirming" || txState === "building"}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm font-mono outline-none transition-colors focus:border-[#FDDA24] bg-transparent"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "var(--ink, #F5F3EC)",
                }}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                Amount (XLM)
              </span>
              <input
                type="number"
                value={amountXlm}
                onChange={(e) => setAmountXlm(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                disabled={txState === "confirming" || txState === "building"}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm font-mono outline-none transition-colors focus:border-[#FDDA24] bg-transparent"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "var(--ink, #F5F3EC)",
                }}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                Memo (optional)
              </span>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Note"
                disabled={txState === "confirming" || txState === "building"}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm font-mono outline-none transition-colors focus:border-[#FDDA24] bg-transparent"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "var(--ink, #F5F3EC)",
                }}
              />
            </label>

            {txState === "idle" && (
              <motion.button
                onClick={handleSend}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!destination || !amountXlm}
                className="w-full rounded-xl px-5 py-4 text-sm font-bold text-black transition-opacity"
                style={{
                  background: STELLAR,
                  opacity: !destination || !amountXlm ? 0.4 : 1,
                }}
              >
                Send XLM
              </motion.button>
            )}

            {(txState === "confirming" || txState === "building") && (
              <motion.div
                className="flex flex-col items-center gap-3 py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${STELLAR}33`, borderTopColor: STELLAR }}
                />
                <span className="text-sm" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                  {txState === "confirming" ? "Please confirm in Freighter..." : "Broadcasting..."}
                </span>
              </motion.div>
            )}

            {txState === "sent" && (
              <motion.div
                className="rounded-xl border px-5 py-5 space-y-3"
                style={{ borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  <span className="text-sm font-semibold text-emerald-400">Transaction successful</span>
                </div>
                {txHash && (
                  <>
                    <p className="text-xs font-mono break-all" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                      TX: {txHash}
                    </p>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs underline"
                      style={{ color: STELLAR }}
                    >
                      View on Stellar Expert →
                    </a>
                  </>
                )}
                <motion.button
                  onClick={handleReset}
                  whileHover={{ scale: 1.02 }}
                  className="mt-2 w-full rounded-xl border px-5 py-3 text-sm font-medium"
                  style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--ink-dim, #8A8B96)" }}
                >
                  Send another
                </motion.button>
              </motion.div>
            )}

            {txState === "error" && (
              <motion.div
                className="rounded-xl border px-5 py-5 space-y-3"
                style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  <span className="text-sm font-semibold text-red-400">Transaction failed</span>
                </div>
                <p className="text-xs font-mono break-all" style={{ color: "var(--ink-dim, #8A8B96)" }}>
                  {errorMsg}
                </p>
                <motion.button
                  onClick={() => setTxState("idle")}
                  whileHover={{ scale: 1.02 }}
                  className="mt-2 w-full rounded-xl border px-5 py-3 text-sm font-medium"
                  style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--ink-dim, #8A8B96)" }}
                >
                  Try again
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
