"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Wordmark } from "@/components/brand/logo";
import { WalletConnect } from "@/components/wallet-connect";
import { cn } from "@/lib/utils";

const STELLAR = "#FDDA24";

const NAV_LINKS = [
  { href: "/send", label: "Send" },
  { href: "/post", label: "Post" },
  { href: "/travelers", label: "Travelers" },
  { href: "/match", label: "Match" },
  { href: "/reputation", label: "Reputation" },
  { href: "/escrow", label: "Escrow" },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-black/80 border-b border-white/5">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="StellarCarry home" className="shrink-0">
          <Wordmark />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} active={pathname.startsWith(link.href)}>
              {link.label}
            </NavLink>
          ))}
          <WalletConnect />
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <WalletConnect />
          <motion.button
            onClick={() => setMobileOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="absolute h-0.5 w-4 rounded-full bg-white/60"
              animate={mobileOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="absolute h-0.5 w-4 rounded-full bg-white/60"
              animate={mobileOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/5 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="space-y-1 px-6 pb-5 pt-3">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  <Link
                    href={link.href}
                    onClick={closeMobile}
                    className={cn(
                      "block rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      pathname.startsWith(link.href)
                        ? "bg-[#FDDA24]/10 text-[#FDDA24]"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "cursor-pointer transition-colors relative py-1",
        active ? "text-white font-medium" : "text-white/60 hover:text-white"
      )}
    >
      {children}
      {active && (
        <motion.span
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
          style={{ background: STELLAR }}
          layoutId="nav-underline"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}
