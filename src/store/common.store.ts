import { getAssetPrice } from "@/lib/utils";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { Provider } from "starknet";
import { LST_CONFIG } from "@/constants";

// TODO: remove if not needed
export const timePeriodAtom = atom<Provider | null>(null);

//DOUBT: why do we have this provider atom? can't we use getProvider() from constants/index.ts(currently)
//TODO: if we can use getProvider, replace that everywhere this atom has been used
export const providerAtom = atom<Provider | null>(null);

//DOUBT: which block will be fetched? can it be moved to specific store instead of common?
export const currentBlockAtom = atom(async (get) => {
  const provider = get(providerAtom);

  // plus 1 to represent pending block
  return provider ? await provider.getBlockNumber() : 0;
});

// TODO: move this to user.store.ts
export const userAddressAtom = atom<string | undefined>();

export const lstConfigAtom = atom<(typeof LST_CONFIG)[keyof typeof LST_CONFIG]>(
  LST_CONFIG.STRK,
);

export const assetPriceAtom = atomWithQuery((get) => {
  return {
    queryKey: ["assetPrice", get(lstConfigAtom)],
    queryFn: async ({ queryKey: _queryKey }: any): Promise<number> => {
      try {
        const lstConfig = get(lstConfigAtom);

        if (!lstConfig) return 0;

        const isSTRK = lstConfig.SYMBOL === "STRK";
        return await getAssetPrice(isSTRK);
      } catch (error) {
        console.error("AssetPriceAtom", error);
        return 0;
      }
    },
    refetchInterval: 60000,
    staleTime: 0,
  };
});

// TODO: remove if not needed
export const lastWalletAtom = createAtomWithStorage<null | string>(
  "ENDURFI_LAST_WALLET",
  null,
);

export function createAtomWithStorage<T>(
  key: string,
  defaultValue: T,
  getter?: (key: string, initialValue: T) => PromiseLike<T>,
) {
  const ISSERVER = typeof window === "undefined";
  let localStorage: any;

  let storageConfig = createJSONStorage<T>(() => {
    if (!ISSERVER) return localStorage;
    return null;
  });

  if (getter) {
    storageConfig = { ...storageConfig, getItem: getter };
  }

  return atomWithStorage<T>(key, defaultValue, storageConfig, {
    getOnInit: true,
  });
}
