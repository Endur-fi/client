import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";

import { SHIELD_AND_STAKE_FEE_STRK_FALLBACK, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import PrivacyPoolService from "@/services/privacy-pool";

import { providerAtom } from "./common.store";

const privacyPoolService = new PrivacyPoolService();

/** The pool fee changes very rarely, so it is cached hard to spare RPC calls. */
const FEE_REFETCH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

// Deliberately not keyed on `currentBlockAtom`: a per-block key would refetch
// the fee on every new block. The provider alone is enough, and `staleTime`
// keeps mount/focus/reconnect from refetching within the window.
const shieldAndStakeFeeStrkQueryAtom = atomWithQuery((get) => ({
  queryKey: ["shieldAndStakeFeeStrk", get(providerAtom)],
  queryFn: () => privacyPoolService.getFeeAmount(),
  refetchInterval: FEE_REFETCH_INTERVAL,
  staleTime: FEE_REFETCH_INTERVAL,
  gcTime: FEE_REFETCH_INTERVAL,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
}));

/**
 * Shield & Stake fee from the privacy pool, always in STRK terms.
 * Falls back to the hardcoded fee while loading or once the query's retries
 * are exhausted, so callers never have to deal with a missing fee.
 */
export const shieldAndStakeFeeStrkAtom = atom((get) => {
  const { data, error } = get(shieldAndStakeFeeStrkQueryAtom);

  return error || !data
    ? MyNumber.fromEther(
        SHIELD_AND_STAKE_FEE_STRK_FALLBACK.toString(),
        STRK_DECIMALS,
      )
    : data;
});
