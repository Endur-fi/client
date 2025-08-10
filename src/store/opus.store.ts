import { BlockIdentifier, RpcProvider } from "starknet";
import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { atomFamily } from "jotai/utils";
import { atom } from "jotai";
import { holdingsService } from "@/services/holdings.service";

export const getOpusHoldings: DAppHoldingsFn = async (
  address: string,
  provider: RpcProvider,
  blockNumber?: BlockIdentifier,
) => {
  // Set provider for the holdings service
  holdingsService.setProvider(provider);
  
  try {
    const holdings = await holdingsService.getProtocolHoldings(address, 'opus', blockNumber as any);
    return {
      xSTRKAmount: holdings.xSTRKAmount,
      STRKAmount: holdings.STRKAmount,
    };
  } catch (error) {
    console.error('Error fetching Opus holdings via SDK:', error);
    return {
      xSTRKAmount: MyNumber.fromZero(),
      STRKAmount: MyNumber.fromZero(),
    };
  }
};

export const userOpusBalanceQueryAtom = getHoldingAtom(
  "userOpusBalance",
  getOpusHoldings,
);

export const userOpusBalanceAtom: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      const { data, error } = get(userOpusBalanceQueryAtom(blockNumber));

      const xSTRKAmount1 =
        data?.xSTRKAmount ?? new MyNumber("0", STRK_DECIMALS);

      return {
        data: {
          xSTRKAmount: xSTRKAmount1,
          STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
        },
        error,
        isLoading: !data && !error,
      };
    }),
);
