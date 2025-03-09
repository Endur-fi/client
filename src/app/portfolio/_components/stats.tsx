"use client";

import { atom, useAtomValue } from "jotai";
import React from "react";

import { formatNumberWithCommas } from "@/lib/utils";
import { userEkuboxSTRKPositions } from "@/store/ekubo.store";
import { exchangeRateAtom, userXSTRKBalanceAtom } from "@/store/lst.store";
import { userxSTRKNostraBalance } from "@/store/nostra.store";
import { snAPYAtom } from "@/store/staking.store";
import { uservXSTRKBalanceAtom } from "@/store/vesu.store";
import { strkPriceAtom } from "@/store/common.store";

export const totalXSTRKAcrossDefiHoldingsAtom = atom((get) => {
  const vesuBalance = get(uservXSTRKBalanceAtom(undefined));
  // const haikoBalance = get(userHaikoBalanceAtom(undefined));
  const nostraBalance = get(userxSTRKNostraBalance(undefined));
  const ekuboBalance = get(userEkuboxSTRKPositions(undefined));
  const xstrkBalance = get(userXSTRKBalanceAtom);
  const value =
    Number(vesuBalance.data.xSTRKAmount.toEtherToFixedDecimals(2)) +
    Number(nostraBalance.data.xSTRKAmount.toEtherToFixedDecimals(2)) +
    Number(ekuboBalance.data.xSTRKAmount.toEtherToFixedDecimals(2)) +
    Number(xstrkBalance.value.toEtherToFixedDecimals(2));
  if (Number.isNaN(value)) {
    return 0;
  }
  return value;
});

const Stats: React.FC = () => {
  const strkPrice = useAtomValue(strkPriceAtom);
  const apy = useAtomValue(snAPYAtom);
  const currentXSTRKBalance = useAtomValue(userXSTRKBalanceAtom);
  const exchangeRate = useAtomValue(exchangeRateAtom);

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
    <div className="flex h-fit w-full flex-wrap items-center justify-between rounded-xl border border-[#AACBC4]/30 bg-white p-5 font-poppins shadow-sm lg:px-12">
      <div className="flex w-[100%] gap-3 lg:w-[50%]">
        <div className="flex w-[50%] flex-col items-start gap-3">
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

        <div className="flex w-[50%] flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            xSTRK in Wallet
          </span>
          <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            {formatNumberWithCommas(
              currentXSTRKBalance.value.toEtherToFixedDecimals(2),
            )}
          </p>
        </div>
      </div>

      <div className="mt-[25px] flex w-[100%] gap-3 lg:mt-0 lg:w-[50%]">
        <div className="flex w-[50%] flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            xSTRK in DApps
          </span>
          <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            {formatNumberWithCommas(
              (
                totalXSTRK -
                Number(currentXSTRKBalance.value.toEtherToFixedDecimals(2))
              ).toFixed(2),
            )}
          </p>
        </div>

        <div className="flex w-[50%] flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            xSTRK APY
          </span>
          <p className="-ml-3 flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            ~{(apy.value * 100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
