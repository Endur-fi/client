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
  title: "Endur.fi | Starknet Liquid Staking (xSTRK) | Earn STRK Rewards",
  description:
    "Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
  keywords: [
    "liquid staking starknet",
    "liquid staking",
    "liquid stake starknet",
    "starknet LST",
    "STRK staking",
    "Endur xSTRK",
    "starknet liquid staking solution",
  ],
  robots: "index,follow",
  openGraph: {
    title: "Starknet Liquid Staking (xSTRK) | Earn STRK Rewards | Endur.fi",
    description:
      "Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
    images: [
      {
        url: "https://app.endur.fi/og.png",
        secureUrl: "https://app.endur.fi/og.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starknet Liquid Staking (xSTRK) | Earn STRK Rewards | Endur.fi",
    description:
      "Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
    site: "@endurfi",
    creator: "@endurfi",
    images: [
      {
        url: "https://app.endur.fi/og.png",
        alt: "Cover Image of endur.fi",
      },
    ],
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
          <React.Suspense>
            <div className="relative flex h-full min-h-screen w-full overflow-x-hidden">
              <Image
                src="/subtle_tree_bg.svg"
                alt="subtle_tree_bg"
                fill
                className="-z-10 object-cover"
              />

              <AppSidebar />

              <div className="flex flex-1 flex-col justify-between overflow-hidden">
                <MaxWidthWrapper className="flex h-full w-full flex-col items-center px-3 py-3 lg:px-7 lg:py-0">
                  <Navbar />
                  {children}
                </MaxWidthWrapper>

                <div className="lg:hidden">
                  <Footer />
                </div>
              </div>
            </div>
          </React.Suspense>

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
