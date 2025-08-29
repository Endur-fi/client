import axios from "axios";
import { Decimal } from "decimal.js-light";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { BlockIdentifier, Contract } from "starknet";

import ekuboPositionAbi from "@/abi/ekubo.position.abi.json";
import { getProvider, STRK_DECIMALS, xSTRK_TOKEN_MAINNET } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import { isContractNotDeployed } from "@/lib/utils";

export const XSTRK_ADDRESS = xSTRK_TOKEN_MAINNET;
export const EKUBO_POSITION_ADDRESS =
  "0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067";
export const EKUBO_POSITION_DEPLOYMENT_BLOCK = 165388;

Decimal.set({ precision: 78 });

// function loadFromCache() {
//   if (typeof window !== "undefined") {
//     // If running in a browser, we cannot use fs
//     return {};
//   // eslint-disable-next-line
//   } else {
//     // eslint-disable-next-line
//     const fs = require("fs");
//     const { existsSync, readFileSync, writeFileSync } = fs;
//     if (!existsSync(`./ekubo_positions.json`)) {
//       return {};
//     }
//     return JSON.parse(readFileSync(`./ekubo_positions.json`, "utf8"));
//   }
//   // return {};
// }
// const ekuboPositionsCache: Record<string, any> = loadFromCache();

export const getEkuboHoldings: DAppHoldingsFn = async ({
  address,
  blockNumber,
}: {
  address: string;
  blockNumber?: BlockIdentifier;
}) => {
  let xSTRKAmount = MyNumber.fromEther("0", 18);
  let STRKAmount = MyNumber.fromEther("0", 18);

  // let res: any = ekuboPositionsCache[address];
  // if (!res) {
  const resp = await axios.get(
    `https://mainnet-api.ekubo.org/positions/${address}?showClosed=true`,
    {
      headers: {
        Host: "mainnet-api.ekubo.org",
      },
    },
    // `https://mainnet-api.ekubo.org/positions/0x067138f4b11ac7757e39ee65814d7a714841586e2aa714ce4ececf38874af245`,
  );
  // if (resp?.data) {
  const res = resp.data;
  //     ekuboPositionsCache[address] = res; // Cache the result
  //     if (typeof window === "undefined") {
  //       // If running in a Node.js environment, write to file
  //       // This is useful for caching in server-side environments
  //       // but should not be used in client-side code
  //       // eslint-disable-next-line
  //       const fs = require("fs");
  //       const { writeFileSync } = fs;
  //       writeFileSync(`./ekubo_positions.json`, JSON.stringify(ekuboPositionsCache, null, 2));
  //     }
  //   } else {
  //     throw new Error("Failed to fetch Ekubo positions data");
  //   }
  // }

  if (isContractNotDeployed(blockNumber, EKUBO_POSITION_DEPLOYMENT_BLOCK)) {
    return {
      lstAmount: xSTRKAmount,
      underlyingTokenAmount: STRKAmount,
    };
  }

  const positionContract = new Contract(
    ekuboPositionAbi,
    EKUBO_POSITION_ADDRESS,
    getProvider(),
  );

  if (res?.data) {
    const filteredData = res?.data?.filter(
      (position: any) =>
        position.pool_key.token0 === XSTRK_ADDRESS ||
        position.pool_key.token1 === XSTRK_ADDRESS,
    );

    if (filteredData) {
      for (let i = 0; i < filteredData.length; i++) {
        const position = filteredData[i];
        if (!position.id) continue;
        try {
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
              blockIdentifier: blockNumber ?? "pending",
            },
          );

          if (XSTRK_ADDRESS === position.pool_key.token0) {
            xSTRKAmount = xSTRKAmount.operate(
              "plus",
              new MyNumber(result.amount0.toString(), STRK_DECIMALS).toString(),
            );
            xSTRKAmount = xSTRKAmount.operate(
              "plus",
              new MyNumber(result.fees0.toString(), STRK_DECIMALS).toString(),
            );
            STRKAmount = STRKAmount.operate(
              "plus",
              new MyNumber(result.amount1.toString(), STRK_DECIMALS).toString(),
            );
            STRKAmount = STRKAmount.operate(
              "plus",
              new MyNumber(result.fees1.toString(), STRK_DECIMALS).toString(),
            );
          } else {
            xSTRKAmount = xSTRKAmount.operate(
              "plus",
              new MyNumber(result.amount1.toString(), STRK_DECIMALS).toString(),
            );
            xSTRKAmount = xSTRKAmount.operate(
              "plus",
              new MyNumber(result.fees1.toString(), STRK_DECIMALS).toString(),
            );
            STRKAmount = STRKAmount.operate(
              "plus",
              new MyNumber(result.amount0.toString(), STRK_DECIMALS).toString(),
            );
            STRKAmount = STRKAmount.operate(
              "plus",
              new MyNumber(result.fees0.toString(), STRK_DECIMALS).toString(),
            );
          }
        } catch (error: any) {
          if (error.message.includes("NOT_INITIALIZED")) {
            // do nothing
            continue;
          }
          throw error;
        }
      }
    }
  }

  return {
    lstAmount: xSTRKAmount,
    underlyingTokenAmount: STRKAmount,
  };
};

const userEkuboxSTRKPositionsQueryAtom = getHoldingAtom(
  "userEkuboxSTRKPositionsQueryAtom",
  getEkuboHoldings,
);

export const userEkuboxSTRKPositions: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      const { data, error } = get(
        userEkuboxSTRKPositionsQueryAtom(blockNumber),
      );

      return {
        data:
          error || !data
            ? {
                lstAmount: MyNumber.fromZero(),
                underlyingTokenAmount: MyNumber.fromZero(),
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
