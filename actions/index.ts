"use server";

import { DuneClient } from "@duneanalytics/client-sdk";

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
