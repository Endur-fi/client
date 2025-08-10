import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import MyNumber from "@/lib/MyNumber";
import { holdingsService, type ProtocolHoldings } from "@/services/holdings.service";
import { providerAtom, userAddressAtom, currentBlockAtom } from "./common.store";

// Atom to get all protocol holdings for a user
export const allProtocolHoldingsQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: [
      "allProtocolHoldings",
      get(currentBlockAtom),
      get(userAddressAtom),
      get(providerAtom),
    ],
    queryFn: async ({ queryKey }: any): Promise<ProtocolHoldings> => {
      const [, , userAddress] = queryKey;
      const provider = get(providerAtom);
      
      if (!provider || !userAddress) {
        return {
          lst: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          ekubo: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          nostra: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          opus: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          strkfarm: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          vesu: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          total: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
        };
      }

      try {
        holdingsService.setProvider(provider);
        return await holdingsService.getAllProtocolHoldings(userAddress);
      } catch (error) {
        console.error("Error fetching all protocol holdings:", error);
        return {
          lst: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          ekubo: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          nostra: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          opus: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          strkfarm: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          vesu: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          total: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
        };
      }
    },
  };
});

// Atom to get all protocol holdings with loading and error states
export const allProtocolHoldingsAtom = atom((get) => {
  const { data, error, isLoading } = get(allProtocolHoldingsQueryAtom);

  return {
    data: data || {
      lst: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
      ekubo: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
      nostra: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
      opus: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
      strkfarm: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
      vesu: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
      total: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
    },
    error,
    isLoading,
  };
});

// Individual protocol atoms
export const lstHoldingsAtom = atom((get) => {
  const { data, error, isLoading } = get(allProtocolHoldingsAtom);
  return {
    data: data.lst,
    error,
    isLoading,
  };
});

export const ekuboHoldingsAtom = atom((get) => {
  const { data, error, isLoading } = get(allProtocolHoldingsAtom);
  return {
    data: data.ekubo,
    error,
    isLoading,
  };
});

export const nostraHoldingsAtom = atom((get) => {
  const { data, error, isLoading } = get(allProtocolHoldingsAtom);
  return {
    data: data.nostra,
    error,
    isLoading,
  };
});

export const opusHoldingsAtom = atom((get) => {
  const { data, error, isLoading } = get(allProtocolHoldingsAtom);
  return {
    data: data.opus,
    error,
    isLoading,
  };
});

export const strkfarmHoldingsAtom = atom((get) => {
  const { data, error, isLoading } = get(allProtocolHoldingsAtom);
  return {
    data: data.strkfarm,
    error,
    isLoading,
  };
});

export const vesuHoldingsAtom = atom((get) => {
  const { data, error, isLoading } = get(allProtocolHoldingsAtom);
  return {
    data: data.vesu,
    error,
    isLoading,
  };
});

export const totalHoldingsAtom = atom((get) => {
  const { data, error, isLoading } = get(allProtocolHoldingsAtom);
  return {
    data: data.total,
    error,
    isLoading,
  };
});

// Atom family for getting holdings by block number
export const allProtocolHoldingsByBlockAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      const provider = get(providerAtom);
      const userAddress = get(userAddressAtom);
      
      if (!provider || !userAddress) {
        return {
          data: {
            lst: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            ekubo: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            nostra: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            opus: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            strkfarm: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            vesu: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            total: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          },
          error: null,
          isLoading: false,
        };
      }

      try {
        holdingsService.setProvider(provider);
        const holdings = holdingsService.getAllProtocolHoldings(userAddress, blockNumber as any);
        return {
          data: holdings,
          error: null,
          isLoading: false,
        };
      } catch (error) {
        console.error("Error fetching all protocol holdings by block:", error);
        return {
          data: {
            lst: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            ekubo: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            nostra: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            opus: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            strkfarm: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            vesu: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
            total: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
          },
          error,
          isLoading: false,
        };
      }
    }),
); 