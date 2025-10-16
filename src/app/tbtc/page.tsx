import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Starknet tBTC liquid staking | Endur.fi",
  description:
    "Stake tBTC on Endur and get xtBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
  openGraph: {
    title: "Starknet Liquid tBTC Staking (xtBTC) | Endur.fi",
    description:
      "Stake tBTC on Endur and get xtBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking.",
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
    title: "Starknet Liquid tBTC Staking (xtBTC) | Endur.fi",
    description:
      "Stake tBTC on Endur and get xtBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking.",
    site: "@endurfi",
    creator: "@endurfi",
    images: [
      {
        url: "https://app.endur.fi/og.png",
        alt: "tBTC Liquid Staking on Starknet - Endur.fi",
      },
    ],
  },
};

export default function TBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
