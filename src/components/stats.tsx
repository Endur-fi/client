import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
import { tabsAtom, activeSubTabAtom } from "@/store/merry.store";
import { lstConfigAtom } from "@/store/common.store";

const platformConfig = (lstConfig: any) => {
  return {
    trovesHyper: {
      platform: "Troves",
      name: `Trove's Hyper ${lstConfig.LST_SYMBOL} Vault`,
      description: (
        <p>Leveraged liquidation risk managed vault. Read all risks here</p>
      ),
    },
  };
};

interface StatsProps {
  selectedPlatform?: Platform;
  getPlatformYield?: (platform: Platform) => number;
  mode?: "stake" | "unstake"; // Add mode prop to determine sorting logic
}

const Stats: React.FC<StatsProps> = ({
  selectedPlatform,
  getPlatformYield,
  mode = "stake", // Default to stake mode
}) => {
  const router = useRouter();
  const apy = useAtomValue(snAPYAtom);
  const currentStaked = useAtomValue(userLSTBalanceAtom);
  const totalStaked = useAtomValue(totalStakedAtom);
  const totalStakedUSD = useAtomValue(totalStakedUSDAtom);
  const activeTab = useAtomValue(tabsAtom);
  const activeSubTab = useAtomValue(activeSubTabAtom);
  const lstConfig = useAtomValue(lstConfigAtom)!;
  const _isBTC = lstConfig.SYMBOL?.toLowerCase().includes("btc");
  const searchParams = useSearchParams();
  const referrer = searchParams.get("referrer");

  const totalXSTRKAcrossDefi = useAtomValue(totalXSTRKAcrossDefiHoldingsAtom);

  const [selectedAsset, setSelectedAsset] = React.useState<string>(
    lstConfig?.SYMBOL || getFirstBtcAsset(),
  );

  const handleAssetChange = (assetSymbol: string) => {
    setSelectedAsset(assetSymbol);

    if (activeTab === "btc") {
      const pathMap: Record<string, string> = {
        LBTC: "/lbtc",
        WBTC: "/wbtc",
        tBTC: "/tbtc",
        solvBTC: "/solvbtc",
      };

      const newPath = pathMap[assetSymbol] || "/btc";

      const queryParams = new URLSearchParams();
      if (referrer) queryParams.set("referrer", referrer);
      if (activeSubTab && activeSubTab !== "stake")
        queryParams.set("tab", activeSubTab);

      const queryString = queryParams.toString();
      const finalPath = queryString ? `${newPath}?${queryString}` : newPath;

      router.push(finalPath);
    }
  };

  React.useEffect(() => {
    if (lstConfig?.SYMBOL && activeTab === "btc") {
      setSelectedAsset(lstConfig.SYMBOL);
    }
  }, [lstConfig?.SYMBOL, activeTab]);

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

  const _xSTRKInDefiOnly = useMemo(() => {
    return totalXSTRKAcrossDefi - Number(currentStaked.value.toEtherStr());
  }, [totalXSTRKAcrossDefi, currentStaked.value]);

  return (
    <>
      <div className="flex items-center justify-between pt-2">
        <p className="flex flex-col items-center text-xs lg:flex-row lg:gap-2">
          <span className="flex items-center gap-1 text-xs text-[##6B7780]">
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
                    : `Estimated yield including both staking and lending on ${platformConfig(lstConfig)[selectedPlatform]?.platform || "DeFi platform"}.`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold text-[#1A1F24]">
              ~{memoizedApyValue}%
            </span>
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

        <div className="flex flex-col items-end lg:flex-row lg:items-center lg:gap-2">
          <p className="text-xs font-normal text-[#6B7780]">TVL</p>

          <p className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1A1F24]">
              {formatNumber(totalStaked.value.toEtherToFixedDecimals(2))}{" "}
              {lstConfig.SYMBOL}
            </span>
            <span className="text-xs font-normal text-[#6B7780]">
              | ${formatNumber(totalStakedUSD.value.toFixed(2))}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {activeTab === "strk" ? (
          <div className="flex w-full items-center gap-2 rounded-[14px] border border-[#E5E8EB] p-3 text-sm font-normal text-black">
            <Icons.strkLogo className="size-6" />
            STRK
          </div>
        ) : (
          <AssetSelector
            selectedAsset={selectedAsset}
            onChange={handleAssetChange}
            mode={mode}
          />
        )}
      </div>
    </>
  );
};

export default Stats;
