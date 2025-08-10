import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { BlockIdentifier, Contract, RpcProvider } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { holdingsService } from "@/services/holdings.service";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import { isContractNotDeployed } from "@/lib/utils";

const nostraLendingAtom: DAppHoldingsFn = async (
  address: string,
  provider: any,
  blockNumber?: BlockIdentifier,
) => {
  const holdingsLending = await holdingsService.getProtocolHoldings(address, 'nostraLending', blockNumber);
  return holdingsLending;
};

const nostraDexAtom: DAppHoldingsFn = async (
  address: string,
  provider: any,
  blockNumber?: BlockIdentifier,
) => {
  const holdingsDex = await holdingsService.getProtocolHoldings(address, 'nostraDex', blockNumber);
  return holdingsDex;
};

const userxSTRKNostraLendingQueryAtom = getHoldingAtom(
  "userxSTRKNostraLending",
  nostraLendingAtom,
);

const userxSTRKNostraDexQueryAtom = getHoldingAtom(
  "userxSTRKNostraDex",
  nostraDexAtom,
);

export const userxSTRKNostraBalance: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      const data = {
        xSTRKAmount: MyNumber.fromEther("0", 18),
        STRKAmount: MyNumber.fromEther("0", 18),
      };

      const {data: holdingsLending, isLoading: isLoading1, error: error1} = get(userxSTRKNostraLendingQueryAtom(blockNumber));
      if (holdingsLending) {
        data.xSTRKAmount = data.xSTRKAmount.operate("plus", holdingsLending.xSTRKAmount.toString());
        data.STRKAmount = data.STRKAmount.operate("plus", holdingsLending.STRKAmount.toString());
      }

      const {data: holdingsDex, isLoading: isLoading2, error: error2} = get(userxSTRKNostraDexQueryAtom(blockNumber));
      if (holdingsDex) {
        data.xSTRKAmount = data.xSTRKAmount.operate("plus", holdingsDex.xSTRKAmount.toString());
        data.STRKAmount = data.STRKAmount.operate("plus", holdingsDex.STRKAmount.toString());
      }

      return {
        data,
        error: error1 || error2,
        isLoading: isLoading1 || isLoading2,
      };
    }),
);
