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
];
