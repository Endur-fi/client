import { NextRequest, NextResponse } from 'next/server';
import {
  getAllLstTokenBalances,
  getNativeTokenBalances,
  getUSDConversionRates,
} from '@/lib/portfolio';

// VIP threshold in USD
const VIP_THRESHOLD_USD = 50000;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    // Validate address
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Fetch all data in parallel
    const [lstBalances, nativeBalances, conversionRates] = await Promise.all([
      getAllLstTokenBalances(address),
      getNativeTokenBalances(address),
      getUSDConversionRates(),
    ]);

    // Calculate native STRK value in USD
    const nativeSTRKBalance = BigInt(nativeBalances.strk);
    const nativeSTRKValue =
      (Number(nativeSTRKBalance) / 1e18) * conversionRates.strk;

    // Calculate native BTC tokens value in USD
    const nativeWBTCBalance = BigInt(nativeBalances.wbtc);
    const nativeSBTCBalance = BigInt(nativeBalances.sbtc);
    const nativeLBTCBalance = BigInt(nativeBalances.lbtc);
    const nativeTBTCBalance = BigInt(nativeBalances.tbtc);

    const nativeWBTCValue =
      (Number(nativeWBTCBalance) / 1e8) * conversionRates.btc;
    const nativeSBTCValue =
      (Number(nativeSBTCBalance) / 1e18) * conversionRates.btc;
    const nativeLBTCValue =
      (Number(nativeLBTCBalance) / 1e8) * conversionRates.btc;
    const nativeTBTCValue =
      (Number(nativeTBTCBalance) / 1e18) * conversionRates.btc;

    const nativeBTCValue =
      nativeWBTCValue + nativeSBTCValue + nativeLBTCValue + nativeTBTCValue;

    // Calculate LST XSTRK value across all apps
    let lstXSTRKValue = 0;
    const xstrkData = lstBalances['XSTRK'];
    if (xstrkData) {
      // Sum all protocol balances
      const totalXSTRKBalance =
        BigInt(xstrkData.endur.balance) +
        BigInt(xstrkData.ekubo.balance) +
        BigInt(xstrkData.vesuCollateral.balance) +
        BigInt(xstrkData.vesuVtoken.balance) +
        BigInt(xstrkData.trovesSensei.balance) +
        BigInt(xstrkData.trovesHyper.balance) +
        BigInt(xstrkData.trovesEkubo.balance) +
        BigInt(xstrkData.nostra.balance) +
        BigInt(xstrkData.opus.balance);

      lstXSTRKValue =
        (Number(totalXSTRKBalance) / 1e18) * conversionRates.xstrk;
    }

    // Calculate LST xBTC values across all apps
    let lstXWBTCValue = 0;
    let lstXLBTCValue = 0;
    let lstXSBTCValue = 0;
    let lstXTBTCValue = 0;

    // XWBTC
    const xwbtcData = lstBalances['XWBTC'];
    if (xwbtcData) {
      const totalXWBTCBalance =
        BigInt(xwbtcData.endur.balance) +
        BigInt(xwbtcData.ekubo.balance) +
        BigInt(xwbtcData.vesuCollateral.balance) +
        BigInt(xwbtcData.vesuVtoken.balance) +
        BigInt(xwbtcData.trovesSensei.balance) +
        BigInt(xwbtcData.trovesHyper.balance) +
        BigInt(xwbtcData.trovesEkubo.balance) +
        BigInt(xwbtcData.nostra.balance) +
        BigInt(xwbtcData.opus.balance);

      lstXWBTCValue =
        (Number(totalXWBTCBalance) / 1e8) * conversionRates.xwbtc;
    }

    // XLBTC
    const xlbtcData = lstBalances['XLBTC'];
    if (xlbtcData) {
      const totalXLBTCBalance =
        BigInt(xlbtcData.endur.balance) +
        BigInt(xlbtcData.ekubo.balance) +
        BigInt(xlbtcData.vesuCollateral.balance) +
        BigInt(xlbtcData.vesuVtoken.balance) +
        BigInt(xlbtcData.trovesSensei.balance) +
        BigInt(xlbtcData.trovesHyper.balance) +
        BigInt(xlbtcData.trovesEkubo.balance) +
        BigInt(xlbtcData.nostra.balance) +
        BigInt(xlbtcData.opus.balance);

      lstXLBTCValue =
        (Number(totalXLBTCBalance) / 1e8) * conversionRates.xlbtc;
    }

    // XSBTC
    const xsbtcData = lstBalances['XSBTC'];
    if (xsbtcData) {
      const totalXSBTCBalance =
        BigInt(xsbtcData.endur.balance) +
        BigInt(xsbtcData.ekubo.balance) +
        BigInt(xsbtcData.vesuCollateral.balance) +
        BigInt(xsbtcData.vesuVtoken.balance) +
        BigInt(xsbtcData.trovesSensei.balance) +
        BigInt(xsbtcData.trovesHyper.balance) +
        BigInt(xsbtcData.trovesEkubo.balance) +
        BigInt(xsbtcData.nostra.balance) +
        BigInt(xsbtcData.opus.balance);

      lstXSBTCValue =
        (Number(totalXSBTCBalance) / 1e18) * conversionRates.xsbtc;
    }

    // XTBTC
    const xtbtcData = lstBalances['XTBTC'];
    if (xtbtcData) {
      const totalXTBTCBalance =
        BigInt(xtbtcData.endur.balance) +
        BigInt(xtbtcData.ekubo.balance) +
        BigInt(xtbtcData.vesuCollateral.balance) +
        BigInt(xtbtcData.vesuVtoken.balance) +
        BigInt(xtbtcData.trovesSensei.balance) +
        BigInt(xtbtcData.trovesHyper.balance) +
        BigInt(xtbtcData.trovesEkubo.balance) +
        BigInt(xtbtcData.nostra.balance) +
        BigInt(xtbtcData.opus.balance);

      lstXTBTCValue =
        (Number(totalXTBTCBalance) / 1e18) * conversionRates.xtbtc;
    }

    const lstBTCValue =
      lstXWBTCValue + lstXLBTCValue + lstXSBTCValue + lstXTBTCValue;

    // Calculate total value
    const totalValueUSD =
      nativeSTRKValue + nativeBTCValue + lstXSTRKValue + lstBTCValue;

    // Determine VIP status
    const isVIP = totalValueUSD >= VIP_THRESHOLD_USD;

		const contacts = {
			phone: isVIP ? '+919876543210' : null,
			telegram: isVIP ? 'https://t.me/endurfi' : null,
		}

    return NextResponse.json({
      success: true,
      data: {
        isVIP,
        totalValueUSD: Math.round(totalValueUSD * 100) / 100, // Round to 2 decimal places
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
    console.error('Error checking VIP status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check VIP status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

