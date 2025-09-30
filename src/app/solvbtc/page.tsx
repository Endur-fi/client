import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Endur.fi | solvBTC Liquid Staking on Starknet",
  description:
    "Stake solvBTC (Solv Bitcoin) on Endur and get xsBTC liquid tokens — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function SolvBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
