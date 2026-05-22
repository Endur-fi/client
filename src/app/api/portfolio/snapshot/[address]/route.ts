import { NextRequest, NextResponse } from "next/server";
import { buildPortfolioSnapshot } from "@/lib/portfolio-snapshot";

export const revalidate = 60 * 2;

export async function GET(
  _request: NextRequest,
  { params }: { params: { address: string } },
) {
  try {
    const { address } = params;
    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    const data = await buildPortfolioSnapshot(address);
    const resp = NextResponse.json({ success: true, data });
    resp.headers.set(
      "Cache-Control",
      `s-maxage=${revalidate}, stale-while-revalidate=60`,
    );
    return resp;
  } catch (error) {
    console.error("Error building portfolio snapshot:", error);
    return NextResponse.json(
      {
        error: "Failed to build portfolio snapshot",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
