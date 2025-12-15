import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";

import MyNumber from "@/lib/MyNumber";
import StakingService from "@/services/staking";

import { currentBlockAtom, providerAtom } from "./common.store";
import { getAssetPrice } from "@/lib/utils";
import { lstStatsQueryAtom } from "./lst.store";

const stakingService = new StakingService();

const snTotalStakingPowerQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["snTotalStakingPower", get(currentBlockAtom), get(providerAtom)],
    queryFn: () => {
      return stakingService.getTotalStakingPower();
    },
    refetchInterval: 60000,
  };
});

export const snTotalStakingPowerAtom = atom((get) => {
  const { data, error } = get(snTotalStakingPowerQueryAtom);
  return {
    value:
      error || !data
        ? {
            totalStakingPowerSTRK: MyNumber.fromZero(),
            totalStakingPowerBTC: MyNumber.fromZero(),
          }
        : data,
    error,
    isLoading: !data && !error,
  };
});

const snAlphaQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["snAlpha", get(currentBlockAtom), get(providerAtom)],
    queryFn: () => {
      return stakingService.getAlpha();
    },
    refetchInterval: 60000,
  };
});

export const snAlphaAtom = atom((get) => {
  const { data, error } = get(snAlphaQueryAtom);
  return {
    value: error || !data ? 0 : data,
    error,
    isLoading: !data && !error,
  };
});

export const yearlyMintingQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["yearlyMinting", get(currentBlockAtom), get(providerAtom)],
    queryFn: () => {
      return stakingService.getYearlyMinting();
    },
    refetchInterval: 60000,
  };
});

export const yearlyMintingAtom = atom((get) => {
  const { data, error } = get(yearlyMintingQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

// Separate atoms for prices to avoid async in main APY calculation
const strkPriceQueryAtom = atomWithQuery((get) => ({
  queryKey: ["strkPrice", get(currentBlockAtom), get(providerAtom)],
  queryFn: () => getAssetPrice(),
  refetchInterval: 60000,
}));

const btcPriceQueryAtom = atomWithQuery((get) => ({
  queryKey: ["btcPrice", get(currentBlockAtom), get(providerAtom)],
  queryFn: () => getAssetPrice(false),
  refetchInterval: 60000,
}));

export const strkPriceAtom = atom((get) => {
  const { data, error } = get(strkPriceQueryAtom);
  return error || !data ? 0 : data;
});

export const btcPriceAtom = atom((get) => {
  const { data, error } = get(btcPriceQueryAtom);
  return error || !data ? 0 : data;
});

export const snAPYAtom = atom((get) => {
  const yearlyMintRes = get(yearlyMintingAtom);
  const totalStakingPowerRes = get(snTotalStakingPowerAtom);
  const alphaRes = get(snAlphaAtom);
  const strkPrice = get(strkPriceAtom);
  const btcPrice = get(btcPriceAtom);

  let strkApy = 0;
  let btcApy = 0;

  // Calculate STRK APY
  if (
    !totalStakingPowerRes.value.totalStakingPowerSTRK.isZero() &&
    alphaRes.value !== 0
  ) {
    const yearMinting = Number(yearlyMintRes.value.toEtherToFixedDecimals(4));
    const alpha = alphaRes.value;
    const strkStakingPower = Number(
      totalStakingPowerRes.value.totalStakingPowerSTRK.toEtherToFixedDecimals(
        4,
      ),
    );

    strkApy = (yearMinting * (100 - alpha)) / (100 * strkStakingPower);

    // deduce endur fee
    strkApy *= 0.85;
  }

  // Calculate BTC APY
  if (
    !totalStakingPowerRes.value.totalStakingPowerBTC.isZero() &&
    alphaRes.value !== 0 &&
    strkPrice > 0 &&
    btcPrice > 0
  ) {
    const yearlyMinting = Number(yearlyMintRes.value.toEtherToFixedDecimals(4));
    const btcStakingPower = Number(
      totalStakingPowerRes.value.totalStakingPowerBTC.toEtherToFixedDecimals(4),
    );

    // Calculate BTC APY
    btcApy =
      (yearlyMinting * strkPrice * alphaRes.value) /
      (100 * btcStakingPower * btcPrice);

    // deduce endur fee
    btcApy *= 0.85;
  }

  return {
    value: {
      strkApy,
      btcApy,
    },
    isLoading:
      yearlyMintRes.isLoading ||
      totalStakingPowerRes.isLoading ||
      alphaRes.isLoading,
    error: yearlyMintRes.error || totalStakingPowerRes.error || alphaRes.error,
  };
});

interface STRKStatsResponse {
  asset: string;
  tvl: number;
  tvlStrk: number;
  apy: number;
  apyInPercentage: string;
}

const strkStatsQueryAtom = atomWithQuery(() => ({
  queryKey: ["strkStats"],
  queryFn: async (): Promise<STRKStatsResponse> => {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("strkStatsQueryAtom error:", error);
      throw error;
    }
  },
  refetchInterval: 60000,
  staleTime: 30000,
}));

export const strkTVLAtom = atom((get) => {
  const { data, error, isLoading } = get(strkStatsQueryAtom);
  return {
    value: error || !data ? 0 : data.tvl,
    isLoading,
    error,
  };
});

export const btcTVLAtom = atom((get) => {
  const { data, error, isLoading } = get(lstStatsQueryAtom);

  if (isLoading || error || !data) {
    return {
      value: 0,
      isLoading,
      error,
    };
  }

  const btcTVL = data
    .filter((stats) => {
      const assetLower = stats.asset?.toLowerCase() || "";
      return assetLower.includes("btc") && !stats.error;
    })
    .reduce((sum, stats) => sum + (stats.tvlUsd || 0), 0);

  return {
    value: btcTVL,
    isLoading: false,
    error: null,
  };
});
