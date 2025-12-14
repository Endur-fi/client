import React from "react";

import { type Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Leaderboard | Endur.fi | Starknet Liquid Staking (xSTRK) | Earn STRK Rewards",
  description:
    "Leaderboard of Endur.fi - the Starknet liquid staking solution. Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
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
    title:
      "Leaderboard | Endur.fi | Starknet Liquid Staking (xSTRK) | Earn STRK Rewards",
    description:
      "Leaderboard of Endur.fi - the Starknet liquid staking solution. Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
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
      "Leaderboard | Endur.fi | Starknet Liquid Staking (xSTRK) | Earn STRK Rewards",
    description:
      "Leaderboard of Endur.fi - the Starknet liquid staking solution. Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
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
