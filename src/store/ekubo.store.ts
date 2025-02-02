import axios from "axios";
import { Decimal } from "decimal.js-light";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { Contract } from "starknet";

import ekuboAbi from "@/abi/ekubo.abi.json";
import ekuboClassHashAbi from "@/abi/ekubo.class.hash.abi.json";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import {
  currentBlockAtom,
  providerAtom,
  userAddressAtom,
} from "./common.store";

const XSTRK_ADDRESS =
  "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a";
const EKUBO_ADDRESS =
  "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b";
const EKUBO_CLASS_HASH_ADDRESS =
  "0x037d63129281c4c42cba74218c809ffc9e6f87ca74e0bdabb757a7f236ca59c3";

Decimal.set({ precision: 78 });

const userEkuboxSTRKPositionsQueryAtom = atomWithQuery((get) => {
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

      if (!provider || !userAddress) return [];

      try {
        const res = await axios.get(
          //   `https://mainnet-api.ekubo.org/positions/${userAddress}`,
          `https://mainnet-api.ekubo.org/positions/0x067138f4b11ac7757e39ee65814d7a714841586e2aa714ce4ececf38874af245`,
        );

        const contract = new Contract(ekuboAbi, EKUBO_ADDRESS, provider);
        const ekuboClassHashContract = new Contract(
          ekuboClassHashAbi,
          EKUBO_CLASS_HASH_ADDRESS,
          provider,
        );

        if (res?.data) {
          const filteredData = res?.data?.data?.filter(
            (position: any) =>
              position.pool_key.token0 === XSTRK_ADDRESS ||
              position.pool_key.token1 === XSTRK_ADDRESS,
          );

          const liquidityDeltaSum = MyNumber.fromZero();

          if (filteredData) {
            filteredData?.map(async (position: any) => {
              const history: any = await getHistory(position?.id);

              if (history) {
                history.forEach((event: any) => {
                  liquidityDeltaSum.operate("plus", event?.liquidity_delta);
                });
              }

              const result: any = await contract.call("get_pool_price", [
                position.pool_key,
              ]);

              if (result?.sqrt_ratio) {
                const sqrtRatio = new MyNumber(
                  result.sqrt_ratio.toString(),
                  STRK_DECIMALS,
                );

                const sqrtRatioLower = new Decimal("1.000001")
                  .sqrt()
                  .pow(position?.bounds?.lower)
                  .mul(new Decimal(2).pow(128));

                const sqrtRatioUpper = new Decimal("1.000001")
                  .sqrt()
                  .pow(position?.bounds?.upper)
                  .mul(new Decimal(2).pow(128));

                if (
                  sqrtRatio &&
                  liquidityDeltaSum &&
                  sqrtRatioLower &&
                  sqrtRatioUpper
                ) {
                  console.log(
                    sqrtRatio.toString(),
                    liquidityDeltaSum.toString(),
                    sqrtRatioLower.toString(),
                    sqrtRatioUpper.toString(),
                    "responsee",
                  );

                  const res = await ekuboClassHashContract.call(
                    "liquidity_delta_to_amount_delta",
                    [
                      sqrtRatio,
                      liquidityDeltaSum,
                      true,
                      //   new MyNumber("6385123148896956783376", STRK_DECIMALS),
                      sqrtRatioLower,
                      sqrtRatioUpper,
                    ],
                  );

                  console.log(res, "responsee");

                  if (res) return new MyNumber(res.toString(), STRK_DECIMALS);

                  return MyNumber.fromZero();
                }
              }
            });
          }
        }
      } catch (error) {
        console.error("userEkuboxSTRKPositionsQueryAtom [3]", error);
        return [];
      }
    },
  };
});

export const userEkuboxSTRKPositions = atom((get) => {
  const { data, error } = get(userEkuboxSTRKPositionsQueryAtom);

  return {
    data: error || !data ? [] : data,
    error,
    isLoading: !data && !error,
  };
});

const getHistory = async (positionId: string) => {
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
