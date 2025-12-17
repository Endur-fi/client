import React from "react";

import { type Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Rewards and Points Leaderboard | Endur.fi",
  description:
    "Leaderboard of Endur.fi - the Starknet liquid staking solution. Stake STRK & BTC with Endur and receive xSTRK & xyBTCs - the liquid staking tokens on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
  keywords: [
    "liquid staking starknet",
    "liquid staking",
    "liquid stake starknet",
    "starknet LST",
    "STRK staking",
    "Endur xSTRK",
    "Endur xyBTC",
    "Endur xWBTC",
    "Endur xtBTC",
    "Endur xLBTC",
    "Endur xsBTC",
    "Wrapped Bitcoin staking",
    "Lombard staking",
    "SolvBTC staking",
    "starknet liquid staking solution",
  ],
  robots: "index,follow",
  openGraph: {
    title:
      "Rewards and Points Leaderboard | Endur.fi",
    description:
      "Leaderboard of Endur.fi - the Starknet liquid staking solution. Stake STRK & BTC with Endur and receive xSTRK & xyBTCs - the liquid staking tokens on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
    images: [
      {
        url: "",
        secureUrl: "",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Rewards and Points Leaderboard | Endur.fi",
    description:
      "Leaderboard of Endur.fi - the Starknet liquid staking solution. Stake STRK & BTC with Endur and receive xSTRK & xyBTCs - the liquid staking tokens on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
    site: "@endurfi",
    creator: "@endurfi",
    images: [
      {
        url: "",
        alt: "Cover Image of endur.fi",
      },
    ],
  },
};

export default function LeaderboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="mx-auto flex w-full items-center justify-center">
      {children}
    </section>
  );
}
