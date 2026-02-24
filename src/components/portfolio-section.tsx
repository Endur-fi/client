"use client";

import { useAtomValue } from "jotai";
import { useAccount, useBalance } from "@starknet-react/core";
import React from "react";
import { Info } from "lucide-react";

import { Icons } from "./Icons";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { getLSTAssetsByCategory, getSTRKAsset } from "@/constants";
import { cn, formatBalance, formatNumberWithCommas } from "@/lib/utils";
import { lstStatsQueryAtom } from "@/store/lst.store";
import { btcPriceAtom, strkPriceAtom } from "@/store/staking.store";
import MyNumber from "@/lib/MyNumber";
import { GET_USER_NET_TOTAL_POINTS_SEASON1, GET_USER_NET_TOTAL_POINTS_SEASON2 } from "@/constants/queries";
import { pointsApolloClient } from "@/lib/apollo-client";

const getBTCLSTIcon = (lstSymbol: string) => {
  switch (lstSymbol) {
    case "xWBTC":
      return <Icons.xwbtc className="h-5 w-5 shrink-0" />;
    case "xtBTC":
      return <Icons.xtbtc className="h-5 w-5 shrink-0" />;
    case "xLBTC":
      return <Icons.xlbtc className="h-5 w-5 shrink-0" />;
    case "xsBTC":
      return <Icons.xsbtc className="h-5 w-5 shrink-0" />;
    default:
      return <div className="h-5 w-5 shrink-0" />;
  }
};

const PortfolioSection: React.FC = () => {
  const { address } = useAccount();
  const strkLSTConfig = getSTRKAsset();
  const btcAssets = getLSTAssetsByCategory("BTC");

  // Get STRK LST balance
  const strkLSTBalanceData = useBalance({
    address,
    token: strkLSTConfig.LST_ADDRESS as `0x${string}`,
  });

  // Get BTC LST balances
  const wbtcBalance = useBalance({
    address,
    token: btcAssets.find((a) => a.SYMBOL === "WBTC")
      ?.LST_ADDRESS as `0x${string}`,
  });
  const tbtcBalance = useBalance({
    address,
    token: btcAssets.find((a) => a.SYMBOL === "tBTC")
      ?.LST_ADDRESS as `0x${string}`,
  });
  const lbtcBalance = useBalance({
    address,
    token: btcAssets.find((a) => a.SYMBOL === "LBTC")
      ?.LST_ADDRESS as `0x${string}`,
  });
  const solvbtcBalance = useBalance({
    address,
    token: btcAssets.find((a) => a.SYMBOL === "solvBTC")
      ?.LST_ADDRESS as `0x${string}`,
  });

  // Get prices and stats
  const strkPrice = useAtomValue(strkPriceAtom);
  const btcPrice = useAtomValue(btcPriceAtom);
  const lstStats = useAtomValue(lstStatsQueryAtom);

  // Calculate STRK holdings
  const strkHoldings = React.useMemo(() => {
    if (
      !strkLSTBalanceData.data?.value ||
      strkLSTBalanceData.data.value === BigInt(0)
    ) {
      return {
        lstAmount: 0,
        underlyingSTRK: 0,
        usdValue: 0,
      };
    }

    const lstAmount = Number(
      new MyNumber(
        strkLSTBalanceData.data.value.toString(),
        strkLSTConfig.DECIMALS,
      ).toEtherStr(),
    );

    const strkStat = lstStats.data?.find(
      (stat) =>
        stat.lstAddress?.toLowerCase() ===
        strkLSTConfig.LST_ADDRESS?.toLowerCase(),
    );
    const exchangeRate = strkStat?.exchangeRate || 0;
    const underlyingSTRK = lstAmount * exchangeRate;
    const usdValue = strkPrice ? underlyingSTRK * strkPrice : 0;

    return {
      lstAmount,
      underlyingSTRK,
      usdValue,
    };
  }, [strkLSTBalanceData, strkLSTConfig, lstStats, strkPrice]);

  // Calculate BTC holdings
  const btcLSTBalances = React.useMemo(() => {
    return btcAssets.map((asset) => {
      let balance = BigInt(0);
      switch (asset.SYMBOL) {
        case "WBTC":
          balance = wbtcBalance.data?.value || BigInt(0);
          break;
        case "tBTC":
          balance = tbtcBalance.data?.value || BigInt(0);
          break;
        case "LBTC":
          balance = lbtcBalance.data?.value || BigInt(0);
          break;
        case "solvBTC":
          balance = solvbtcBalance.data?.value || BigInt(0);
          break;
        default:
          balance = BigInt(0);
      }
      return {
        asset,
        balance,
      };
    });
  }, [wbtcBalance, tbtcBalance, lbtcBalance, solvbtcBalance, btcAssets]);

  const btcHoldings = React.useMemo(() => {
    const holdings = btcLSTBalances
      .filter(({ balance }) => balance > 0)
      .map(({ balance, asset }) => {
        const lstAmount = Number(
          new MyNumber(balance.toString(), asset.DECIMALS).toEtherStr(),
        );
        const lstStat = lstStats.data?.find(
          (stat) =>
            stat.lstAddress?.toLowerCase() === asset.LST_ADDRESS?.toLowerCase(),
        );
        const exchangeRate = lstStat?.exchangeRate || 1;
        const underlyingBTC = lstAmount * exchangeRate;
        const usdValue = btcPrice ? underlyingBTC * btcPrice : 0;

        return {
          asset,
          lstAmount,
          underlyingBTC,
          usdValue,
        };
      });

    const totalLSTAmount = holdings.reduce((sum, h) => sum + h.lstAmount, 0);
    const totalUnderlyingBTC = holdings.reduce(
      (sum, h) => sum + h.underlyingBTC,
      0,
    );
    const totalUsd = holdings.reduce((sum, h) => sum + h.usdValue, 0);

    return {
      holdings,
      totalLSTAmount,
      totalUnderlyingBTC,
      totalUsd,
    };
  }, [btcLSTBalances, btcPrice, lstStats]);

  // Calculate total value staked
  const totalValueStaked = React.useMemo(() => {
    let total = 0;
    if (strkHoldings) {
      total += strkHoldings.usdValue;
    }
    total += btcHoldings.totalUsd;
    return total;
  }, [strkHoldings, btcHoldings]);

  // Fetch Season 1 points from API - using same logic as rewards page
  const [season1Points, setSeason1Points] = React.useState<string | null>(null);
  const [season1Loading, setSeason1Loading] = React.useState(false);

	const [season2Points, setSeason2Points] = React.useState<string | null>(null);
	const [season2Loading, setSeason2Loading] = React.useState(false);

  React.useEffect(() => {
    if (!address) {
      setSeason1Points(null);
      return;
    }

    const fetchSeason1Points = async () => {
      setSeason1Loading(true);
      try {
        const result = await pointsApolloClient.query({
          query: GET_USER_NET_TOTAL_POINTS_SEASON1,
          variables: { userAddress: address },
          fetchPolicy: "network-only",
        });

        const userData = result.data?.getUserNetTotalPointsSeason1;

        // Use weightedTotalPoints for display (weighted points refer to previous total_points)
        if (userData?.weightedTotalPoints) {
          setSeason1Points(userData.weightedTotalPoints);
        } else {
          setSeason1Points("0");
        }
      } catch (error) {
        console.error("Error fetching Season 1 points:", error);
        setSeason1Points("0");
      } finally {
        setSeason1Loading(false);
      }
    };

    fetchSeason1Points();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- pointsApolloClient is stable
  }, [address]);

  // Season 2 is 0 for now
  React.useEffect(() => {
    if (!address) {
      setSeason2Points(null);
      return;
    }

		const fetchSeason2Points = async () => {
      setSeason2Loading(true);
      try {
        const result = await pointsApolloClient.query({
          query: GET_USER_NET_TOTAL_POINTS_SEASON2,
          variables: { userAddress: address, overall: true },
          fetchPolicy: "network-only",
        });

        const userData = result.data?.getUserNetTotalPointsSeason2;

        // Use weightedTotalPoints for display (weighted points refer to previous total_points)
        if (userData?.weightedTotalPoints) {
          setSeason2Points(userData.weightedTotalPoints);
        } else {
          setSeason2Points("0");
        }
      } catch (error) {
        console.error("Error fetching Season 2 points:", error);
        setSeason2Points("0");
      } finally {
        setSeason2Loading(false);
      }
    };

		fetchSeason2Points();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- pointsApolloClient is stable
  }, [address]);

  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-col gap-6 lg:max-w-none",
        "rounded-[14px] border border-[#E5E8EB]",
        "shadow-[0_1px_2px_-1px_#0000001A,_0_1px_3px_0_#0000001A]",
      )}
    >
      <div className="flex flex-col gap-4 rounded-xl border border-[#E5E8EB] bg-white px-2 py-3 shadow-sm lg:p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-[#6B7780]">PORTFOLIO</h2>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-[#E5E8EB] pb-2">
          <span className="text-sm text-[#6B7780]">Your Stake</span>
          <span className="text-xl text-[#1A1F24]">
            {!address
              ? "-"
              : `$${formatNumberWithCommas(totalValueStaked.toFixed(2))}`}
          </span>
        </div>

        {/* xSTRK Holdings */}
        <div className="rounded-xl px-0 py-1 lg:px-0 lg:py-0">
          <div className="flex w-full items-start gap-3">
            <Icons.strkLogo className="h-10 w-10 shrink-0" />
            <div className="flex flex-1 items-start justify-between">
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex w-full items-center justify-between">
                  <span className="text-left text-sm text-[#1A1F24]">
                    {formatBalance(strkHoldings.lstAmount, 2)} xSTRK
                  </span>
                  <span className="text-sm font-semibold text-[#1A1F24]">
                    {formatBalance(strkHoldings.underlyingSTRK, 2)}{" "}
                    STRK
                  </span>
                </div>
                <span className="text-left text-xs text-[#6B7780]">
                  ${formatNumberWithCommas(strkHoldings.usdValue, 2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BTC Holdings */}
        <div className="rounded-xl px-0 py-1 lg:px-0 lg:py-0">
          <div className="flex w-full items-start gap-3">
            <Icons.btcLogo className="h-10 w-10 shrink-0" />
            <div className="flex flex-1 items-start justify-between">
              <div className="flex w-full flex-col gap-0.5">
                {/* <span className="text-left text-sm text-[#1A1F24]">BTC</span> */}
                <div className="flex w-full items-center justify-between">
                  <span className="text-left text-sm text-[#1A1F24]">
                    {formatBalance(btcHoldings.totalLSTAmount, 6)}{" "}
                    xyBTC
                  </span>
                  <span className="text-sm font-semibold text-[#1A1F24]">
                    {formatBalance(btcHoldings.totalUnderlyingBTC, 6)}{" "}
                    BTC
                  </span>
                </div>
                <span className="text-left text-xs text-[#6B7780]">
                  ${formatNumberWithCommas(btcHoldings.totalUsd, 2)}
                </span>
              </div>
            </div>
          </div>
          {btcHoldings.holdings.length > 0 && (
            <div className="mt-3 space-y-3 rounded-lg bg-[#F5F7F8] p-3 lg:ml-[20px]">
              {btcHoldings.holdings.map((holding) => (
                <div
                  key={holding.asset.SYMBOL}
                  className="flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      {getBTCLSTIcon(holding.asset.LST_SYMBOL)}
                      <span className="text-[#1A1F24]">
                        {formatBalance(holding.lstAmount, 6)}{" "}
                        {holding.asset.LST_SYMBOL}
                      </span>
                    </div>
                    <span className="text-[#6B7780] ml-[22px]">
                      ${formatNumberWithCommas(holding.usdValue, 2)}
                    </span>
                  </div>
                  <span className="text-right text-[#6B7780]">
                    {formatBalance(holding.underlyingBTC, 6)}{" "}
                    {holding.asset.SYMBOL}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Message */}
        <div className="rounded-lg border border-[#FFC46680] bg-[#FFC4661A] p-2 text-xs text-[#D69733]">
          <p className="mb-1">
            Only wallet-held LSTs are shown. LSTs deployed in third-party dApps
            {" won't"} appear here.
          </p>
          {/* TODO: Add link to portfolio page */}
          {/* <Link
            href="/portfolio"
            className="inline-flex items-center gap-1 font-medium text-[#0D5F4E] hover:underline"
          >
            Visit Portfolio page
            <ExternalLink className="h-3 w-3" />
          </Link> */}
        </div>

        {/* Season Points */}
        <div className="border-t border-[#E5E8EB] p-2 lg:p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#6B7780]">Season 1 Points</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-[#6B7780]" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs rounded-md border border-[#03624C] bg-white text-[#03624C]">
                      Points earned during Season 1 [Nov 27th 2024 - Dec 15th 2025]
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm text-[#1A1F24]">
                {!address
                  ? "-"
                  : season1Loading
                    ? "..."
                    : season1Points !== null
                      ? `${formatNumberWithCommas(season1Points)} pts`
                      : "0 pts"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#6B7780]">Season 2 Points</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-[#6B7780]" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs rounded-md border border-[#03624C] bg-white text-[#03624C]">
                      Points earned during Season 2 [Dec 16th 2025 - June 15th 2026]
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm text-[#1A1F24]">
                {!address
                  ? "-"
                  : season2Loading
                    ? "..."
                    : season2Points !== null
                      ? `${formatNumberWithCommas(season2Points)} pts`
                      : "0 pts"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSection;
