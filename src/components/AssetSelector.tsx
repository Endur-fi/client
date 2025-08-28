import React from "react";
import { useSetAtom } from "jotai";
import { LST_CONFIG } from "@/constants";
import { lstConfigAtom } from "@/store/common.store"; // Adjust path if needed

interface AssetSelectorProps {
  selectedAsset: string;
  onChange: (assetSymbol: string) => void;
}

const btcAssets = Object.values(LST_CONFIG).filter(
  (asset: (typeof LST_CONFIG)[keyof typeof LST_CONFIG]) =>
    asset?.SYMBOL?.toLowerCase().includes("btc"),
);

const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAsset,
  onChange,
}) => {
  const setLstConfig = useSetAtom(lstConfigAtom);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const symbol = e.target.value;
    onChange(symbol);
    const selected = btcAssets.find(
      (asset: any) => asset.symbol === symbol || asset.SYMBOL === symbol,
    );
    if (selected) setLstConfig(selected);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-[#3F6870]">
        Select Asset
      </label>
      <select
        className="rounded-md border px-3 py-2 text-sm"
        value={selectedAsset}
        onChange={handleChange}
      >
        {btcAssets.map((asset: any) => (
          <option
            key={asset.symbol || asset.SYMBOL}
            value={asset.symbol || asset.SYMBOL}
          >
            {asset.name || asset.symbol || asset.SYMBOL}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AssetSelector;
