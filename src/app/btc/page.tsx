import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title:
    "Endur.fi | Starknet Liquid Staking | xWBTC | xtBTC | xLBTC | xsolvBTC | Earn BTC rewards",
  description:
    "Stake BTC with Endur and receive x BTCs - the liquid staking BTC tokens on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
};

export default function BTCPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
