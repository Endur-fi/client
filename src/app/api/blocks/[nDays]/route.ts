import { getProvider } from "@/constants";
import {
  getExchangeRateGivenAssets,
  getTotalAssetsByBlock,
  getTotalSupplyByBlock,
} from "@/store/lst.store";
import { NextResponse } from "next/server";

export const revalidate = 60 * 60 * 6; // 6 hours

/**
 * Retrieves the lst exchange rate for a given block.
 *
 * @param block - The block number.
 * @returns The exchange rate.
 * @throws If the maximum number of tries is reached and an error is still thrown.
 */
const getExchangeRate = async (
  lstAddress: string,
  decimals: number,
  block: number,
) => {
  const MAX_TRIES = 5;
  let tries = 0;
  while (tries < MAX_TRIES) {
    try {
      const totalSupply = await getTotalSupplyByBlock(
        lstAddress,
        decimals,
        block,
      );
      const totalAssets = await getTotalAssetsByBlock(
        lstAddress,
        decimals,
        block,
      );
      const ex = getExchangeRateGivenAssets(totalAssets, totalSupply, decimals);
      return ex;
    } catch (err) {
      tries++;
      if (tries === MAX_TRIES) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * tries));
    }
  }
};

// TODO [BLOCK_ROUTE]: if this endpoint is used on server side only then convert this into function instead of route
export async function GET(req: Request, context: any) {
  const { params } = context;
  const { searchParams } = new URL(req.url);
  const nDays = Number(params.nDays);
  const lstAddress = searchParams.get("lstAddress");
  const decimalsStr = searchParams.get("decimals");

  if (!lstAddress) {
    return NextResponse.json(
      {
        error: "lstAddress parameter is required",
      },
      { status: 400 },
    );
  }

  if (!decimalsStr) {
    return NextResponse.json(
      {
        error: "decimals parameter is required",
      },
      { status: 400 },
    );
  }

  const decimals = Number(decimalsStr);
  if (isNaN(decimals)) {
    return NextResponse.json(
      {
        error: "decimals must be a valid number",
      },
      { status: 400 },
    );
  }

  // days is the time period of blocks we need
  // gapDays is the gap between each block in days (to avoid too much computation)
  const supportedDays = [
    {
      days: 7,
      gapDays: 1,
    },
    {
      days: 30,
      gapDays: 3,
    },
    {
      days: 90,
      gapDays: 7,
    },
    {
      days: 180,
      gapDays: 7,
    },
  ];

  const config = supportedDays.find((d) => d.days === nDays);

  if (isNaN(nDays) || !config) {
    return NextResponse.json({
      error: "Invalid nDays",
    });
  }

  // compute avg block time
  const provider = getProvider();
  const currentBlock = await provider.getBlock("latest");
  const currentBlockMinus1000 = await provider.getBlock(
    currentBlock.block_number - 1000,
  );

  const avgBlockTimeSeconds =
    (currentBlock.timestamp - currentBlockMinus1000.timestamp) / 1000;

  const promises: Promise<any>[] = [];

  // loop across each day we need block for
  const now = new Date(currentBlock.timestamp * 1000);
  const endTime = new Date(now.getTime() - nDays * 24 * 60 * 60 * 1000);
  while (now >= endTime) {
    now.setDate(now.getDate() - config.gapDays);
    const timestampSeconds = Math.floor(now.getTime() / 1000);
    promises.push(
      getBlockForTime(
        currentBlock.block_number,
        timestampSeconds,
        avgBlockTimeSeconds,
      ),
    );
  }

  const blocks = await Promise.all(promises);
  const allBlocks = [
    {
      block: currentBlock.block_number,
      timestamp: currentBlock.timestamp,
      date: new Date(currentBlock.timestamp * 1000).toISOString(),
    },
    ...blocks,
  ];
  const blocksWithExchangeRates = await Promise.all(
    allBlocks.map(async (block) => {
      return {
        ...block,
        exchangeRate: await getExchangeRate(lstAddress, decimals, block.block),
      };
    }),
  );

  const resp = NextResponse.json({
    blocks: blocksWithExchangeRates,
  });
  resp.headers.set(
    "Cache-Control",
    `s-maxage=${revalidate}, stale-while-revalidate=180`,
  );
  return resp;
}

/**
 * Retrieves the block information for a given timestamp based on the current block number and average block time.
 * Uses linear approximation to find the block number.
 * @param currentBlock - The current block number.
 * @param timestampSeconds - The timestamp in seconds for which to retrieve the block information.
 * @param avgBlockTimeSeconds - The average block time in seconds.
 * @returns An object containing the block number, timestamp, and date of the retrieved block.
 */
async function getBlockForTime(
  currentBlock: number,
  timestampSeconds: number,
  avgBlockTimeSeconds: number,
) {
  const provider = getProvider();

  const nowSeconds = Math.floor(Date.now() / 1000);
  const blockDiff = Math.floor(
    (nowSeconds - timestampSeconds) / avgBlockTimeSeconds,
  );

  const block = currentBlock - blockDiff;
  const blockInfo = await provider.getBlock(block);

  return {
    block,
    timestamp: blockInfo.timestamp,
    date: new Date(blockInfo.timestamp * 1000).toISOString(),
  };
}
