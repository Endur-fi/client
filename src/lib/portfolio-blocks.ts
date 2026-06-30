import { getProvider } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import {
  getExchangeRateGivenAssets,
  getTotalAssetsByBlock,
  getTotalSupplyByBlock,
} from "@/store/lst.store";

export interface BlockInfo {
  block: number;
  timestamp: number;
  date: string;
  exchangeRate: {
    rate: number;
    preciseRate: MyNumber;
  };
}

const supportedDays = [
  { days: 7, gapDays: 1 },
  { days: 30, gapDays: 3 },
  { days: 90, gapDays: 7 },
  { days: 180, gapDays: 7 },
];

async function getExchangeRate(
  lstAddress: string,
  decimals: number,
  block: number,
) {
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
      return getExchangeRateGivenAssets(totalAssets, totalSupply, decimals);
    } catch (err) {
      tries++;
      if (tries === MAX_TRIES) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * tries));
    }
  }
  throw new Error("Failed to get exchange rate");
}

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

export async function getBlocksWithExchangeRatesForDays(
  nDays: number,
  lstAddress: string,
  decimals: number,
): Promise<{ blocks: BlockInfo[] } | { error: string }> {
  const config = supportedDays.find((d) => d.days === nDays);

  if (isNaN(nDays) || !config) {
    return { error: "Invalid nDays" };
  }

  const provider = getProvider();
  const currentBlock = await provider.getBlock("latest");
  const currentBlockMinus1000 = await provider.getBlock(
    currentBlock.block_number - 1000,
  );

  const avgBlockTimeSeconds =
    (currentBlock.timestamp - currentBlockMinus1000.timestamp) / 1000;

  const promises: Promise<{
    block: number;
    timestamp: number;
    date: string;
  }>[] = [];

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
    allBlocks.map(async (block) => ({
      ...block,
      exchangeRate: await getExchangeRate(lstAddress, decimals, block.block),
    })),
  );

  return { blocks: blocksWithExchangeRates };
}
