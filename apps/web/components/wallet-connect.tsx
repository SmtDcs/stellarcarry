"use client";

import { useEffect, useState, useCallback } from "react";
import { isConnected, getAddress, setAllowed, getNetwork, isBrowser } from "@stellar/freighter-api";
import { motion, AnimatePresence } from "motion/react";

type WalletState = "idle" | "not-installed" | "disconnected" | "connected";

const STELLAR = "#FDDA24";
const FRIEND_BOT_URL = "https://friendbot.stellar.org";
const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";

function truncateAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnect() {
  const [state, setState] = useState<WalletState>("idle");
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string | null>(null);
  const [isTestnet, setIsTestnet] = useState(false);

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      const res = await fetch(`${HORIZON_TESTNET}/accounts/${addr}`);
      if (!res.ok) {
        setBalance(null);
        return;
      }
      const data = await res.json();
      for (const b of data.balances) {
        if (b.asset_type === "native") {
          const xlm = Number(b.balance).toLocaleString(undefined, {
            maximumFractionDigits: 4,
          });
          setBalance(xlm);
          return;
        }
      }
      setBalance("0");
    } catch {
      setBalance(null);
    }
  }, []);

  const detect = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !isBrowser) {
        setState("not-installed");
        return;
      }
      const net = await getNetwork();
      setIsTestnet(net.network === "TESTNET");

      const connected = await isConnected();
      if (!connected.isConnected) {
        setState("disconnected");
        return;
      }
      const addr = await getAddress();
      if (addr.error || !addr.address) {
        setState("disconnected");
        return;
      }
      setAddress(addr.address);
      setState("connected");
      fetchBalance(addr.address);
    } catch {
      setState("not-installed");
    }
  }, [fetchBalance]);

  useEffect(() => {
    detect();
  }, [detect]);

  const handleConnect = useCallback(async () => {
    try {
      await setAllowed();
      const net = await getNetwork();
      setIsTestnet(net.network === "TESTNET");
      const addr = await getAddress();
      if (addr.error || !addr.address) {
        setState("disconnected");
        return;
      }
      setAddress(addr.address);
      setState("connected");
      fetchBalance(addr.address);
    } catch {
      setState("disconnected");
    }
  }, [fetchBalance]);

  const handleDisconnect = useCallback(() => {
    setAddress("");
    setBalance(null);
    setState("disconnected");
  }, []);

  return (
    <div data-testid="wallet-connect" className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-10 w-32 rounded-lg animate-pulse"
            style={{ background: `${STELLAR}0d` }}
          />
        )}
        {state === "not-installed" && (
          <motion.span
            key="not-installed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-white/30 font-medium select-none"
          >
            Freighter not installed
          </motion.span>
        )}
        {state === "disconnected" && (
          <motion.button
            key="disconnected"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: `${STELLAR}33`,
              color: `${STELLAR}cc`,
              background: `${STELLAR}0d`,
            }}
            onClick={handleConnect}
            aria-label="Connect Freighter wallet"
          >
            Connect wallet
          </motion.button>
        )}
        {state === "connected" && (
          <div key="connected" className="flex items-center gap-2">
            {balance !== null && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full border px-2.5 py-1 text-xs font-medium"
                style={{
                  borderColor: `${STELLAR}33`,
                  color: STELLAR,
                  background: `${STELLAR}0d`,
                }}
                data-testid="wallet-balance"
              >
                {balance} XLM
              </motion.span>
            )}
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDisconnect}
              aria-label="Disconnect wallet"
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-mono font-medium text-emerald-400 cursor-pointer transition-colors hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
            >
              {truncateAddress(address)}
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
