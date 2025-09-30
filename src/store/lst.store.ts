import { atom, type Getter } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { type BlockIdentifier, BlockTag, Contract, uint256 } from "starknet";

import WqAbi from "@/abi/wq.abi.json";
import {
  STRK_DECIMALS,
  xSTRK_TOKEN_MAINNET_DEPLOYMENT_BLOCK,
} from "@/constants";
import MyNumber from "@/lib/MyNumber";
import LSTService from "@/services/lst";

// LST Stats API types
interface LSTStatsResponse {
  asset: string;
  assetAddress: string;
  lstAddress: string;
  tvlUsd: number;
  tvlAsset: number;
  apy: number;
  apyInPercentage: string;
  exchangeRate: number;
  preciseExchangeRate: string;
  error?: string;
}

import {
  currentBlockAtom,
  lstConfigAtom,
  providerAtom,
  assetPriceAtom,
  userAddressAtom,
} from "./common.store";
import {
  type DAppHoldingsAtom,
  type DAppHoldingsFn,
  getHoldingAtom,
} from "./defi.store";
import { isContractNotDeployed } from "@/lib/utils";

const lstService = new LSTService();

export const getHoldings: DAppHoldingsFn = async ({
  address,
  lstAddress,
  decimals,
  blockNumber,
}: {
  address: string;
  lstAddress?: string;
  decimals?: number;
  blockNumber?: BlockIdentifier;
}) => {
  if (!lstAddress || !decimals) {
    return {
      lstAmount: MyNumber.fromZero(),
      underlyingTokenAmount: MyNumber.fromZero(),
    };
  }
  const lstContract = lstService.getLSTContract(lstAddress);
  if (
    isContractNotDeployed(blockNumber, xSTRK_TOKEN_MAINNET_DEPLOYMENT_BLOCK)
  ) {
    return {
      lstAmount: MyNumber.fromZero(),
      underlyingTokenAmount: MyNumber.fromZero(),
    };
  }

  const balance = await lstContract.call("balance_of", [address], {
    blockIdentifier: blockNumber ?? BlockTag.LATEST,
  });
  return {
    lstAmount: new MyNumber(balance.toString(), decimals),
    underlyingTokenAmount: MyNumber.fromZero(),
  };
};

export const getTotalAssetsByBlock = async (
  lstAddress: string,
  decimals: number,
  blockNumber: BlockIdentifier = BlockTag.LATEST,
) => {
  const balance = await lstService.getTotalStaked(
    lstAddress,
    decimals,
    blockNumber,
  );
  return balance;
};

export const getTotalSupplyByBlock = async (
  lstAddress: string,
  decimals: number,
  blockNumber: BlockIdentifier = BlockTag.LATEST,
) => {
  const balance = await lstService.getTotalSupply(
    lstAddress,
    decimals,
    blockNumber,
  );
  return balance;
};

function blockNumberQueryKey(
  get: Getter,
  blockNumber: BlockIdentifier = BlockTag.LATEST,
) {
  if (blockNumber === BlockTag.LATEST || blockNumber === BlockTag.LATEST) {
    return get(currentBlockAtom);
  }
  return blockNumber;
}

export const getExchangeRateGivenAssets = (
  totalAssets: MyNumber,
  totalSupply: MyNumber,
  decimals: number,
) => {
  return {
    rate: Number(totalAssets.toEtherStr()) / Number(totalSupply.toEtherStr()),
    preciseRate: totalAssets
      .operate("multipliedBy", MyNumber.fromEther("1", decimals).toString())
      .operate("div", totalSupply.toString() || "1"),
  };
};

const userLSTBalanceQueryAtom = atomWithQuery((get) => {
  return {
    // current block atom only to trigger a change when the block changes
    queryKey: [
      "userLSTBalance",
      get(currentBlockAtom),
      get(userAddressAtom),
      get(lstConfigAtom),
    ],
    queryFn: async ({ queryKey }: any): Promise<MyNumber> => {
      const [, , userAddress, lstConfig] = queryKey;
      if (!userAddress || !lstConfig) {
        return MyNumber.fromZero();
      }
      try {
        const lstContract = lstService.getLSTContract(lstConfig.LST_ADDRESS);
        const balance = await lstContract.call("balance_of", [userAddress]);
        return new MyNumber(balance.toString(), lstConfig.DECIMALS);
      } catch (error) {
        console.error("userLSTBalanceAtom [3]", error);
        return MyNumber.fromZero();
      }
    },
  };
});

export const userLSTBalanceAtom = atom((get) => {
  const { data, error } = get(userLSTBalanceQueryAtom);

  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const userNstSTRKBalanceQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: [
      "userNstSTRKBalance",
      get(currentBlockAtom),
      get(userAddressAtom),
    ],
    queryFn: async ({ _queryKey }: any): Promise<MyNumber> => {
      const userAddress = get(userAddressAtom);

      if (!userAddress) {
        return MyNumber.fromZero();
      }

      try {
        const nstContract = lstService.getNstSTRKContract();
        const balance = await nstContract.call("balanceOf", [userAddress]);
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("userNstSTRKBalanceQueryAtom [2]", error);
        return MyNumber.fromZero();
      }
    },
  };
});

export const nstStrkWithdrawalFeeQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: [
      "userNstWithdrawalFee",
      get(currentBlockAtom),
      get(userAddressAtom),
    ],
    queryFn: async ({ _queryKey }: any): Promise<MyNumber> => {
      const userAddress = get(userAddressAtom);

      if (!userAddress) {
        return MyNumber.fromZero();
      }

      try {
        const nstContract = lstService.getNstSTRKContract();
        const balance = await nstContract.call("withdrawal_fee");
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("nstStrkWithdrawalFeeQueryAtom [3]", error);
        return MyNumber.fromZero();
      }
    },
  };
});

export const userBalanceQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: [
      "userBalance",
      get(currentBlockAtom),
      get(userAddressAtom),
      get(userLSTBalanceAtom),
      get(lstConfigAtom),
    ],
    queryFn: async ({ _queryKey }: any): Promise<MyNumber> => {
      const userAddress = get(userAddressAtom);
      const lstBalance = get(userLSTBalanceAtom);
      const lstConfig = get(lstConfigAtom)!;

      if (!userAddress || !lstConfig || lstBalance.value.isZero()) {
        return MyNumber.fromZero();
      }

      try {
        const lstContract = lstService.getLSTContract(lstConfig.LST_ADDRESS);
        const balance = await lstContract.call("convert_to_assets", [
          uint256.bnToUint256(lstBalance.value.toString()),
        ]);
        return new MyNumber(balance.toString(), lstConfig.DECIMALS);
      } catch (error) {
        console.error("userBalanceQueryAtom [3]", error);
        return MyNumber.fromZero();
      }
    },
  };
});

export const userNstSTRKBalanceAtom = atom((get) => {
  const { data, error } = get(userNstSTRKBalanceQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const nstStrkWithdrawalFeeAtom = atom((get) => {
  const { data, error } = get(nstStrkWithdrawalFeeQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const userBalanceAtom = atom((get) => {
  const { data, error } = get(userBalanceQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const totalStakedQueryAtom = atomFamily(
  (blockNumber: BlockIdentifier | undefined) => {
    return atomWithQuery((get) => {
      return {
        queryKey: [
          "totalStaked",
          blockNumberQueryKey(get, blockNumber),
          get(lstConfigAtom),
        ],
        queryFn: async ({ _queryKey }: any): Promise<MyNumber> => {
          const lstConfig = get(lstConfigAtom)!;
          try {
            return await getTotalAssetsByBlock(
              lstConfig.LST_ADDRESS,
              lstConfig.DECIMALS,
              blockNumber,
            );
          } catch (error) {
            console.error("totalStakedAtom [3]", error);
            return MyNumber.fromZero();
          }
        },
        staleTime: Infinity, // Prevents automatic refetching
        cacheTime: 60000, // Keeps old block data for 60s
      };
    });
  },
);

export const totalStakedAtom = atom((get) => {
  const { data, error, isLoading } = get(totalStakedCurrentBlockQueryAtom);

  return {
    value:
      error || data?.error || !data?.value ? MyNumber.fromZero() : data.value,
    error,
    isLoading,
  };
});

export const totalSupplyQueryAtom = atomFamily(
  (blockNumber: BlockIdentifier | undefined) => {
    return atomWithQuery((get) => ({
      queryKey: [
        "totalSupply",
        blockNumberQueryKey(get, blockNumber),
        get(lstConfigAtom),
      ],
      queryFn: async ({ _queryKey }: any): Promise<MyNumber> => {
        const lstConfig = get(lstConfigAtom)!;

        try {
          return await getTotalSupplyByBlock(
            lstConfig.LST_ADDRESS,
            lstConfig.DECIMALS,
            blockNumber,
          );
        } catch (error) {
          console.error("totalSupplyAtom [3]", error);
          return MyNumber.fromZero();
        }
      },
    }));
  },
);

export const exchangeRateAtom = atom((get) => {
  const totalStaked = get(totalStakedCurrentBlockQueryAtom);
  const totalSupply = get(totalSupplyCurrentBlockAtom);
  const lstConfig = get(lstConfigAtom);
  if (
    totalStaked.isLoading ||
    totalSupply.isLoading ||
    totalStaked.error ||
    totalSupply.error ||
    !totalStaked.data ||
    !totalSupply.data ||
    totalSupply.data.value.isZero() ||
    !lstConfig
  ) {
    // return ex rate as zero
    // Note: Technically it should be one, but
    // here we assume that if its zero, something wrong
    // in our requests and return 0 to avoid any user side confusion
    return {
      rate: 0,
      preciseRate: MyNumber.fromZero(),
      isLoading: totalStaked.isLoading || totalSupply.isLoading,
    };
  }
  return {
    rate:
      Number(totalStaked.data.value.toEtherStr()) /
      Number(totalSupply.data.value.toEtherStr()),
    preciseRate: totalStaked.data.value
      .operate(
        "multipliedBy",
        MyNumber.fromEther("1", lstConfig.DECIMALS).toString(),
      )
      .operate("div", totalSupply.data.value.toString() || "1"),
    isLoading: totalStaked.isLoading || totalSupply.isLoading,
  };
});

export const totalStakedUSDAtom = atom((get) => {
  const { data: price, isLoading: isPriceLoading } = get(assetPriceAtom);
  const lstConfig = get(lstConfigAtom);

  const totalStaked = get(totalStakedAtom);
  const isLoading = totalStaked.isLoading || isPriceLoading;

  if (!price || !lstConfig || isLoading)
    return {
      value: 0,
      isLoading,
    };

  console.log("tvl price", price);
  console.log("tvl total staked", totalStaked.value.toEtherToFixedDecimals(4));
  console.log(
    "tvl",
    Number(totalStaked.value.toEtherToFixedDecimals(4)) * price,
  );

  return {
    value: Number(totalStaked.value.toEtherToFixedDecimals(4)) * price || 0,
    isLoading,
  };
});

export const withdrawalQueueStateQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["withdrawalQueueState", get(currentBlockAtom)],
    queryFn: async () => {
      const provider = get(providerAtom);
      const lstConfig = get(lstConfigAtom)!;
      if (!provider) return null;

      try {
        const contract = new Contract({
          abi: WqAbi,
          address: lstConfig.WITHDRAWAL_QUEUE_ADDRESS,
          providerOrAccount: provider,
        });

        const state = await contract.call("get_queue_state");
        return state;
      } catch (error) {
        console.error("Error fetching withdrawal queue state:", error);
        return null;
      }
    },
  };
});

export const withdrawalQueueStateAtom = atom((get) => {
  const { data, error } = get(withdrawalQueueStateQueryAtom);
  return {
    value: data,
    error,
    isLoading: !data && !error,
  };
});

const userLSTBalanceByBlockQueryAtom = getHoldingAtom(
  "userXSTRKBalance",
  getHoldings,
);

export const userLSTBalanceByBlockAtom: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) => {
    return atom((get) => {
      const { data, error } = get(userLSTBalanceByBlockQueryAtom(blockNumber));

      return {
        data:
          error || !data
            ? {
                lstAmount: MyNumber.fromZero(),
                underlyingTokenAmount: MyNumber.fromZero(),
              }
            : data,
        error,
        isLoading: !data && !error,
      };
    });
  },
);

export const totalStakedCurrentBlockQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: [
      "totalStaked",
      get(currentBlockAtom),
      get(providerAtom),
      get(lstConfigAtom),
      get(totalStakedQueryAtom(BlockTag.LATEST)),
    ],
    queryFn: async ({ _queryKey }: any) => {
      const { data, error } = get(totalStakedQueryAtom(BlockTag.LATEST));
      return {
        value: error || !data ? MyNumber.fromZero() : data,
        error,
        isLoading: !data && !error,
      };
    },
  };
});

export const totalSupplyCurrentBlockAtom = atomWithQuery((get) => {
  return {
    queryKey: [
      "totalSupply",
      get(currentBlockAtom),
      get(totalStakedQueryAtom(BlockTag.LATEST)),
    ],
    queryFn: async ({ _queryKey }: any) => {
      const { data, error } = get(totalSupplyQueryAtom(BlockTag.LATEST));

      return {
        value: error || !data ? MyNumber.fromZero() : data,
        error,
        isLoading: !data && !error,
      };
    },
  };
});

export const exchangeRateByBlockAtom = atomFamily((blockNumber?: number) => {
  return atom((get) => {
    const totalStaked = get(totalStakedQueryAtom(blockNumber));
    const totalSupply = get(totalSupplyQueryAtom(blockNumber));
    const lstConfig = get(lstConfigAtom);
    if (
      totalStaked.isLoading ||
      totalSupply.isLoading ||
      totalStaked.error ||
      totalSupply.error ||
      !totalStaked.data ||
      !totalSupply.data ||
      !lstConfig
    ) {
      // return ex rate as zero
      // Note: Technically it should be one, but
      // here we assume that if its zero, something wrong
      // in our requests and return 0 to avoid any user side confusion
      return {
        rate: 0,
        preciseRate: MyNumber.fromZero(),
        isLoading: totalStaked.isLoading || totalSupply.isLoading,
      };
    }
    return {
      ...getExchangeRateGivenAssets(
        totalStaked.data,
        totalSupply.data,
        lstConfig.DECIMALS,
      ),
      isLoading: totalStaked.isLoading || totalSupply.isLoading,
    };
  });
});

export const lstStatsQueryAtom = atomWithQuery(() => ({
  queryKey: ["lstStats"],
  queryFn: async (): Promise<LSTStatsResponse[]> => {
    try {
      const response = await fetch("/api/lst/stats");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("lstStatsQueryAtom error:", error);
      throw error;
    }
  },
  refetchInterval: 60000,
  staleTime: 30000,
}));

export const apiExchangeRateAtom = atom((get) => {
  const { data, error, isLoading } = get(lstStatsQueryAtom);
  const lstConfig = get(lstConfigAtom);

  if (isLoading || error || !data || !lstConfig) {
    return {
      rate: 0,
      preciseRate: MyNumber.fromZero(),
      isLoading,
      error,
    };
  }

  const lstStats = data.find(
    (stats) =>
      stats.lstAddress?.toLowerCase() === lstConfig.LST_ADDRESS?.toLowerCase(),
  );

  if (!lstStats || lstStats.error) {
    return {
      rate: 0,
      preciseRate: MyNumber.fromZero(),
      isLoading: false,
      error: lstStats?.error || "LST stats not found",
    };
  }

  return {
    rate: lstStats.exchangeRate,
    preciseRate: MyNumber.fromZero().operate(
      "plus",
      lstStats.preciseExchangeRate,
    ),
    isLoading: false,
    error: null,
  };
});
