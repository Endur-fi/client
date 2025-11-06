import React, { useState, useEffect, useMemo } from "react";
import { useSetAtom } from "jotai";
import { useAccount, useBalance } from "@starknet-react/core";
import { getLSTAssetsByCategory, getFirstBTCAsset } from "@/constants";
import { lstConfigAtom } from "@/store/common.store"; // Adjust path if needed
import { Icons } from "../../../components/Icons";
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
  mode?: "stake" | "unstake"; // Add mode prop to determine sorting logic
}

const btcAssets = getLSTAssetsByCategory("BTC");

// Helper to get the first BTC asset symbol
export const getFirstBtcAsset = (): string => {
  const firstBtcAsset = getFirstBTCAsset();
  return firstBtcAsset ? firstBtcAsset.SYMBOL : "";
};

// Custom hook to get BTC token balances
const useBtcTokenBalances = () => {
  const { address } = useAccount();

  // Get balances for each BTC token individually
  const wbtcBalance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "WBTC")
      ?.ASSET_ADDRESS as `0x${string}`,
  });

  const tbtcBalance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "tBTC")
      ?.ASSET_ADDRESS as `0x${string}`,
  });

  const lbtcBalance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "LBTC")
      ?.ASSET_ADDRESS as `0x${string}`,
  });

  const solvbtcBalance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "solvBTC")
      ?.ASSET_ADDRESS as `0x${string}`,
  });

  const tbtc1Balance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "TBTC1")
      ?.ASSET_ADDRESS as `0x${string}`,
  });

  const tbtc2Balance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "TBTC2")
      ?.ASSET_ADDRESS as `0x${string}`,
  });

  return btcAssets.map((asset) => {
    let balance = BigInt(0);

    switch (asset.SYMBOL) {
      case "WBTC":
        balance = wbtcBalance.data?.value || BigInt(0);
        break;
      case "tBTC":
        balance = tbtcBalance.data?.value || BigInt(0);
        break;
      case "LBTC":
        balance = lbtcBalance.data?.value || BigInt(0);
        break;
      case "solvBTC":
        balance = solvbtcBalance.data?.value || BigInt(0);
        break;
      case "TBTC1":
        balance = tbtc1Balance.data?.value || BigInt(0);
        break;
      case "TBTC2":
        balance = tbtc2Balance.data?.value || BigInt(0);
        break;
      default:
        balance = BigInt(0);
    }

    return {
      symbol: asset.SYMBOL,
      decimals: asset.DECIMALS,
      balance,
      asset,
    };
  });
};

// Custom hook to get xBTC token balances (for unstake mode)
const useXBtcTokenBalances = () => {
  const { address } = useAccount();

  // Get balances for each xBTC token individually
  const xwbtcBalance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "WBTC")
      ?.LST_ADDRESS as `0x${string}`,
  });

  const xtbtcBalance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "tBTC")
      ?.LST_ADDRESS as `0x${string}`,
  });

  const xlbtcBalance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "LBTC")
      ?.LST_ADDRESS as `0x${string}`,
  });

  const xsolvbtcBalance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "solvBTC")
      ?.LST_ADDRESS as `0x${string}`,
  });

  const xtbtc1Balance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "TBTC1")
      ?.LST_ADDRESS as `0x${string}`,
  });

  const xtbtc2Balance = useBalance({
    address,
    token: btcAssets.find((asset) => asset.SYMBOL === "TBTC2")
      ?.LST_ADDRESS as `0x${string}`,
  });

  return btcAssets.map((asset) => {
    let balance = BigInt(0);

    switch (asset.SYMBOL) {
      case "WBTC":
        balance = xwbtcBalance.data?.value || BigInt(0);
        break;
      case "tBTC":
        balance = xtbtcBalance.data?.value || BigInt(0);
        break;
      case "LBTC":
        balance = xlbtcBalance.data?.value || BigInt(0);
        break;
      case "solvBTC":
        balance = xsolvbtcBalance.data?.value || BigInt(0);
        break;
      case "TBTC1":
        balance = xtbtc1Balance.data?.value || BigInt(0);
        break;
      case "TBTC2":
        balance = xtbtc2Balance.data?.value || BigInt(0);
        break;
      default:
        balance = BigInt(0);
    }

    return {
      symbol: asset.SYMBOL,
      decimals: asset.DECIMALS,
      balance,
      asset,
    };
  });
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
  mode = "stake", // Default to stake mode
}) => {
  const setLstConfig = useSetAtom(lstConfigAtom);
  const [isOpen, setIsOpen] = useState(false);
  const btcBalances = useBtcTokenBalances();
  const xBtcBalances = useXBtcTokenBalances();

  // Sort BTC assets based on mode
  const sortedBtcAssets = useMemo(() => {
    if (mode === "stake") {
      // Sort by BTC token balance (descending)
      return [...btcAssets].sort((a, b) => {
        const tokenAInfo = btcBalances.find((ba) => ba.symbol === a.SYMBOL);
        const tokenBInfo = btcBalances.find((ba) => ba.symbol === b.SYMBOL);
        const balanceA =
          Number(tokenAInfo?.balance) / 10 ** (tokenAInfo?.decimals || 0) || 0;
        const balanceB =
          Number(tokenBInfo?.balance) / 10 ** (tokenBInfo?.decimals || 0) || 0;
        return Number(balanceB) - Number(balanceA);
      });
    }
    // Sort by xBTC token balance (descending) - for unstake mode
    return [...btcAssets].sort((a, b) => {
      const tokenAInfo = xBtcBalances.find((ba) => ba.symbol === a.SYMBOL);
      const tokenBInfo = xBtcBalances.find((ba) => ba.symbol === b.SYMBOL);
      const balanceA =
        Number(tokenAInfo?.balance) / 10 ** (tokenAInfo?.decimals || 0) || 0;
      const balanceB =
        Number(tokenBInfo?.balance) / 10 ** (tokenBInfo?.decimals || 0) || 0;
      return Number(balanceB) - Number(balanceA);
    });
  }, [mode, btcBalances, xBtcBalances]);

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
          {sortedBtcAssets.map((asset: any) => {
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
