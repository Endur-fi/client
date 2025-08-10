import { getProvider } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { holdingsService, HoldingsService } from "@/services/holdings.service";
import { DAppHoldings } from "@/store/defi.store";


import axios from "axios";
import { NextResponse } from "next/server";

export const revalidate = 3600 * 6;

export interface BlockInfo {
  block: number;
  timestamp: number;
  date: string;
  exchangeRate: {
    rate: number;
    preciseRate: MyNumber;
  };
}

export async function GET(_req: Request, context: any) {
  const { params } = context;
  const addr = params.address;
  const nDays = Number(params.nDays);

  // get blocks to use for the chart
  const host = process.env.HOSTNAME ?? "http://localhost:3000";
  if (!host) {
    return NextResponse.json({
      error: "Invalid host",
    });
  }
  try {
    const result = await axios.get(`${host}/api/blocks/${nDays}`);
    if (!result?.data) {
      return NextResponse.json({
        error: "Invalid blocks",
      });
    }
    const blocks: BlockInfo[] = result.data.blocks;

    //
    // Compute the holdings for each dapp
    //
    // ? ADD_NEW_PROTOCOL Modify this to add
    // new dapp holdings
    const vesuHoldingsProm = getAllVesuHoldings(addr, blocks);
    const ekuboHoldingsProm = getAllEkuboHoldings(addr, blocks);
    const nostraLendingHoldingsProm = getNostraLendingHoldings(addr, blocks);
    const nostraDexHoldingsProm = getNostraDEXHoldings(addr, blocks);
    const xstrkHoldingsProm = getAllXSTRKHoldings(addr, blocks);
    const strkfarmHoldingsProm = getAllXSTRKSenseiHoldings(addr, blocks);
    const strkfarmEkuboHoldingsProm = getAllEkuboXSTRKSTRKHoldings(
      addr,
      blocks,
    );
    const opusHoldingsProm = getAllOpusHoldings(addr, blocks);

    // resolve promises
    // ADD_NEW_PROTOCOL
    const [
      vesuHoldings,
      ekuboHoldings,
      nostraLendingHoldings,
      nostraDexHoldings,
      xstrkHoldings,
      strkfarmHoldings,
      strkfarmEkuboHoldings,
      opusHoldings,
    ] = await Promise.all([
      vesuHoldingsProm,
      ekuboHoldingsProm,
      nostraLendingHoldingsProm,
      nostraDexHoldingsProm,
      xstrkHoldingsProm,
      strkfarmHoldingsProm,
      strkfarmEkuboHoldingsProm,
      opusHoldingsProm,
    ]);

    const resp = NextResponse.json({
      vesu: vesuHoldings,
      ekubo: ekuboHoldings,
      nostraLending: nostraLendingHoldings,
      nostraDex: nostraDexHoldings,
      strkfarm: strkfarmHoldings,
      strkfarmEkubo: strkfarmEkuboHoldings,
      wallet: xstrkHoldings,
      opus: opusHoldings,
      blocks,
      lastUpdated: new Date().toISOString(),
    });
    resp.headers.set(
      "Cache-Control",
      `s-maxage=${revalidate}, stale-while-revalidate=180`,
    );
    return resp;
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      {
        error: "Error fetching data",
      },
      { status: 500 },
    );
  }
}

//
// ADD_NEW_PROTOCOL
//

export async function getAllOpusHoldings(address: string, blocks: BlockInfo[]) {
  // Opus holdings are not implemented yet
  return Promise.all(
    blocks.map(async (block) => {
      return retry(holdingsService.getProtocolHoldings.bind(holdingsService), [address, 'opus', block.block]);
    }),
  );
}

export async function getAllVesuHoldings(address: string, blocks: BlockInfo[]) {
  return Promise.all(
    blocks.map(async (block) => {
      return retry(holdingsService.getProtocolHoldings.bind(holdingsService), [address, 'vesu', block.block]);
    }),
  );
}

// todo switch to actual sensei logic
export async function getAllXSTRKSenseiHoldings(
  address: string,
  blocks: BlockInfo[],
) {
  return Promise.all(
    blocks.map(async (block) => {
      return retry(holdingsService.getProtocolHoldings.bind(holdingsService), [address, 'strkfarm', block.block]);
    }),
  );
}

// todo switch to actual ekubo logic
export async function getAllEkuboXSTRKSTRKHoldings(
  address: string,
  blocks: BlockInfo[],
) {
  return Promise.all(
    blocks.map(async (block) => {
      return retry(holdingsService.getProtocolHoldings.bind(holdingsService), [address, 'strkfarmEkubo', block.block]);
    }),
  );
}


export async function getAllEkuboHoldings(
  address: string,
  blocks: BlockInfo[],
) {
  return Promise.all(
    blocks.map(async (block) => {
      return retry(holdingsService.getProtocolHoldings.bind(holdingsService), [address, 'ekubo', block.block]);
    }),
  );
}

/**
 * Retrieves the nostra lending holdings for a given address and blocks.
 *
 * @param address - The address for which to retrieve the holdings.
 * @param blocks - An array of BlockInfo objects representing the blocks to retrieve holdings from.
 * @returns A promise that resolves to an array of DAppHoldings objects representing the lending holdings.
 */
export async function getNostraLendingHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {

  // loop across blocks and sum the holdings for all tokens
  const result = await Promise.all(
    blocks.map(async (block) => {
      return retry(holdingsService.getProtocolHoldings.bind(holdingsService), [address, 'nostraLending', block.block]);
    }),
  );
  return result;
}

export async function getNostraDEXHoldings(
  address: string,
  blocks: BlockInfo[],
) {
  const provider = getProvider();

  return Promise.all(
    blocks.map(async (block) => {
      return retry(holdingsService.getProtocolHoldings.bind(holdingsService), [address, 'nostraDex', block.block]);
    }),
  );
}

export async function getAllXSTRKHoldings(
  address: string,
  blocks: BlockInfo[],
) {
  return Promise.all(
    blocks.map(async (block) => {
      return retry(holdingsService.getProtocolHoldings.bind(holdingsService), [address, 'lst', block.block]);
    }),
  );
}

export async function retry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  args: Parameters<T>,
  retries: number = 3,
  delay: number = 1000,
): Promise<ReturnType<T>> {
  let attempts = 0;

  while (attempts < retries) {
    try {
      return (await fn(...args)) as ReturnType<T>;
    } catch (error) {
      attempts++;
      if (attempts >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Function failed after max retries");
}
