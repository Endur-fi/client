import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { Contract, RpcProvider, uint256 } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import nostraSTRKAbi from "@/abi/nostra.strk.abi.json";
import {
  LST_ADDRRESS,
  NST_STRK_ADDRESS,
  STRK_DECIMALS,
  WITHDRAWAL_QUEUE_ADDRESS,
} from "@/constants";
import MyNumber from "@/lib/MyNumber";
import WqAbi from "@/abi/wq.abi.json";

import {
  currentBlockAtom,
  providerAtom,
  strkPriceAtom,
  userAddressAtom,
} from "./common.store";

export function getLSTContract(provider: RpcProvider) {
  return new Contract(erc4626Abi, LST_ADDRRESS, provider);
}

export function getNstSTRKContract(provider: RpcProvider) {
  return new Contract(nostraSTRKAbi, NST_STRK_ADDRESS, provider);
}

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
      const [, , userAddress] = queryKey;
      const provider = get(providerAtom);
      if (!provider || !userAddress) {
        return MyNumber.fromZero();
      }
      try {
        const lstContract = getLSTContract(provider);
        const balance = await lstContract.call("balance_of", [userAddress]);
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("userXSTRKBalanceAtom [3]", error);
        return MyNumber.fromZero();
      }
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
      const { data, error } = get(userXSTRKBalanceQueryAtom);
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

export const totalStakedQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["totalStaked", get(currentBlockAtom), get(providerAtom)],
    queryFn: async ({ queryKey }: any): Promise<MyNumber> => {
      const provider = get(providerAtom);
      if (!provider) {
        return MyNumber.fromZero();
      }

      try {
        const lstContract = getLSTContract(provider);
        const balance = await lstContract.call("total_assets");
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("totalStakedAtom [3]", error);
        return MyNumber.fromZero();
      }
    },
  };
});

export const totalStakedAtom = atom((get) => {
  const { data, error } = get(totalStakedQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const totalSupplyQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["totalSupply", get(currentBlockAtom), get(providerAtom)],
    queryFn: async ({ queryKey }: any): Promise<MyNumber> => {
      const provider = get(providerAtom);
      if (!provider) {
        return MyNumber.fromZero();
      }

      try {
        const lstContract = getLSTContract(provider);
        const balance = await lstContract.call("total_supply");
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("totalSupplyAtom [3]", error);
        return MyNumber.fromZero();
      }
    },
  };
});

export const totalSupplyAtom = atom((get) => {
  const { data, error } = get(totalSupplyQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const exchangeRateAtom = atom((get) => {
  const totalStaked = get(totalStakedAtom);
  const totalSupply = get(totalSupplyAtom);
  if (totalSupply.value.isZero()) {
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
  console.log("exchangeRateAtom", totalStaked.value, totalSupply.value);
  return {
    rate:
      Number(totalStaked.value.toEtherStr()) /
      Number(totalSupply.value.toEtherStr()),
    preciseRate: totalStaked.value
      .operate("multipliedBy", MyNumber.fromEther("1", 18).toString())
      .operate("div", totalSupply.value.toString()),
    isLoading: totalStaked.isLoading || totalSupply.isLoading,
  };
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
