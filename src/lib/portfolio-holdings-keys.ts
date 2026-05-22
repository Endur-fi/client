import type { SupportedDApp } from "@/store/defi.store";

export const ASSET_SYMBOL_TO_LST_TOKEN: Record<string, string> = {
  STRK: "XSTRK",
  WBTC: "XWBTC",
  tBTC: "XTBTC",
  LBTC: "XLBTC",
  solvBTC: "XSBTC",
  strkBTC: "XSTRKBTC",
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
