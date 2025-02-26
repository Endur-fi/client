import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import Image from "next/image";
import React from "react";

import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/footer";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import Navbar from "@/components/navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "Endur | Liquid Staked STRK",
  description:
    "Stake your STRK to support Starknet's decentralization with xSTRK—a liquid staking token (LST) that empowers you to actively engage in DeFi, retain flexibility, and use your xSTRK across various protocols just like STRK. From the buidlers of Karnot and STRKFarm",
  keywords: [
    "endur",
    "starknet",
    "strk",
    "xstrk",
    "liquid staking",
    "lst",
    "defi",
    "karnot",
    "strkfarm",
    "yield",
    "farming",
    "staking",
    "LSTs",
    "competitor",
    "avnu",
    "fibrous",
    "starkware",
    "vesu",
    "ekubo",
    "stark",
    "brother",
    "memecoin",
    "chillguy",
  ],
  openGraph: {
    title: "Endur | Liquid Staked STRK",
    description:
      "Stake your STRK to support Starknet's decentralization with xSTRK—a liquid staking token (LST) that empowers you to actively engage in DeFi, retain flexibility, and use your xSTRK across various protocols just like STRK. From the buidlers of Karnot and STRKFarm",
    images: ["https://endur.fi/og.png"],
  },
  twitter: {
    title: "Endur | Liquid Staked STRK",
    description:
      "Stake your STRK to support Starknet's decentralization with xSTRK—a liquid staking token (LST) that empowers you to actively engage in DeFi, retain flexibility, and use your xSTRK across various protocols just like STRK. From the buidlers of Karnot and STRKFarm",
    card: "player",
    images: ["https://endur.fi/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F1F7F6]">
        <Analytics />

        <Providers>
          <div className="relative flex h-full min-h-screen w-full overflow-x-hidden">
            <Image
              src="/subtle_tree_bg.svg"
              alt="subtle_tree_bg"
              fill
              className="-z-10 object-cover"
            />

            <React.Suspense
              fallback={<div className="w-72">Loading sidebar...</div>}
            >
              <AppSidebar />
            
              <div className="flex flex-1 flex-col justify-between">
                <MaxWidthWrapper className="flex h-full w-full flex-col items-center overflow-hidden px-7 py-3 lg:py-0">
                  <Navbar />
                  {children}
                </MaxWidthWrapper>

                <div className="lg:hidden">
                  <Footer />
                </div>
              </div>
            </React.Suspense>
          </div>

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
