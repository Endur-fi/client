import type { PortfolioData } from "@/lib/portfolio-types";
import { ASSET_SYMBOL_TO_LST_TOKEN } from "@/lib/portfolio-holdings-keys";
import MyNumber from "@/lib/MyNumber";

export function getLstTokenKeyForAsset(symbol: string): string {
  return ASSET_SYMBOL_TO_LST_TOKEN[symbol] ?? "XSTRK";
}

export function portfolioDataTotalEther(
  data: PortfolioData | undefined,
  decimals: number,
): number {
  if (!data) return 0;
  const sum =
    BigInt(data.endur.balance) +
    BigInt(data.ekubo.balance) +
    BigInt(data.vesuCollateral.balance) +
    BigInt(data.vesuVtoken.balance) +
    BigInt(data.trovesSensei.balance) +
    BigInt(data.trovesHyper.balance) +
    BigInt(data.trovesEkubo.balance) +
    BigInt(data.nostra.balance) +
    BigInt(data.opus.balance);
  return Number(new MyNumber(sum.toString(), decimals).toEtherStr());
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
  const vesu =
    BigInt(data.vesuVtoken.balance) + BigInt(data.vesuCollateral.balance);
  const strkfarm =
    BigInt(data.trovesSensei.balance) + BigInt(data.trovesEkubo.balance);

  const slices = [
    { dapp: "endur", raw: data.endur.balance },
    { dapp: "ekubo", raw: data.ekubo.balance },
    { dapp: "vesu", raw: vesu.toString() },
    { dapp: "strkfarm", raw: strkfarm.toString() },
    { dapp: "trovesHyper", raw: data.trovesHyper.balance },
    { dapp: "nostra", raw: data.nostra.balance },
    { dapp: "opus", raw: data.opus.balance },
  ];

  return slices.map(({ dapp, raw }) => ({
    dapp,
    holdings: Number(new MyNumber(raw, decimals).toEtherStr()),
  }));
}
