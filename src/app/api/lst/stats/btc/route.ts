import { NextResponse } from "next/server";

import { getProvider, LST_CONFIG } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { getAssetPrice, tryCatch } from "@/lib/utils";
import LSTService from "@/services/lst";
import StakingService from "@/services/staking";

export const revalidate = 60 * 60; // 1 hour

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
  let setCache = true;

  // Get BTC assets - filter by specific asset if provided
  const btcAssets = Object.values(LST_CONFIG).filter((config) => 
    config.CATEGORY === "BTC" && 
    (!assetSymbol || config.SYMBOL.toLowerCase() === assetSymbol.toLowerCase())
  );

  if (assetSymbol && btcAssets.length === 0) {
    return NextResponse.json({
      message: "BTC asset not found",
      error: `No BTC LST configuration found for asset: ${assetSymbol}`,
    });
  }

  try {
    // Get all shared APY data for BTC assets in a single merged call
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

    // Calculate BTC APY (same for all BTC assets)
    let apy = 0;
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

    const apyInPercentage = (apy * 100).toFixed(2);

    // Process each BTC asset
    for (const btcConfig of btcAssets) {
      try {
        const balance = await lstService.getTotalStaked(
          btcConfig.LST_ADDRESS,
          btcConfig.DECIMALS,
        );

        const totalSupply = await lstService.getTotalSupply(
          btcConfig.LST_ADDRESS,
          btcConfig.DECIMALS,
        );

        if (balance && btcPrice) {
          const tvlAsset = Number(
            new MyNumber(balance.toString(), btcConfig.DECIMALS).toEtherStr(),
          );
          const tvlUsd = btcPrice * tvlAsset;

          let exchangeRate = 0;
          let preciseExchangeRate = "0";

          if (totalSupply && !totalSupply.isZero()) {
            exchangeRate =
              Number(balance.toEtherStr()) / Number(totalSupply.toEtherStr());
            preciseExchangeRate = balance
              .operate(
                "multipliedBy",
                MyNumber.fromEther("1", btcConfig.DECIMALS).toString(),
              )
              .operate("div", totalSupply.toString())
              .toString();
          }

          results.push({
            asset: btcConfig.SYMBOL,
            assetAddress: btcConfig.ASSET_ADDRESS,
            lstAddress: btcConfig.LST_ADDRESS,
            tvlUsd,
            tvlAsset,
            apy,
            apyInPercentage: `${apyInPercentage}%`,
            exchangeRate,
            preciseExchangeRate,
          });
        } else {
          results.push({
            asset: btcConfig.SYMBOL,
            error: "Missing balance or price",
          });
        }
      } catch (err: any) {
        setCache = false;
        results.push({
          asset: btcConfig.SYMBOL,
          error: err?.message || "Unknown error",
        });
      }
    }
  } catch (err: any) {
    setCache = false;
    return NextResponse.json({
      message: "BTC stats error",
      error: err?.message || "Unknown error",
    });
  }

  const response = NextResponse.json(assetSymbol ? results[0] : results);
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