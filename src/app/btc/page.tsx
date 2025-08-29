import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title:
    "Endur.fi | BTC Liquid Staking on Starknet",
  description:
    "Stake BTC on Endur and get liquid tokens like xWBTC, xtBTC (Threshold network), etc. — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function BTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
