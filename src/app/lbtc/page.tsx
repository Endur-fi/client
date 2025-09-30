import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Starknet LBTC liquid staking | Endur.fi",
  description:
    "Stake LBTC on Endur and get xLBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function LBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
