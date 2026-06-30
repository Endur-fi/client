import { getBlocksWithExchangeRatesForDays } from "@/lib/portfolio-blocks";
import { NextResponse } from "next/server";

export const revalidate = 60 * 60 * 6; // 6 hours

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

  const result = await getBlocksWithExchangeRatesForDays(
    nDays,
    lstAddress,
    decimals,
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error });
  }

  const resp = NextResponse.json({ blocks: result.blocks });
  resp.headers.set(
    "Cache-Control",
    `s-maxage=${revalidate}, stale-while-revalidate=180`,
  );
  return resp;
}
