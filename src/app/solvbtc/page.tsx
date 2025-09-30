import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Starknet SolvBTC liquid staking | Endur.fi",
  description:
    "Stake SolvBTC on Endur and get xsBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function SolvBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
