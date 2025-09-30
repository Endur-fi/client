import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Endur.fi | WBTC Liquid Staking on Starknet",
  description:
    "Stake WBTC (Wrapped Bitcoin) on Endur and get xWBTC liquid tokens — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function WBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
