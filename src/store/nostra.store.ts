import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { Contract } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import nostraLpAbi from "@/abi/nostra.lp.abi.json";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import {
  currentBlockAtom,
  providerAtom,
  userAddressAtom,
} from "./common.store";

const N_XSTRK_CONTRACT_ADDRESS =
  "0x06878fd475d5cea090934d690ecbe4ad78503124e4f80380a2e45eb417aafb9c";
const N_XSTRK_C_CONTRACT_ADDRESS =
  "0x01b8d8e31f9dd1bde7dc878dd871225504837c78c40ff01cbf03a255e2154bf0";
const i_XSTRK_CONTRACT_ADDRESS =
  "0x04d1125a716f547a0b69413c0098e811da3b799d173429c95da4290a00c139f7";
const i_XSTRK_C_CONTRACT_ADDRESS =
  "0x0257afe480da9255a026127cd3a295a580ef316b297a69be22b89729ae8c1d2a";
const D_XSTRK_CONTRACT_ADDRESS =
  "0x0424638c9060d08b4820aabbb28347fc7234e2b7aadab58ad0f101e2412ea42d";
const LP_TOKEN_CONTRACT_ADDRESS =
  "0x00205fd8586f6be6c16f4aa65cc1034ecff96d96481878e55f629cd0cb83e05f";

const usernxSTRKBalanceQueryAtom = atomFamily((blockNumber?: number) =>
  atomWithQuery((get) => {
    return {
      // current block atom only to trigger a change when the block changes
      queryKey: [
        "usernxSTRKBalance",
        get(currentBlockAtom),
        get(userAddressAtom),
        get(providerAtom),
      ],

      queryFn: async ({ queryKey }: any) => {
        const [, , userAddress] = queryKey;
        const provider = get(providerAtom);

        if (!provider || !userAddress) {
          return MyNumber.fromZero();
        }

        try {
          const contract = new Contract(
            erc4626Abi,
            N_XSTRK_CONTRACT_ADDRESS,
            provider,
          );

          const balance = await contract.call("balance_of", [userAddress], {
            blockIdentifier: blockNumber ?? "latest",
          });
          return new MyNumber(balance.toString(), STRK_DECIMALS);
        } catch (error) {
          console.error("usernxSTRKBalance [3]", error);
          return 0;
        }
      },
    };
  }),
);

const usernxSTRKcBalanceQueryAtom = atomFamily((blockNumber?: number) =>
  atomWithQuery((get) => {
    return {
      // current block atom only to trigger a change when the block changes
      queryKey: [
        "usernxSTRKcBalance",
        get(currentBlockAtom),
        get(userAddressAtom),
        get(providerAtom),
      ],

      queryFn: async ({ queryKey }: any) => {
        const [, , userAddress] = queryKey;
        const provider = get(providerAtom);

        if (!provider || !userAddress) {
          return MyNumber.fromZero();
        }

        try {
          const contract = new Contract(
            erc4626Abi,
            N_XSTRK_C_CONTRACT_ADDRESS,
            provider,
          );

          const balance = await contract.call("balance_of", [userAddress], {
            blockIdentifier: blockNumber ?? "latest",
          });
          return new MyNumber(balance.toString(), STRK_DECIMALS);
        } catch (error) {
          console.error("usernxSTRKcBalance [3]", error);
          return 0;
        }
      },
    };
  }),
);

const userixSTRKBalanceQueryAtom = atomFamily((blockNumber?: number) =>
  atomWithQuery((get) => {
    return {
      // current block atom only to trigger a change when the block changes
      queryKey: [
        "userixSTRKBalance",
        get(currentBlockAtom),
        get(userAddressAtom),
        get(providerAtom),
      ],

      queryFn: async ({ queryKey }: any) => {
        const [, , userAddress] = queryKey;
        const provider = get(providerAtom);

        if (!provider || !userAddress) {
          return MyNumber.fromZero();
        }

        try {
          const contract = new Contract(
            erc4626Abi,
            i_XSTRK_CONTRACT_ADDRESS,
            provider,
          );

          const balance = await contract.call("balance_of", [userAddress], {
            blockIdentifier: blockNumber ?? "latest",
          });
          return new MyNumber(balance.toString(), STRK_DECIMALS);
        } catch (error) {
          console.error("userixSTRKBalance [3]", error);
          return 0;
        }
      },
    };
  }),
);

const userixSTRKcBalanceQueryAtom = atomFamily((blockNumber?: number) =>
  atomWithQuery((get) => {
    return {
      // current block atom only to trigger a change when the block changes
      queryKey: [
        "userixSTRKcBalance",
        get(currentBlockAtom),
        get(userAddressAtom),
        get(providerAtom),
      ],

      queryFn: async ({ queryKey }: any) => {
        const [, , userAddress] = queryKey;
        const provider = get(providerAtom);

        if (!provider || !userAddress) {
          return MyNumber.fromZero();
        }

        try {
          const contract = new Contract(
            erc4626Abi,
            i_XSTRK_C_CONTRACT_ADDRESS,
            provider,
          );

          const balance = await contract.call("balance_of", [userAddress], {
            blockIdentifier: blockNumber ?? "latest",
          });
          return new MyNumber(balance.toString(), STRK_DECIMALS);
        } catch (error) {
          console.error("userixSTRKcBalance [3]", error);
          return 0;
        }
      },
    };
  }),
);

const userdxSTRKBalanceQueryAtom = atomFamily((blockNumber?: number) =>
  atomWithQuery((get) => {
    return {
      // current block atom only to trigger a change when the block changes
      queryKey: [
        "userdxSTRKBalance",
        get(currentBlockAtom),
        get(userAddressAtom),
        get(providerAtom),
      ],

      queryFn: async ({ queryKey }: any) => {
        const [, , userAddress] = queryKey;
        const provider = get(providerAtom);

        if (!provider || !userAddress) {
          return MyNumber.fromZero();
        }

        try {
          const contract = new Contract(
            erc4626Abi,
            D_XSTRK_CONTRACT_ADDRESS,
            provider,
          );

          const balance = await contract.call("balance_of", [userAddress], {
            blockIdentifier: blockNumber ?? "latest",
          });
          return new MyNumber(balance.toString(), STRK_DECIMALS);
        } catch (error) {
          console.error("userdxSTRKBalance [3]", error);
          return 0;
        }
      },
    };
  }),
);

const userLPTokenBalanceQueryAtom = atomFamily((blockNumber?: number) =>
  atomWithQuery((get) => {
    return {
      // current block atom only to trigger a change when the block changes
      queryKey: [
        "userLPTokenBalance",
        get(currentBlockAtom),
        get(userAddressAtom),
        get(providerAtom),
      ],

      queryFn: async ({ queryKey }: any) => {
        const [, , userAddress] = queryKey;
        const provider = get(providerAtom);

        if (!provider || !userAddress) {
          return MyNumber.fromZero();
        }

        try {
          const contract = new Contract(
            nostraLpAbi,
            LP_TOKEN_CONTRACT_ADDRESS,
            provider,
          );

          const balance = await contract.call("balance_of", [userAddress], {
            blockIdentifier: blockNumber ?? "latest",
          });
          const totalSupply = await contract.call("total_supply");
          const getReserves: any = await contract.call("get_reserves");

          const balanceStr = new MyNumber(
            balance.toString(),
            STRK_DECIMALS,
          ).toEtherStr();

          const totalSupplyStr = new MyNumber(
            totalSupply.toString(),
            STRK_DECIMALS,
          ).toEtherStr();

          const getReserves0Str = new MyNumber(
            getReserves[0].toString(),
            STRK_DECIMALS,
          ).toEtherStr();

          console.log(balanceStr, "balance_lptoken");
          console.log(totalSupplyStr, "totalSupply");
          console.log(getReserves0Str, "getReserves[0]");

          const lpTokenBalance =
            (Number(balanceStr) / Number(totalSupplyStr)) *
            Number(getReserves0Str);

          console.log(lpTokenBalance, "lpTokenBalance");

          return MyNumber.fromEther(lpTokenBalance.toFixed(8), STRK_DECIMALS);
        } catch (error) {
          console.error("userLPTokenBalance [3]", error);
          return MyNumber.fromZero();
        }
      },
    };
  }),
);

export const usernxSTRKBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(usernxSTRKBalanceQueryAtom(blockNumber));

    return {
      value: error || !data ? MyNumber.fromZero() : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const usernxSTRKcBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(usernxSTRKcBalanceQueryAtom(blockNumber));

    return {
      value: error || !data ? MyNumber.fromZero() : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userixSTRKBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userixSTRKBalanceQueryAtom(blockNumber));

    return {
      value: error || !data ? MyNumber.fromZero() : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userixSTRKcBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userixSTRKcBalanceQueryAtom(blockNumber));

    return {
      value: error || !data ? MyNumber.fromZero() : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userdxSTRKBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userdxSTRKBalanceQueryAtom(blockNumber));

    return {
      value: error || !data ? MyNumber.fromZero() : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userLPTokenBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userLPTokenBalanceQueryAtom(blockNumber));

    return {
      value: error || !data ? MyNumber.fromZero() : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userxSTRKNostraBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const nxSTRKBal = get(usernxSTRKBalance(blockNumber));
    const nxSTRKcBal = get(usernxSTRKcBalance(blockNumber));
    const ixSTRKBal = get(userixSTRKBalance(blockNumber));
    const ixSTRKcBal = get(userixSTRKcBalance(blockNumber));
    const dxSTRKBal = get(userdxSTRKBalance(blockNumber));
    const lpTokenBal = get(userLPTokenBalance(blockNumber));

    console.log(nxSTRKBal.value.toString(), "nxSTRKBal");
    console.log(nxSTRKcBal.value.toString(), "nxSTRKcBal");
    console.log(ixSTRKBal.value.toString(), "ixSTRKBal");
    console.log(ixSTRKcBal.value.toString(), "ixSTRKcBal");
    console.log(dxSTRKBal.value.toString(), "dxSTRKBal");
    console.log(lpTokenBal.value.toString(), "lpTokenBal");

    const totalBalance =
      Number(nxSTRKBal.value.toEtherToFixedDecimals(2)) +
      Number(nxSTRKcBal.value.toEtherToFixedDecimals(2)) +
      Number(ixSTRKBal.value.toEtherToFixedDecimals(2)) +
      Number(ixSTRKcBal.value.toEtherToFixedDecimals(2)) +
      // Number(dxSTRKBal.value.toEtherToFixedDecimals(2)) +
      Number(lpTokenBal.value.toEtherToFixedDecimals(2));

    return {
      value: totalBalance,
    };
  }),
);
