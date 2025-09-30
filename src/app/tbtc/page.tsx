import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Starknet tBTC liquid staking | Endur.fi",
  description:
    "Stake tBTC on Endur and get xtBTC, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
};

export default function TBTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
