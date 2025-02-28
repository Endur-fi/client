import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { BlockIdentifier, Contract } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";

const VESU_XSTRK_ADDRESS =
  "0x037ff012710c5175004687bc4d9e4c6e86d6ce5ca6fb6afee72ea02b1208fdb7";

export const getVesuHoldings: DAppHoldingsFn = async (
  address: string,
  provider: any,
  blockNumber?: BlockIdentifier,
) => {
  const VESU_xSTRK = VESU_XSTRK_ADDRESS;
  const contract = new Contract(erc4626Abi, VESU_xSTRK, provider);
  const shares = await contract.call("balance_of", [address], {
    blockIdentifier: blockNumber ?? "pending",
  });

  const balance = await contract.call("convert_to_assets", [shares], {
    blockIdentifier: blockNumber ?? "pending",
  });

  return {
    xSTRKAmount: new MyNumber(balance.toString(), STRK_DECIMALS),
    STRKAmount: MyNumber.fromZero(),
  };
};

export const uservXSTRKBalanceQueryAtom = getHoldingAtom(
  "uservXSTRKBalance",
  getVesuHoldings,
);

export const uservXSTRKBalanceAtom: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      const { data, error } = get(uservXSTRKBalanceQueryAtom(blockNumber));
      return {
        data:
          error || !data
            ? {
                xSTRKAmount: MyNumber.fromZero(),
                STRKAmount: MyNumber.fromZero(),
              }
            : data,
        error,
        isLoading: !data && !error,
      };
    }),
);

// todo Add collateral
