"use client";

import { useAtomValue } from "jotai";
import React from "react";

import { formatNumber, getSTRKPrice } from "@/lib/utils";
import { userEkuboxSTRKPositions } from "@/store/ekubo.store";
import { userHaikoBalanceAtom } from "@/store/haiko.store";
import { userSTRKBalanceAtom, userXSTRKBalanceAtom } from "@/store/lst.store";
import { userxSTRKNostraBalance } from "@/store/nostra.store";
import { snAPYAtom } from "@/store/staking.store";
import { uservXSTRKBalanceAtom } from "@/store/vesu.store";

const Stats: React.FC = () => {
  const [stakedUSD, setStakedUSD] = React.useState(0);
  const [totalSTRK, setTotalSTRK] = React.useState(0);

  const vxStrkBalance = useAtomValue(uservXSTRKBalanceAtom(undefined));
  const userHaikoBalance = useAtomValue(userHaikoBalanceAtom(undefined));
  const nostraBal = useAtomValue(userxSTRKNostraBalance(undefined));
  const ekuboPosi = useAtomValue(userEkuboxSTRKPositions(undefined));

  const currentStaked = useAtomValue(userSTRKBalanceAtom);
  const apy = useAtomValue(snAPYAtom);
  const currentXSTRKBalance = useAtomValue(userXSTRKBalanceAtom);

  React.useEffect(() => {
    (async () => {
      const price = await getSTRKPrice();

      setStakedUSD(
        Number(currentStaked.value.toEtherToFixedDecimals(8)) * price,
      );
    })();
  }, [currentStaked]);

  React.useEffect(() => {
    setTotalSTRK(
      parseInt(userHaikoBalance.value.toString(), 2) +
        Number(vxStrkBalance.data.xSTRKAmount.toEtherToFixedDecimals(2)) +
        Number(nostraBal.data.xSTRKAmount.toEtherToFixedDecimals(2)) +
        Number(ekuboPosi.data.xSTRKAmount.toEtherToFixedDecimals(2)),
    );
  }, [
    nostraBal,
    userHaikoBalance,
    vxStrkBalance,
    ekuboPosi,
  ]);

  console.log(totalSTRK, "totalSTRK");

  return (
    <div className="flex h-fit w-full items-center justify-between gap-3 rounded-xl border border-[#AACBC4]/30 bg-white p-5 px-12 font-poppins shadow-sm">
      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-[#03624C]">
          Total staked STRK
        </span>
        <p className="flex items-end gap-2 text-xl font-semibold leading-[1] text-black">
          {formatNumber(currentStaked.value.toEtherToFixedDecimals(2))}
          <span className="text-sm font-normal leading-[1.2] text-muted-foreground/80">
            ${stakedUSD.toFixed(2)}
          </span>
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-[#03624C]">Total xSTRK</span>
        <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
          {Number(totalSTRK.toString()).toFixed(2)}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-[#03624C]">Unused xSTRK</span>
        <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
          {formatNumber(currentXSTRKBalance.value.toEtherToFixedDecimals(2))}
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
