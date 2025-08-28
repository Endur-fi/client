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
      const { data: price, error: assetPriceError } = await tryCatch(
        getAssetPrice(value.SYMBOL.toLowerCase().includes("strk")),
      );

      if (assetPriceError) {
        console.error("strkPriceError", assetPriceError);
        return NextResponse.json({
          message: "strkPriceError",
          error: assetPriceError.message,
        });
      }

      const yearlyMinting =
        (await stakingService.getYearlyMinting(value.DECIMALS)) ??
        MyNumber.fromZero();
      const totalStaked =
        (await stakingService.getSNTotalStaked(value.DECIMALS)) ??
        MyNumber.fromZero();

      let apy = 0;

      if (Number(totalStaked.toEtherToFixedDecimals(0)) !== 0) {
        apy =
          Number(yearlyMinting.toEtherToFixedDecimals(4)) /
          Number(totalStaked.toEtherToFixedDecimals(4));
        apy *= 0.85; // deduce endur fee
      }

      const newApy = (1 + apy / 365) ** 365 - 1;
      const apyInPercentage = (newApy * 100).toFixed(2);

      const balance = await lstService.getTotalStaked(
        value.LST_ADDRESS,
        value.DECIMALS,
      );

      if (balance && price) {
        const tvlAsset = Number(
          new MyNumber(balance.toString(), value.DECIMALS).toEtherStr(),
        );
        const tvlUsd = price * tvlAsset;

        results.push({
          asset: value.SYMBOL,
          assetAddress: value.ASSET_ADDRESS,
          lstAddress: value.LST_ADDRESS,
          tvlUsd,
          tvlAsset,
          apy: newApy,
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
