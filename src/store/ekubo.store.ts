import axios from "axios";
import { Decimal } from "decimal.js-light";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { Contract } from "starknet";

import ekuboPositionAbi from "@/abi/ekubo.position.abi.json";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import {
  currentBlockAtom,
  providerAtom,
  userAddressAtom,
} from "./common.store";

export const XSTRK_ADDRESS =
  "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a";
const _EKUBO_CORE_ADDRESS =
  "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b";
export const EKUBO_POSITION_ADDRESS =
  "0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067";
const _EKUBO_CLASS_HASH_ADDRESS =
  "0x04a72e9e166f6c0e9d800af4dc40f6b6fb4404b735d3f528d9250808b2481995";

Decimal.set({ precision: 78 });

const userEkuboxSTRKPositionsQueryAtom = atomFamily((blockNumber?: number) =>
  atomWithQuery((get) => {
    return {
      // current block atom only to trigger a change when the block changes
      queryKey: [
        "userEkuboxSTRKPositionsQueryAtom",
        get(currentBlockAtom),
        get(userAddressAtom),
        get(providerAtom),
      ],
      queryFn: async ({ _queryKey }: any) => {
        const provider = get(providerAtom);
        const userAddress = get(userAddressAtom);

        let xSTRKAmount = MyNumber.fromZero();
        let STRKAmount = MyNumber.fromZero();

        if (!provider || !userAddress)
          return {
            xSTRKAmount: MyNumber.fromZero(),
            STRKAmount: MyNumber.fromZero(),
          };

        try {
          const res = await axios.get(
            `https://mainnet-api.ekubo.org/positions/${userAddress}`,
            // `https://mainnet-api.ekubo.org/positions/0x067138f4b11ac7757e39ee65814d7a714841586e2aa714ce4ececf38874af245`,
          );

          console.log("ekubo res", res);

          const positionContract = new Contract(
            ekuboPositionAbi,
            EKUBO_POSITION_ADDRESS,
            provider,
          );

          if (res?.data) {
            const filteredData = res?.data?.data?.filter(
              (position: any) =>
                position.pool_key.token0 === XSTRK_ADDRESS ||
                position.pool_key.token1 === XSTRK_ADDRESS,
            );

            if (filteredData) {
              for (let i = 0; i < filteredData.length; i++) {
                const position = filteredData[i];
                if (!position.id) continue;

                console.log(position, "position");
                const result: any = await positionContract.call(
                  "get_token_info",
                  [
                    position?.id,
                    position.pool_key,
                    {
                      lower: {
                        mag: Math.abs(position?.bounds?.lower),
                        sign: position?.bounds?.lower < 0 ? 1 : 0,
                      },
                      upper: {
                        mag: Math.abs(position?.bounds?.upper),
                        sign: position?.bounds?.upper < 0 ? 1 : 0,
                      },
                    },
                  ],
                  {
                    blockIdentifier: blockNumber ?? "latest",
                  },
                );

                console.log(result, "position responsee2");

                if (XSTRK_ADDRESS === position.pool_key.token0) {
                  xSTRKAmount = xSTRKAmount.operate(
                    "plus",
                    new MyNumber(
                      result.amount0.toString(),
                      STRK_DECIMALS,
                    ).toEtherToFixedDecimals(6),
                  );
                  xSTRKAmount = xSTRKAmount.operate(
                    "plus",
                    new MyNumber(
                      result.fees0.toString(),
                      STRK_DECIMALS,
                    ).toEtherToFixedDecimals(6),
                  );
                  STRKAmount = STRKAmount.operate(
                    "plus",
                    new MyNumber(
                      result.amount1.toString(),
                      STRK_DECIMALS,
                    ).toEtherToFixedDecimals(6),
                  );
                  STRKAmount = STRKAmount.operate(
                    "plus",
                    new MyNumber(
                      result.fees1.toString(),
                      STRK_DECIMALS,
                    ).toEtherToFixedDecimals(6),
                  );
                } else {
                  xSTRKAmount = xSTRKAmount.operate(
                    "plus",
                    new MyNumber(
                      result.amount1.toString(),
                      STRK_DECIMALS,
                    ).toEtherToFixedDecimals(6),
                  );
                  xSTRKAmount = xSTRKAmount.operate(
                    "plus",
                    new MyNumber(
                      result.fees1.toString(),
                      STRK_DECIMALS,
                    ).toEtherToFixedDecimals(6),
                  );
                  STRKAmount = STRKAmount.operate(
                    "plus",
                    new MyNumber(
                      result.amount0.toString(),
                      STRK_DECIMALS,
                    ).toEtherToFixedDecimals(6),
                  );
                  STRKAmount = STRKAmount.operate(
                    "plus",
                    new MyNumber(
                      result.fees0.toString(),
                      STRK_DECIMALS,
                    ).toEtherToFixedDecimals(6),
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error("userEkuboxSTRKPositionsQueryAtom [3]", error);
        }

        return {
          xSTRKAmount,
          STRKAmount,
        };
      },
    };
  }),
);

export const userEkuboxSTRKPositions = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userEkuboxSTRKPositionsQueryAtom(blockNumber));

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

const _getHistory = async (positionId: string) => {
  try {
    const res = await axios.get(
      `https://mainnet-api.ekubo.org/${positionId}/history`,
    );

    if (res?.data) {
      return res?.data?.events;
    }

    return [];
  } catch (error) {
    console.error("getHistory [3]", error);
    return [];
  }
};
