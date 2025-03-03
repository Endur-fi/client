"use server";

import { DuneClient } from "@duneanalytics/client-sdk";
import axios from "axios";

const dune = new DuneClient(process.env.DUNE_API_KEY!);

export const getAvgWaitTime = async () => {
  try {
    const query_result = await dune.getLatestResult({ queryId: 4345214 });
    return query_result.result?.rows[0]?.wait_time_hours as string;
  } catch (e) {
    console.warn("Failed to fetch avg wait time", e);
    return "4hr"; // something dummy for now. need to take this to backend route
  }
};

export const getHaikoxSTRKBalance = async (
  blockNumber: string,
  userAddress: string,
) => {
  if (!blockNumber || !userAddress) return 0;

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
    }

    return sum;
  } catch (error) {
    console.error("userHaikoBalanceAtom [3]", error);
    return 0;
  }
};
