import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import { BlockIdentifier, Contract } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import vesuSingletonAbi from "@/abi/vesu.singleton.abi.json";
import {
  ETH_TOKEN,
  RUSDC,
  STRK_DECIMALS,
  STRK_TOKEN,
  USDC_TOKEN,
  USDT_TOKEN,
  WBTC_TOKEN,
  xSTRK_TOKEN_MAINNET,
} from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { holdingsService } from "@/services/holdings.service";
import { providerAtom, userAddressAtom } from "./common.store";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import { isContractNotDeployed } from "@/lib/utils";

export const getVesuHoldings: DAppHoldingsFn = async (
  address: string,
  provider: any,
  blockNumber?: BlockIdentifier,
) => {
  const balance = await holdingsService.getProtocolHoldings(address, 'vesu', blockNumber);
  return balance;
};

export const uservXSTRKBalanceQueryAtom = getHoldingAtom(
  "uservXSTRKBalance",
  getVesuHoldings,
);

export const uservXSTRKBalanceAtom: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) => 
    atom((get) => {
      const {data, isLoading, error} = get(uservXSTRKBalanceQueryAtom(blockNumber));
      return {
        data: data || {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
        error,
        isLoading,
      };
    }),
);
