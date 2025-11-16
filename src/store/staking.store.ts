import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";

import MyNumber from "@/lib/MyNumber";
import StakingService, { type APYData } from "@/services/staking";

import { currentBlockAtom, providerAtom } from "./common.store";
import { getAssetPrice } from "@/lib/utils";
import { isUserActiveAtom } from "@/hooks/useUserActivity";

const stakingService = new StakingService();

const snTotalStakingPowerQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["snTotalStakingPower", get(currentBlockAtom), get(providerAtom)],
    queryFn: () => {
      return stakingService.getTotalStakingPower();
    },
    refetchInterval: () => {
      const isActive = get(isUserActiveAtom);
      return isActive ? 60000 : false; // Only refetch if user is active
    },
    refetchOnWindowFocus: () => {
      const isActive = get(isUserActiveAtom);
      return isActive;
    },
  };
});

//TODO: don't export
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
    refetchInterval: () => {
      const isActive = get(isUserActiveAtom);
      return isActive ? 60000 : false; // Only refetch if user is active
    },
    refetchOnWindowFocus: () => {
      const isActive = get(isUserActiveAtom);
      return isActive;
    },
  };
});

//TODO: don't export
export const snAlphaAtom = atom((get) => {
  const { data, error } = get(snAlphaQueryAtom);
  return {
    value: error || !data ? 0 : data,
    error,
    isLoading: !data && !error,
  };
});

//TODO: don't export
export const yearlyMintingQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["yearlyMinting", get(currentBlockAtom), get(providerAtom)],
    queryFn: () => {
      return stakingService.getYearlyMinting();
    },
    refetchInterval: () => {
      const isActive = get(isUserActiveAtom);
      return isActive ? 60000 : false; // Only refetch if user is active
    },
    refetchOnWindowFocus: () => {
      const isActive = get(isUserActiveAtom);
      return isActive;
    },
  };
});

//TODO: don't export
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
  refetchInterval: () => {
    const isActive = get(isUserActiveAtom);
    return isActive ? 60000 : false; // Only refetch if user is active
  },
  refetchOnWindowFocus: () => {
    const isActive = get(isUserActiveAtom);
    return isActive;
  },
}));

const btcPriceQueryAtom = atomWithQuery((get) => ({
  queryKey: ["btcPrice", get(currentBlockAtom), get(providerAtom)],
  queryFn: () => getAssetPrice(false),
  refetchInterval: () => {
    const isActive = get(isUserActiveAtom);
    return isActive ? 60000 : false; // Only refetch if user is active
  },
  refetchOnWindowFocus: () => {
    const isActive = get(isUserActiveAtom);
    return isActive;
  },
}));

const strkPriceAtom = atom((get) => {
  const { data, error } = get(strkPriceQueryAtom);
  return error || !data ? 0 : data;
});

export const btcPriceAtom = atom((get) => {
  const { data, error } = get(btcPriceQueryAtom);
  return error || !data ? 0 : data;
});

// Optimized APY data atom that merges three contract calls into one
const mergedAPYDataQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["mergedAPYData", get(currentBlockAtom), get(providerAtom)],
    queryFn: (): Promise<APYData> => {
      return stakingService.getAPYData();
    },
    refetchInterval: () => {
      const isActive = get(isUserActiveAtom);
      return isActive ? 60000 : false; // Only refetch if user is active
    },
    refetchOnWindowFocus: () => {
      const isActive = get(isUserActiveAtom);
      return isActive;
    },
  };
});

// Optimized APY atom using merged contract calls
export const optimizedAPYAtom = atom((get) => {
  const { data: apyData, error, isLoading } = get(mergedAPYDataQueryAtom);
  const { data: strkPrice, error: strkPriceError } = get(strkPriceQueryAtom);
  const { data: btcPrice, error: btcPriceError } = get(btcPriceQueryAtom);

  let strkApy = 0;
  let btcApy = 0;

  if (apyData && !error) {
    const { yearlyMinting, totalStakingPower, alpha } = apyData;

    // Calculate STRK APY
    if (
      !totalStakingPower.totalStakingPowerSTRK.isZero() &&
      alpha !== 0
    ) {
      const yearMinting = Number(yearlyMinting.toEtherToFixedDecimals(4));
      const strkStakingPower = Number(
        totalStakingPower.totalStakingPowerSTRK.toEtherToFixedDecimals(4),
      );

      strkApy = (yearMinting * (100 - alpha)) / (100 * strkStakingPower);
      // deduce endur fee
      strkApy *= 0.85;
    }

    // Calculate BTC APY
    if (
      !totalStakingPower.totalStakingPowerBTC.isZero() &&
      alpha !== 0 &&
      strkPrice &&
      btcPrice &&
      strkPrice > 0 &&
      btcPrice > 0
    ) {
      const yearlyMintingNum = Number(yearlyMinting.toEtherToFixedDecimals(4));
      const btcStakingPower = Number(
        totalStakingPower.totalStakingPowerBTC.toEtherToFixedDecimals(4),
      );

      btcApy =
        (yearlyMintingNum * strkPrice * alpha) /
        (100 * btcStakingPower * btcPrice);
      // deduce endur fee
      btcApy *= 0.85;
    }
  }

  return {
    value: {
      strkApy,
      btcApy,
    },
    isLoading: isLoading || !apyData,
    error: error || strkPriceError || btcPriceError,
  };
});

//TODO [APY_TODO]: DEPRECATED - Use optimizedAPYAtom or apiAPYAtom from lst.store.ts
// This atom is kept for backward compatibility but should be replaced
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
