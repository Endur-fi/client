import { NextResponse } from "next/server";

import { getProvider, LST_CONFIG, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { getAssetPrice, tryCatch } from "@/lib/utils";
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
  const totalStakingPower = (await stakingService.getTotalStakingPower()) ?? {
    totalStakingPowerSTRK: MyNumber.fromZero(),
    totalStakingPowerBTC: MyNumber.fromZero(),
  };
  const alpha = (await stakingService.getAlpha()) ?? 0;

  let strkApy = 0;

  if (!totalStakingPower.totalStakingPowerSTRK.isZero() && alpha !== 0) {
    const yearMinting = Number(yearlyMinting.toEtherToFixedDecimals(4));
    const strkStakingPower = Number(
      totalStakingPower.totalStakingPowerSTRK.toEtherToFixedDecimals(4),
    );

    strkApy = (yearMinting * (100 - alpha)) / (100 * strkStakingPower);
    // deduce endur fee
    strkApy *= 0.85;
  }

  const apyInPercentage = (strkApy * 100).toFixed(2);

  const strkLSTConfig = LST_CONFIG.STRK;

  const balance = await lstService.getTotalStaked(
    strkLSTConfig.LST_ADDRESS,
    strkLSTConfig.DECIMALS,
  );

  const { data: price, error: strkPriceError } =
    await tryCatch(getAssetPrice());

  if (balance && price) {
    const tvlInStrk = Number(
      new MyNumber(balance.toString(), STRK_DECIMALS).toEtherStr(),
    );

    const tvlInUsd = price * tvlInStrk;

    const response = NextResponse.json({
      asset: "STRK",
      tvl: tvlInUsd,
      tvlStrk: tvlInStrk,
      apy: strkApy,
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
