import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NavBar } from "@/components/navbar";
import OnboardingTrigger from "@/components/OnboardingWizard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StellarCarry — cross-border delivery, secured on-chain",
  description: "Shop the world. Carried by travelers, secured by Soroban escrow on Stellar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        <NavBar />
        {children}
        <Analytics />
        <OnboardingTrigger />
      </body>
    </html>
  );
}
