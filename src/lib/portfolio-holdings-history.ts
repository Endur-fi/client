import type { BlockInfo } from "@/lib/portfolio-blocks";
import MyNumber from "@/lib/MyNumber";
import { DAppHoldings } from "@/store/defi.store";
import { getHoldings } from "@/store/lst.store";
import { getEkuboHoldings } from "@/store/ekubo.store";
import { getOpusHoldings } from "@/store/opus.store";
import {
  getNostraDexHoldings,
  getNostraHoldingsByToken,
  i_XSTRK_C_CONTRACT_ADDRESS,
  i_XSTRK_CONTRACT_ADDRESS,
  N_XSTRK_C_CONTRACT_ADDRESS,
  N_XSTRK_CONTRACT_ADDRESS,
} from "@/store/nostra.store";
import {
  getEkuboXSTRKSTRKHoldings,
  getXSTRKSenseiHoldings,
} from "@/store/strkfarm.store";
import {
  getVesuHoldings,
  getVesuxSTRKCollateralWrapper,
} from "@/store/vesu.store";
import {
  buildPortfolioDataForLst,
  getLstConfigBySymbol,
  getTrovesHyperHoldings,
  type LstConfigWithAddresses,
} from "@/lib/portfolio-rpc";
import { ASSET_SYMBOL_TO_LST_TOKEN } from "@/lib/portfolio-types";
import { STRK_DECIMALS } from "@/constants";

export interface HistoricalHoldingsSeries {
  wallet: DAppHoldings[];
  vesu: DAppHoldings[];
  ekubo: DAppHoldings[];
  nostraLending: DAppHoldings[];
  nostraDex: DAppHoldings[];
  strkfarm: DAppHoldings[];
  strkfarmEkubo: DAppHoldings[];
  trovesHyper: DAppHoldings[];
  opus: DAppHoldings[];
}

function isTransientRpcError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Unexpected end of JSON input") ||
    error.message.includes("fetch failed") ||
    error.message.includes("ECONNRESET")
  );
}

async function retry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  args: Parameters<T>,
  retries: number = 5,
  delay: number = 1500,
): Promise<ReturnType<T>> {
  let attempts = 0;
  while (attempts < retries) {
    try {
      return (await fn(...args)) as ReturnType<T>;
    } catch (error) {
      attempts++;
      if (attempts >= retries) throw error;
      const backoff = isTransientRpcError(error) ? delay * attempts : delay;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw new Error("Function failed after max retries");
}

let historicalHoldingsQueue: Promise<void> = Promise.resolve();

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (true) {
      const idx = nextIndex++;
      if (idx >= items.length) return;
      results[idx] = await mapper(items[idx]!, idx);
    }
  });

  await Promise.all(workers);
  return results;
}

function portfolioBalanceToHoldings(
  balance: string,
  decimals: number,
): DAppHoldings {
  return {
    lstAmount: new MyNumber(balance, decimals),
    underlyingTokenAmount: MyNumber.fromZero(decimals),
  };
}

async function getWalletSeries(
  address: string,
  lstConfig: LstConfigWithAddresses,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return Promise.all(
    blocks.map((block) =>
      retry(getHoldings, [
        {
          address,
          lstAddress: lstConfig.LST_ADDRESS,
          decimals: lstConfig.DECIMALS,
          blockNumber: block.block,
        },
      ]),
    ),
  );
}

async function getTrovesHyperSeries(
  address: string,
  lstConfig: LstConfigWithAddresses,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  if (!lstConfig.TROVES_HYPER_VAULT_ADDRESS) {
    return blocks.map(() => ({
      lstAmount: MyNumber.fromZero(lstConfig.DECIMALS),
      underlyingTokenAmount: MyNumber.fromZero(lstConfig.DECIMALS),
    }));
  }
  return Promise.all(
    blocks.map((block) =>
      retry(getTrovesHyperHoldings, [
        address,
        lstConfig.TROVES_HYPER_VAULT_ADDRESS!,
        lstConfig.DECIMALS,
        block.block,
      ]),
    ),
  );
}

async function getEkuboSeries(
  address: string,
  lstConfig: LstConfigWithAddresses,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return Promise.all(
    blocks.map((block) =>
      retry(getEkuboHoldings, [
        {
          address,
          blockNumber: block.block,
          lstAddress: lstConfig.LST_ADDRESS,
        },
      ]),
    ),
  );
}

async function getStrkProtocolSeries(
  address: string,
  blocks: BlockInfo[],
): Promise<
  Pick<
    HistoricalHoldingsSeries,
    "vesu" | "nostraLending" | "nostraDex" | "strkfarm" | "strkfarmEkubo" | "opus"
  >
> {
  // This endpoint fans out into many RPC calls; limit concurrency to avoid
  // intermittent truncated JSON responses ("Unexpected end of JSON input").
  const concurrency = blocks.length >= 20 ? 1 : 3;

  const vesu = await mapWithConcurrency(blocks, concurrency, async (block) => {
    const justSupply = await retry(getVesuHoldings, [
      { address, blockNumber: block.block },
    ]);
    const collateral = await retry(getVesuxSTRKCollateralWrapper(), [
      { address, blockNumber: block.block },
    ]);
    return {
      lstAmount: justSupply.lstAmount.operate(
        "plus",
        collateral.lstAmount.toString(),
      ),
      underlyingTokenAmount: justSupply.underlyingTokenAmount.operate(
        "plus",
        collateral.underlyingTokenAmount.toString(),
      ),
    };
  });

  const nostraTokens = [
    N_XSTRK_CONTRACT_ADDRESS,
    N_XSTRK_C_CONTRACT_ADDRESS,
    i_XSTRK_CONTRACT_ADDRESS,
    i_XSTRK_C_CONTRACT_ADDRESS,
  ];

  const nostraLending = await mapWithConcurrency(
    blocks,
    concurrency,
    async (block) => {
      const holdings = await Promise.all(
        nostraTokens.map((token) =>
          retry(getNostraHoldingsByToken, [address, token, block.block]),
        ),
      );
      return {
        lstAmount: holdings.reduce(
          (acc, cur) => acc.operate("plus", cur.toString()),
          MyNumber.fromZero(STRK_DECIMALS),
        ),
        underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
      };
    },
  );

  const nostraDex = await mapWithConcurrency(blocks, concurrency, (block) =>
    retry(getNostraDexHoldings, [{ address, blockNumber: block.block }]),
  );

  const strkfarm = await mapWithConcurrency(blocks, concurrency, (block) =>
    retry(getXSTRKSenseiHoldings, [{ address, blockNumber: block.block }]),
  );

  const strkfarmEkubo = await mapWithConcurrency(blocks, concurrency, (block) =>
    retry(getEkuboXSTRKSTRKHoldings, [{ address, blockNumber: block.block }]),
  );

  const opus = await mapWithConcurrency(blocks, concurrency, (block) =>
    retry(getOpusHoldings, [{ address, blockNumber: block.block }]),
  );

  return {
    vesu,
    nostraLending,
    nostraDex,
    strkfarm,
    strkfarmEkubo,
    opus,
  };
}

async function getBtcIndexedSeries(
  address: string,
  lstConfig: LstConfigWithAddresses,
  blocks: BlockInfo[],
): Promise<
  Pick<
    HistoricalHoldingsSeries,
    "vesu" | "nostraLending" | "nostraDex" | "strkfarm" | "strkfarmEkubo" | "opus"
  >
> {
  const lstToken =
    ASSET_SYMBOL_TO_LST_TOKEN[lstConfig.SYMBOL] ?? lstConfig.LST_SYMBOL;
  const decimals = lstConfig.DECIMALS;
  const zero = () => ({
    lstAmount: MyNumber.fromZero(decimals),
    underlyingTokenAmount: MyNumber.fromZero(decimals),
  });

  const results = await Promise.all(
    blocks.map(async () => {
      try {
        const data = await buildPortfolioDataForLst(address, lstConfig);
        return data;
      } catch {
        return null;
      }
    }),
  );

  return {
    vesu: results.map((d) =>
      d
        ? portfolioBalanceToHoldings(
            (
              BigInt(d.vesuVtoken.balance) + BigInt(d.vesuCollateral.balance)
            ).toString(),
            decimals,
          )
        : zero(),
    ),
    nostraLending: results.map((d) =>
      d ? portfolioBalanceToHoldings(d.nostra.balance, decimals) : zero(),
    ),
    nostraDex: blocks.map(() => zero()),
    strkfarm: results.map((d) =>
      d ? portfolioBalanceToHoldings(d.trovesSensei.balance, decimals) : zero(),
    ),
    strkfarmEkubo: results.map((d) =>
      d ? portfolioBalanceToHoldings(d.trovesEkubo.balance, decimals) : zero(),
    ),
    opus: results.map((d) =>
      d ? portfolioBalanceToHoldings(d.opus.balance, decimals) : zero(),
    ),
  };
}

async function fetchHistoricalHoldingsForAssetInner(
  address: string,
  assetSymbol: string,
  blocks: BlockInfo[],
): Promise<HistoricalHoldingsSeries> {
  const lstConfig = getLstConfigBySymbol(assetSymbol);
  if (!lstConfig) {
    throw new Error(`Unknown lst asset: ${assetSymbol}`);
  }

  const [wallet, trovesHyper, ekubo] = await Promise.all([
    getWalletSeries(address, lstConfig, blocks),
    getTrovesHyperSeries(address, lstConfig, blocks),
    getEkuboSeries(address, lstConfig, blocks),
  ]);

  if (assetSymbol === "STRK") {
    const strk = await getStrkProtocolSeries(address, blocks);
    return {
      wallet,
      trovesHyper,
      ekubo,
      ...strk,
    };
  }

  const indexed = await getBtcIndexedSeries(address, lstConfig, blocks);
  return {
    wallet,
    trovesHyper,
    ekubo,
    ...indexed,
  };
}

export async function fetchHistoricalHoldingsForAsset(
  address: string,
  assetSymbol: string,
  blocks: BlockInfo[],
): Promise<HistoricalHoldingsSeries> {
  const run = () =>
    fetchHistoricalHoldingsForAssetInner(address, assetSymbol, blocks);
  const result = historicalHoldingsQueue.then(run, run);
  historicalHoldingsQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/** xSTRK helpers for block-holdings API (legacy imports) */
export async function getAllVesuHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return (await getStrkProtocolSeries(address, blocks)).vesu;
}

export async function getAllEkuboHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return getEkuboSeries(address, getLstConfigBySymbol("STRK")!, blocks);
}

export async function getNostraLendingHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return (await getStrkProtocolSeries(address, blocks)).nostraLending;
}

export async function getNostraDEXHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return (await getStrkProtocolSeries(address, blocks)).nostraDex;
}

export async function getAllXSTRKSenseiHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return (await getStrkProtocolSeries(address, blocks)).strkfarm;
}

export async function getAllEkuboXSTRKSTRKHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return (await getStrkProtocolSeries(address, blocks)).strkfarmEkubo;
}

export async function getAllOpusHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  return (await getStrkProtocolSeries(address, blocks)).opus;
}

export async function getAllXSTRKHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  const strk = getLstConfigBySymbol("STRK")!;
  return getWalletSeries(address, strk, blocks);
}

export { retry };
