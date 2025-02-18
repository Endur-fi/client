import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import React from "react";

import Providers from "@/components/providers";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

import "./globals.css";

const font = Figtree({
  subsets: ["latin-ext"],
});

export const metadata: Metadata = {
  title: "Endur.fi | Starknet Liquid Staking (xSTRK) | Earn STRK Rewards",
  description:
    "Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, zero fees, and faster unstaking",
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
      "Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, zero fees, and faster unstaking",
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
      "Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, zero fees, and faster unstaking",
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
          <SidebarProvider className={cn(font.className, "w-full")}>
            {children}
            <Toaster />
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
