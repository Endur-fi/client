import MyNumber from "@/lib/MyNumber";
import { Atom, atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { AtomFamily } from "jotai/vanilla/utils/atomFamily";
import { BlockIdentifier } from "starknet";
import { assetPriceAtom, lstConfigAtom, userAddressAtom } from "./common.store";
import { exchangeRateAtom } from "./lst.store";
import { snAPYAtom } from "./staking.store";

interface VesuAPIResponse {
  data: {
    assets: Array<{
      symbol: string;
      stats: {
        supplyApy: {
          value: string;
          decimals: number;
        };
        defiSpringSupplyApr: {
          value: string;
          decimals: number;
        };
        totalSupplied: {
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
  topPools: {
    fees0_24h: string;
    fees1_24h: string;
    tvl0_total: string;
    tvl1_total: string;
  }[];
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

interface MongoDBResponse {
  documents: Array<{
    timestamp: number;
    assets: {
      xSTRK: {
        supply: string;
        price: string;
        lendApr: string;
      };
    };
  }>;
}

interface ProtocolYield {
  value: number | null;
  totalSupplied?: number | null;
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

      const stats = data.data.assets?.find((a) => a.symbol === "xSTRK")?.stats;
      if (!stats) {
        console.error("No xSTRK stats found in Vesu API response");
        return {
          value: null,
          totalSupplied: null,
          isLoading: false,
          error: "xSTRK stats not found",
        };
      }
      const supplyApy = convertVesuValue(
        stats.supplyApy.value,
        stats.supplyApy.decimals,
      );
      const defiSpringApr = convertVesuValue(
        stats.defiSpringSupplyApr.value,
        stats.defiSpringSupplyApr.decimals,
      );
      const totalSupplied = convertVesuValue(
        stats.totalSupplied.value,
        stats.totalSupplied.decimals,
      );

      return {
        value: (supplyApy + defiSpringApr) * 100,
        totalSupplied,
        isLoading: false,
      };
    } catch (error) {
      console.error("vesuYieldQueryAtom error:", error);
      return {
        value: null,
        totalSupplied: null,
        isLoading: false,
        error: "Failed to fetch Vesu yield",
      };
    }
  },
  refetchInterval: 60000,
}));

const ekuboYieldQueryAtom = atomWithQuery((get) => ({
  queryKey: ["ekuboYield", get(exchangeRateAtom)],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      const response = await fetch(
        "https://starknet-mainnet-api.ekubo.org/pair/0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a/0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d/pools",
      );
      const data: EkuboAPIResponse = await response.json();

      if (data.topPools.length === 0) {
        console.error("No pools found in Ekubo API response");
        return {
          value: null,
          isLoading: false,
          error: "No pools found",
        };
      }
      const mostLiquidPool = data.topPools.sort((a, b) => {
        const tvlA = BigInt(a.tvl0_total) + BigInt(a.tvl1_total);
        const tvlB = BigInt(b.tvl0_total) + BigInt(b.tvl1_total);
        return Number(tvlB) - Number(tvlA);
      })[0];

      const xSTRKExchangeRate = get(exchangeRateAtom).rate || 1;
      const tvlInSTRK =
        BigInt(Number(mostLiquidPool.tvl0_total) * xSTRKExchangeRate) +
        BigInt(mostLiquidPool.tvl1_total);
      const feesInSTRK =
        BigInt(Number(mostLiquidPool.fees0_24h) * xSTRKExchangeRate) +
        BigInt(mostLiquidPool.fees1_24h);

      const apy =
        Number((feesInSTRK * BigInt(365) * BigInt(10000)) / tvlInSTRK) / 100;
      console.log(
        "Endur pair:",
        mostLiquidPool,
        "APY:",
        apy,
        "TVL:",
        tvlInSTRK,
        "Fees:",
        feesInSTRK,
      );
      return {
        value: apy,
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
      const [lendingResponse, mongoResponse] = await Promise.all([
        fetch("https://api.nostra.finance/openblock/supply_incentives"),
        fetch(
          "https://us-east-2.aws.data.mongodb-api.com/app/data-yqlpb/endpoint/data/v1/action/find",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              dataSource: "nostra-production",
              database: "lend-and-borrow-analytics-prod-b-nostra-db",
              collection: "supplyAndBorrow",
              filter: {
                timestamp: {
                  $gte: Math.floor(Date.now() / 1000) - 86400, // 24 hours ago
                },
              },
              sort: { timestamp: 1 },
            }),
          },
        ),
      ]);

      const lendingData: NostraLendingResponse = await lendingResponse.json();
      let mongoData: MongoDBResponse = await mongoResponse.json();

      if (
        lendingData.Nostra?.xSTRK?.length > 0 &&
        !mongoData.documents?.length
      ) {
        // if nostra apy fails, will set 0s for nostra base yield
        // since xSTRK borrowing is low, this should be ok in most cases
        // helps avoid failing in nostra apy from disrupting the entire page
        mongoData = {
          documents: [
            {
              timestamp: Math.floor(Date.now() / 1000),
              assets: {
                xSTRK: {
                  supply: "0",
                  price: "0",
                  lendApr: "0",
                },
              },
            },
          ],
        };
      }

      if (!lendingData.Nostra?.xSTRK?.length || !mongoData.documents?.length) {
        return {
          value: null,
          totalSupplied: null,
          isLoading: false,
          error: "Data not found",
        };
      }

      // Get latest MongoDB document
      const latestDoc = mongoData.documents[mongoData.documents.length - 1];
      const xSTRKData = latestDoc.assets.xSTRK;

      const latestLendingData =
        lendingData.Nostra.xSTRK[lendingData.Nostra.xSTRK.length - 1];
      const apr =
        latestLendingData.strk_grant_apr_ts * 100 +
        Math.floor(Number(xSTRKData.lendApr) * 10000) / 100;
      const totalSupplied = parseFloat(xSTRKData.supply);

      return {
        value: apr,
        totalSupplied,
        isLoading: false,
      };
    } catch (error) {
      console.error("nostraLendYieldQueryAtom error:", error);
      return {
        value: null,
        totalSupplied: null,
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
    const hostname = window.location.origin;
    const res = await fetch(`${hostname}/strkfarm/api/strategies`);
    const data = await res.json();
    const strategies = data.strategies;
    const xSTRKStrategy = strategies.find(
      (strategy: any) => strategy.id === "xstrk_sensei",
    );
    return {
      value: xSTRKStrategy.apy * 100,
      isLoading: false,
      error: "Coming soon",
    };
  },
  refetchInterval: 60000,
}));

const strkFarmEkuboYieldQueryAtom = atomWithQuery((get) => ({
  queryKey: ["strkFarmEkuboYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    const hostname = window.location.origin;
    const res = await fetch(`${hostname}/strkfarm/api/strategies`);
    const data = await res.json();
    const strategies = data.strategies;
    const strategy = strategies.find(
      (strategy: any) => strategy.id === "ekubo_cl_xstrkstrk",
    );

    if (!strategy) {
      return {
        value: 0,
        isLoading: false,
        error: "Failed to find strategy",
      };
    }

    const { data: price, isLoading } = get(assetPriceAtom);
    const { value: baseApy } = get(snAPYAtom);

    if (!price) {
      return {
        value: 0,
        isLoading: false,
        error: "Failed to fetch STRK price",
      };
    }

    const totalSupplied = strategy.tvlUsd / price;

    const apy = strategy.apy - baseApy.strkApy;

    return {
      value: apy * 100,
      totalSupplied: totalSupplied ?? 0,
      isLoading,
      error: "Failed to fetch APY",
    };
  },
  refetchInterval: 60000,
}));

const haikoYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["haikoYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      const response = await fetch(
        "https://app.haiko.xyz/api/v1/vaults?network=mainnet&user=0x6058fd211ebc489b5f5fa98d92354a4be295ff007b211f72478702a6830c21f",
      );
      const data = await response.json();

      const xSTRKSolver = data?.inactive?.find(
        (vault: any) => vault.market.baseSymbol === "xSTRK",
      );

      if (!xSTRKSolver) {
        return {
          value: null,
          isLoading: false,
          error: "xSTRK solver not found",
        };
      }

      return {
        value: xSTRKSolver.apy * 100,
        isLoading: false,
      };
    } catch (error) {
      console.error("haikoYieldQueryAtom error:", error);
      return {
        value: null,
        isLoading: false,
        error: "Failed to fetch Haiko yield",
      };
    }
  },
  refetchInterval: 60000,
}));

export const vesuYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(vesuYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: error || !data ? null : data.totalSupplied || null,
    error,
    isLoading: !data && !error,
  };
});

export const ekuboYieldAtom = atom<ProtocolStats>((get) => {
  const response = get(ekuboYieldQueryAtom);
  return {
    value: !response.data ? null : response.data.value,
    totalSupplied: 0,
    error: response.error,
    isLoading: response.isLoading || false,
  };
});

export const nostraLPYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(nostraLPYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: 0,
    error,
    isLoading: !data && !error,
  };
});

export const nostraLendYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(nostraLendYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: error || !data ? null : data.totalSupplied || null,
    error,
    isLoading: !data && !error,
  };
});

export const strkFarmYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(strkFarmYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: 0,
    error,
    isLoading: !data && !error,
  };
});

export const strkFarmEkuboYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(strkFarmEkuboYieldQueryAtom);

  return {
    value: error || !data ? null : data.value,
    totalSupplied: error || !data ? 0 : (data.totalSupplied ?? 0),
    error,
    isLoading: !data && !error,
  };
});

export const haikoYieldAtom = atom<ProtocolStats>((get) => {
  const response = get(haikoYieldQueryAtom);
  return {
    value: !response.data ? null : response.data.value,
    totalSupplied: 0,
    error: response.error,
    isLoading: response.isLoading || false,
  };
});

export type SupportedDApp =
  | "strkfarm"
  | "strkfarmEkubo"
  | "vesu"
  | "avnu"
  | "fibrous"
  | "ekubo"
  | "nostraDex"
  | "nostraLending"
  | "nostra"
  | "haiko"
  | "opus"
  | "endur";

export interface ProtocolStats {
  value: number | null;
  totalSupplied: number | null;
  error: Error | null;
  isLoading: boolean;
}

export const protocolYieldsAtom = atom<
  Partial<Record<SupportedDApp, ProtocolStats>>
>((get) => ({
  strkfarm: get(strkFarmYieldAtom),
  strkfarmEkubo: get(strkFarmEkuboYieldAtom),
  vesu: get(vesuYieldAtom),
  ekubo: get(ekuboYieldAtom),
  nostraDex: get(nostraLPYieldAtom),
  nostraLending: get(nostraLendYieldAtom),
  haiko: get(haikoYieldAtom),
}));

// Takes input as blocknumber | undefined, returns a Query Atom
export interface DAppHoldings {
  lstAmount: MyNumber;
  underlyingTokenAmount: MyNumber;
}
export type DAppHoldingsAtom = AtomFamily<
  number | undefined,
  Atom<{
    data: DAppHoldings;
    error: Error | null;
    isLoading: boolean;
  }>
>;

export type DAppHoldingsFn = (params: {
  address: string;
  lstAddress?: string;
  decimals?: number;
  blockNumber?: BlockIdentifier;
}) => Promise<DAppHoldings>;

/**
 * @description Returns an AtomFamily of DAppHoldings
 * @dev This function is used to create an AtomFamily of DAppHoldings in a
 * generic way for different dApps
 * @param uniqueKey Unique key used for cache for each dApp atom
 * @param queryFn Logic to fetch DAppHoldings
 * @returns AtomFamily of DAppHoldings
 */
export function getHoldingAtom(uniqueKey: string, queryFn: DAppHoldingsFn) {
  return atomFamily((blockNumber?: BlockIdentifier) => {
    return atomWithQuery((get) => {
      return {
        queryKey: [uniqueKey, blockNumber, get(userAddressAtom)],
        queryFn: async ({ queryKey }: any): Promise<DAppHoldings> => {
          const userAddress = get(userAddressAtom);
          const lstConfig = get(lstConfigAtom);

          if (!userAddress || !lstConfig)
            return {
              lstAmount: MyNumber.fromZero(),
              underlyingTokenAmount: MyNumber.fromZero(),
            };

          try {
            return await queryFn({
              address: userAddress,
              lstAddress: lstConfig.LST_ADDRESS,
              decimals: lstConfig.DECIMALS,
              blockNumber,
            });
          } catch (err) {
            console.error("getHoldingAtom error:", err);
            return {
              lstAmount: MyNumber.fromZero(),
              underlyingTokenAmount: MyNumber.fromZero(),
            };
          }
        },
        staleTime: Infinity, // Prevents automatic refetching
        cacheTime: 60000, // Keeps old block data for 60s
      };
    });
  });
}
