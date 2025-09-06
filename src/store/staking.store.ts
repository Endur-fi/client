import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";

import MyNumber from "@/lib/MyNumber";
import StakingService from "@/services/staking";

import { currentBlockAtom, providerAtom } from "./common.store";
import { getAssetPrice } from "@/lib/utils";

const stakingService = new StakingService();

const snTotalStakingPowerQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["snTotalStakingPower", get(currentBlockAtom)],
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
    queryKey: ["snAlpha", get(currentBlockAtom)],
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
const strkPriceQueryAtom = atomWithQuery(() => ({
  queryKey: ["strkPrice"],
  queryFn: () => getAssetPrice(),
  refetchInterval: 60000,
}));

const btcPriceQueryAtom = atomWithQuery(() => ({
  queryKey: ["btcPrice"],
  queryFn: () => getAssetPrice(false),
  refetchInterval: 60000,
}));

const strkPriceAtom = atom((get) => {
  const { data, error } = get(strkPriceQueryAtom);
  return error || !data ? 0 : data;
});

const btcPriceAtom = atom((get) => {
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
