import { NextResponse } from "next/server";

import { ALPHA, getProvider, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { getSTRKPrice, tryCatch } from "@/lib/utils";
import LSTService from "@/services/lst";
import StakingService from "@/services/staking";

export const revalidate = 60 * 60; // 1 hour

export async function GET(_req: Request) {
  const provider = getProvider();

  if (!provider) {
    return NextResponse.json("Provider not found");
  }

  const stakingService = new StakingService();
  const lstService = new LSTService();

  const yearlyMinting =
    (await stakingService.getYearlyMinting()) ?? MyNumber.fromZero();
  const totalStaked =
    (await stakingService.getSNTotalStaked()) ?? MyNumber.fromZero();

  let apy = 0;

  if (Number(totalStaked.toEtherToFixedDecimals(0)) !== 0) {
    apy =
      Number(yearlyMinting.toEtherToFixedDecimals(4)) /
      Number(totalStaked.toEtherToFixedDecimals(4));

    // deduce endur fee
    apy *= (1 - ALPHA) * 0.85;
  }

  const newApy = (1 + apy / 365) ** 365 - 1;

  const apyInPercentage = (newApy * 100).toFixed(2);

  const balance = await lstService.getTotalStaked();

  const { data: price, error: strkPriceError } = await tryCatch(getSTRKPrice());

  if (balance && price) {
    const tvlInStrk = Number(
      new MyNumber(balance.toString(), STRK_DECIMALS).toEtherStr(),
    );

    const tvlInUsd = price * tvlInStrk;

    const response = NextResponse.json({
      asset: "STRK",
      tvl: tvlInUsd,
      tvlStrk: tvlInStrk,
      apy: newApy,
      apyInPercentage: `${apyInPercentage}%`,
    });
    response.headers.set(
      "Cache-Control",
      `s-maxage=${revalidate}, stale-while-revalidate=180`,
    );
    return response;
  }

  if (strkPriceError) {
    console.error("strkPriceError", strkPriceError);
    return NextResponse.json({
      message: "strkPriceError",
      error: strkPriceError.message,
    });
  }

  return NextResponse.json({
    message: "Stats api error",
  });
}
