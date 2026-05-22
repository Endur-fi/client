import {
  getAllLstTokenBalancesRpc,
  getNativeTokenBalances,
  getUSDConversionRates,
} from "@/lib/portfolio";
import type {
  PortfolioData,
  NativeTokenBalances,
} from "@/lib/portfolio-types";
import { getPortfolioProvider } from "@/constants";

export interface PortfolioSnapshot {
  lastUpdated: string;
  blockNumber: number;
  nativeBalances: NativeTokenBalances;
  conversionRates: Awaited<ReturnType<typeof getUSDConversionRates>>;
  byLst: Record<string, PortfolioData>;
  totals: {
    usd: number;
    byCategory: { STRK: number; BTC: number };
  };
}

function lstTotalRaw(data: PortfolioData): bigint {
  return (
    BigInt(data.endur.balance) +
    BigInt(data.ekubo.balance) +
    BigInt(data.vesuCollateral.balance) +
    BigInt(data.vesuVtoken.balance) +
    BigInt(data.trovesSensei.balance) +
    BigInt(data.trovesHyper.balance) +
    BigInt(data.trovesEkubo.balance) +
    BigInt(data.nostra.balance) +
    BigInt(data.opus.balance)
  );
}

function lstUsdValue(
  data: PortfolioData,
  lstToken: string,
  rates: Awaited<ReturnType<typeof getUSDConversionRates>>,
): number {
  const total = lstTotalRaw(data);
  const priceMap: Record<string, number> = {
    XSTRK: rates.xstrk,
    XWBTC: rates.xwbtc,
    XLBTC: rates.xlbtc,
    XSBTC: rates.xsbtc,
    XTBTC: rates.xtbtc,
    XSTRKBTC: rates.xwbtc,
  };
  const price = priceMap[lstToken] ?? rates.xstrk;
  const decimals =
    lstToken === "XSTRK" || lstToken === "XSBTC" || lstToken === "XTBTC"
      ? 18
      : 8;
  return (Number(total) / 10 ** decimals) * price;
}

export async function buildPortfolioSnapshot(
  userAddress: string,
): Promise<PortfolioSnapshot> {
  const [byLst, nativeBalances, conversionRates] = await Promise.all([
    getAllLstTokenBalancesRpc(userAddress),
    getNativeTokenBalances(userAddress),
    getUSDConversionRates(),
  ]);

  let blockNumber = 0;
  try {
    const block = await getPortfolioProvider().getBlock("latest");
    blockNumber = block.block_number;
  } catch {}

  let lstStrkUsd = 0;
  let lstBtcUsd = 0;

  for (const [lstToken, data] of Object.entries(byLst)) {
    const usd = lstUsdValue(data, lstToken, conversionRates);
    if (lstToken === "XSTRK") {
      lstStrkUsd += usd;
    } else {
      lstBtcUsd += usd;
    }
  }

  const nativeStrkUsd =
    (Number(nativeBalances.strk) / 1e18) * conversionRates.strk;
  const nativeBtcUsd =
    (Number(nativeBalances.wbtc) / 1e8 +
      Number(nativeBalances.lbtc) / 1e8 +
      Number(nativeBalances.sbtc) / 1e18 +
      Number(nativeBalances.tbtc) / 1e18) *
    conversionRates.btc;

  const totalUsd = nativeStrkUsd + nativeBtcUsd + lstStrkUsd + lstBtcUsd;

  return {
    lastUpdated: new Date().toISOString(),
    blockNumber,
    nativeBalances,
    conversionRates,
    byLst,
    totals: {
      usd: Math.round(totalUsd * 100) / 100,
      byCategory: {
        STRK: Math.round((nativeStrkUsd + lstStrkUsd) * 100) / 100,
        BTC: Math.round((nativeBtcUsd + lstBtcUsd) * 100) / 100,
      },
    },
  };
}
