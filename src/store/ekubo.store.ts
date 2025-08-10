import axios from "axios";
import { Decimal } from "decimal.js-light";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { BlockIdentifier, RpcProvider } from "starknet";

import { xSTRK_TOKEN_MAINNET } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { holdingsService } from "@/services/holdings.service";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";

export const XSTRK_ADDRESS = xSTRK_TOKEN_MAINNET;
export const EKUBO_POSITION_ADDRESS =
  "0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067";
export const EKUBO_POSITION_DEPLOYMENT_BLOCK = 165388;

Decimal.set({ precision: 78 });

export const getEkuboHoldings: DAppHoldingsFn = async (
  address: string,
  provider: RpcProvider,
  blockNumber?: BlockIdentifier,
) => {
  // Set provider for the holdings service
  holdingsService.setProvider(provider);
  
  try {
    const holdings = await holdingsService.getProtocolHoldings(address, 'ekubo', blockNumber as any);
    return {
      xSTRKAmount: holdings.xSTRKAmount,
      STRKAmount: holdings.STRKAmount,
    };
  } catch (error) {
    console.error('Error fetching Ekubo holdings via SDK:', error);
    return {
      xSTRKAmount: MyNumber.fromZero(),
      STRKAmount: MyNumber.fromZero(),
    };
  }
};

const userEkuboxSTRKPositionsQueryAtom = getHoldingAtom(
  "userEkuboxSTRKPositionsQueryAtom",
  getEkuboHoldings,
);

export const userEkuboxSTRKPositions: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      const { data, error } = get(
        userEkuboxSTRKPositionsQueryAtom(blockNumber),
      );

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
