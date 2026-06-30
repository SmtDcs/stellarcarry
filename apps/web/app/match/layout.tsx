import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Travelers — StellarCarry",
  description: "Find the best travelers for your cross-border delivery requests.",
};

export default function MatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
