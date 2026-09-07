import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import axios from "axios";
import { userAddressAtom } from "./common.store";

export const chartFilter = atom("7d");

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
    call: string | null;
    telegram: string | null;
  };
}

interface VIPStatusResponse {
  success: boolean;
  data: VIPStatus;
}

const isVIPQueryAtom = atomWithQuery((get) => {
  const address = get(userAddressAtom);

  return {
    queryKey: ["isVIP", address],
    queryFn: async (): Promise<VIPStatus | null> => {
      if (!address) return null;

      try {
        const res = await axios.get<VIPStatusResponse>(
          `/api/portfolio/isVIP/${address}`,
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

const VIP_DEFAULT = {
  isVIP: false,
  totalValueUSD: 0,
  breakdown: { nativeSTRK: 0, nativeBTC: 0, lstSTRK: 0, lstBTC: 0 },
  contacts: { call: null as string | null, telegram: null as string | null },
};

/** Mirrors starknet-vip.store.ts's normalization for comparing raw felts. */
function normalizeAddress(value: string): string | null {
  try {
    const big = BigInt(value);
    return `0x${big.toString(16).padStart(64, "0").toLowerCase()}`;
  } catch {
    return null;
  }
}

// TODO: remove — test wallet for QA while this address isn't yet flagged
// VIP by the real /api/portfolio/isVIP response.
const TEST_VIP_WALLET_ADDRESSES = [
  "0x005B03F9aC3fEf9fAb8985C1a8060a78d257D1266815841D7c2ceE52283B8a2b",
].map(normalizeAddress);

export const isVIPAtom = atom((get) => {
  const address = get(userAddressAtom);
  const { data, error, isPending } = get(isVIPQueryAtom);

  const isTestVipWallet =
    !!address &&
    TEST_VIP_WALLET_ADDRESSES.includes(normalizeAddress(address));

  if (isTestVipWallet) {
    return {
      isVIP: true,
      totalValueUSD: data?.totalValueUSD ?? VIP_DEFAULT.totalValueUSD,
      breakdown: data?.breakdown ?? VIP_DEFAULT.breakdown,
      contacts: {
        call:
          data?.contacts.call ??
          "https://cal.com/akira-unwrap-labs/elite-access-calendar",
        telegram: data?.contacts.telegram ?? "https://t.me/akirabuilds",
      },
      isLoading: false,
      error: null,
    };
  }

  if (isPending) {
    return { ...VIP_DEFAULT, isLoading: true, error: null };
  }

  if (error || !data) {
    return { ...VIP_DEFAULT, isLoading: false, error: error?.message || null };
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
