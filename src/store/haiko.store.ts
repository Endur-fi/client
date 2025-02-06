import axios from "axios";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";

import { currentBlockAtom, userAddressAtom } from "./common.store";

const userHaikoBalanceQueryAtom = atomFamily((_blockNumber?: number) =>
  atomWithQuery((get) => {
    return {
      queryKey: [
        "userHaikoBalance",
        get(currentBlockAtom),
        get(userAddressAtom),
      ],
      queryFn: async ({ queryKey }: any) => {
        const [, , userAddress] = queryKey;

        if (!userAddress) return 0;

        let sum = 0;

        try {
          const res = await axios.get(
            `https://app.haiko.xyz/api/v1/positions?network=mainnet&isActive=true&user=${userAddress}`,
          );

          if (res?.data) {
            res.data?.map((position: any) => {
              if (position.market.baseSymbol === "xSTRK") {
                sum += position.baseAmount + position.baseFees;
              } else if (position.market.quoteSymbol === "xSTRK") {
                sum += position.quoteAmount + position.quoteFees;
              }
            });

            return sum;
          }
        } catch (error) {
          console.error("userHaikoBalanceAtom [3]", error);
          return 0;
        }
      },
    };
  }),
);

export const userHaikoBalanceAtom = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userHaikoBalanceQueryAtom(blockNumber));

    return {
      value: error || !data ? 0 : data,
      error,
      isLoading: !data && !error,
    };
  }),
);
