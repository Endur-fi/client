import React, { useState, useEffect } from "react";
import { useSetAtom } from "jotai";
import { LST_CONFIG } from "@/constants";
import { lstConfigAtom } from "@/store/common.store"; // Adjust path if needed
import { Icons } from "./Icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface AssetSelectorProps {
  selectedAsset: string;
  onChange: (assetSymbol: string) => void;
}

const btcAssets = Object.values(LST_CONFIG).filter(
  (asset: (typeof LST_CONFIG)[keyof typeof LST_CONFIG]) =>
    asset?.SYMBOL?.toLowerCase().includes("btc"),
);

// Helper to get the first BTC asset symbol
export const getFirstBtcAsset = () => {
  return btcAssets.length > 0 ? btcAssets[0].SYMBOL : "";
};

// Component for BTC icons using SVG files from public folder
const BtcIcon: React.FC<{ symbol: string; className?: string }> = ({
  symbol,
  className,
}) => {
  const getIconPath = (tokenSymbol: string) => {
    switch (tokenSymbol.toLowerCase()) {
      case "wbtc":
        return "/wbtc.svg";
      case "tbtc":
        return "/tbtc.svg";
      case "lbtc":
        return "/lbtc.svg";
      case "solvbtc":
        return "/solvbtc.svg";
      case "tbtc1":
      case "tbtc2":
        return "/tbtc.svg"; // Use tbtc.svg for testnet tokens
      default:
        return "/wbtc.svg"; // Fallback to wbtc
    }
  };

  return (
    <Image
      src={getIconPath(symbol)}
      alt={`${symbol} icon`}
      width={24}
      height={24}
      className={className}
    />
  );
};

export const ASSET_ICONS: Record<string, React.FC<any>> = {
  STRK: Icons.strkLogo,
  TBTC1: (props: any) => <BtcIcon symbol="TBTC1" className={props.className} />,
  TBTC2: (props: any) => <BtcIcon symbol="TBTC2" className={props.className} />,
  WBTC: (props: any) => <BtcIcon symbol="WBTC" className={props.className} />,
  tBTC: (props: any) => <BtcIcon symbol="tBTC" className={props.className} />,
  LBTC: (props: any) => <BtcIcon symbol="LBTC" className={props.className} />,
  solvBTC: (props: any) => (
    <BtcIcon symbol="solvBTC" className={props.className} />
  ),
};

const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAsset,
  onChange,
}) => {
  const setLstConfig = useSetAtom(lstConfigAtom);
  const [isOpen, setIsOpen] = useState(false);

  // Set initial lstConfig when component mounts or selectedAsset changes
  useEffect(() => {
    if (selectedAsset) {
      const selected = btcAssets.find(
        (asset: any) => asset.SYMBOL === selectedAsset,
      );
      if (selected) setLstConfig(selected);
    }
  }, [selectedAsset, setLstConfig]);

  const handleAssetSelect = (symbol: string) => {
    onChange(symbol);
    const selected = btcAssets.find((asset: any) => asset.SYMBOL === symbol);
    if (selected) setLstConfig(selected);
    setIsOpen(false);
  };

  const selectedAssetData = btcAssets.find(
    (asset: any) => asset.SYMBOL === selectedAsset,
  );
  const SelectedIcon = ASSET_ICONS[selectedAsset];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-[#3F6870]">
        Select Asset
      </label>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-between gap-4 pr-3 text-sm focus:outline-none">
            <div className="flex items-center gap-2">
              {SelectedIcon && (
                <SelectedIcon className="size-6 h-4 w-4 lg:size-[35px]" />
              )}
              <span className="text-xl font-bold">{selectedAsset}</span>
            </div>
            <ChevronDown className="h-6 w-6 text-black" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]" align="start">
          {btcAssets.map((asset: any) => {
            const AssetIcon = ASSET_ICONS[asset.SYMBOL];
            return (
              <DropdownMenuItem
                key={asset.SYMBOL}
                onClick={() => handleAssetSelect(asset.SYMBOL)}
                className="flex cursor-pointer items-center gap-2"
              >
                {AssetIcon && <AssetIcon className="h-4 w-4" />}
                <span>{asset.SYMBOL}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AssetSelector;
