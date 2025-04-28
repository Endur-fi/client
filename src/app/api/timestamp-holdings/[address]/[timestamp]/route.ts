import axios from "axios";
import { NextResponse } from "next/server";

import MyNumber from "@/lib/MyNumber";

import {
  getAllEkuboHoldings,
  getAllVesuHoldings,
  getAllXSTRKHoldings,
  getNostraDEXHoldings,
  getNostraLendingHoldings,
} from "@/app/api/holdings/[address]/[nDays]/route";

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
  const timestamp = Number(params.timestamp);

  // get blocks to use for the chart
  const host = process.env.HOSTNAME ?? "http://localhost:3000";

  if (!host) {
    return NextResponse.json({
      error: "Invalid host",
    });
  }

  try {
    const result = await axios.get(`${host}/api/block/${timestamp}`);

    if (!result?.data) {
      return NextResponse.json({
        error: "Invalid blocks",
      });
    }

    const blockNumber = result.data.block;
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
