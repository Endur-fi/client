import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import axios from "axios";
import { userAddressAtom } from "./common.store";

export const chartFilter = atom("7d");

interface VIPStatusResponse {
  success: boolean;
  data: {
    isVIP: boolean;
    totalValueUSD: number;
    breakdown: {
      nativeSTRK: number;
      nativeBTC: number;
      lstSTRK: number;
      lstBTC: number;
    };
    contacts: {
      phone: string | null;
      telegram: string | null;
    };
  };
}

interface VIPStatus {
  isVIP: boolean;
  totalValueUSD: number;
  breakdown: {
    nativeSTRK: number;
    nativeBTC: number;
    lstSTRK: number;
    lstBTC: number;
  };
  contacts: {
    phone: string | null;
    telegram: string | null;
  };
}

const isVIPQueryAtom = atomWithQuery((get) => {
  const address = get(userAddressAtom);

  return {
    queryKey: ["isVIP", address],
    queryFn: async (): Promise<VIPStatus | null> => {
      if (!address) return null;

      try {
        const res = await axios.get<VIPStatusResponse>(
          `/api/portfolio/isVIP/0x053c99890b560cf41fb4c34b5d45abc918f85782d43c3f5d46ed845c67df350d`
        );

        if (res.data.success && res.data.data) {
          return res.data.data;
        }

        return null;
      } catch (error) {
        console.error("Error fetching VIP status:", error);
        return null;
      }
    },
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes - matches cache TTL
    gcTime: 5 * 60 * 1000, // 5 minutes
  };
});

export const isVIPAtom = atom((get) => {
  const { data, error } = get(isVIPQueryAtom);

  if (error || !data) {
    return {
      isVIP: false,
      totalValueUSD: 0,
      breakdown: {
        nativeSTRK: 0,
        nativeBTC: 0,
        lstSTRK: 0,
        lstBTC: 0,
      },
      contacts: {
        phone: null,
        telegram: null,
      },
      isLoading: false,
      error: error?.message || null,
    };
  }

  return {
    isVIP: data.isVIP,
    totalValueUSD: data.totalValueUSD,
    breakdown: data.breakdown,
    contacts: data.contacts,
    isLoading: false,
    error: null,
  };
});
