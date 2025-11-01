import MyNumber from "@/lib/MyNumber";
import { Atom, atom, WritableAtom } from "jotai";
import { atomWithQuery, AtomWithQueryResult } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { AtomFamily } from "jotai/vanilla/utils/atomFamily";
import { BlockIdentifier } from "starknet";
import { assetPriceAtom, lstConfigAtom, userAddressAtom } from "./common.store";
import { apiExchangeRateAtom } from "./lst.store";
import { snAPYAtom, btcPriceAtom } from "./staking.store";
import { LSTAssetConfig } from "@/constants";

// TODO: move all the types to separate type file
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
		borrowApr: {
			value: string;
			decimals: number;
		},
		lstApr: {
			value: string;
			decimals: number;
		}
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
        "https://api.vesu.xyz/pools/0x052fb52363939c3aa848f8f4ac28f0a51379f8d1b971d8444de25fbd77d8f161",
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
	// this should also be added - but then final apy is not matching
    //   const borrowApr = convertVesuValue(
    //     stats.borrowApr.value,
    //     stats.borrowApr.decimals,
    //   );
      const lstApr = convertVesuValue(
        stats.lstApr.value,
        stats.lstApr.decimals,
      );

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
  refetchOnMount: false
}));

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
	const apy = (baseApy + rewardApy);

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

// TODO: move to separate type file
export type SupportedDApp =
  | "strkfarm"
  | "strkfarmEkubo"
  | "trovesHyper"
  | "vesu"
  | "avnu"
  | "fibrous"
  | "ekubo"
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
