import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";

interface VesuAPIResponse {
  data: {
    assets: Array<{
      stats: {
        supplyApy: {
          value: string;
          decimals: number;
        };
        defiSpringSupplyApr: {
          value: string;
          decimals: number;
        };
      };
    }>;
  };
}

interface EkuboPair {
  token0: {
    name: string;
    symbol: string;
  };
  token1: {
    name: string;
    symbol: string;
  };
  currentApr: number;
  consideredTvl: number;
}

interface EkuboAPIResponse {
  strkPrice: number;
  totalStrk: number;
  pairs: EkuboPair[];
}

interface NostraLPResponse {
  [key: string]: {
    baseApr: string;
    rewardApr: string;
  };
}

interface NostraLendingResponse {
  Nostra: {
    xSTRK: Array<{
      strk_grant_apr_ts: number;
    }>;
  };
}

interface ProtocolYield {
  value: number | null;
  isLoading: boolean;
  error?: string;
}

const convertVesuValue = (value: string, decimals: number): number => {
  const numValue = Number(value);
  if (isNaN(numValue)) return 0;
  return numValue / Math.pow(10, decimals);
};

const findEndurPair = (pairs: EkuboPair[]): EkuboPair | undefined => {
  return pairs.find(
    (pair) =>
      (pair.token0.symbol === "xSTRK" && pair.token1.symbol === "STRK") ||
      (pair.token0.symbol === "STRK" && pair.token1.symbol === "xSTRK"),
  );
};

const vesuYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["vesuYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      const response = await fetch(
        "https://api.vesu.xyz/pools/2345856225134458665876812536882617294246962319062565703131100435311373119841",
      );
      const data: VesuAPIResponse = await response.json();

      const stats = data.data.assets[1].stats;
      const supplyApy = convertVesuValue(
        stats.supplyApy.value,
        stats.supplyApy.decimals,
      );
      const defiSpringApr = convertVesuValue(
        stats.defiSpringSupplyApr.value,
        stats.defiSpringSupplyApr.decimals,
      );

      return {
        value: (supplyApy + defiSpringApr) * 100,
        isLoading: false,
      };
    } catch (error) {
      console.error("vesuYieldQueryAtom error:", error);
      return {
        value: null,
        isLoading: false,
        error: "Failed to fetch Vesu yield",
      };
    }
  },
  refetchInterval: 60000,
}));

const ekuboYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["ekuboYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      const response = await fetch(
        "https://mainnet-api.ekubo.org/defi-spring-incentives",
      );
      const data: EkuboAPIResponse = await response.json();

      const endurPair = findEndurPair(data.pairs);

      if (!endurPair) {
        return {
          value: null,
          isLoading: false,
          error: "Endur pair not found",
        };
      }

      return {
        value: endurPair.currentApr * 100,
        isLoading: false,
      };
    } catch (error) {
      console.error("ekuboYieldQueryAtom error:", error);
      return {
        value: null,
        isLoading: false,
        error: "Failed to fetch Ekubo yield",
      };
    }
  },
  refetchInterval: 60000,
}));

const nostraLPYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["nostraLPYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      const response = await fetch(
        "https://api.nostra.finance/query/pool_aprs",
      );
      const data: NostraLPResponse = await response.json();

      const xSTRKPool =
        data[
          "0x00205fd8586f6be6c16f4aa65cc1034ecff96d96481878e55f629cd0cb83e05f"
        ];

      if (!xSTRKPool) {
        return {
          value: null,
          isLoading: false,
          error: "xSTRK pool not found",
        };
      }

      const baseApr = parseFloat(xSTRKPool.baseApr);
      const rewardApr = parseFloat(xSTRKPool.rewardApr);
      const totalApr = (baseApr + rewardApr) * 100;

      return {
        value: totalApr,
        isLoading: false,
      };
    } catch (error) {
      console.error("nostraLPYieldQueryAtom error:", error);
      return {
        value: null,
        isLoading: false,
        error: "Failed to fetch Nostra LP yield",
      };
    }
  },
  refetchInterval: 60000,
}));

const nostraLendYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["nostraLendYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      const response = await fetch(
        "https://api.nostra.finance/openblock/supply_incentives",
      );
      const data: NostraLendingResponse = await response.json();

      if (!data.Nostra?.xSTRK?.length) {
        return {
          value: null,
          isLoading: false,
          error: "xSTRK lending data not found",
        };
      }

      // Get the latest APR
      const latestData = data.Nostra.xSTRK[data.Nostra.xSTRK.length - 1];
      const apr = latestData.strk_grant_apr_ts * 100;

      return {
        value: apr,
        isLoading: false,
      };
    } catch (error) {
      console.error("nostraLendYieldQueryAtom error:", error);
      return {
        value: null,
        isLoading: false,
        error: "Failed to fetch Nostra lending yield",
      };
    }
  },
  refetchInterval: 60000,
}));

const strkFarmYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["strkFarmYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    return {
      value: null,
      isLoading: false,
      error: "Coming soon",
    };
  },
  refetchInterval: 60000,
}));

export const vesuYieldAtom = atom((get) => {
  const { data, error } = get(vesuYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    error,
    isLoading: !data && !error,
  };
});

export const ekuboYieldAtom = atom((get) => {
  const response = get(ekuboYieldQueryAtom);
  return {
    value: !response.data ? null : response.data.value,
    error: response.error,
    isLoading: response.isLoading || false,
  };
});

export const nostraLPYieldAtom = atom((get) => {
  const { data, error } = get(nostraLPYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    error,
    isLoading: !data && !error,
  };
});

export const nostraLendYieldAtom = atom((get) => {
  const { data, error } = get(nostraLendYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    error,
    isLoading: !data && !error,
  };
});

export const strkFarmYieldAtom = atom((get) => {
  const { data, error } = get(strkFarmYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    error,
    isLoading: !data && !error,
  };
});

export const protocolYieldsAtom = atom((get) => ({
  strkfarm: get(strkFarmYieldAtom),
  vesu: get(vesuYieldAtom),
  avnu: { value: null, isLoading: false },
  fibrous: { value: null, isLoading: false },
  ekubo: get(ekuboYieldAtom),
  "nostra-pool": get(nostraLPYieldAtom),
  "nostra-lend": get(nostraLendYieldAtom),
}));
