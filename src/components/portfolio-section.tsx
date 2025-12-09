"use client";

import { useAtomValue } from "jotai";
import { useAccount, useBalance } from "@starknet-react/core";
import React from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Info } from "lucide-react";

import { Icons } from "./Icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { getLSTAssetsByCategory, getSTRKAsset } from "@/constants";
import { formatNumber, formatNumberWithCommas } from "@/lib/utils";
import { lstStatsQueryAtom } from "@/store/lst.store";
import { assetPriceAtom } from "@/store/common.store";
import { btcPriceAtom, strkTVLAtom, btcTVLAtom } from "@/store/staking.store";
import MyNumber from "@/lib/MyNumber";

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
  const strkPrice = useAtomValue(assetPriceAtom);
  const btcPrice = useAtomValue(btcPriceAtom);
  const lstStats = useAtomValue(lstStatsQueryAtom);
  const strkTVL = useAtomValue(strkTVLAtom);
  const btcTVL = useAtomValue(btcTVLAtom);

  // Calculate total platform TVL
  const totalPlatformTVL = React.useMemo(() => {
    return (strkTVL.value || 0) + (btcTVL.value || 0);
  }, [strkTVL, btcTVL]);

  // Calculate STRK holdings
  const strkHoldings = React.useMemo(() => {
    if (
      !strkLSTBalanceData.data?.value ||
      strkLSTBalanceData.data.value === BigInt(0)
    ) {
      return null;
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
    const usdValue = strkPrice.data ? underlyingSTRK * strkPrice.data : 0;

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

  if (!address) {
    return null;
  }

  return (
    <div className="flex w-full max-w-full flex-col gap-6 lg:max-w-none">
      {/* Total Value Staked */}
      <div className="flex items-center justify-between rounded-xl border border-[#E5E8EB] bg-white px-2 py-3 shadow-sm lg:px-4 lg:py-7">
        <span className="text-sm text-[#6B7780]">Total Value Staked</span>
        <p className="mt-2 text-xl text-[#1A1F24]">
          ${formatNumberWithCommas(totalPlatformTVL.toFixed(2))}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-[#E5E8EB] bg-white p-2 shadow-sm lg:p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1A1F24]">PORTFOLIO</h2>
        </div>

        {/* Your Stake instead */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-[#6B7780]">Your Stake</span>
          <span className="text-2xl text-[#1A1F24]">
            ${formatNumberWithCommas(totalValueStaked.toFixed(2))}
          </span>
        </div>

        {/* xSTRK Holdings */}
        {strkHoldings && (
          <div className="px-0 py-1 lg:px-0 lg:py-0">
            <div className="flex items-start gap-3">
              <Icons.strkLogo className="h-10 w-10 shrink-0" />
              <div className="flex flex-1 items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1A1F24]">
                    xSTRK
                  </span>
                  <span className="mt-1 text-sm text-[#1A1F24]">
                    {formatNumberWithCommas(strkHoldings.lstAmount.toFixed(2))}{" "}
                    xSTRK
                  </span>
                  <span className="mt-0.5 text-xs text-[#6B7780]">
                    ${formatNumberWithCommas(strkHoldings.usdValue.toFixed(2))}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[#1A1F24]">
                  {formatNumberWithCommas(
                    strkHoldings.underlyingSTRK.toFixed(2),
                  )}{" "}
                  STRK
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BTC Holdings */}
        {btcHoldings.holdings.length > 0 && (
          <div className="rounded-xl px-0 py-1 lg:px-0 lg:py-0">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-start gap-3">
                <Icons.btcLogo className="h-10 w-10 shrink-0" />
                <div className="flex flex-1 items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-left text-sm text-[#1A1F24]">
                      BTC
                    </span>
                    <span className="mt-1 text-sm text-[#1A1F24]">
                      {formatNumberWithCommas(
                        btcHoldings.totalUnderlyingBTC.toFixed(3),
                      )}{" "}
                      xyBTC
                    </span>
                    <span className="mt-0.5 text-left text-xs text-[#6B7780]">
                      ${formatNumberWithCommas(btcHoldings.totalUsd.toFixed(2))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1A1F24]">
                      {formatNumberWithCommas(
                        btcHoldings.totalUnderlyingBTC.toFixed(3),
                      )}{" "}
                      BTC
                    </span>
                    <ChevronDown className="h-4 w-4 text-[#6B7780] transition-transform duration-200 data-[state=open]:rotate-180" />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 space-y-2 border-t border-[#E5E8EB] pt-3">
                  {btcHoldings.holdings.map((holding) => (
                    <div
                      key={holding.asset.SYMBOL}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#6B7780]">
                          {formatNumberWithCommas(holding.lstAmount.toFixed(3))}{" "}
                          {holding.asset.LST_SYMBOL}
                        </span>
                        <span className="text-[#6B7780]">
                          {formatNumberWithCommas(
                            holding.underlyingBTC.toFixed(3),
                          )}{" "}
                          {holding.asset.SYMBOL}
                        </span>
                      </div>
                      <span className="text-[#6B7780]">
                        ${formatNumberWithCommas(holding.usdValue.toFixed(2))}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Info Message */}
        <div className="rounded-lg border border-[#E5E8EB] bg-[#FFF4E6] p-2 text-xs text-[#D69733]">
          <p className="mb-1">
            Only wallet-held LSTs are shown. LSTs deployed in third-party dApps
            won't appear here.
          </p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1 font-medium text-[#17876D] hover:underline"
          >
            Visit Portfolio page
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Season Points */}
        <div className="p-2 lg:p-4">
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
                      Points earned during Season 1
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-semibold text-[#1A1F24]">
                15,840 pts
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
                      Points earned during Season 2
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-semibold text-[#1A1F24]">
                15,840 pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSection;
