import axios from "axios";
import { Decimal } from "decimal.js-light";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { BlockIdentifier, Contract, RpcProvider } from "starknet";

import ekuboPositionAbi from "@/abi/ekubo.position.abi.json";
import { STRK_DECIMALS, STRK_TOKEN, xSTRK_TOKEN_MAINNET } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import { isContractNotDeployed } from "@/lib/utils";
import { gql } from "@apollo/client";
import apolloClient from "@/lib/apollo-client";

export const XSTRK_ADDRESS = xSTRK_TOKEN_MAINNET;
export const EKUBO_POSITION_ADDRESS =
  "0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067";
export const EKUBO_POSITION_DEPLOYMENT_BLOCK = 165388;

Decimal.set({ precision: 78 });

const EKUBO_API_QUERY = gql`query GetEkuboPositionsByUser($userAddress: String!, $showClosed: Boolean!, $toDateTime: DateTimeISO!) {
  getEkuboPositionsByUser(userAddress: $userAddress, showClosed: $showClosed, toDateTime: $toDateTime) {
    position_id
    timestamp
    lower_bound
    upper_bound
    pool_fee
    pool_tick_spacing
    extension
  }
}`;

export const getEkuboHoldings: DAppHoldingsFn = async (
  address: string,
  provider: RpcProvider,
  blockNumber?: BlockIdentifier,
) => {
  let xSTRKAmount = MyNumber.fromEther("0", 18);
  let STRKAmount = MyNumber.fromEther("0", 18);
  
  const blockInfo = await provider.getBlock(blockNumber ?? "latest");
  if (isContractNotDeployed(blockNumber, EKUBO_POSITION_DEPLOYMENT_BLOCK)) {
    return {
      xSTRKAmount,
      STRKAmount,
    };
  }

  const resp = await apolloClient.query({
    query: EKUBO_API_QUERY,
    variables: {
      userAddress: address.toLowerCase(),
      showClosed: false, // Fetch both open and closed positions
      toDateTime: new Date(blockInfo.timestamp * 1000).toISOString()
    },
  });
  const ekuboPositionsResp = resp;
  if (!ekuboPositionsResp || !ekuboPositionsResp.data || !ekuboPositionsResp.data.getEkuboPositionsByUser) {
    throw new Error("Failed to fetch Ekubo positions data");
  }
  const ekuboPositions: {
    position_id: string;
    timestamp: string;
    lower_bound: number;
    upper_bound: number;
    pool_fee: string;
    pool_tick_spacing: string;
    extension: string;
  }[] = ekuboPositionsResp.data.getEkuboPositionsByUser;


  const positionContract = new Contract(
    ekuboPositionAbi,
    EKUBO_POSITION_ADDRESS,
    provider,
  );

  for (let i = 0; i < ekuboPositions.length; i++) {
    const position = ekuboPositions[i];
    if (!position.position_id) continue;
    try {
      const poolKey = {
        token0: XSTRK_ADDRESS,
        token1: STRK_TOKEN,
        fee: position.pool_fee,
        tick_spacing: position.pool_tick_spacing,
        extension: position.extension,
      }
      const result: any = await positionContract.call(
        "get_token_info",
        [
          position.position_id,
          poolKey,
          {
            lower: {
              mag: Math.abs(position.lower_bound),
              sign: position.lower_bound < 0 ? 1 : 0,
            },
            upper: {
              mag: Math.abs(position.upper_bound),
              sign: position.upper_bound < 0 ? 1 : 0,
            },
          },
        ],
        {
          blockIdentifier: blockNumber ?? "pending",
        },
      );

      console.log(`Position ID: ${position.position_id}, Result:`, result, poolKey, blockNumber);

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
    } catch (error: any) {
      if (error.message.includes("NOT_INITIALIZED")) {
        // do nothing
        continue;
      }
      throw error;
    }
  }

  return {
    xSTRKAmount,
    STRKAmount,
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
