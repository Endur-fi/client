"use client";

import { useAtomValue } from "jotai";
import React from "react";

import { formatNumberWithCommas } from "@/lib/utils";
import { userEkuboxSTRKPositions } from "@/store/ekubo.store";
import { userHaikoBalanceAtom } from "@/store/haiko.store";
import { exchangeRateAtom, userXSTRKBalanceAtom } from "@/store/lst.store";
import { userxSTRKNostraBalance } from "@/store/nostra.store";
import { snAPYAtom } from "@/store/staking.store";
import { uservXSTRKBalanceAtom } from "@/store/vesu.store";
import { strkPriceAtom } from "@/store/common.store";

const Stats: React.FC = () => {
  const vxStrkBalance = useAtomValue(uservXSTRKBalanceAtom(undefined));
  const userHaikoBalance = useAtomValue(userHaikoBalanceAtom(undefined));
  const nostraBal = useAtomValue(userxSTRKNostraBalance(undefined));
  const ekuboPosi = useAtomValue(userEkuboxSTRKPositions(undefined));
  const strkPrice = useAtomValue(strkPriceAtom);
  const apy = useAtomValue(snAPYAtom);
  const currentXSTRKBalance = useAtomValue(userXSTRKBalanceAtom);
  const exchangeRate = useAtomValue(exchangeRateAtom);

  const totalXSTRK = React.useMemo(() => {
    const value =
      parseInt(userHaikoBalance.value.toString(), 2) +
      Number(vxStrkBalance.data.xSTRKAmount.toEtherToFixedDecimals(2)) +
      Number(nostraBal.data.xSTRKAmount.toEtherToFixedDecimals(2)) +
      Number(ekuboPosi.data.xSTRKAmount.toEtherToFixedDecimals(2)) +
      Number(currentXSTRKBalance.value.toEtherToFixedDecimals(2));
    if (Number.isNaN(value)) {
      return 0;
    }
    return value;
  }, [
    nostraBal,
    userHaikoBalance,
    vxStrkBalance,
    ekuboPosi,
    currentXSTRKBalance,
  ]);

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
    <div className="flex h-fit w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-[#AACBC4]/30 bg-white p-5 font-poppins shadow-sm lg:px-12">
      <div className="flex flex-col items-start gap-3">
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

      <div className="flex flex-col items-start gap-3">
        <span className="text-xs font-medium text-[#03624C] lg:text-sm">
          xSTRK in Wallet
        </span>
        <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
          {formatNumberWithCommas(
            currentXSTRKBalance.value.toEtherToFixedDecimals(2),
          )}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <span className="text-xs font-medium text-[#03624C] lg:text-sm">
          DApps xSTRK
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

      <div className="mr-5 flex flex-col items-start gap-3 sm:mr-0">
        <span className="text-xs font-medium text-[#03624C] lg:text-sm">
          APY
        </span>
        <p className="-ml-3 flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
          ~{(apy.value * 100).toFixed(2)}%
        </p>
      </div>
    </div>
  );
};

export default Stats;
