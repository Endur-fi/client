import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Starknet SolvBTC liquid staking | Endur.fi",
  description:
    "Stake SolvBTC on Endur and get xsBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
  openGraph: {
    title: "Starknet Liquid SolvBTC Staking (xsBTC) | Endur.fi",
    description:
      "Stake SolvBTC on Endur and get xsBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking.",
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
    title: "Starknet Liquid SolvBTC Staking (xsBTC) | Endur.fi",
    description:
      "Stake SolvBTC on Endur and get xsBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking.",
    site: "@endurfi",
    creator: "@endurfi",
    images: [
      {
        url: "https://app.endur.fi/og.png",
        alt: "SolvBTC Liquid Staking on Starknet - Endur.fi",
      },
    ],
  },
};

export default function SolvBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
