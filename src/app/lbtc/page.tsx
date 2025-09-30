import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Endur.fi | LBTC Liquid Staking on Starknet",
  description:
    "Stake LBTC (Lightning Bitcoin) on Endur and get xLBTC liquid tokens — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function LBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
