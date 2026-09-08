import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import axios from "axios";
import { userAddressAtom } from "./common.store";

interface StarknetVipCtaLink {
  label: string;
  url: string;
}

interface StarknetVipCta {
  body: string;
  links: StarknetVipCtaLink[];
}

interface StarknetVipData {
  wallets: string[];
  cta: StarknetVipCta | null;
  updatedAt: string | null;
}

interface StarknetVipResponse {
  success: boolean;
  data: StarknetVipData;
}

const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes, matches the API route's revalidate window

/** Mirrors the route's normalization so the client-side membership check is a plain `Set.has()`. */
export function normalizeAddress(value: string): string | null {
  try {
    const big = BigInt(value);
    return `0x${big.toString(16).padStart(64, "0").toLowerCase()}`;
  } catch {
    return null;
  }
}

const starknetVipQueryAtom = atomWithQuery(() => ({
  queryKey: ["starknetVipWallets"],
  queryFn: async (): Promise<StarknetVipData> => {
    const res = await axios.get<StarknetVipResponse>("/api/vip/starknet");

    // eslint-disable-next-line no-console
    console.log("[starknet-vip] /api/vip/starknet response:", res.data);

    if (!res.data.success || !res.data.data) {
      throw new Error("Unexpected /api/vip/starknet response shape");
    }

    return res.data.data;
  },
  refetchInterval: REFETCH_INTERVAL_MS,
  staleTime: REFETCH_INTERVAL_MS,
  gcTime: 3 * REFETCH_INTERVAL_MS,
  // Let TanStack Query keep the last successful payload if a later
  // background refetch fails, instead of us discarding good data below.
  retry: 1,
}));

export const starknetVipAtom = atom((get) => {
  const { data, error, isPending } = get(starknetVipQueryAtom);

  if (!data) {
    return {
      wallets: new Set<string>(),
      cta: null as StarknetVipCta | null,
      isLoading: isPending,
      error: error?.message || null,
    };
  }

  return {
    wallets: new Set(data.wallets),
    cta: data.cta,
    isLoading: false,
    // Surfaced for visibility even when we still have (possibly stale) data.
    error: error?.message || null,
  };
});

export const isStarknetVipAtom = atom((get) => {
  const address = get(userAddressAtom);
  if (!address) return false;

  const { wallets } = get(starknetVipAtom);
  const normalized = normalizeAddress(address);
  if (!normalized) return false;

  return wallets.has(normalized);
});

export const starknetVipCtaAtom = atom((get) => get(starknetVipAtom).cta);

export const starknetVipPrimaryCtaLinkAtom = atom((get) => {
  const cta = get(starknetVipCtaAtom);
  if (!cta || cta.links.length === 0) return null;

  const joinLink = cta.links.find(
    (link) =>
      link.label.toLowerCase().includes("join") ||
      link.url.toLowerCase().includes("join"),
  );

  return joinLink ?? cta.links[0];
});

/** Controls the one-time-per-session Starknet VIP popup. */
export const starknetVipModalOpenAtom = atom(false);
