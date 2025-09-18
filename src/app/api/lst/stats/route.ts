import { NextResponse } from "next/server";

import { getProvider, LST_CONFIG } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { getAssetPrice, tryCatch } from "@/lib/utils";
import LSTService from "@/services/lst";
import StakingService from "@/services/staking";

export const revalidate = 60 * 60; // 1 hour

export async function GET(_req: Request) {
  const provider = getProvider();

  if (!provider) {
    return NextResponse.json({ message: "Provider not found" });
  }

  const stakingService = new StakingService();
  const lstService = new LSTService();

  const results = [];

  for (const value of Object.values(LST_CONFIG)) {
    try {
      const isBtcAsset = value.SYMBOL.toLowerCase().includes("btc");
      const isStrkAsset = value.SYMBOL.toLowerCase().includes("strk");

      // Get the asset price for TVL calculation
      const { data: assetPrice, error: assetPriceError } = await tryCatch(
        getAssetPrice(isStrkAsset),
      );

      if (assetPriceError) {
        console.error("assetPriceError", assetPriceError);
        return NextResponse.json({
          message: "assetPriceError",
          error: assetPriceError.message,
        });
      }

      const yearlyMinting =
        (await stakingService.getYearlyMinting()) ?? MyNumber.fromZero();
      const totalStakingPower =
        (await stakingService.getTotalStakingPower()) ?? {
          totalStakingPowerSTRK: MyNumber.fromZero(),
          totalStakingPowerBTC: MyNumber.fromZero(),
        };
      const alpha = (await stakingService.getAlpha()) ?? 0;

      const { data: strkPrice, error: strkPriceError } = await tryCatch(
        getAssetPrice(true),
      );
      const { data: btcPrice, error: btcPriceError } = await tryCatch(
        getAssetPrice(false),
      );

      if (strkPriceError || btcPriceError) {
        console.error("Price errors", { strkPriceError, btcPriceError });
      }

      let apy = 0;

      if (isBtcAsset) {
        if (
          !totalStakingPower.totalStakingPowerBTC.isZero() &&
          alpha !== 0 &&
          strkPrice &&
          btcPrice &&
          strkPrice > 0 &&
          btcPrice > 0
        ) {
          const yearMinting = Number(yearlyMinting.toEtherToFixedDecimals(4));
          const btcStakingPower = Number(
            totalStakingPower.totalStakingPowerBTC.toEtherToFixedDecimals(4),
          );

          apy =
            (yearMinting * strkPrice * alpha) /
            (100 * btcStakingPower * btcPrice);
          // deduce endur fee
          apy *= 0.85;
        }
      } else if (
        !totalStakingPower.totalStakingPowerSTRK.isZero() &&
        alpha !== 0
      ) {
        const yearMinting = Number(yearlyMinting.toEtherToFixedDecimals(4));
        const strkStakingPower = Number(
          totalStakingPower.totalStakingPowerSTRK.toEtherToFixedDecimals(4),
        );

        apy = (yearMinting * (100 - alpha)) / (100 * strkStakingPower);
        // deduce endur fee
        apy *= 0.85;
      }

      const apyInPercentage = (apy * 100).toFixed(2);

      const balance = await lstService.getTotalStaked(
        value.LST_ADDRESS,
        value.DECIMALS,
      );

      if (balance && assetPrice) {
        const tvlAsset = Number(
          new MyNumber(balance.toString(), value.DECIMALS).toEtherStr(),
        );
        const tvlUsd = assetPrice * tvlAsset;

        results.push({
          asset: value.SYMBOL,
          assetAddress: value.ASSET_ADDRESS,
          lstAddress: value.LST_ADDRESS,
          tvlUsd,
          tvlAsset,
          apy,
          apyInPercentage: `${apyInPercentage}%`,
        });
      } else {
        results.push({
          asset: value.SYMBOL,
          error: "Missing balance or price",
        });
      }
    } catch (err: any) {
      results.push({
        asset: value.SYMBOL,
        error: err?.message || "Unknown error",
      });
    }
  }

  const response = NextResponse.json(results);
  response.headers.set(
    "Cache-Control",
    `s-maxage=${revalidate}, stale-while-revalidate=180`,
  );
  return response;
}
