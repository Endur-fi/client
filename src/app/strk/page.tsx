import React from "react";
import { Metadata } from "next";

import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Endur.fi | Starknet Liquid Staking | xSTRK | Earn STRK rewards",
  description:
    "Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
};

export default function STRKPage() {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
}
