import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  formatNumber,
  createTrovesHyperConfig,
  buildUrlWithReferrer,
} from "@/lib/utils";
import {
  totalStakedAtom,
  totalStakedUSDAtom,
  userLSTBalanceAtom,
} from "@/store/lst.store";
import { snAPYAtom } from "@/store/staking.store";
import { totalXSTRKAcrossDefiHoldingsAtom } from "@/features/portfolio/components/stats";
import { tabsAtom, activeSubTabAtom } from "@/store/merry.store";
import { lstConfigAtom } from "@/store/common.store";

import { Icons } from "../../../components/Icons";
import { type Platform } from "./stake-sub-tab";
import AssetSelector, { getFirstBtcAsset } from "./asset-selector";
import { MyDottedTooltip } from "../../../components/my-tooltip";

// TODO: can shift this to utils if it is same as stake's platformConfig - SOLVED
const platformConfig = (lstConfig: any) => {
  return {
    trovesHyper: {
      ...createTrovesHyperConfig(lstConfig.LST_SYMBOL),
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
  const isBTC = lstConfig.SYMBOL?.toLowerCase().includes("btc");
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

      // TODO: this logic where referrer query is conditioanlly appended can be moved to common utils and used everywhere required - SOLVED
      const additionalParams: Record<string, string> = {};
      if (activeSubTab && activeSubTab !== "stake") {
        additionalParams.tab = activeSubTab;
      }

      const finalPath = buildUrlWithReferrer(
        newPath,
        referrer,
        additionalParams,
      );
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

  const xSTRKInDefiOnly = useMemo(() => {
    return totalXSTRKAcrossDefi - Number(currentStaked.value.toEtherStr());
  }, [totalXSTRKAcrossDefi, currentStaked.value]);

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 lg:px-6">
        <p className="flex flex-col items-center text-xs font-semibold lg:flex-row lg:gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#3F6870] lg:text-[#8D9C9C]">
            APY
            {/* TODO: use InfoTooltip - SOLVED */}
            <MyDottedTooltip
              tooltip={
                <div className="text-[#03624C]">
                  {!selectedPlatform || selectedPlatform === "none"
                    ? "Estimated current compounded annualised yield on staking in terms of STRK."
                    : `Estimated yield including both staking and lending on ${platformConfig(lstConfig)[selectedPlatform]?.platform || "DeFi platform"}.`}
                </div>
              }
            >
              <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
            </MyDottedTooltip>
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
            onChange={handleAssetChange}
            mode={mode}
          />
        )}

        <div>
          <div className="flex items-center justify-between rounded-md bg-[#17876D] px-2 py-1 text-xs text-white">
            <span>
              Available stake:{" "}
              {Number(
                currentStaked.value.toEtherToFixedDecimals(isBTC ? 8 : 2),
              ).toFixed(isBTC ? 8 : 2)}{" "}
              {lstConfig.LST_SYMBOL}
            </span>
            <div className="ml-auto pl-2">
              {/* TODO: use InfoTooltip - SOLVED */}
              <MyDottedTooltip
                tooltip={
                  <>
                    {lstConfig.LST_SYMBOL} directly available in your wallet.
                    You can unstake this {lstConfig.LST_SYMBOL} anytime.
                    <br />
                    <br />
                    Excludes {lstConfig.LST_SYMBOL} in DeFi apps.
                  </>
                }
              >
                <Info className="ml-[5px] size-3 text-[#efefef]" />
              </MyDottedTooltip>
            </div>
          </div>

          {!isBTC && (
            <a href="/portfolio">
              <div className="mt-[10px] flex items-center justify-between rounded-md bg-white px-2 py-1 text-xs text-[#17876D]">
                <span>
                  Stake in DeFi:{" "}
                  {Number(xSTRKInDefiOnly.toFixed(isBTC ? 8 : 2)).toFixed(
                    isBTC ? 8 : 2,
                  )}{" "}
                  {lstConfig.LST_SYMBOL}
                </span>
                <div className="ml-auto pl-2">
                  {/* TODO: use InfoTooltip - SOLVED */}
                  <MyDottedTooltip
                    tooltip={
                      <>
                        <div>
                          {lstConfig.LST_SYMBOL} in third party DeFi apps. You
                          cannot unstake this {lstConfig.LST_SYMBOL} directly.
                          Withdraw your {lstConfig.LST_SYMBOL} from DeFi apps to
                          unstake here.
                        </div>
                        <br />
                        <div>
                          <b>Note:</b> This is a beta feature, may not include
                          all DApps. Click{" "}
                          <a href="/portfolio">
                            <b>here</b>
                          </a>{" "}
                          to see more details.
                        </div>
                      </>
                    }
                  >
                    <Info className="ml-[5px] size-3 text-[#17876D]" />
                  </MyDottedTooltip>
                </div>
              </div>
            </a>
          )}
        </div>
      </div>
    </>
  );
};

export default Stats;
