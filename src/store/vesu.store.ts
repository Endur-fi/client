import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { Contract } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import {
  currentBlockAtom,
  providerAtom,
  userAddressAtom,
} from "./common.store";

const uservXSTRKBalanceQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: [
      "uservXSTRKBalance",
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
        const VESU_xSTRK = "0x037ff012710c5175004687bc4d9e4c6e86d6ce5ca6fb6afee72ea02b1208fdb7";
        const contract = new Contract(
          erc4626Abi,
          VESU_xSTRK,
          provider,
        );
        const shares = await contract.call("balance_of", [userAddress]);
        const balance = await contract.call("convert_to_assets", [shares]);
        console.log(balance, "balance");
        return new MyNumber(balance.toString(), STRK_DECIMALS);
      } catch (error) {
        console.error("userXSTRKBalanceAtom [3]", error);
        return MyNumber.fromZero();
      }
    },
  };
});

export const uservXSTRKBalanceAtom = atom((get) => {
  const { data, error } = get(uservXSTRKBalanceQueryAtom);

  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});
