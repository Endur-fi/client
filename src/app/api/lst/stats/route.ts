import { NextResponse } from "next/server";

import { getProvider, LST_CONFIG } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { getAssetPrice, tryCatch } from "@/lib/utils";
import LSTService from "@/services/lst";
import StakingService from "@/services/staking";

export const revalidate = 60 * 60; // 1 hour

// DEPRECATED: Use /api/lst/stats/strk for STRK or /api/lst/stats/btc for BTC assets
// This endpoint is kept for backward compatibility and will be removed in future versions
export async function GET(req: Request) {
  const provider = getProvider();
  const { searchParams } = new URL(req.url);
  const assetSymbol = searchParams.get("asset");

  if (!provider) {
    return NextResponse.json({ message: "Provider not found" });
  }

  const stakingService = new StakingService();
  const lstService = new LSTService();

  const results = [];
  let setCache = true; // made to false if any error

  // Filter LST_CONFIG based on asset parameter if provided
  const configsToProcess = assetSymbol
    ? Object.values(LST_CONFIG).filter(
        (config) => config.SYMBOL.toLowerCase() === assetSymbol.toLowerCase(),
      )
    : Object.values(LST_CONFIG);

  if (assetSymbol && configsToProcess.length === 0) {
    return NextResponse.json({
      message: "Asset not found",
      error: `No LST configuration found for asset: ${assetSymbol}`,
    });
  }

  for (const value of configsToProcess) {
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

      // Use merged APY data call for better performance
      const apyData = await stakingService.getAPYData();
      const { yearlyMinting, totalStakingPower, alpha } = apyData;

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

      const totalSupply = await lstService.getTotalSupply(
        value.LST_ADDRESS,
        value.DECIMALS,
      );

      if (balance && assetPrice) {
        const tvlAsset = Number(
          new MyNumber(balance.toString(), value.DECIMALS).toEtherStr(),
        );
        const tvlUsd = assetPrice * tvlAsset;

        let exchangeRate = 0;
        let preciseExchangeRate = "0";

        if (totalSupply && !totalSupply.isZero()) {
          exchangeRate =
            Number(balance.toEtherStr()) / Number(totalSupply.toEtherStr());
          preciseExchangeRate = balance
            .operate(
              "multipliedBy",
              MyNumber.fromEther("1", value.DECIMALS).toString(),
            )
            .operate("div", totalSupply.toString())
            .toString();
        }

        results.push({
          asset: value.SYMBOL,
          assetAddress: value.ASSET_ADDRESS,
          lstAddress: value.LST_ADDRESS,
          tvlUsd,
          tvlAsset,
          apy,
          apyInPercentage: `${apyInPercentage}%`,
          exchangeRate,
          preciseExchangeRate,
        });
      } else {
        results.push({
          asset: value.SYMBOL,
          error: "Missing balance or price",
        });
      }
    } catch (err: any) {
      setCache = false;
      results.push({
        asset: value.SYMBOL,
        error: err?.message || "Unknown error",
      });
    }
  }

  console.log("results", results);

  const response = NextResponse.json(results);
  if (setCache) {
    response.headers.set(
      "Cache-Control",
      `s-maxage=${revalidate}, stale-while-revalidate=180`,
    );
  } else {
    response.headers.set(
      "Cache-Control",
      `s-maxage=0, stale-while-revalidate=180`,
    );
  }
  return response;
}