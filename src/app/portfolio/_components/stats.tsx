"use client";

import { atom, useAtomValue } from "jotai";
import React from "react";

import { BalanceWithLargeSubscript } from "@/components/balance-with-large-subscript";
import { getLSTAssetBySymbol, getSTRKAsset } from "@/constants";
import {
  ASSET_SYMBOL_TO_HYPER_YIELD,
  getLstTokenKeyForAsset,
  getLstUsdPrice,
  portfolioDataTotalEther,
  portfolioWalletEther,
} from "@/lib/portfolio-types";
import { userEkuboxSTRKPositions } from "@/store/ekubo.store";
import { userLSTBalanceAtom } from "@/store/lst.store";
import { userLSTNostraBalance } from "@/store/nostra.store";
import { snAPYAtom } from "@/store/staking.store";
import { uservXSTRKBalanceAtom } from "@/store/vesu.store";
import { getSTRKFarmBalanceAtom } from "@/store/strkfarm.store";
import { userOpusBalanceAtom } from "@/store/opus.store";
import {
  portfolioAssetSymbolAtom,
  portfolioSnapshotAtom,
} from "@/store/portfolio.store";
import { protocolYieldsAtom } from "@/store/defi.store";

export const totalXSTRKAcrossDefiHoldingsAtom = atom((get) => {
  const snapshot = get(portfolioSnapshotAtom);
  const xstrk = snapshot.data?.byLst?.XSTRK;
  const strkDecimals = getSTRKAsset().DECIMALS;
  if (xstrk && portfolioDataTotalEther(xstrk, strkDecimals) > 0) {
    return portfolioDataTotalEther(xstrk, strkDecimals);
  }
  const vesuBalance = get(uservXSTRKBalanceAtom(undefined));
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
  const assetSymbol = useAtomValue(portfolioAssetSymbolAtom);
  const { data: snapshot, isLoading, error } = useAtomValue(
    portfolioSnapshotAtom,
  );
  const lstConfig = getLSTAssetBySymbol(assetSymbol) ?? getSTRKAsset();
  const lstTokenKey = getLstTokenKeyForAsset(assetSymbol);
  const portfolioData = snapshot?.byLst?.[lstTokenKey];

  const apy = useAtomValue(snAPYAtom);
  const yields = useAtomValue(protocolYieldsAtom);
  const clientLstBalance = useAtomValue(userLSTBalanceAtom);
  const clientStrkTotal = useAtomValue(totalXSTRKAcrossDefiHoldingsAtom);

  const decimals = lstConfig.DECIMALS;
  const lstSymbol = lstConfig.LST_SYMBOL;
  const isBTC = lstConfig.SYMBOL?.toLowerCase().includes("btc");
  const balanceDecimals = isBTC ? 8 : 2;

  const snapshotTotal = portfolioDataTotalEther(portfolioData, decimals);
  const snapshotWallet = portfolioWalletEther(portfolioData, decimals);
  const useClientFallback =
    assetSymbol === "STRK" &&
    !isLoading &&
    (!snapshot ||
      !!error ||
      portfolioDataTotalEther(portfolioData, decimals) <= 0);

  const clientWalletLst = Number(
    clientLstBalance.value.toEtherToFixedDecimals(2),
  );
  const clientTotalLst = clientStrkTotal;

  const totalLst = useClientFallback ? clientTotalLst : snapshotTotal;
  const walletLst = useClientFallback ? clientWalletLst : snapshotWallet;
  const defiLst = useClientFallback
    ? Math.max(0, clientTotalLst - clientWalletLst)
    : totalLst - walletLst;

  const totalUSD = React.useMemo(() => {
    if (!portfolioData || !snapshot?.conversionRates) return "";
    const lstPrice = getLstUsdPrice(lstTokenKey, snapshot.conversionRates);
    return `$${(totalLst * lstPrice).toFixed(2)}`;
  }, [portfolioData, snapshot, totalLst, lstTokenKey]);

  const displayApy = React.useMemo(() => {
    const hyperKey = ASSET_SYMBOL_TO_HYPER_YIELD[assetSymbol];
    if (hyperKey && yields[hyperKey]?.value) {
      return yields[hyperKey]!.value!;
    }
    if (assetSymbol === "STRK") {
      return (apy.value.strkApy ?? 0) * 100;
    }
    return (apy.value.btcApy ?? 0) * 100;
  }, [assetSymbol, yields, apy]);

  if (isLoading) {
    return (
      <div className="flex h-fit w-full items-center justify-center rounded-xl border border-[#AACBC4]/30 bg-white p-8 font-poppins text-sm text-muted-foreground">
        Loading portfolio...
      </div>
    );
  }

  return (
    <div className="flex h-fit w-full items-center justify-between rounded-xl border border-[#AACBC4]/30 bg-white p-5 font-poppins shadow-sm lg:px-8">
      <div className="flex w-[100%] gap-3 lg:w-[60%]">
        <div className="flex w-full flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            Total {lstSymbol}
          </span>
          <p className="flex items-end gap-2 text-xl font-semibold leading-[1] text-black">
            <BalanceWithLargeSubscript value={totalLst} decimals={balanceDecimals} />
            <span className="text-sm font-normal leading-[1.2] text-muted-foreground/80">
              {totalUSD}
            </span>
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            {lstSymbol} in Wallet
          </span>
          <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            <BalanceWithLargeSubscript value={walletLst} decimals={balanceDecimals} />
          </p>
        </div>
      </div>

      <div className="mt-[25px] flex w-[100%] gap-3 lg:mt-0 lg:w-[40%]">
        <div className="flex w-full flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            {lstSymbol} in DApps
          </span>
          <p className="flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            <BalanceWithLargeSubscript
              value={Math.max(0, defiLst)}
              decimals={balanceDecimals}
            />
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-3">
          <span className="text-xs font-medium text-[#03624C] lg:text-sm">
            {lstSymbol} APY
          </span>
          <p className="-ml-3 flex items-end gap-4 text-xl font-semibold leading-[1] text-black">
            ~{displayApy.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
