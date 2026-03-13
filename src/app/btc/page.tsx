import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Stake Bitcoin & Earn BTC Yield - Endur App",
  description:
    "Stake Bitcoin through Endur’s liquid staking app and earn BTC yield while keeping liquidity. Access BTC LSTs on Starknet in one click.",
  openGraph: {
    title: "Stake Bitcoin & Earn BTC Yield - Endur App",
    description:
      "Stake Bitcoin through Endur’s liquid staking app and earn BTC yield while keeping liquidity. Access BTC LSTs on Starknet in one click.",
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
    title:
      "Starknet Liquid BTC Staking (xWBTC, xLBTC, xsBTC, xtBTC) | Endur.fi",
    description:
      "Stake BTC on Endur and get liquid tokens like xWBTC, xtBTC, xLBTC, xsBTC, etc. — earn rewards, enjoy instant liquidity, and faster unstaking.",
    site: "@endurfi",
    creator: "@endurfi",
    images: [
      {
        url: "https://app.endur.fi/og.png",
        alt: "BTC Liquid Staking on Starknet - Endur.fi",
      },
    ],
  },
};

export default function BTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
