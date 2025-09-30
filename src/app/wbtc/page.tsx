import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Starknet WBTC liquid staking | Endur.fi",
  description:
    "Stake WBTC on Endur and get xWBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function WBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
