"use client";

import { atom, useAtomValue } from "jotai";
import React from "react";

import { formatNumberWithCommas } from "@/lib/utils";
import { userEkuboxSTRKPositions } from "@/store/ekubo.store";
import { apiExchangeRateAtom, userLSTBalanceAtom } from "@/store/lst.store";
import { userLSTNostraBalance } from "@/store/nostra.store";
import { snAPYAtom } from "@/store/staking.store";
import { uservXSTRKBalanceAtom } from "@/store/vesu.store";
import { assetPriceAtom } from "@/store/common.store";
import { getSTRKFarmBalanceAtom } from "@/store/strkfarm.store";
import { userOpusBalanceAtom } from "@/store/opus.store";

export const totalXSTRKAcrossDefiHoldingsAtom = atom((get) => {
  const vesuBalance = get(uservXSTRKBalanceAtom(undefined));
  // const haikoBalance = get(userHaikoBalanceAtom(undefined));
  const nostraBalance = get(userLSTNostraBalance(undefined));
  const ekuboBalance = get(userEkuboxSTRKPositions(undefined));
  const lstBalance = get(userLSTBalanceAtom);
  const opusBalance = get(userOpusBalanceAtom(undefined));
  const strkfarmXSTRKBalance = get(getSTRKFarmBalanceAtom(undefined));
  const value =
    Number(vesuBalance.data.lstAmount.toEtherToFixedDecimals(2)) +
    Number(nostraBalance.data.lstAmount.toEtherToFixedDecimals(2)) +
    Number(ekuboBalance.data.lstAmount.toEtherToFixedDecimals(2)) +
    Number(lstBalance.value.toEtherToFixedDecimals(2)) + 
    Number(strkfarmXSTRKBalance.data.lstAmount.toEtherToFixedDecimals(2)) +
    Number(opusBalance.data.lstAmount.toEtherToFixedDecimals(2));
  if (Number.isNaN(value)) {
    return 0;
  }
  return value;
});

const Stats: React.FC = () => {
  const strkPrice = useAtomValue(assetPriceAtom);
  const apy = useAtomValue(snAPYAtom);
  const currentLSTBalance = useAtomValue(userLSTBalanceAtom);
  const exchangeRate = useAtomValue(apiExchangeRateAtom);

  const totalXSTRK = useAtomValue(totalXSTRKAcrossDefiHoldingsAtom);

  const totalUSD = React.useMemo(() => {
    if (Number.isNaN(exchangeRate.rate) || !strkPrice.data) {
      return "";
    }

    try {
      const xstrkPrice = strkPrice.data * exchangeRate.rate;

      return `$${(totalXSTRK * xstrkPrice).toFixed(2)}`;
    } catch (error) {
      console.error("Error in getting xSTRK total USD value", error);
      return "";
    }
  }, [exchangeRate.rate, totalXSTRK]);

  return (
    <div className="flex h-fit w-full items-center justify-between rounded-xl border border-[#AACBC4]/30 bg-white p-5 font-poppins shadow-sm lg:px-8">
      <div className="flex w-[100%] gap-3 lg:w-[60%]">
        <div className="flex w-full flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            Total staked STRK
          </span>
          <p className="flex items-end gap-2 text-xl font-semibold leading-[1] text-black">
            {formatNumberWithCommas(totalXSTRK.toFixed(2))}
            <span className="text-sm font-normal leading-[1.2] text-muted-foreground/80">
              {totalUSD}
            </span>
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            xSTRK in Wallet
          </span>
          <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            {formatNumberWithCommas(
              currentLSTBalance.value.toEtherToFixedDecimals(2),
            )}
          </p>
        </div>
      </div>

      <div className="mt-[25px] flex w-[100%] gap-3 lg:mt-0 lg:w-[40%]">
        <div className="flex w-full flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            xSTRK in DApps
          </span>
          <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            {formatNumberWithCommas(
              (
                totalXSTRK -
                Number(currentLSTBalance.value.toEtherToFixedDecimals(2))
              ).toFixed(2),
            )}
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            xSTRK APY
          </span>
          <p className="-ml-3 flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            ~{(apy.value.strkApy * 100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
