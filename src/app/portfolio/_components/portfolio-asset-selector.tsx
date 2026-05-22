"use client";

import { useAtom } from "jotai";
import React from "react";

import { Icons } from "@/components/Icons";
import { getLSTAssetsByCategory, getSTRKAsset, LST_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";
import { lstConfigAtom } from "@/store/common.store";
import { portfolioAssetSymbolAtom } from "@/store/portfolio.store";

const ASSET_OPTIONS = [
  { symbol: "STRK", label: "xSTRK", icon: Icons.endurLogo },
  ...getLSTAssetsByCategory("BTC").map((asset) => ({
    symbol: asset.SYMBOL,
    label: asset.LST_SYMBOL,
    icon:
      asset.LST_SYMBOL === "xWBTC"
        ? Icons.xwbtc
        : asset.LST_SYMBOL === "xtBTC"
          ? Icons.xtbtc
          : asset.LST_SYMBOL === "xLBTC"
            ? Icons.xlbtc
            : asset.LST_SYMBOL === "xsBTC"
              ? Icons.xsbtc
              : Icons.xstrkbtc,
  })),
];

const PortfolioAssetSelector: React.FC = () => {
  const [selected, setSelected] = useAtom(portfolioAssetSymbolAtom);
  const [, setLstConfig] = useAtom(lstConfigAtom);

  const onSelect = (symbol: string) => {
    setSelected(symbol);
    const config = LST_CONFIG[symbol] ?? getSTRKAsset();
    setLstConfig(config);
  };

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {ASSET_OPTIONS.map(({ symbol, label, icon: Icon }) => (
        <button
          key={symbol}
          type="button"
          onClick={() => onSelect(symbol)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-[#0000000D] bg-white px-3 py-2 text-xs font-medium text-[#5B616D] shadow-sm",
            selected === symbol && "bg-[#17876D] text-white",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default PortfolioAssetSelector;
