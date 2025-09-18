import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import React, { useMemo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/utils";
import {
  totalStakedAtom,
  totalStakedUSDAtom,
  userLSTBalanceAtom,
} from "@/store/lst.store";
import { snAPYAtom } from "@/store/staking.store";

import { Icons } from "./Icons";
import { type Platform } from "./stake";
import { totalXSTRKAcrossDefiHoldingsAtom } from "@/app/portfolio/_components/stats";
import AssetSelector, { getFirstBtcAsset } from "./asset-selector";
import { tabsAtom } from "@/store/merry.store";
import { lstConfigAtom } from "@/store/common.store";

interface StatsProps {
  selectedPlatform?: Platform;
  getPlatformYield?: (platform: Platform) => number;
}

const Stats: React.FC<StatsProps> = ({
  selectedPlatform,
  getPlatformYield,
}) => {
  const apy = useAtomValue(snAPYAtom);
  const currentStaked = useAtomValue(userLSTBalanceAtom);
  const totalStaked = useAtomValue(totalStakedAtom);
  const totalStakedUSD = useAtomValue(totalStakedUSDAtom);
  const activeTab = useAtomValue(tabsAtom);
  const lstConfig = useAtomValue(lstConfigAtom)!;
  const isBTC = lstConfig.SYMBOL?.toLowerCase().includes("btc");

  const totalXSTRKAcrossDefi = useAtomValue(totalXSTRKAcrossDefiHoldingsAtom);

  const [selectedAsset, setSelectedAsset] =
    React.useState<string>(getFirstBtcAsset());

  // Memoize APY values to prevent re-renders from async calculations
  const memoizedApyValue = useMemo(() => {
    const apyValue =
      activeTab === "strk" ? apy.value.strkApy * 100 : apy.value.btcApy * 100;

    // Show more decimal places for very small values
    if (apyValue < 0.01 && apyValue > 0) {
      return apyValue.toFixed(6);
    }
    return apyValue.toFixed(2);
  }, [activeTab, apy.value.strkApy, apy.value.btcApy]);

  const xSTRKInDefiOnly = useMemo(() => {
    return totalXSTRKAcrossDefi - Number(currentStaked.value.toEtherStr());
  }, [totalXSTRKAcrossDefi, currentStaked.value]);

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 lg:px-6">
        <p className="flex flex-col items-center text-xs font-semibold lg:flex-row lg:gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#3F6870] lg:text-[#8D9C9C]">
            APY
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-56 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  {!selectedPlatform || selectedPlatform === "none"
                    ? "Estimated current compounded annualised yield on staking in terms of STRK."
                    : `Estimated yield including both staking and lending on ${selectedPlatform === "vesu" ? "Vesu" : "Nostra"}.`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
          <span className="flex items-center gap-1">
            ~{memoizedApyValue}%
            {selectedPlatform && selectedPlatform !== "none" && (
              <span className="font-semibold text-[#17876D]">
                +{" "}
                {getPlatformYield &&
                  selectedPlatform &&
                  getPlatformYield(selectedPlatform).toFixed(2)}
                %
              </span>
            )}
          </span>
        </p>

        <div className="flex flex-col items-end text-xs font-bold text-[#3F6870] lg:flex-row lg:items-center lg:gap-2 lg:text-[#8D9C9C]">
          TVL
          <p className="flex items-center gap-2">
            <span>
              {formatNumber(totalStaked.value.toEtherToFixedDecimals(2))}{" "}
              {lstConfig.SYMBOL}
            </span>
            <span className="font-medium">
              | ${formatNumber(totalStakedUSD.value.toFixed(2))}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b bg-gradient-to-t from-[#E9F3F0] to-white px-5 py-12 lg:py-12">
        {activeTab === "strk" ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-black lg:gap-4 lg:text-2xl">
            <Icons.strkLogo className="size-6 lg:size-[35px]" />
            STRK
          </div>
        ) : (
          <AssetSelector
            selectedAsset={selectedAsset}
            onChange={setSelectedAsset}
          />
        )}

        <div>
          <div className="flex items-center justify-between rounded-md bg-[#17876D] px-2 py-1 text-xs text-white">
            <span>
              Available stake:{" "}
              {Number(
                currentStaked.value.toEtherToFixedDecimals(isBTC ? 6 : 2),
              ).toFixed(isBTC ? 6 : 2)}{" "}
              {lstConfig.LST_SYMBOL}
            </span>
            <div className="ml-auto pl-2">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-[5px] size-3 text-[#efefef]" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-56 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                  >
                    {lstConfig.LST_SYMBOL} directly available in your wallet.
                    You can unstake this {lstConfig.LST_SYMBOL} anytime.
                    <br />
                    <br />
                    Excludes {lstConfig.LST_SYMBOL} in DeFi apps.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <a href="/portfolio">
            <div className="mt-[10px] flex items-center justify-between rounded-md bg-white px-2 py-1 text-xs text-[#17876D]">
              <span>
                Stake in DeFi:{" "}
                {Number(xSTRKInDefiOnly.toFixed(isBTC ? 6 : 2)).toFixed(
                  isBTC ? 6 : 2,
                )}{" "}
                {lstConfig.LST_SYMBOL}
              </span>
              <div className="ml-auto pl-2">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-[5px] size-3 text-[#17876D]" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-56 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                    >
                      <div>
                        {lstConfig.LST_SYMBOL} in third party DeFi apps. You
                        cannot unstake this {lstConfig.LST_SYMBOL} directly.
                        Withdraw your {lstConfig.LST_SYMBOL} from DeFi apps to
                        unstake here.
                      </div>
                      <br />
                      <div>
                        <b>Note:</b> This is a beta feature, may not include all
                        DApps. Click{" "}
                        <a href="/portfolio">
                          <b>here</b>
                        </a>{" "}
                        to see more details.
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </a>
        </div>
      </div>
    </>
  );
};

export default Stats;
