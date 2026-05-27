import { NextRequest, NextResponse } from "next/server";
import {
  getAllLstTokenBalancesRpc,
  getNativeTokenBalances,
  getUSDConversionRates,
} from "@/lib/portfolio";
import {
  PORTFOLIO_LST_TOKEN_KEYS,
  portfolioLstUsdValue,
} from "@/lib/portfolio-types";

// VIP threshold in USD
const VIP_THRESHOLD_USD = 50000;

export async function GET(
  request: NextRequest,
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

    const [lstBalances, nativeBalances, conversionRates] = await Promise.all([
      getAllLstTokenBalancesRpc(address),
      getNativeTokenBalances(address),
      getUSDConversionRates(),
    ]);

    const nativeSTRKValue =
      (Number(BigInt(nativeBalances.strk)) / 1e18) * conversionRates.strk;

    const nativeBTCValue =
      (Number(BigInt(nativeBalances.wbtc)) / 1e8 +
        Number(BigInt(nativeBalances.lbtc)) / 1e8 +
        Number(BigInt(nativeBalances.sbtc)) / 1e18 +
        Number(BigInt(nativeBalances.tbtc)) / 1e18 +
        Number(BigInt(nativeBalances.strkbtc)) / 1e8) *
      conversionRates.btc;

    let lstXSTRKValue = 0;
    let lstBTCValue = 0;

    for (const lstToken of PORTFOLIO_LST_TOKEN_KEYS) {
      const data = lstBalances[lstToken];
      if (!data) continue;
      const value = portfolioLstUsdValue(data, lstToken, conversionRates);
      if (lstToken === "XSTRK") {
        lstXSTRKValue += value;
      } else {
        lstBTCValue += value;
      }
    }

    const totalValueUSD =
      nativeSTRKValue + nativeBTCValue + lstXSTRKValue + lstBTCValue;

    const isVIP = totalValueUSD >= VIP_THRESHOLD_USD;

    const contacts = {
      call: isVIP
        ? "https://cal.com/akira-unwrap-labs/elite-access-calendar"
        : null,
      telegram: isVIP ? "https://t.me/akirabuilds" : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        isVIP,
        totalValueUSD: Math.round(totalValueUSD * 100) / 100,
        breakdown: {
          nativeSTRK: Math.round(nativeSTRKValue * 100) / 100,
          nativeBTC: Math.round(nativeBTCValue * 100) / 100,
          lstSTRK: Math.round(lstXSTRKValue * 100) / 100,
          lstBTC: Math.round(lstBTCValue * 100) / 100,
        },
        contacts,
      },
    });
  } catch (error) {
    console.error("Error checking VIP status:", error);
    return NextResponse.json(
      {
        error: "Failed to check VIP status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
