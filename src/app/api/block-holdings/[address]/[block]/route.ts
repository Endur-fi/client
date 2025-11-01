// [block] > route.ts

import { NextResponse } from "next/server";

import MyNumber from "@/lib/MyNumber";

import {
  getAllEkuboHoldings,
  getAllVesuHoldings,
  getAllXSTRKHoldings,
  getAllXSTRKSenseiHoldings,
  getAllEkuboXSTRKSTRKHoldings,
  getNostraDEXHoldings,
  getNostraLendingHoldings,
  getAllOpusHoldings,
} from "@/app/api/holdings/[address]/[nDays]/route";
import { DAppHoldings } from "@/store/defi.store";

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

//TODO: remove this if not used anywhere
export async function GET(_req: Request, context: any) {
  const { params } = context;
  const addr = params.address;
  const blockNumber = Number(params.block);

  try {
    const blocks = [
      {
        block: blockNumber,
      },
    ] as BlockInfo[];

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
    const dummy: DAppHoldings[] = [
      {
        lstAmount: MyNumber.fromZero(18),
        underlyingTokenAmount: MyNumber.fromZero(18),
      },
    ];
    return NextResponse.json({
      vesu: vesuHoldings,
      ekubo: ekuboHoldings,
      nostraLending: nostraLendingHoldings,
      nostraDex: nostraDexHoldings,
      wallet: xstrkHoldings,
      strkfarm: strkfarmHoldings,
      strkfarmEkubo: strkfarmEkuboHoldings,
      opus: opusHoldings,
      blocks,
      lastUpdated: new Date().toISOString(),
    });
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
