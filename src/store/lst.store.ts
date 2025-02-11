import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { Contract, RpcProvider, uint256 } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import nostraSTRKAbi from "@/abi/nostra.strk.abi.json";
import WqAbi from "@/abi/wq.abi.json";
import {
  LST_ADDRRESS,
  NST_STRK_ADDRESS,
  STRK_DECIMALS,
  WITHDRAWAL_QUEUE_ADDRESS,
} from "@/constants";
import MyNumber from "@/lib/MyNumber";

import {
  currentBlockAtom,
  providerAtom,
  strkPriceAtom,
  userAddressAtom,
} from "./common.store";
import { atomFamily } from "jotai/utils";
import { get } from "http";
import { DAppHoldings, DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";

export function getLSTContract(provider: RpcProvider) {
  return new Contract(erc4626Abi, LST_ADDRRESS, provider);
}

export function getNstSTRKContract(provider: RpcProvider) {
  return new Contract(nostraSTRKAbi, NST_STRK_ADDRESS, provider);
}

const getXSTRKHoldings: DAppHoldingsFn = async (
  address: string,
  provider: RpcProvider,
  blockNumber?: number,
) => {
  const lstContract = getLSTContract(provider);
  const balance = await lstContract.call("balance_of", [address], {
    blockIdentifier: blockNumber ?? "latest",
  });
  return {
    xSTRKAmount: new MyNumber(balance.toString(), STRK_DECIMALS),
    STRKAmount: MyNumber.fromZero(),
  };
}

const userXSTRKBalanceByBlockQueryAtom = getHoldingAtom(
  'userXSTRKBalance',
  getXSTRKHoldings,
)

export const userXSTRKBalanceByBlockAtom: DAppHoldingsAtom = atomFamily((blockNumber?: number) => {
  return atom((get) => {
    const { data, error } = get(userXSTRKBalanceByBlockQueryAtom(blockNumber));

    return {
      data: error || !data ? {
        xSTRKAmount: MyNumber.fromZero(),
        STRKAmount: MyNumber.fromZero(),
      } : data,
      error,
      isLoading: !data && !error,
    };
  });
});

const userXSTRKBalanceQueryAtom = atomWithQuery((get) => {
  return {
    // current block atom only to trigger a change when the block changes
    queryKey: [
      "userXSTRKBalance",
      get(currentBlockAtom),
      get(userAddressAtom),
      get(providerAtom),
    ],
    queryFn: async ({ queryKey }: any): Promise<MyNumber> => {
      const currentBlock = queryKey[1];
      const res = get(userXSTRKBalanceByBlockQueryAtom(currentBlock));
      return res.data?.xSTRKAmount || MyNumber.fromZero();
    },
  };
});

export const userXSTRKBalanceAtom = atom((get) => {
  const { data, error } = get(userXSTRKBalanceQueryAtom);
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
      get(providerAtom),
    ],
    queryFn: async ({ _queryKey }: any): Promise<MyNumber> => {
      const provider = get(providerAtom);
      const userAddress = get(userAddressAtom);

      if (!provider || !userAddress) {
        return MyNumber.fromZero();
      }

      try {
        const nstContract = getNstSTRKContract(provider);
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
      get(providerAtom),
    ],
    queryFn: async ({ _queryKey }: any): Promise<MyNumber> => {
      const provider = get(providerAtom);
      const userAddress = get(userAddressAtom);

      if (!provider || !userAddress) {
        return MyNumber.fromZero();
      }

      try {
        const nstContract = getNstSTRKContract(provider);
        const balance = await nstContract.call("withdrawal_fee");
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("nstStrkWithdrawalFeeQueryAtom [3]", error);
        return MyNumber.fromZero();
      }
    },
  };
});

export const userSTRKBalanceQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: [
      "userSTRKBalance",
      get(currentBlockAtom),
      get(userAddressAtom),
      get(userXSTRKBalanceAtom),
    ],
    queryFn: async ({ queryKey }: any): Promise<MyNumber> => {
      const provider = get(providerAtom);
      const userAddress = get(userAddressAtom);
      const xSTRKBalance = get(userXSTRKBalanceAtom);
      if (!provider || !userAddress || xSTRKBalance.value.isZero()) {
        return MyNumber.fromZero();
      }

      try {
        const lstContract = getLSTContract(provider);
        const balance = await lstContract.call("convert_to_assets", [
          uint256.bnToUint256(xSTRKBalance.value.toString()),
        ]);
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("userSTRKBalanceQueryAtom [3]", error);
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

export const userSTRKBalanceAtom = atom((get) => {
  const { data, error } = get(userSTRKBalanceQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const totalStakedQueryAtom = atomFamily((blockNumber?: number) => {
  return atomWithQuery((get) => {
    return {
      queryKey: ["totalStaked", blockNumber, get(providerAtom)],
      queryFn: async ({ queryKey }: any): Promise<MyNumber> => {
        const provider = get(providerAtom);
        if (!provider) {
          return MyNumber.fromZero();
        }

        try {
          const lstContract = getLSTContract(provider);
          const balance = await lstContract.call("total_assets", [], {
            blockIdentifier: blockNumber ?? "latest",
          })
          return new MyNumber(balance.toString(), STRK_DECIMALS);
        } catch (error) {
          console.error("totalStakedAtom [3]", error);
          return MyNumber.fromZero();
        }
      },
      staleTime: Infinity, // Prevents automatic refetching
      cacheTime: 60000, // Keeps old block data for 60s
    };
  });
});

export const totalStakedCurrentBlockQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["totalStaked", get(currentBlockAtom), get(providerAtom)],
    queryFn: async ({ queryKey }: any) => {
      const currentBlock = await get(currentBlockAtom);
      const { data, error } = get(totalStakedQueryAtom(currentBlock));
      return {
        value: error || !data ? MyNumber.fromZero() : data,
        error,
        isLoading: !data && !error,
      };
    }
  }
});

export const totalStakedAtom = atom((get) => {
  const { data, error, isLoading } = get(totalStakedCurrentBlockQueryAtom);
  return {
    value: error || data?.error || !data?.value ? MyNumber.fromZero() : data.value,
    error,
    isLoading: isLoading
  };
});

export const totalSupplyQueryAtom = atomFamily((blockNumber?: number) => {
  return atomWithQuery((get) => ({
    queryKey: ["totalSupply", blockNumber, get(providerAtom)],
    queryFn: async ({ queryKey }: any): Promise<MyNumber> => {
      const provider = get(providerAtom);
      if (!provider) {
        return MyNumber.fromZero();
      }

      try {
        const lstContract = getLSTContract(provider);
        const balance = await lstContract.call("total_supply", [], {
          blockIdentifier: blockNumber ?? "latest",
        });
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("totalSupplyAtom [3]", error);
        return MyNumber.fromZero();
      }
    },
  }));
});

export const totalSupplyCurrentBlockAtom = atomWithQuery((get) => {
  return {
    queryKey: ["totalSupply", get(currentBlockAtom), get(providerAtom)],
    queryFn: async ({ queryKey }: any) => {
      const currentBlock = await get(currentBlockAtom);
      const { data, error } = get(totalSupplyQueryAtom(currentBlock));
      return {
        value: error || !data ? MyNumber.fromZero() : data,
        error,
        isLoading: !data && !error,
      };
    }
  }
});

export const exchangeRateAtom = atom((get) => {
  const totalStaked = get(totalStakedCurrentBlockQueryAtom);
  const totalSupply = get(totalSupplyCurrentBlockAtom);
  if (
    totalStaked.isLoading || totalSupply.isLoading || 
    totalStaked.error || totalSupply.error || 
    !totalStaked.data || !totalSupply.data
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
  console.log("exchangeRateAtom", totalStaked.data.value, totalSupply.data.value);
  return {
    rate:
      Number(totalStaked.data.value.toEtherStr()) /
      Number(totalSupply.data.value.toEtherStr()),
    preciseRate: totalStaked.data.value
      .operate("multipliedBy", MyNumber.fromEther("1", 18).toString())
      .operate("div", totalSupply.data.value.toString() || '1'),
    isLoading: totalStaked.isLoading || totalSupply.isLoading,
  };
});

export const exchangeRateByBlockAtom = atomFamily((blockNumber?: number) => {
  return atom((get) => {
    const totalStaked = get(totalStakedQueryAtom(blockNumber));
    const totalSupply = get(totalSupplyQueryAtom(blockNumber));
    if (
      totalStaked.isLoading || totalSupply.isLoading ||
      totalStaked.error || totalSupply.error ||
      !totalStaked.data || !totalSupply.data
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
    console.log("exchangeRateByBlockAtom", totalStaked.data, totalSupply.data);
    return {
      rate:
        Number(totalStaked.data.toEtherStr()) /
        Number(totalSupply.data.toEtherStr()),
      preciseRate: totalStaked.data
        .operate("multipliedBy", MyNumber.fromEther("1", 18).toString())
        .operate("div", totalSupply.data.toString() || '1'),
      isLoading: totalStaked.isLoading || totalSupply.isLoading,
    };
  })
});

export const totalStakedUSDAtom = atom((get) => {
  const { data: price, isLoading: isPriceLoading } = get(strkPriceAtom);
  const totalStaked = get(totalStakedAtom);
  const isLoading = totalStaked.isLoading || isPriceLoading;
  if (!price)
    return {
      value: 0,
      isLoading,
    };

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
      if (!provider) return null;

      try {
        const contract = new Contract(
          WqAbi,
          WITHDRAWAL_QUEUE_ADDRESS,
          provider,
        );

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
