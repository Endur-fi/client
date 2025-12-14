import MyNumber from "@/lib/MyNumber";
import { Atom, atom, WritableAtom } from "jotai";
import { atomWithQuery, AtomWithQueryResult } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { AtomFamily } from "jotai/vanilla/utils/atomFamily";
import { BlockIdentifier, Contract } from "starknet";
import { assetPriceAtom, lstConfigAtom, userAddressAtom } from "./common.store";
import { apiExchangeRateAtom } from "./lst.store";
import { snAPYAtom, btcPriceAtom } from "./staking.store";
import { LSTAssetConfig, LST_CONFIG, NETWORK, getProvider } from "@/constants";
import erc4626Abi from "@/abi/erc4626.abi.json";
import { getAssetPrice } from "@/lib/utils";
import { Web3Number } from "@strkfarm/sdk";

interface VesuAsset {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  usdPrice: {
    value: string;
    decimals: number;
  };
  stats: {
    supplyApy: {
      value: string;
      decimals: number;
    };
    defiSpringSupplyApr?: {
      value: string;
      decimals: number;
    } | null;
    totalSupplied: {
      value: string;
      decimals: number;
    };
    borrowApr: {
      value: string;
      decimals: number;
    };
    lstApr?: {
      value: string;
      decimals: number;
    } | null;
  };
}

interface VesuPair {
  collateralAssetAddress: string;
  debtAssetAddress: string;
  maxLTV: {
    value: string;
    decimals: number;
  };
  debtCap: {
    value: string;
    decimals: number;
  };
  totalDebt: {
    value: string;
    decimals: number;
  };
  btcFiBorrowApr?: {
    value: string;
    decimals: number;
  } | null;
}
// TODO: move all the types to separate type file
interface VesuAPIResponse {
  data: {
    assets: Array<VesuAsset>;
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

interface VesuPoolResponse {
  id: string;
  name: string;
  isVerified: boolean;
  assets: Array<VesuAsset>;
  pairs: Array<VesuPair>;
}

interface VesuPoolsAPIResponse {
  data: VesuPoolResponse[];
}

interface APRSplit {
  value: number;
  title: string;
  remarks: string;
  // natural is due to market economics
  // incentive is due to external incentives (like STRK incentives)
  // yield-bearing is due to yield-bearing assets (like xSTRK)
  type: "natural" | "incentive" | "yield-bearing"
}

export interface VesuBorrowPool {
  poolId: string;
  poolName: string;
  collateralAddress: string;
  collateralSymbol: string;
  collateralName: string;
  debtAddress: string;
  debtSymbol: string;
  debtName: string;
  maxLTV: number;
  debtCap: number;
  totalDebt: number;
  totalSupplied: number;
  debtPrice: number;
  borrowApr: number | null;
  supplyApy: number;
  borrowAprSplit: APRSplit[];
  supplyAprSplit: APRSplit[];
}

// Filter options for Vesu pools
export interface VesuPoolFilter {
  isVerified?: boolean;
  collateralIsLST?: boolean; // xSTRK or BTC LST
  collateralSymbols?: string[]; // Specific LST symbols to filter
}

// TODO: move this to utils/common.utils.ts under "defi formating" comments
const convertVesuValue = (value: string, decimals: number): number => {
  const numValue = Number(value);
  if (isNaN(numValue)) return 0;
  return numValue / Math.pow(10, decimals);
};

// TODO: remove if not needed
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
      //TODO: move the api call logic to api.ts under "defi calls" comment
      const response = await fetch(
        "https://proxy.api.troves.fi/vesu/pools/0x052fb52363939c3aa848f8f4ac28f0a51379f8d1b971d8444de25fbd77d8f161",
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
      const defiSpringApr = stats.defiSpringSupplyApr ? convertVesuValue(
        stats.defiSpringSupplyApr.value,
        stats.defiSpringSupplyApr.decimals,
      ) : 0;
      // this should also be added - but then final apy is not matching
      //   const borrowApr = convertVesuValue(
      //     stats.borrowApr.value,
      //     stats.borrowApr.decimals,
      //   );
      const lstApr = stats.lstApr ? convertVesuValue(
          stats.lstApr.value,
          stats.lstApr.decimals,
        ) : 0;

      const totalSupplied = convertVesuValue(
        stats.totalSupplied.value,
        stats.totalSupplied.decimals,
      );

      return {
        value: (supplyApy + defiSpringApr + lstApr) * 100,
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
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

// Helper function to create Vesu BTC borrow pool query atoms
const createVesuBTCYieldQueryAtom = (
  poolId: string,
  assetSymbol: string,
  queryKey: string,
) =>
  atomWithQuery(() => ({
    queryKey: [queryKey],
    queryFn: async (): Promise<ProtocolYield> => {
      try {
        //TODO: move the api call logic to api.ts under "defi calls" comment
        const response = await fetch(`https://proxy.api.troves.fi/vesu/pools/${poolId}`);
        const data: VesuAPIResponse = await response.json();

        const stats = data.data.assets?.find(
          (a) => a.symbol === assetSymbol,
        )?.stats;
        if (!stats) {
          console.error(
            `No ${assetSymbol} stats found in Vesu API response for pool ${poolId}`,
          );
          return {
            value: null,
            totalSupplied: null,
            isLoading: false,
            error: `${assetSymbol} stats not found`,
          };
        }
        const supplyApy = convertVesuValue(
          stats.supplyApy.value,
          stats.supplyApy.decimals,
        );
        const defiSpringApr = stats.defiSpringSupplyApr ? convertVesuValue(
          stats.defiSpringSupplyApr.value,
          stats.defiSpringSupplyApr.decimals,
        ) : 0;
        const lstApr = stats.lstApr ? convertVesuValue(
          stats.lstApr.value,
          stats.lstApr.decimals,
        ) : 0;

        const totalSupplied = convertVesuValue(
          stats.totalSupplied.value,
          stats.totalSupplied.decimals,
        );

        return {
          value: (supplyApy + defiSpringApr + lstApr) * 100,
          totalSupplied,
          isLoading: false,
        };
      } catch (error) {
        console.error(`${queryKey} error:`, error);
        return {
          value: null,
          totalSupplied: null,
          isLoading: false,
          error: `Failed to fetch Vesu ${assetSymbol} yield`,
        };
      }
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }));

// TODO: Update these pool IDs with the actual pool IDs from Vesu API response
// Placeholder pool IDs - these need to be replaced with actual pool IDs from the API
const vesuBTCxWBTCYieldQueryAtom = createVesuBTCYieldQueryAtom(
  "PLACEHOLDER_POOL_ID_xWBTC", // Replace with actual pool ID
  "xWBTC",
  "vesuBTCxWBTCYield",
);

const vesuBTCxtBTCYieldQueryAtom = createVesuBTCYieldQueryAtom(
  "PLACEHOLDER_POOL_ID_xtBTC", // Replace with actual pool ID
  "xtBTC",
  "vesuBTCxtBTCYield",
);

const vesuBTCxLBTCYieldQueryAtom = createVesuBTCYieldQueryAtom(
  "PLACEHOLDER_POOL_ID_xLBTC", // Replace with actual pool ID
  "xLBTC",
  "vesuBTCxLBTCYield",
);

const vesuBTCxsBTCYieldQueryAtom = createVesuBTCYieldQueryAtom(
  "PLACEHOLDER_POOL_ID_xsBTC", // Replace with actual pool ID
  "xsBTC",
  "vesuBTCxsBTCYield",
);

const ekuboYieldQueryAtom = atomWithQuery((get) => ({
  queryKey: ["ekuboYield", get(apiExchangeRateAtom)],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      //TODO: move the api call logic to api.ts under "defi calls" comment
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

      const xSTRKExchangeRate = get(apiExchangeRateAtom).rate || 1;
      const tvlInSTRK =
        BigInt(Number(mostLiquidPool.tvl0_total) * xSTRKExchangeRate) +
        BigInt(mostLiquidPool.tvl1_total);
      const feesInSTRK =
        BigInt(Number(mostLiquidPool.fees0_24h) * xSTRKExchangeRate) +
        BigInt(mostLiquidPool.fees1_24h);

      const apy =
        Number((feesInSTRK * BigInt(365) * BigInt(10000)) / tvlInSTRK) / 100;
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
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

const nostraLPYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["nostraLPYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      //TODO: move the api call logic to api.ts under "defi calls" comment
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
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

const nostraLendYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["nostraLendYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      //TODO: move the api call logic to api.ts under "defi calls" comment
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
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

const strkFarmYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["strkFarmYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    const hostname = window.location.origin;
    const res = await fetch(`https://app.troves.fi/api/strategies`);
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
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

const strkFarmEkuboYieldQueryAtom = atomWithQuery((get) => ({
  queryKey: ["strkFarmEkuboYield", get(assetPriceAtom)],
  queryFn: async (): Promise<ProtocolYield> => {
    //TODO: move the api call logic to api.ts under "defi calls" comment
    const hostname = window.location.origin;
    const res = await fetch(`https://app.troves.fi/api/strategies`);
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
    // const { value: baseApy } = get(snAPYAtom);

    if (!price) {
      return {
        value: 0,
        isLoading: false,
        error: "Failed to fetch STRK price",
      };
    }

    const totalSupplied = strategy.tvlUsd / price;

    // const apy = strategy.apy - baseApy.strkApy;

    const baseApy = parseFloat(strategy?.apySplit?.baseApy || 0);
    const rewardApy = parseFloat(strategy?.apySplit?.rewardApy || 0);
    const apy = baseApy + rewardApy;

    return {
      value: apy * 100,
      totalSupplied: totalSupplied ?? 0,
      isLoading,
      error: "Failed to fetch APY",
    };
  },
  refetchInterval: 60000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

const trovesHyperYieldQueryAtom = atomWithQuery((get) => ({
  queryKey: ["trovesHyperYield", get(lstConfigAtom)] as [
    string,
    LSTAssetConfig | undefined,
  ],
  queryFn: async ({
    queryKey,
  }: {
    queryKey: [string, LSTAssetConfig | undefined];
  }): Promise<ProtocolYield> => {
    const [, lstConfig] = queryKey;
    //TODO: move the api call logic to api.ts under "defi calls" comment
    const hostname = "https://app.troves.fi";
    const res = await fetch(`${hostname}/api/strategies`);
    const data = await res.json();
    const strategies = data.strategies;
    const strategy = strategies.find(
      (strategy: any) =>
        strategy.id === `hyper_${lstConfig!.LST_SYMBOL.toLocaleLowerCase()}`,
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

    const isSTRK = lstConfig!.SYMBOL === "STRK";

    const apy = isSTRK
      ? strategy.apy - baseApy.strkApy
      : strategy.apy - baseApy.btcApy;

    return {
      value: apy * 100,
      totalSupplied: totalSupplied ?? 0,
      isLoading,
      error: "Failed to fetch APY",
    };
  },
  refetchInterval: 60000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

// BTC Troves Hyper Vault atoms
const createTrovesYieldQueryAtom = (strategyId: string, queryKey: string) =>
  atomWithQuery((get) => ({
    queryKey: [queryKey, get(btcPriceAtom)],
    queryFn: async (): Promise<ProtocolYield> => {
      //TODO: move the api call logic to api.ts under "defi calls" comment
      const hostname = "https://app.troves.fi";
      const res = await fetch(`${hostname}/api/strategies`);
      const data = await res.json();
      const strategies = data.strategies;
      console.log("strategies", strategies);
      const strategy = strategies.find(
        (strategy: any) => strategy.id === strategyId,
      );
      console.log("strategy", strategy);

      if (!strategy) {
        return {
          value: 0,
          isLoading: false,
          error: `Failed to find ${strategyId} strategy`,
        };
      }

      const btcPrice = get(btcPriceAtom);
      const totalSupplied = btcPrice > 0 ? strategy.tvlUsd / btcPrice : 0;

      // Handle null APY values
      const apy = strategy.apy !== null ? strategy.apy * 100 : 0;

      return {
        value: apy,
        totalSupplied: totalSupplied ?? 0,
        isLoading: false,
      };
    },
    refetchInterval: 60000,
  }));

const trovesHyperxSTRKYieldQueryAtom = createTrovesYieldQueryAtom(
  "hyper_xstrk",
  "trovesHyperxSTRKYield",
);
const trovesHyperxWBTCYieldQueryAtom = createTrovesYieldQueryAtom(
  "hyper_xwbtc",
  "trovesHyperxWBTCYield",
);

const trovesHyperxtBTCYieldQueryAtom = createTrovesYieldQueryAtom(
  "hyper_xtbtc",
  "trovesHyperxtBTCYield",
);

const trovesHyperxLBTCYieldQueryAtom = createTrovesYieldQueryAtom(
  "hyper_xlbtc",
  "trovesHyperBTCxLBTCYield",
);

const trovesHyperxsBTCYieldQueryAtom = createTrovesYieldQueryAtom(
  "hyper_xsbtc",
  "trovesHyperxsBTCYield",
);

// BTC Troves Ekubo Concentrated Liquidity atoms
const trovesEkuboBTCxWBTCYieldQueryAtom = createTrovesYieldQueryAtom(
  "ekubo_cl_xwbtcwbtc",
  "trovesEkuboBTCxWBTCYield",
);

const trovesEkuboBTCxtBTCYieldQueryAtom = createTrovesYieldQueryAtom(
  "ekubo_cl_xtbtctbtc",
  "trovesEkuboBTCxtBTCYield",
);

const trovesEkuboBTCxLBTCYieldQueryAtom = createTrovesYieldQueryAtom(
  "ekubo_cl_xlbtclbtc",
  "trovesEkuboBTCxLBTCYield",
);

const trovesEkuboBTCxsBTCYieldQueryAtom = createTrovesYieldQueryAtom(
  "ekubo_cl_xsbtcsolvbtc",
  "trovesEkuboBTCxsBTCYield",
);

const haikoYieldQueryAtom = atomWithQuery(() => ({
  queryKey: ["haikoYield"],
  queryFn: async (): Promise<ProtocolYield> => {
    try {
      //TODO: move the api call logic to api.ts under "defi calls" comment
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
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

//TODO: below all destructuring of query atom can be standardised
// actually for btc it is already standardised with createTrovesYieldAtom function, we can use that same for all of the below 8 functions
// TODO: don't export if we are not using anywhere else
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

// Vesu BTC borrow pool yield atoms
export const vesuBTCxWBTCYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(vesuBTCxWBTCYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: error || !data ? null : data.totalSupplied || null,
    error,
    isLoading: !data && !error,
  };
});

export const vesuBTCxtBTCYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(vesuBTCxtBTCYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: error || !data ? null : data.totalSupplied || null,
    error,
    isLoading: !data && !error,
  };
});

export const vesuBTCxLBTCYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(vesuBTCxLBTCYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: error || !data ? null : data.totalSupplied || null,
    error,
    isLoading: !data && !error,
  };
});

export const vesuBTCxsBTCYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(vesuBTCxsBTCYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: error || !data ? null : data.totalSupplied || null,
    error,
    isLoading: !data && !error,
  };
});

export const trovesHyperYieldAtom = atom<ProtocolStats>((get) => {
  const { data, error } = get(trovesHyperYieldQueryAtom);
  return {
    value: error || !data ? null : data.value,
    totalSupplied: error || !data ? 0 : (data.totalSupplied ?? 0),
    error,
    isLoading: !data && !error,
  };
});

// BTC Troves Hyper Vault yield atoms
const createTrovesYieldAtom = (
  queryAtom: WritableAtom<AtomWithQueryResult<ProtocolYield, Error>, [], void>,
) =>
  atom<ProtocolStats>((get) => {
    const { data, error } = get(queryAtom);
    return {
      value: error || !data ? null : data.value,
      totalSupplied: error || !data ? 0 : (data.totalSupplied ?? 0),
      error,
      isLoading: !data && !error,
    };
  });

//DOUBT [ASK_AKIRA]: if we are using same function "trovesHyperYieldAtom" for protocolYieldsAtom, then why do we have different yield atom here?
//TODO: move these all troves atom to troves.store.ts
export const trovesHyperxSTRKYieldAtom = createTrovesYieldAtom(
  trovesHyperxSTRKYieldQueryAtom,
);
export const trovesHyperxWBTCYieldAtom = createTrovesYieldAtom(
  trovesHyperxWBTCYieldQueryAtom,
);

export const trovesHyperxtBTCYieldAtom = createTrovesYieldAtom(
  trovesHyperxtBTCYieldQueryAtom,
);

export const trovesHyperxLBTCYieldAtom = createTrovesYieldAtom(
  trovesHyperxLBTCYieldQueryAtom,
);

export const trovesHyperxsBTCYieldAtom = createTrovesYieldAtom(
  trovesHyperxsBTCYieldQueryAtom,
);

// BTC Troves Ekubo Concentrated Liquidity yield atoms
export const trovesEkuboBTCxWBTCYieldAtom = createTrovesYieldAtom(
  trovesEkuboBTCxWBTCYieldQueryAtom,
);

export const trovesEkuboBTCxtBTCYieldAtom = createTrovesYieldAtom(
  trovesEkuboBTCxtBTCYieldQueryAtom,
);

export const trovesEkuboBTCxLBTCYieldAtom = createTrovesYieldAtom(
  trovesEkuboBTCxLBTCYieldQueryAtom,
);

export const trovesEkuboBTCxsBTCYieldAtom = createTrovesYieldAtom(
  trovesEkuboBTCxsBTCYieldQueryAtom,
);

// Build LST addresses map from LST_CONFIG for filtering borrow pools
// Maps LST_SYMBOL to LST_ADDRESS
const LST_ADDRESSES: Record<string, string> = Object.values(LST_CONFIG).reduce(
  (acc, asset) => {
    if (asset.LST_ADDRESS) {
      acc[asset.LST_SYMBOL] = asset.LST_ADDRESS;
    }
    return acc;
  },
  {} as Record<string, string>,
);

// Query atom to fetch all Vesu pools (raw data)
const vesuPoolsRawQueryAtom = atomWithQuery(() => ({
  queryKey: ["vesuPoolsRaw"],
  queryFn: async (): Promise<VesuPoolsAPIResponse> => {
    try {
      const response = await fetch("https://proxy.api.troves.fi/vesu/pools");
      const data: VesuPoolsAPIResponse = await response.json();
      return data;
    } catch (error) {
      console.error("vesuPoolsRawQueryAtom error:", error);
      return { data: [] };
    }
  },
  refetchInterval: 60000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}));

// Helper function to normalize addresses for comparison
const normalizeAddress = (addr: string): string => {
  const hex = addr.toLowerCase().replace(/^0x/, "");
  return hex.padStart(64, "0");
};

// Generic atom to get filtered Vesu pools based on criteria
export const vesuPoolsFilteredAtom = atom((get) => {
  const { data } = get(vesuPoolsRawQueryAtom);
  if (!data) {
    return (filter: VesuPoolFilter = {}): VesuBorrowPool[] => [];
  }

  return (filter: VesuPoolFilter = {}): VesuBorrowPool[] => {
    const borrowPools: VesuBorrowPool[] = [];

    // Iterate through all pools
    for (const pool of data.data) {
      // Filter by isVerified if specified
      if (filter.isVerified !== undefined && pool.isVerified !== filter.isVerified) {
        continue;
      }

      // Find pairs where collateral matches criteria
      for (const pair of pool.pairs) {
        const collateralNormalized = normalizeAddress(
          pair.collateralAssetAddress,
        );
        const matchingLst = Object.entries(LST_ADDRESSES).find(
          ([, address]) => {
            const lstNormalized = normalizeAddress(address);
            return lstNormalized === collateralNormalized;
          },
        );

        // Filter by collateralIsLST if specified
        if (filter.collateralIsLST !== undefined) {
          const isLST = !!matchingLst;
          if (filter.collateralIsLST !== isLST) {
            continue;
          }
        }

        // Filter by specific collateral symbols if specified
        if (filter.collateralSymbols && filter.collateralSymbols.length > 0) {
          if (!matchingLst || !filter.collateralSymbols.includes(matchingLst[0])) {
            continue;
          }
        }

        const lstEntry = matchingLst;

        if (lstEntry) {
          const [collateralSymbol] = lstEntry;
          const debtNormalized = normalizeAddress(pair.debtAssetAddress);
          const collateralAsset = pool.assets.find(
            (a) => normalizeAddress(a.address) === collateralNormalized,
          );
          const debtAsset = pool.assets.find(
            (a) => normalizeAddress(a.address) === debtNormalized,
          );

          // Only include pairs where both collateral and debt assets are found
          if (collateralAsset && debtAsset && debtAsset.symbol) {
            const supplyStats = collateralAsset.stats;
            const supplyApr = supplyStats
              ? convertVesuValue(
                  supplyStats.supplyApy.value,
                  supplyStats.supplyApy.decimals,
                ) * 100
              : 0;
            const defiSpringSupplyApr = supplyStats?.defiSpringSupplyApr
              ? convertVesuValue(
                  supplyStats.defiSpringSupplyApr.value,
                  supplyStats.defiSpringSupplyApr.decimals,
                ) * 100
              : 0;
            const lstApr = supplyStats?.lstApr
              ? convertVesuValue(
                  supplyStats.lstApr.value,
                  supplyStats.lstApr.decimals,
                ) * 100
              : 0;
            const supplyAprSplit: APRSplit[] = [
              {
                value: supplyApr,
                title: "Supply APR",
                remarks: "",
                type: "natural",
              },
              {
                value: defiSpringSupplyApr,
                title: "Defi Spring Supply APR",
                remarks: "",
                type: "incentive",
              },
              {
                value: lstApr,
                title: "LST APR",
                remarks: "",
                type: "yield-bearing",
              },
            ];

            const debtStats = debtAsset.stats;
            let borrowApr = debtStats
              ? convertVesuValue(
                  debtStats.borrowApr.value,
                  debtStats.borrowApr.decimals,
                ) * 100
              : 0;
            const btcFiBorrowApr = pair.btcFiBorrowApr
              ? convertVesuValue(
                  pair.btcFiBorrowApr.value,
                  pair.btcFiBorrowApr.decimals,
                ) * 100
              : 0;
            // offset incentives API
            borrowApr -= btcFiBorrowApr;
            const borrowAprSplit: APRSplit[] = [
              {
                value: borrowApr,
                title: "Borrow APR",
                remarks: "",
                type: "natural",
              },
            ];
            if (btcFiBorrowApr > 0) {
              borrowAprSplit.push({
                value: btcFiBorrowApr * -1,
                title: "BTCFi Borrow APR",
                remarks: "Offset incentives API",
                type: "incentive",
              });
            }

            const maxLTVValue =
              convertVesuValue(pair.maxLTV.value, pair.maxLTV.decimals) * 100;

            const debtCapValue = convertVesuValue(pair.debtCap.value, pair.debtCap.decimals);
            const totalDebtValue = convertVesuValue(pair.totalDebt.value, pair.totalDebt.decimals);
            const totalSuppliedValue = debtStats?.totalSupplied
              ? convertVesuValue(
                  debtStats.totalSupplied.value,
                  debtStats.totalSupplied.decimals,
                )
              : 0;

            borrowPools.push({
              poolId: pool.id,
              poolName: pool.name,
              collateralAddress: pair.collateralAssetAddress,
              collateralSymbol,
              collateralName: collateralAsset.name,
              debtAddress: pair.debtAssetAddress,
              debtSymbol: debtAsset.symbol,
              debtName: debtAsset.name,
              maxLTV: maxLTVValue,
              debtCap: debtCapValue,
              totalDebt: totalDebtValue,
              totalSupplied: totalSuppliedValue,
              debtPrice: Web3Number.fromWei(debtAsset.usdPrice.value, debtAsset.usdPrice.decimals).toNumber(),
              borrowApr,
              supplyApy: supplyApr + defiSpringSupplyApr + lstApr,
              supplyAprSplit,
              borrowAprSplit,
            });
          }
        }
      }
    }

    return borrowPools;
  };
});

// Atom to expose Vesu borrow pools (for backward compatibility)
// Filters: isVerified=true, collateralIsLST=true
export const vesuBorrowPoolsAtom = atom<VesuBorrowPool[]>((get) => {
  const filterFn = get(vesuPoolsFilteredAtom);
  return filterFn({ isVerified: true, collateralIsLST: true });
});

// Vault capacity interface
export interface VaultCapacity {
  used: number;
  total: number | null; // null means no limit
}

// Helper function to fetch vault capacity from troves hyper vault
async function fetchVaultCapacity(
  vaultAddress: string,
  vaultDecimals: number,
  isBTC: boolean,
): Promise<VaultCapacity | null> {
  try {
    const provider = getProvider();

    const contract = new Contract({
      abi: erc4626Abi,
      address: vaultAddress as `0x${string}`,
      providerOrAccount: provider,
    });

    // Fetch total_assets and max_deposit
    // For max_deposit, we need a receiver address, but we can use zero address
    const zeroAddress =
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    const [totalAssetsResult, maxDepositResult] = await Promise.all([
      contract.call("total_assets", []),
      contract.call("get_deposit_limit", []),
    ]);

    // Convert u256 results using MyNumber
    // Handle both string and u256 struct (low/high) formats
    const totalAssetsStr = totalAssetsResult.toString();
    const maxDepositStr = maxDepositResult.toString();

    const totalAssetsMyNum = new MyNumber(totalAssetsStr, vaultDecimals);
    const maxDepositMyNum = new MyNumber(maxDepositStr, vaultDecimals);

    // Calculate used capacity
    const used = Number(totalAssetsMyNum.toEtherToFixedDecimals(6));

    const underlyingPrice = await getAssetPrice(!isBTC);

    const usedUSD = used * underlyingPrice;

    // If max_deposit is 0, it means no limit
    const maxDepositValue = Number(maxDepositMyNum.toEtherToFixedDecimals(6));
    const maxDepositUSD = maxDepositValue * underlyingPrice;
  
    // alert(`used: ${usedUSD}, maxDeposit: ${maxDepositUSD}, address: ${vaultAddress}`);

    if (maxDepositUSD === 0) {
      return { used: usedUSD, total: null };
    }

    // If max deposit is > 1B, show no limit
    if (maxDepositUSD > 1_000_000_000) {
      return { used: usedUSD, total: null };
    }

    return { used: usedUSD, total: maxDepositUSD };
  } catch (error) {
    console.error("Error fetching vault capacity:", error);
    return null;
  }
}

// Create vault capacity atoms for each hyper vault
const createVaultCapacityAtom = (vaultSymbol: string) => {
  return atomWithQuery(() => ({
    queryKey: [`vaultCapacity_${vaultSymbol}`],
    queryFn: async (_queryKey: any): Promise<VaultCapacity | null> => {
      const asset = Object.values(LST_CONFIG).find(
        (a) => a.LST_SYMBOL === vaultSymbol,
      );

      if (!asset?.NETWORKS[NETWORK]?.TROVES_HYPER_VAULT_ADDRESS) {
        return null;
      }

      const networkConfig = asset.NETWORKS[NETWORK];
      if (!networkConfig?.TROVES_HYPER_VAULT_ADDRESS) {
        return null;
      }
      const vaultAddress = networkConfig.TROVES_HYPER_VAULT_ADDRESS;
      const isBTC = asset.SYMBOL.toLowerCase().includes("btc");
      return fetchVaultCapacity(vaultAddress, asset.DECIMALS, isBTC);
    },
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  }));
};

export const hyperxWBTCVaultCapacityAtom = createVaultCapacityAtom("xWBTC");
export const hyperxtBTCVaultCapacityAtom = createVaultCapacityAtom("xtBTC");
export const hyperxLBTCVaultCapacityAtom = createVaultCapacityAtom("xLBTC");
export const hyperxsBTCVaultCapacityAtom = createVaultCapacityAtom("xsBTC");
export const hyperxSTRKVaultCapacityAtom = createVaultCapacityAtom("xSTRK");

// TODO: move to separate type file
export type SupportedDApp =
  | "strkfarm"
  | "strkfarmEkubo"
  | "trovesHyper"
  | "vesu"
  | "avnu"
  | "fibrous"
  | "ekubo"
  | "ekuboSTRK"
  | "ekuboxWBTC"
  | "ekuboxtBTC"
  | "ekuboxLBTC"
  | "ekuboxsBTC"
  | "nostraDex"
  | "nostraLending"
  | "nostra"
  | "haiko"
  | "opus"
  | "endur"
  | "ekuboBTCxWBTC"
  | "ekuboBTCxtBTC"
  | "ekuboBTCxLBTC"
  | "ekuboBTCxsBTC"
  | "hyperxSTRK"
  | "hyperxWBTC"
  | "hyperxtBTC"
  | "hyperxsBTC"
  | "hyperxLBTC"
  | "avnuBTCxWBTC"
  | "avnuBTCxtBTC"
  | "avnuBTCxLBTC"
  | "avnuBTCxsBTC"
  | "vesuBTCxWBTC"
  | "vesuBTCxtBTC"
  | "vesuBTCxLBTC"
  | "vesuBTCxsBTC";

// TODO: move to separate type file
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
  hyperxSTRK: get(trovesHyperYieldAtom),
  hyperxWBTC: get(trovesHyperYieldAtom),
  hyperxtBTC: get(trovesHyperYieldAtom),
  hyperxLBTC: get(trovesHyperYieldAtom),
  hyperxsBTC: get(trovesHyperYieldAtom),
  vesu: get(vesuYieldAtom),
  vesuBTCxWBTC: get(vesuBTCxWBTCYieldAtom),
  vesuBTCxtBTC: get(vesuBTCxtBTCYieldAtom),
  vesuBTCxLBTC: get(vesuBTCxLBTCYieldAtom),
  vesuBTCxsBTC: get(vesuBTCxsBTCYieldAtom),
  ekubo: get(ekuboYieldAtom),
  nostraDex: get(nostraLPYieldAtom),
  nostraLending: get(nostraLendYieldAtom),
  haiko: get(haikoYieldAtom), //TODO: I think haiko is not being used anywhere now. Confirm that and comment this here as well
}));

// Takes input as blocknumber | undefined, returns a Query Atom
// TODO: move all the below type/interface to separate type file
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
