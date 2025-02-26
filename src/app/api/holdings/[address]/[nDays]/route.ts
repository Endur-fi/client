import { getProvider } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { DAppHoldings } from "@/store/defi.store";
import { getEkuboHoldings } from "@/store/ekubo.store";
import { getXSTRKHoldings } from "@/store/lst.store";
import {
  getNostraDexHoldings,
  getNostraHoldingsByToken,
  i_XSTRK_C_CONTRACT_ADDRESS,
  i_XSTRK_CONTRACT_ADDRESS,
  N_XSTRK_C_CONTRACT_ADDRESS,
  N_XSTRK_CONTRACT_ADDRESS,
} from "@/store/nostra.store";
import { getVesuHoldings } from "@/store/vesu.store";
import axios from "axios";
import { NextResponse } from "next/server";

export const revalidate = 60;

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
  const host = process.env.VERCEL_URL;
  if (!host) {
    return NextResponse.json({
      error: "Invalid host",
    });
  }
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

  // resolve promises
  const [
    vesuHoldings,
    ekuboHoldings,
    nostraLendingHoldings,
    nostraDexHoldings,
    xstrkHoldings,
  ] = await Promise.all([
    vesuHoldingsProm,
    ekuboHoldingsProm,
    nostraLendingHoldingsProm,
    nostraDexHoldingsProm,
    xstrkHoldingsProm,
  ]);
  return NextResponse.json({
    vesu: vesuHoldings,
    ekubo: ekuboHoldings,
    nostraLending: nostraLendingHoldings,
    nostraDex: nostraDexHoldings,
    wallet: xstrkHoldings,
    blocks,
  });
}

async function getAllVesuHoldings(address: string, blocks: BlockInfo[]) {
  return Promise.all(
    blocks.map(async (block) => {
      return retry(getVesuHoldings, [address, getProvider(), block.block]);
    }),
  );
}

async function getAllEkuboHoldings(address: string, blocks: BlockInfo[]) {
  return Promise.all(
    blocks.map(async (block) => {
      return retry(getEkuboHoldings, [address, getProvider(), block.block]);
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
async function getNostraLendingHoldings(
  address: string,
  blocks: BlockInfo[],
): Promise<DAppHoldings[]> {
  const nTokens = [
    N_XSTRK_CONTRACT_ADDRESS,
    N_XSTRK_C_CONTRACT_ADDRESS,
    i_XSTRK_CONTRACT_ADDRESS,
    i_XSTRK_C_CONTRACT_ADDRESS,
  ];
  const provider = getProvider();

  // loop across blocks and sum the holdings for all tokens
  const result = await Promise.all(
    blocks.map(async (block) => {
      const holdings = await Promise.all(
        nTokens.map(async (token) => {
          return retry(getNostraHoldingsByToken, [
            address,
            provider,
            token,
            block.block,
          ]);
        }),
      );
      return {
        xSTRKAmount: holdings.reduce(
          (acc, cur) => acc.operate("plus", cur.toString()),
          MyNumber.fromEther("0", 18),
        ),
        STRKAmount: MyNumber.fromZero(),
      };
    }),
  );
  return result;
}

async function getNostraDEXHoldings(address: string, blocks: BlockInfo[]) {
  const provider = getProvider();

  return Promise.all(
    blocks.map(async (block) => {
      return retry(getNostraDexHoldings, [address, provider, block.block]);
    }),
  );
}

async function getAllXSTRKHoldings(address: string, blocks: BlockInfo[]) {
  return Promise.all(
    blocks.map(async (block) => {
      return retry(getXSTRKHoldings, [address, getProvider(), block.block]);
    }),
  );
}

async function retry<T extends (...args: any[]) => Promise<any>>(
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
