import {
  BlockInfo,
  getBlocksWithExchangeRatesForDays,
} from "@/lib/portfolio-blocks";
import { fetchHistoricalHoldingsForAsset } from "@/lib/portfolio-holdings-history";
import { getLstConfigBySymbol } from "@/lib/portfolio-rpc";
import { NextResponse } from "next/server";

export const revalidate = 3600 * 6;

export type { BlockInfo };

export async function GET(req: Request, context: any) {
  const { params } = context;
  const addr = params.address;
  const nDays = Number(params.nDays);
  const { searchParams } = new URL(req.url);
  const lstSymbol = searchParams.get("lstSymbol") || "STRK";

  const lstConfig = getLstConfigBySymbol(lstSymbol);
  if (!lstConfig) {
    return NextResponse.json(
      { error: `Invalid lstSymbol: ${lstSymbol}` },
      { status: 400 },
    );
  }

  try {
    const blocksResult = await getBlocksWithExchangeRatesForDays(
      nDays,
      lstConfig.LST_ADDRESS,
      lstConfig.DECIMALS,
    );
    if ("error" in blocksResult) {
      return NextResponse.json({
        error: blocksResult.error,
      });
    }
    const blocks: BlockInfo[] = blocksResult.blocks;

    const series = await fetchHistoricalHoldingsForAsset(
      addr,
      lstSymbol,
      blocks,
    );

    const resp = NextResponse.json({
      lstSymbol,
      vesu: series.vesu,
      ekubo: series.ekubo,
      nostraLending: series.nostraLending,
      nostraDex: series.nostraDex,
      strkfarm: series.strkfarm,
      strkfarmEkubo: series.strkfarmEkubo,
      trovesHyper: series.trovesHyper,
      wallet: series.wallet,
      opus: series.opus,
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
