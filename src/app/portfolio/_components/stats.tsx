"use client";

import { useAtomValue } from "jotai";
import React, { useMemo } from "react";

import { formatNumber } from "@/lib/utils";
import { userEkuboxSTRKPositions } from "@/store/ekubo.store";
import { userHaikoBalanceAtom } from "@/store/haiko.store";
import { exchangeRateAtom, userXSTRKBalanceAtom } from "@/store/lst.store";
import { userxSTRKNostraBalance } from "@/store/nostra.store";
import { snAPYAtom } from "@/store/staking.store";
import { uservXSTRKBalanceAtom } from "@/store/vesu.store";

const Stats: React.FC = () => {
  const vxStrkBalance = useAtomValue(uservXSTRKBalanceAtom(undefined));
  const userHaikoBalance = useAtomValue(userHaikoBalanceAtom(undefined));
  const nostraBal = useAtomValue(userxSTRKNostraBalance(undefined));
  const ekuboPosi = useAtomValue(userEkuboxSTRKPositions(undefined));

  const apy = useAtomValue(snAPYAtom);
  const currentXSTRKBalance = useAtomValue(userXSTRKBalanceAtom);
  const exchangeRate = useAtomValue(exchangeRateAtom);

  const totalXSTRK = useMemo(() => {
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

  const totalUSD = useMemo(() => {
    if (Number.isNaN(exchangeRate.rate)) {
      return "";
    }
    return `$${(totalXSTRK * exchangeRate.rate).toFixed(2)}`;
  }, [totalXSTRK, exchangeRate]);

  return (
    <div className="flex h-fit w-full items-center justify-between gap-3 rounded-xl border border-[#AACBC4]/30 bg-white p-5 px-12 font-poppins shadow-sm">
      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-[#03624C]">
          Total staked STRK
        </span>
        <p className="flex items-end gap-2 text-xl font-semibold leading-[1] text-black">
          {formatNumber(totalXSTRK.toFixed(2))}
          <span className="text-sm font-normal leading-[1.2] text-muted-foreground/80">
            {totalUSD}
          </span>
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-[#03624C]">
          xSTRK in Wallet
        </span>
        <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
          {formatNumber(currentXSTRKBalance.value.toEtherToFixedDecimals(2))}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-[#03624C]">DApps xSTRK</span>
        <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
          {(
            totalXSTRK -
            Number(currentXSTRKBalance.value.toEtherToFixedDecimals(2))
          ).toFixed(2)}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-[#03624C]">APY</span>
        <p className="-ml-3 flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
          ~{(apy.value * 100).toFixed(2)}%
        </p>
      </div>
    </div>
  );
};

export default Stats;
