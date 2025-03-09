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
  userXSTRKBalanceAtom,
} from "@/store/lst.store";
import { snAPYAtom } from "@/store/staking.store";

import { Icons } from "./Icons";
import { type Platform } from "./stake";
import { totalXSTRKAcrossDefiHoldingsAtom } from "@/app/portfolio/_components/stats";

interface StatsProps {
  selectedPlatform?: Platform;
  getPlatformYield?: (platform: Platform) => number;
}

const Stats: React.FC<StatsProps> = ({
  selectedPlatform,
  getPlatformYield,
}) => {
  const apy = useAtomValue(snAPYAtom);
  const currentStaked = useAtomValue(userXSTRKBalanceAtom);
  const totalStaked = useAtomValue(totalStakedAtom);
  const totalStakedUSD = useAtomValue(totalStakedUSDAtom);

  const totalXSTRKAcrossDefi = useAtomValue(totalXSTRKAcrossDefiHoldingsAtom);

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
            ~{(apy.value * 100).toFixed(2)}%
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
              {formatNumber(totalStaked.value.toEtherToFixedDecimals(2))} STRK
            </span>
            <span className="font-medium">
              | ${formatNumber(totalStakedUSD.value)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b bg-gradient-to-t from-[#E9F3F0] to-white px-5 py-12 lg:py-12">
        <div className="flex items-center gap-2 text-sm font-semibold text-black lg:gap-4 lg:text-2xl">
          <Icons.strkLogo className="size-6 lg:size-[35px]" />
          STRK
        </div>

        <div>
          <div className="flex items-center justify-between rounded-md bg-[#17876D] px-2 py-1 text-xs text-white">
            <span>
              Available stake:{" "}
              {formatNumber(currentStaked.value.toEtherToFixedDecimals(2))}{" "}
              xSTRK
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
                    xSTRK directly available in your wallet. You can unstake
                    this xSTRK anytime.
                    <br />
                    <br />
                    Excludes xSTRK in DeFi apps.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <a href="/portfolio">
            <div className="mt-[10px] flex items-center justify-between rounded-md bg-white px-2 py-1 text-xs text-[#17876D]">
              <span>
                Stake in DeFi: {formatNumber(xSTRKInDefiOnly.toFixed(2))} xSTRK
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
                        xSTRK in third party DeFi apps. You cannot unstake this
                        xSTRK directly. Withdraw your xSTRK from DeFi apps to
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
