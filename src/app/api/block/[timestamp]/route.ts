import { BLOCK_NUMBER_24_NOV_2024, getProvider } from "@/constants";

import { NextResponse } from "next/server";

export const revalidate = 60 * 60 * 6; // 6 hours

const timestampBlockCache: Record<number, number> = {};

export async function GET(_req: Request, context: any) {
  const { params } = context;

  const timestamp = Number(params.timestamp);

  if (isNaN(timestamp) || !timestamp) {
    return NextResponse.json({
      error: "Invalid timestamp",
    });
  }

  if (timestampBlockCache[timestamp]) {
    console.log(
      `using cache for ${timestamp} => ${timestampBlockCache[timestamp]}`,
    );
    return NextResponse.json({
      block: timestampBlockCache[timestamp],
    });
  }

  const block = await getBlockNumberForTimestamp(timestamp);
  timestampBlockCache[timestamp] = block;

  return NextResponse.json({
    block,
  });
}

async function getBlockNumberForTimestamp(
  timestampSeconds: number,
): Promise<number> {
  const provider = getProvider();

  // Get the latest block to determine the upper bound of the search
  const latestBlock = await provider.getBlock("latest");
  const latestBlockTimestamp = latestBlock.timestamp;

  // Check if the timestamp is in the future
  console.log(
    `latestBlockTimestamp: ${latestBlockTimestamp}, timestampSeconds: ${timestampSeconds}, block: ${latestBlock.block_number}`,
  );
  if (timestampSeconds > latestBlockTimestamp) {
    throw new Error(
      "Timestamp is in the future. No blocks exist for this timestamp.",
    );
  }

  // Get the genesis block to determine the lower bound of the search
  const genesisBlock = await provider.getBlock(BLOCK_NUMBER_24_NOV_2024);
  const genesisBlockTimestamp = genesisBlock.timestamp;

  // Check if the timestamp is before the genesis block
  if (timestampSeconds < genesisBlockTimestamp) {
    throw new Error(
      "Timestamp is before the genesis block. No blocks exist for this timestamp.",
    );
  }

  // Binary search to find the block closest to the specified timestamp
  let low = 0;
  let high = latestBlock.block_number;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midBlock = await provider.getBlock(mid);
    const midBlockTimestamp = midBlock.timestamp;

    if (midBlockTimestamp === timestampSeconds) {
      // Exact match found
      return mid;
    } else if (midBlockTimestamp < timestampSeconds) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // If no exact match is found, return the closest block
  const lowBlock = await provider.getBlock(low);
  const highBlock = await provider.getBlock(high);

  // Determine which block is closer to the target timestamp
  const lowDiff = Math.abs(lowBlock.timestamp - timestampSeconds);
  const highDiff = Math.abs(highBlock.timestamp - timestampSeconds);

  return lowDiff < highDiff ? low : high;
}
