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
function normalizeAddress(value: string): string | null {
  try {
    const big = BigInt(value);
    return `0x${big.toString(16).padStart(64, "0").toLowerCase()}`;
  } catch {
    return null;
  }
}

// TODO: remove — test wallet for QA while this address isn't yet on the
// partner's real VIP list. Merged into whatever the live API returns; the
// CTA body/links always come from the real /api/vip/starknet response.
const TEST_WALLET_ADDRESSES = [
  "0x005B03F9aC3fEf9fAb8985C1a8060a78d257D1266815841D7c2ceE52283B8a2b",
];

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

  const testWallets = TEST_WALLET_ADDRESSES.map(normalizeAddress).filter(
    (w): w is string => w !== null,
  );

  if (!data) {
    return {
      wallets: new Set(testWallets),
      cta: null as StarknetVipCta | null,
      isLoading: isPending,
      error: error?.message || null,
    };
  }

  return {
    wallets: new Set([...data.wallets, ...testWallets]),
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

/**
 * The CTA link that points at the VIP signup, for surfaces that show a single
 * "join" action instead of the full link list. Falls back to the first link so
 * the action is never rendered without a destination. URLs are used exactly as
 * returned — the partner referral is already baked into them.
 */
export const starknetVipJoinLinkAtom = atom((get) => {
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
