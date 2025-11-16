import { NextResponse } from "next/server";

import { getProvider, LST_CONFIG } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { getAssetPrice, tryCatch } from "@/lib/utils";
import LSTService from "@/services/lst";
import StakingService from "@/services/staking";

export const revalidate = 60 * 60; // 1 hour

export async function GET() {
  const provider = getProvider();

  if (!provider) {
    return NextResponse.json({ message: "Provider not found" });
  }

  const stakingService = new StakingService();
  const lstService = new LSTService();

  let setCache = true;

  try {
    const strkConfig = LST_CONFIG.STRK;
    
    if (!strkConfig) {
      return NextResponse.json({
        message: "STRK config not found",
        error: "STRK configuration not available",
      });
    }

    // Get STRK price for TVL calculation
    const { data: strkPrice, error: strkPriceError } = await tryCatch(
      getAssetPrice(true),
    );

    if (strkPriceError) {
      console.error("STRK price error", strkPriceError);
      return NextResponse.json({
        message: "STRK price error",
        error: strkPriceError.message,
      });
    }

    // Get all staking data for APY calculation in a single merged call
    const apyData = await stakingService.getAPYData();
    const { yearlyMinting, totalStakingPower, alpha } = apyData;

    // Calculate STRK APY
    let apy = 0;
    if (
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

    // Get TVL data
    const balance = await lstService.getTotalStaked(
      strkConfig.LST_ADDRESS,
      strkConfig.DECIMALS,
    );

    const totalSupply = await lstService.getTotalSupply(
      strkConfig.LST_ADDRESS,
      strkConfig.DECIMALS,
    );

    if (!balance || !strkPrice) {
      return NextResponse.json({
        asset: strkConfig.SYMBOL,
        error: "Missing balance or price data",
      });
    }

    const tvlAsset = Number(
      new MyNumber(balance.toString(), strkConfig.DECIMALS).toEtherStr(),
    );
    const tvlUsd = strkPrice * tvlAsset;

    let exchangeRate = 0;
    let preciseExchangeRate = "0";

    if (totalSupply && !totalSupply.isZero()) {
      exchangeRate =
        Number(balance.toEtherStr()) / Number(totalSupply.toEtherStr());
      preciseExchangeRate = balance
        .operate(
          "multipliedBy",
          MyNumber.fromEther("1", strkConfig.DECIMALS).toString(),
        )
        .operate("div", totalSupply.toString())
        .toString();
    }

    const result = {
      asset: strkConfig.SYMBOL,
      assetAddress: strkConfig.ASSET_ADDRESS,
      lstAddress: strkConfig.LST_ADDRESS,
      tvlUsd,
      tvlAsset,
      apy,
      apyInPercentage: `${apyInPercentage}%`,
      exchangeRate,
      preciseExchangeRate,
    };

    const response = NextResponse.json(result);
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
  } catch (err: any) {
    setCache = false;
    const response = NextResponse.json({
      asset: "STRK",
      error: err?.message || "Unknown error",
    });
    response.headers.set(
      "Cache-Control",
      `s-maxage=0, stale-while-revalidate=180`,
    );
    return response;
  }
}