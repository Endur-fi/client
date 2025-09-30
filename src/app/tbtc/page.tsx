import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Endur.fi | tBTC Liquid Staking on Starknet",
  description:
    "Stake tBTC (Threshold Bitcoin) on Endur and get xtBTC liquid tokens — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function TBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
