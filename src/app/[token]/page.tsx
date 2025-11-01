import type { Metadata } from "next";

import Tabs from "@/features/staking/components/token-tab";
import { getLSTAssetBySymbol } from "@/constants";
import type { TokenProps } from "@/types";

export async function generateMetadata({
  params,
}: TokenProps): Promise<Metadata> {
  const lowerToken = params.token.toLowerCase();

  if (lowerToken === "btc") {
    return {
      title: "Starknet BTC liquid staking | Endur.fi",
      description:
        "Stake BTC on Endur and get liquid tokens like xWBTC, xtBTC, xLBTC, xsBTC, etc. — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.",
    };
  }

  const tokenNameMap: Record<string, string> = {
    solvbtc: "solvBTC",
    wbtc: "WBTC",
    tbtc: "tBTC",
    lbtc: "LBTC",
    strk: "STRK",
  };

  const tokenName = tokenNameMap[lowerToken];

  const tokenConfig = getLSTAssetBySymbol(tokenName);

  if (!tokenConfig) {
    return {
      title: "Endur.fi | Starknet Liquid Staking (xSTRK) | Earn STRK Rewards",
      description:
        "Stake STRK with Endur and receive xSTRK - the liquid staking token on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
    };
  }

  const { SYMBOL, LST_SYMBOL } = tokenConfig;

  return {
    title: `Starknet ${SYMBOL} liquid staking | Endur.fi`,
    description: `Stake ${SYMBOL} on Endur and get ${LST_SYMBOL}, liquid staking token by Endur — earn rewards, enjoy instant liquidity, and faster unstaking in DeFi.`,
  };
}

const Token = () => {
  return (
    <main className="h-full w-full">
      <Tabs />
    </main>
  );
};

export default Token;
