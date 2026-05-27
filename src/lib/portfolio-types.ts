import type { SupportedDApp } from "@/store/defi.store";
import MyNumber from "@/lib/MyNumber";

export interface PoolBreakdown {
  poolId: string;
  balance: string;
  balanceInXstrk: string;
}

export interface PortfolioBalance {
  balance: string;
  balanceInXstrk: string;
  breakdown?: PoolBreakdown[];
}

export interface NativeTokenBalances {
  strk: string;
  wbtc: string;
  sbtc: string;
  lbtc: string;
  tbtc: string;
  strkbtc: string;
}

export interface PortfolioData {
  blockNumber: number;
  timestamp: number;
  endur: PortfolioBalance;
  ekubo: PortfolioBalance;
  vesuCollateral: PortfolioBalance;
  vesuVtoken: PortfolioBalance;
  vesuDebt: PortfolioBalance;
  trovesSensei: PortfolioBalance;
  trovesHyper: PortfolioBalance;
  trovesEkubo: PortfolioBalance;
  nostra: PortfolioBalance;
  opus: PortfolioBalance;
}

export type PortfolioLstTokenKey =
  | "XSTRK"
  | "XWBTC"
  | "XLBTC"
  | "XSBTC"
  | "XTBTC"
  | "XSTRKBTC";

export const PORTFOLIO_LST_TOKEN_KEYS: PortfolioLstTokenKey[] = [
  "XSTRK",
  "XWBTC",
  "XLBTC",
  "XSBTC",
  "XTBTC",
  "XSTRKBTC",
];

export const DEFAULT_USD_CONVERSION_RATES = {
  strk: 0,
  btc: 0,
  xstrk: 0,
  xwbtc: 0,
  xlbtc: 0,
  xsbtc: 0,
  xtbtc: 0,
  xstrkbtc: 0,
};

export type UsdConversionRates = typeof DEFAULT_USD_CONVERSION_RATES;

export const ASSET_SYMBOL_TO_LST_TOKEN: Record<string, string> = {
  STRK: "XSTRK",
  WBTC: "XWBTC",
  tBTC: "XTBTC",
  LBTC: "XLBTC",
  solvBTC: "XSBTC",
  strkBTC: "XSTRKBTC",
};

export const ASSET_SYMBOL_TO_HYPER_YIELD: Record<string, SupportedDApp> = {
  STRK: "hyperxSTRK",
  WBTC: "hyperxWBTC",
  tBTC: "hyperxtBTC",
  LBTC: "hyperxLBTC",
  solvBTC: "hyperxsBTC",
  strkBTC: "hyperxstrkBTC",
};

export const PORTFOLIO_PROTOCOLS_BY_ASSET: Record<string, SupportedDApp[]> = {
  STRK: [
    "hyperxSTRK",
    "strkfarmEkubo",
    "vesu",
    "ekuboSTRK",
    "nostraDex",
    "opus",
  ],
  WBTC: ["hyperxWBTC", "ekuboxWBTC", "ekuboBTCxWBTC"],
  tBTC: ["hyperxtBTC", "ekuboxtBTC", "ekuboBTCxtBTC"],
  LBTC: ["hyperxLBTC", "ekuboxLBTC", "ekuboBTCxLBTC"],
  solvBTC: ["hyperxsBTC", "ekuboxsBTC", "ekuboBTCxsBTC"],
  strkBTC: [],
};

export const CONFIG_KEY_TO_HOLDINGS_KEY: Partial<
  Record<SupportedDApp, string>
> = {
  ekuboSTRK: "ekubo",
  ekuboxWBTC: "ekubo",
  ekuboxtBTC: "ekubo",
  ekuboxLBTC: "ekubo",
  ekuboxsBTC: "ekubo",
  vesu: "vesu",
  vesuBTCxWBTC: "vesu",
  vesuBTCxtBTC: "vesu",
  vesuBTCxLBTC: "vesu",
  vesuBTCxsBTC: "vesu",
  nostraDex: "nostraDex",
  nostraLending: "nostraLending",
  strkfarmEkubo: "strkfarmEkubo",
  hyperxSTRK: "trovesHyper",
  hyperxWBTC: "trovesHyper",
  hyperxtBTC: "trovesHyper",
  hyperxLBTC: "trovesHyper",
  hyperxsBTC: "trovesHyper",
  ekuboBTCxWBTC: "strkfarmEkubo",
  ekuboBTCxtBTC: "strkfarmEkubo",
  ekuboBTCxLBTC: "strkfarmEkubo",
  ekuboBTCxsBTC: "strkfarmEkubo",
  opus: "opus",
};

export function getHoldingsKeyForProtocol(protocol: SupportedDApp): string {
  return CONFIG_KEY_TO_HOLDINGS_KEY[protocol] ?? protocol;
}

export function getProtocolsForAssetSymbol(symbol: string): SupportedDApp[] {
  return PORTFOLIO_PROTOCOLS_BY_ASSET[symbol] ?? [];
}

export function isProtocolAllowedForAsset(
  protocol: SupportedDApp,
  assetSymbol: string,
): boolean {
  const allowed = PORTFOLIO_PROTOCOLS_BY_ASSET[assetSymbol];
  if (!allowed) return false;
  return allowed.includes(protocol);
}

export function getLstTokenKeyForAsset(symbol: string): string {
  return ASSET_SYMBOL_TO_LST_TOKEN[symbol] ?? "XSTRK";
}

export function portfolioDataTotalRaw(data: PortfolioData): bigint {
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

/** LST balances use 18 decimals for STRK-family; 8 for BTC-family LSTs. */
export function getPortfolioLstDecimals(lstToken: string): number {
  return lstToken === "XSTRK" || lstToken === "XSBTC" || lstToken === "XTBTC"
    ? 18
    : 8;
}

export function getLstUsdPrice(
  lstToken: string,
  rates: UsdConversionRates,
): number {
  const priceMap: Record<string, number> = {
    XSTRK: rates.xstrk,
    XWBTC: rates.xwbtc,
    XLBTC: rates.xlbtc,
    XSBTC: rates.xsbtc,
    XTBTC: rates.xtbtc,
    XSTRKBTC: rates.xstrkbtc,
  };
  return priceMap[lstToken] ?? rates.xstrk;
}

export function portfolioLstUsdValue(
  data: PortfolioData,
  lstToken: string,
  rates: UsdConversionRates,
): number {
  const total = portfolioDataTotalRaw(data);
  const decimals = getPortfolioLstDecimals(lstToken);
  const price = getLstUsdPrice(lstToken, rates);
  return (Number(total) / 10 ** decimals) * price;
}

export function portfolioDataTotalEther(
  data: PortfolioData | undefined,
  decimals: number,
): number {
  if (!data) return 0;
  return Number(
    new MyNumber(portfolioDataTotalRaw(data).toString(), decimals).toEtherStr(),
  );
}

export function portfolioWalletEther(
  data: PortfolioData | undefined,
  decimals: number,
): number {
  if (!data) return 0;
  return Number(
    new MyNumber(data.endur.balance, decimals).toEtherToFixedDecimals(6),
  );
}

export function portfolioDefiPieSlices(
  data: PortfolioData | undefined,
  decimals: number,
) {
  if (!data) return [];
  const pickRaw = (b: PortfolioBalance) =>
    BigInt(b.balance) > BigInt(0) ? b.balance : b.balanceInXstrk;

  const vesu =
    BigInt(pickRaw(data.vesuVtoken)) + BigInt(pickRaw(data.vesuCollateral));
  const strkfarm =
    BigInt(pickRaw(data.trovesSensei)) + BigInt(pickRaw(data.trovesEkubo));

  const slices = [
    { dapp: "endur", raw: pickRaw(data.endur) },
    { dapp: "ekubo", raw: pickRaw(data.ekubo) },
    { dapp: "vesu", raw: vesu.toString() },
    { dapp: "strkfarm", raw: strkfarm.toString() },
    { dapp: "trovesHyper", raw: pickRaw(data.trovesHyper) },
    { dapp: "nostra", raw: pickRaw(data.nostra) },
    { dapp: "opus", raw: pickRaw(data.opus) },
  ];

  return slices.map(({ dapp, raw }) => ({
    dapp,
    holdings: Number(new MyNumber(raw, decimals).toEtherStr()),
  }));
}
