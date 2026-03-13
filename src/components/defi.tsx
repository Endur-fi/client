"use client";

import { useAtomValue } from "jotai";
import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HelpCircle,
  OctagonAlert,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { MyAnalytics } from "@/lib/analytics";
import { cn, eventNames, formatNumber } from "@/lib/utils";
import {
  protocolYieldsAtom,
  SupportedDApp,
  vesuBTCxWBTCYieldAtom,
  vesuBTCxtBTCYieldAtom,
  vesuBTCxLBTCYieldAtom,
  vesuBTCxsBTCYieldAtom,
  trovesHyperxWBTCYieldAtom,
  trovesHyperxtBTCYieldAtom,
  trovesHyperxLBTCYieldAtom,
  trovesHyperxsBTCYieldAtom,
  trovesHyperxSTRKYieldAtom,
  trovesEkuboBTCxWBTCYieldAtom,
  trovesEkuboBTCxtBTCYieldAtom,
  trovesEkuboBTCxLBTCYieldAtom,
  trovesEkuboBTCxsBTCYieldAtom,
  vesuBorrowPoolsAtom,
  vesuPoolsFilteredAtom,
  VesuBorrowPool,
  hyperxWBTCVaultCapacityAtom,
  hyperxtBTCVaultCapacityAtom,
  hyperxLBTCVaultCapacityAtom,
  hyperxsBTCVaultCapacityAtom,
  hyperxSTRKVaultCapacityAtom,
  vesuContributorSupplyPoolsAtom,
  ekuboYieldAtom,
  VaultCapacity,
  APRSplit,
} from "@/store/defi.store";
import { useAtom } from "jotai";
import { assetPriceAtom } from "@/store/common.store";
import { btcPriceAtom } from "@/store/staking.store";

import DefiCard, {
  ProtocolAction,
  ProtocolBadge,
  TokenDisplay,
} from "./defi-card";
import { Icons } from "./Icons";
import { MyDottedTooltip } from "./my-tooltip";
import {
  Tabs as ShadCNTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Progress } from "./ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ChevronDown } from "lucide-react";
import MyHeader from "./header";

export const POINTS_CONFIG = {
  USDC_BORROWING: 3, // additional 3x of borrowed value normalised
  UNDERLYING_BORROWING: 0, // no additional points for underlying borrowing
  STAKING: 1, // simply for staking
};
export interface ProtocolConfig {
  tokens: TokenDisplay[];
  protocolIcon: React.ReactNode;
  protocolName: string;
  badges: ProtocolBadge[];
  description: string;
  apy?: number; // not %
  action?: ProtocolAction;
  pointsMultiplier?: { min: number; max: number; description: string };
  externalPointsInfo?: string | null; // "+Vesu Points" for vesu linked protocols, null for rest
}

// Factory function for Ekubo pool configs
const createEkuboPoolConfig = (
  token1: { icon: React.ReactNode; name: string },
  token2: { icon: React.ReactNode; name: string },
  quoteCurrency: string,
  baseCurrency: string,
  protocolKey: string,
): ProtocolConfig => ({
  tokens: [token1, token2],
  protocolIcon: <Icons.ekuboLogo className="rounded-full" />,
  protocolName: "Ekubo",
  badges: [{ type: "Liquidity Pool", color: "bg-[#FFF7ED] text-[#EA580C]" }],
  description: `Provide liquidity to the ${token1.name}/${token2.name} pool on Ekubo and earn trading fees & DeFi Spring rewards`,
  externalPointsInfo: null,
  action: {
    type: "pool",
    link: `https://app.ekubo.org/starknet/positions/new?quoteCurrency=${quoteCurrency}&baseCurrency=${baseCurrency}`,
    buttonText: "Add Liquidity",
    onClick: () => {
      MyAnalytics.track(eventNames.OPPORTUNITIES, {
        protocol: protocolKey,
        buttonText: "Add Liquidity",
      });
    },
  },
  pointsMultiplier: {
    min: 8,
    max: 12,
    description: `To boost DEX liquidity of ${token1.name}/${token2.name} pool, this pool receives high season 2 points under contributor category. It is important to ensure liquidity is provided within 0.5% of the true price of LST. Your entire position value in either tokens is counter for points.`,
  },
});

// Factory functions for protocol configs
const createTrovesEkuboLiquidityConfig = (
  key: string,
  token1: { icon: React.ReactNode; name: string },
  token2: { icon: React.ReactNode; name: string },
  strategyPath: string,
  protocolKey: string,
): ProtocolConfig => ({
  tokens: [token1, token2],
  protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
  protocolName: "Troves",
  badges: [
    {
      type: "Automated Liquidity Pool",
      color: "bg-[#E9F3F0] text-[#17876D]",
    },
  ],
  description: `Auto-managed liquidity vault for Ekubo's ${token1.name}/${token2.name} pool. Rebalances range and compounds fees and rewards automatically.`,
  pointsMultiplier: {
    min: 8,
    max: 15,
    description: `To boost liquidity of ${token1.name}/${token2.name} pool, this pool receives high season 2 points under contributor category. Without the headache of active rebalancing, this pool is a great way to earn points. Your entire position value in either tokens is counted for points.`,
  },
  externalPointsInfo: null,
  action: {
    type: "pool",
    link: `https://app.troves.fi/strategy/${strategyPath}`,
    buttonText: "Add Liquidity",
    onClick: () => {
      MyAnalytics.track(eventNames.OPPORTUNITIES, {
        protocol: protocolKey,
        buttonText: "Add Liquidity",
      });
    },
  },
});

// STRK protocol configurations
export const strkProtocolConfigs: Partial<
  Record<SupportedDApp, ProtocolConfig>
> = {
  strkfarmEkubo: createTrovesEkuboLiquidityConfig(
    "strkfarmEkubo",
    { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
    { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    "ekubo_cl_xstrkstrk",
    "trovesEkubo",
  ),
  avnu: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.avnuLogo className="rounded-full border" />,
    protocolName: "Avnu",
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xSTRK for STRK on Avnu",
    externalPointsInfo: null,
    action: {
      type: "swap",
      link: "https://app.avnu.fi/en?mode=simple&tokenFrom=0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a&tokenTo=0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d&amount=100",
      buttonText: "Swap Tokens",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "anvu",
          buttonText: "Swap Tokens",
        });
      },
    },
  },
  fibrous: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.fibrousLogo className="rounded-full" />,
    protocolName: "Fibrous",
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xSTRK for STRK on Fibrous",
    externalPointsInfo: null,
    action: {
      type: "swap",
      link: "https://app.fibrous.finance/en?network=starknet&mode=swap&source=0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a&destination=0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      buttonText: "Swap Tokens",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "fibrous",
          buttonText: "Swap Tokens",
        });
      },
    },
  },
  nostraDex: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.nostraLogo className="shrink-0 rounded-full" />,
    protocolName: "Nostra (DEX)",
    badges: [{ type: "Liquidity Pool", color: "bg-[#FFF7ED] text-[#EA580C]" }],
    description:
      "Provide liquidity to the xSTRK/STRK pool on Nostra and earn trading fees",
    externalPointsInfo: null,
    action: {
      type: "pool",
      link: "https://app.nostra.finance/pools/xSTRK-STRK/deposit",
      buttonText: "Add Liquidity",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "nostra-pool",
          buttonText: "Add Liquidity",
        });
      },
    },
  },
  ekuboSTRK: createEkuboPoolConfig(
    { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
    { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", // STRK
    "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a", // xSTRK
    "ekuboSTRK",
  ),
  opus: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.cashLogo className="size-[22px]" />, name: "CASH" },
    ],
    protocolIcon: <Icons.opusLogo className="rounded-full" />,
    badges: [{ type: "Lend/Borrow", color: "bg-[#EEF6FF] text-[#0369A1]" }],
    protocolName: "Opus",
    description:
      "Deposit your xSTRK on Opus to borrow CASH and earn more rewards",
    externalPointsInfo: null,
    apy: 0.06, // 6% hardcoded for borrow
    action: {
      type: "borrow",
      link: "https://app.opus.money/",
      buttonText: "Borrow",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "opus",
          buttonText: "Borrow",
        });
      },
    },
  },
};

const createHyperVaultConfig = (
  token: { icon: React.ReactNode; name: string },
  borrowToken: string,
  strategyPath: string,
  protocolKey: string,
): ProtocolConfig => ({
  tokens: [token],
  protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
  protocolName: "Troves",
  badges: [
    {
      type: "Hyper Vault",
      color: "bg-[#E9F3F0] text-[#17876D]",
    },
  ],
  description: `Automated leveraged looping strategy for ${token.name}. Maximizes yield through borrowing ${borrowToken} and lending ${token.name} on Vesu.`,
  pointsMultiplier: {
    min: token.name === "xSTRK" ? 1 : 1,
    max: token.name === "xSTRK" ? 3 : 5,
    description: `A one-click vault that amplifies yield and points through real leverage. Rather than relying on bonus multipliers, the vault expands your deposited asset value by 3–5× by borrowing the underlying assets on Vesu and staking them back.`,
  },
  action: {
    type: "vault",
    link: `https://app.troves.fi/strategy/${strategyPath}`,
    buttonText: "Invest",
    onClick: () => {
      MyAnalytics.track(eventNames.OPPORTUNITIES, {
        protocol: protocolKey,
        buttonText: "Invest",
      });
    },
  },
});

// TODO, Add Trade tab and move them there
const createAvnuSwapConfig = (
  token1: { icon: React.ReactNode; name: string },
  token2: { icon: React.ReactNode; name: string },
  tokenFrom: string,
  tokenTo: string,
  protocolKey: string,
): ProtocolConfig => ({
  tokens: [token1, token2],
  protocolIcon: <Icons.avnuLogo className="rounded-full border" />,
  protocolName: "Avnu",
  badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
  description: `Swap ${token1.name} for ${token2.name} on Avnu DEX aggregator`,
  externalPointsInfo: null,
  action: {
    type: "swap",
    link: `https://app.avnu.fi/en?mode=simple&tokenFrom=${tokenFrom}&tokenTo=${tokenTo}&amount=100`,
    buttonText: "Swap Tokens",
    onClick: () => {
      MyAnalytics.track(eventNames.OPPORTUNITIES, {
        protocol: protocolKey,
        buttonText: "Swap Tokens",
      });
    },
  },
});

// Generic function to create Vesu lending configs from pools
const createVesuLendingConfigsFromPools = (
  pools: VesuBorrowPool[],
): Record<string, ProtocolConfig> => {
  const configs: Record<string, ProtocolConfig> = {};

  // Group by collateral symbol to create lending configs
  const poolsByCollateral = pools.reduce(
    (acc, pool) => {
      if (!acc[pool.collateralSymbol]) {
        acc[pool.collateralSymbol] = pool;
      }
      return acc;
    },
    {} as Record<string, VesuBorrowPool>,
  );

  Object.values(poolsByCollateral).forEach((pool) => {
    const key = `vesuLending_${pool.collateralSymbol}`;
    configs[key] = {
      tokens: [
        {
          icon: getTokenIcon(pool.collateralSymbol),
          name: pool.collateralSymbol,
        },
      ],
      protocolIcon: <Icons.vesuLogo className="rounded-full" />,
      protocolName: "Vesu",
      badges: [{ type: "Lending Pool", color: "bg-[#E8F4FD] text-[#1E40AF]" }],
      description: `Lend and borrow against ${pool.collateralSymbol} on Vesu`,
      externalPointsInfo: "+Vesu Points",
      action: {
        type: "lend",
        link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
        buttonText: "Lend & Borrow",
        onClick: () => {
          MyAnalytics.track(eventNames.OPPORTUNITIES, {
            protocol: `vesuLending_${pool.collateralSymbol}`,
            buttonText: "Lend & Borrow",
          });
        },
      },
    };
  });

  return configs;
};

// Legacy function for backward compatibility
const _createVesuLendingConfig = (
  token: { icon: React.ReactNode; name: string },
  protocolKey: string,
): ProtocolConfig => ({
  tokens: [token],
  protocolIcon: <Icons.vesuLogo className="rounded-full" />,
  protocolName: "Vesu",
  badges: [{ type: "Lending Pool", color: "bg-[#E8F4FD] text-[#1E40AF]" }],
  description: `Lend and borrow against ${token.name} on Vesu`,
  externalPointsInfo: "+Vesu Points",
  action: {
    type: "lend",
    link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
    buttonText: "Lend & Borrow",
    onClick: () => {
      MyAnalytics.track(eventNames.OPPORTUNITIES, {
        protocol: protocolKey,
        buttonText: "Lend & Borrow",
      });
    },
  },
});

// BTC-specific protocol configurations
export const btcProtocolConfigs: Partial<
  Record<SupportedDApp, ProtocolConfig>
> = {
  // Ekubo Direct Pool Configurations
  ekuboxWBTC: createEkuboPoolConfig(
    { icon: <Icons.xwbtc className="size-[22px]" />, name: "xWBTC" },
    { icon: <Icons.wbtc className="size-[22px]" />, name: "WBTC" },
    "0x3fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac", // WBTC
    "0x6a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13", // xWBTC
    "ekuboxWBTC",
  ),
  ekuboxtBTC: createEkuboPoolConfig(
    { icon: <Icons.xtbtc className="size-[22px]" />, name: "xtBTC" },
    { icon: <Icons.tbtc className="size-[22px]" />, name: "tBTC" },
    "0x4daa17763b286d1e59b97c283c0b8c949994c361e426a28f743c67bdfe9a32f", // tBTC
    "0x43a35c1425a0125ef8c171f1a75c6f31ef8648edcc8324b55ce1917db3f9b91", // xtBTC
    "ekuboxtBTC",
  ),
  ekuboxLBTC: createEkuboPoolConfig(
    { icon: <Icons.xlbtc className="size-[22px]" />, name: "xLBTC" },
    { icon: <Icons.lbtc className="size-[22px]" />, name: "LBTC" },
    "0x036834a40984312f7f7de8d31e3f6305b325389eaeea5b1c0664b2fb936461a4", // LBTC
    "0x7dd3c80de9fcc5545f0cb83678826819c79619ed7992cc06ff81fc67cd2efe0", // xLBTC
    "ekuboxLBTC",
  ),
  ekuboxsBTC: createEkuboPoolConfig(
    { icon: <Icons.xsbtc className="size-[22px]" />, name: "xsBTC" },
    { icon: <Icons.solvbtc className="size-[22px]" />, name: "solvBTC" },
    "0x0593e034dda23eea82d2ba9a30960ed42cf4a01502cc2351dc9b9881f9931a68", // solvBTC
    "0x580f3dc564a7b82f21d40d404b3842d490ae7205e6ac07b1b7af2b4a5183dc9", // xsBTC
    "ekuboxsBTC",
  ),

  // BTC Concentrated Liquidity Strategies
  ekuboBTCxWBTC: createTrovesEkuboLiquidityConfig(
    "ekuboBTCxWBTC",
    { icon: <Icons.xwbtc className="size-[22px]" />, name: "xWBTC" },
    { icon: <Icons.wbtc className="size-[22px]" />, name: "WBTC" },
    "ekubo_cl_xwbtcwbtc",
    "trovesEkuboBTCxWBTC",
  ),
  ekuboBTCxtBTC: createTrovesEkuboLiquidityConfig(
    "ekuboBTCxtBTC",
    { icon: <Icons.xtbtc className="size-[22px]" />, name: "xtBTC" },
    { icon: <Icons.tbtc className="size-[22px]" />, name: "tBTC" },
    "ekubo_cl_xtbtctbtc",
    "trovesEkuboBTCxtBTC",
  ),
  ekuboBTCxLBTC: createTrovesEkuboLiquidityConfig(
    "ekuboBTCxLBTC",
    { icon: <Icons.xlbtc className="size-[22px]" />, name: "xLBTC" },
    { icon: <Icons.lbtc className="size-[22px]" />, name: "LBTC" },
    "ekubo_cl_xlbtclbtc",
    "trovesEkuboBTCxLBTC",
  ),
  ekuboBTCxsBTC: createTrovesEkuboLiquidityConfig(
    "ekuboBTCxsBTC",
    { icon: <Icons.xsbtc className="size-[22px]" />, name: "xsBTC" },
    { icon: <Icons.solvbtc className="size-[22px]" />, name: "solvBTC" },
    "ekubo_cl_xsbtcsolvbtc",
    "trovesEkuboBTCxsBTC",
  ),

  // Hyper Vault Strategies
  hyperxSTRK: createHyperVaultConfig(
    { icon: <Icons.strkLogo className="size-[22px]" />, name: "xSTRK" },
    "STRK",
    "hyper_xstrk",
    "trovesHyperBTCxSTRK",
  ),
  hyperxWBTC: createHyperVaultConfig(
    { icon: <Icons.xwbtc className="size-[22px]" />, name: "xWBTC" },
    "WBTC",
    "hyper_xwbtc",
    "trovesHyperBTCxWBTC",
  ),
  hyperxtBTC: createHyperVaultConfig(
    { icon: <Icons.xtbtc className="size-[22px]" />, name: "xtBTC" },
    "tBTC",
    "hyper_xtbtc",
    "trovesHyperBTCxtBTC",
  ),
  hyperxsBTC: createHyperVaultConfig(
    { icon: <Icons.xsbtc className="size-[22px]" />, name: "xsBTC" },
    "solvBTC",
    "hyper_xsbtc",
    "trovesHyperBTCxsBTC",
  ),
  hyperxLBTC: createHyperVaultConfig(
    { icon: <Icons.xlbtc className="size-[22px]" />, name: "xLBTC" },
    "LBTC",
    "hyper_xlbtc",
    "trovesHyperBTCxLBTC",
  ),

  // BTC Token Swapping on Avnu
  avnuBTCxWBTC: createAvnuSwapConfig(
    { icon: <Icons.xwbtc className="size-[22px]" />, name: "xWBTC" },
    { icon: <Icons.wbtc className="size-[22px]" />, name: "WBTC" },
    "0x6a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13",
    "0x3fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    "avnuBTCxWBTC",
  ),
  avnuBTCxtBTC: createAvnuSwapConfig(
    { icon: <Icons.xtbtc className="size-[22px]" />, name: "xtBTC" },
    { icon: <Icons.tbtc className="size-[22px]" />, name: "tBTC" },
    "0x43a35c1425a0125ef8c171f1a75c6f31ef8648edcc8324b55ce1917db3f9b91",
    "0x4daa17763b286d1e59b97c283c0b8c949994c361e426a28f743c67bdfe9a32f",
    "avnuBTCxtBTC",
  ),
  avnuBTCxLBTC: createAvnuSwapConfig(
    { icon: <Icons.xlbtc className="size-[22px]" />, name: "xLBTC" },
    { icon: <Icons.lbtc className="size-[22px]" />, name: "LBTC" },
    "0x7dd3c80de9fcc5545f0cb83678826819c79619ed7992cc06ff81fc67cd2efe0",
    "0x036834a40984312f7f7de8d31e3f6305b325389eaeea5b1c0664b2fb936461a4",
    "avnuBTCxLBTC",
  ),
  avnuBTCxsBTC: createAvnuSwapConfig(
    { icon: <Icons.xsbtc className="size-[22px]" />, name: "xsBTC" },
    { icon: <Icons.solvbtc className="size-[22px]" />, name: "solvBTC" },
    "0x580f3dc564a7b82f21d40d404b3842d490ae7205e6ac07b1b7af2b4a5183dc9",
    "0x0593e034dda23eea82d2ba9a30960ed42cf4a01502cc2351dc9b9881f9931a68",
    "avnuBTCxsBTC",
  ),

  // Note: Vesu BTC Lending Pools are now dynamically generated from API
  // These are kept for backward compatibility but may be removed if not needed
  // vesuBTCxWBTC, vesuBTCxtBTC, vesuBTCxLBTC, vesuBTCxsBTC
};

// Combine all protocol configs
export const protocolConfigs: Partial<Record<SupportedDApp, ProtocolConfig>> = {
  ...strkProtocolConfigs,
  ...btcProtocolConfigs,
};

// Categorize protocols by type
const supplyProtocols: SupportedDApp[] = [
  "strkfarm",
  "strkfarmEkubo",
  "vesu",
  "ekuboSTRK",
  "ekuboxWBTC",
  "ekuboxtBTC",
  "ekuboxLBTC",
  "ekuboxsBTC",
  "nostraDex",
  // "opus",
  "hyperxSTRK",
  "hyperxWBTC",
  "hyperxtBTC",
  "hyperxsBTC",
  "hyperxLBTC",
  "ekuboBTCxWBTC",
  "ekuboBTCxtBTC",
  "ekuboBTCxLBTC",
  "ekuboBTCxsBTC",
  // Vesu lending pools are now dynamically added via vesuLendingConfigs
  // "avnu",
  // "fibrous",
  // "avnuBTCxWBTC",
  // "avnuBTCxtBTC",
  // "avnuBTCxLBTC",
  // "avnuBTCxsBTC",
];

const _borrowProtocols: SupportedDApp[] = [
  // Add borrow-specific protocols here when available
];

// Asset filter options
type AssetFilter = "all" | "xSTRK" | "xtBTC" | "xLBTC" | "xWBTC" | "xsBTC";

// Protocol filter options
type ProtocolFilter = "all" | "Ekubo" | "Vesu" | "Nostra" | "Troves" | "Opus";

// Filters Component
interface FiltersProps {
  assetFilters: AssetFilter[];
  protocolFilters: ProtocolFilter[];
  selectedAsset: AssetFilter;
  selectedProtocol: ProtocolFilter;
  showMoreFilters: boolean;
  activeTab: "earn" | "borrow" | "contribute-liquidity";
  showStablesOnly?: boolean;
  onAssetChange: (asset: AssetFilter) => void;
  onProtocolChange: (protocol: ProtocolFilter) => void;
  onToggleMoreFilters: () => void;
  onShowStablesOnlyChange?: (value: boolean) => void;
}

const Filters: React.FC<FiltersProps> = ({
  assetFilters,
  protocolFilters,
  selectedAsset,
  selectedProtocol,
  showMoreFilters,
  activeTab,
  showStablesOnly = false,
  onAssetChange,
  onProtocolChange,
  onToggleMoreFilters,
  onShowStablesOnlyChange,
}) => {
  // Helper function to get icon for each asset
  const getAssetIcon = (asset: AssetFilter) => {
    switch (asset) {
      case "xSTRK":
        return <Icons.endurLogo className="h-4 w-4" />;
      case "xtBTC":
        return <Icons.xtbtc className="h-4 w-4" />;
      case "xLBTC":
        return <Icons.xlbtc className="h-4 w-4" />;
      case "xWBTC":
        return <Icons.xwbtc className="h-4 w-4" />;
      case "xsBTC":
        return <Icons.xsbtc className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Asset Filters */}
      <div className="">
        {/* <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-[#5B616D]">Assets</p>
         
        </div> */}
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {assetFilters.map((asset) => {
              const icon = getAssetIcon(asset);
              return (
                <button
                  key={asset}
                  onClick={() => onAssetChange(asset)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border border-[#0000000D] bg-white px-3 py-2 text-xs font-medium text-[#5B616D] shadow-sm",
                    {
                      "bg-[#17876D] text-white": selectedAsset === asset,
                    },
                  )}
                >
                  {icon}
                  {asset === "all" ? "All Assets" : asset}
                </button>
              );
            })}
          </div>
          {activeTab === "earn" && (
            <button
              onClick={onToggleMoreFilters}
              className="flex items-center gap-1 rounded-lg border border-[#0000000D] bg-[#F2F2F4CC] px-3 py-2 text-xs font-medium text-[#6B7780] shadow-sm"
            >
              Show more filters
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", {
                  "rotate-180": showMoreFilters,
                })}
              />
            </button>
          )}
          {activeTab === "borrow" && onShowStablesOnlyChange && (
            <button
              onClick={() => onShowStablesOnlyChange(!showStablesOnly)}
              className="flex items-center gap-2 rounded-lg border border-[#0000000D] bg-white px-3 py-2 text-xs font-medium text-[#5B616D] shadow-sm"
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                  showStablesOnly
                    ? "border-[#17876D] bg-[#17876D]"
                    : "border-[#6B7780] bg-transparent",
                )}
              >
                {showStablesOnly && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <span>Show stables only</span>
            </button>
          )}
        </div>
      </div>

      {/* Protocol Filters */}
      <div
        className={cn("mb-4 lg:mb-0", {
          hidden: !showMoreFilters,
        })}
      >
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <p className="mb-0 text-sm font-medium text-[#1A1F24]">Protocols:</p>
          {protocolFilters.map((protocol) => (
            <button
              key={protocol}
              onClick={() => onProtocolChange(protocol)}
              className={cn(
                "rounded-lg border border-[#0000000D] bg-white px-3 py-2 text-xs font-medium text-[#5B616D] shadow-sm",
                {
                  "bg-[#17876D] text-white": selectedProtocol === protocol,
                },
              )}
            >
              {protocol === "all" ? "All Protocols" : protocol}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Token icon mapping - centralized for reusability
const TOKEN_ICON_MAP: Record<string, (className?: string) => React.ReactNode> =
  {
    xSTRK: (className) => <Icons.endurLogo className={className} />,
    xWBTC: (className) => <Icons.xwbtc className={className} />,
    xtBTC: (className) => <Icons.xtbtc className={className} />,
    xLBTC: (className) => <Icons.xlbtc className={className} />,
    xsBTC: (className) => <Icons.xsbtc className={className} />,
    STRK: (className) => <Icons.strkLogo className={className} />,
    WBTC: (className) => <Icons.wbtc className={className} />,
    tBTC: (className) => <Icons.tbtc className={className} />,
    LBTC: (className) => <Icons.lbtc className={className} />,
    solvBTC: (className) => <Icons.solvbtc className={className} />,
    ETH: (className) => <Icons.eth className={className} />,
    USDC: (className) => <Icons.usdcLogo className={className} />,
    "USDC.e": (className) => <Icons.usdcLogo className={className} />,
    USDT: (className) => <Icons.usdt className={className} />,
    CASH: (className) => <Icons.cashLogo className={className} />,
  };

// Helper function to get token icon by symbol
const getTokenIcon = (
  symbol: string,
  className = "size-[22px]",
): React.ReactNode => {
  const iconFactory = TOKEN_ICON_MAP[symbol];
  if (iconFactory) return iconFactory(className);
  if (symbol.includes("BTC")) return <Icons.btcLogo className={className} />;
  return <Icons.btcLogo className={className} />;
};

// Helper function to calculate borrow pool capacity and related data
const calculateBorrowPoolData = (
  config: ProtocolConfig,
  vesuBorrowPools: VesuBorrowPool[],
  formatNumber: (value: number) => string,
) => {
  // For borrow pools, use the apy from config
  const apyValue = config.apy !== undefined ? config.apy * 100 : null;
  const isLoading = false;

  const tokenPair = config.tokens.map((t: TokenDisplay) => t.name).join("/");
  const primaryToken = config.tokens[0];
  const secondaryToken = config.tokens[1];
  const badgeType = config.badges[0]?.type || "";

  // Find the corresponding pool for capacity data
  const pool = vesuBorrowPools.find(
    (p) =>
      primaryToken &&
      secondaryToken &&
      p.collateralSymbol === primaryToken.name &&
      p.debtSymbol === secondaryToken.name &&
      config.badges.map((b) => b.type).includes(p.poolName),
  );
  // Values are already converted from wei to human-readable format in the store
  const totalDebt = pool ? pool.totalDebt : 0;
  const debtCap = pool ? pool.debtCap : 0;
  const totalSupplied = pool ? pool.totalSupplied : 0;

  const debtPrice = pool ? pool.debtPrice : 0;

  // Cap should be min(available supply + borrowed, debt cap)
  // available supply + borrowed = (totalSupplied - totalDebt) + totalDebt = totalSupplied
  const effectiveCap =
    totalSupplied > 0 && debtCap > 0
      ? Math.min(totalSupplied, debtCap)
      : debtCap > 0
        ? debtCap
        : totalSupplied > 0
          ? totalSupplied
          : 0;

  const effectiveCapUSD = effectiveCap * debtPrice;

  // If effectiveCap is 0 or very small (effectively 0), show no limit (no borrowing limit)
  // Check both the raw value and formatted value to avoid showing "$0 of $0"
  const formattedTotalDebt = formatNumber(totalDebt * debtPrice);
  const formattedEffectiveCap = formatNumber(effectiveCapUSD);
  const hasNoLimit = effectiveCapUSD > 1000000000;
  // If no pool data exists, return null to show "-" instead of "$0 of $0"
  const capacityText =
    !pool || effectiveCapUSD === 0
      ? null
      : hasNoLimit
        ? null
        : `$${formattedTotalDebt} of $${formattedEffectiveCap} used`;
  const capacityUsed =
    pool && effectiveCapUSD > 0
      ? ((pool.totalDebt * debtPrice) / effectiveCapUSD) * 100
      : 0;

  return {
    apyValue,
    isLoading,
    tokenPair,
    primaryToken,
    secondaryToken,
    badgeType,
    pool,
    totalDebt,
    debtCap,
    totalSupplied,
    debtPrice,
    effectiveCap,
    effectiveCapUSD,
    formattedTotalDebt,
    formattedEffectiveCap,
    hasNoLimit,
    capacityText,
    capacityUsed,
    supplyApy: pool?.supplyApy ?? 0,
    borrowApr: pool?.borrowApr ?? 0,
  };
};

const Defi: React.FC = () => {
  const { isPinned } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const yields: any = useAtomValue(protocolYieldsAtom);
  
  // Get initial tab from URL query parameter, default to "borrow"
  const tabParam = searchParams.get("tab");
  const getInitialTab = (): "earn" | "borrow" | "contribute-liquidity" => {
    if (tabParam === "earn") return "earn";
    if (tabParam === "borrow") return "borrow";
    if (tabParam === "contribute-liquidity") return "contribute-liquidity";
    return "borrow"; // default
  };
  
  const [activeTab, setActiveTab] = useState<
    "earn" | "borrow" | "contribute-liquidity"
  >(getInitialTab());
  const [selectedAsset, setSelectedAsset] = useState<AssetFilter>("all");
  const [selectedProtocol, setSelectedProtocol] =
    useState<ProtocolFilter>("all");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showStablesOnly, setShowStablesOnly] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Track scroll state for shadow visibility
  React.useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout>;
    let lastScrollTop = 0;

    const handleScroll = () => {
      const currentScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Show shadow when scrolling
      if (currentScrollTop > 0 && currentScrollTop !== lastScrollTop) {
        setIsScrolling(true);
      }

      // Clear any existing timer
      clearTimeout(scrollTimer);

      // Hide shadow after scrolling stops
      scrollTimer = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      lastScrollTop = currentScrollTop;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  // Update URL when tab changes (only if URL doesn't already match)
  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam !== activeTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", activeTab);
      router.replace(`/defi?${params.toString()}`, { scroll: false });
    }
  }, [activeTab, router, searchParams]);

  // Sync tab state with URL parameter changes (only when URL changes externally)
  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    const validTabs: Array<"earn" | "borrow" | "contribute-liquidity"> = ["earn", "borrow", "contribute-liquidity"];
    
    if (validTabs.includes(tabParam as any)) {
      setActiveTab(tabParam as "earn" | "borrow" | "contribute-liquidity");
    } else if (!tabParam) {
      // If no tab param, default to "borrow" but only update URL if needed
      setActiveTab("borrow");
    }
  }, [searchParams]); // Only depend on searchParams to avoid loops

  // Reset filters when switching tabs
  React.useEffect(() => {
    setSelectedAsset("all");
    setSelectedProtocol("all");
    setShowMoreFilters(false);
    setShowStablesOnly(false);
  }, [activeTab]);
  const [pendingProtocolLink, setPendingProtocolLink] = useState<string | null>(
    null,
  );

  const handleContinue = () => {
    setShowDisclaimer(false);
    if (pendingProtocolLink) {
      window.open(pendingProtocolLink, "_blank");
      setPendingProtocolLink(null);
    }
  };

  const handleCTAClick = (link: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
    }
    window.open(link, "_blank");
    setPendingProtocolLink(null);
    // handleContinue();
    // setPendingProtocolLink(link);
    // setShowDisclaimer(true);
  };

  // BTC yield atoms - using a map for easier access
  const [trovesHyperxWBTCYield] = useAtom(trovesHyperxWBTCYieldAtom);
  const [trovesHyperxtBTCYield] = useAtom(trovesHyperxtBTCYieldAtom);
  const [trovesHyperxLBTCYield] = useAtom(trovesHyperxLBTCYieldAtom);
  const [trovesHyperxsBTCYield] = useAtom(trovesHyperxsBTCYieldAtom);
  const [trovesHyperxSTRKYield] = useAtom(trovesHyperxSTRKYieldAtom);
  const [trovesEkuboXWBTCYield] = useAtom(trovesEkuboBTCxWBTCYieldAtom);
  const [trovesEkuboXtBTCYield] = useAtom(trovesEkuboBTCxtBTCYieldAtom);
  const [trovesEkuboXLBTCYield] = useAtom(trovesEkuboBTCxLBTCYieldAtom);
  const [trovesEkuboXsBTCYield] = useAtom(trovesEkuboBTCxsBTCYieldAtom);
  const [vesuBTCxWBTCYield] = useAtom(vesuBTCxWBTCYieldAtom);
  const [vesuBTCxtBTCYield] = useAtom(vesuBTCxtBTCYieldAtom);
  const [vesuBTCxLBTCYield] = useAtom(vesuBTCxLBTCYieldAtom);
  const [vesuBTCxsBTCYield] = useAtom(vesuBTCxsBTCYieldAtom);
  const vesuBorrowPools = useAtomValue(vesuBorrowPoolsAtom);
  const vesuPoolsFilterFn = useAtomValue(vesuPoolsFilteredAtom);
  const vesuContributorSupplyPools = useAtomValue(
    vesuContributorSupplyPoolsAtom,
  );
  const ekuboYield = useAtomValue(ekuboYieldAtom);

  // Get all Vesu pools for lending (all verified pools with LST assets)
  const vesuLendingPools = useMemo(() => {
    return vesuPoolsFilterFn({ isVerified: true, collateralIsLST: true });
  }, [vesuPoolsFilterFn]);

  // Generate lending configs from pools
  const vesuLendingConfigs = useMemo(() => {
    const configs = createVesuLendingConfigsFromPools(vesuLendingPools);
    // Add externalPointsInfo to all Vesu configs
    Object.values(configs).forEach((config) => {
      config.externalPointsInfo = "+Vesu Points";
    });
    return configs;
  }, [vesuLendingPools]);

  // Contributor pools data structure
  const contributorPools = useMemo(() => {
    const pools: Array<{
      id: string;
      tokens: TokenDisplay[];
      protocolIcon: React.ReactNode;
      protocolName: string;
      tokenPair: string;
      description: string;
      badge?: ProtocolBadge;
      yield: number | null;
      yieldSplit?: APRSplit[];
      capacity: VaultCapacity | null;
      capacityText: string | null;
      capacityPercent: number;
      pointsMultiplier?: { min: number; max: number; description: string };
      externalPointsInfo?: string | null;
      action: ProtocolAction;
      actionLink: string;
      actionText: string;
      actionOnClick?: () => void;
    }> = [];

    // 1. Vesu supply pools from Re7 xSTRK and Re7 xBTC
    vesuContributorSupplyPools.forEach((pool) => {
      const tokenIcon = getTokenIcon(pool.assetSymbol);
			const vesuUrl = process.env.NEXT_PUBLIC_VESU_URL || "http://vesu.xyz/pro";
			const vesuEarnEndpoint = `${vesuUrl}/earn`;
      pools.push({
        id: `vesu-supply-${pool.poolId}-${pool.assetSymbol}`,
        tokens: [{ icon: tokenIcon, name: pool.assetSymbol }],
        protocolIcon: <Icons.vesuLogo className="rounded-full" />,
        protocolName: "Vesu",
        tokenPair: pool.assetSymbol,
        description: `Supply ${pool.assetSymbol} on ${pool.poolName} pool`,
        badge: {
          type: pool.poolName,
          color: "bg-[#E8F4FD] text-[#1E40AF]",
        },
        yield: pool.supplyApy,
        yieldSplit: pool.supplyAprSplit,
        capacity: null, // Vesu pools don't have capacity limits
        capacityText: null,
        capacityPercent: 0,
        externalPointsInfo: "+Vesu Points",
        pointsMultiplier: {
          min: 8,
          max: 15,
          description:
            "Supply BTC and STRK to designated pools, helping bootstrap liquidity and earn higher points.",
        },
        action: {
          type: "lend",
          link: `${vesuEarnEndpoint}/${pool.poolId}/${pool.assetAddress}`,
          buttonText: "Supply",
          onClick: () => {
            MyAnalytics.track(eventNames.OPPORTUNITIES, {
              protocol: `vesu-supply-${pool.assetSymbol}`,
              buttonText: "Supply",
            });
          },
        },
        actionLink: `${vesuEarnEndpoint}/${pool.poolId}/${pool.assetAddress}`,
        actionText: "Supply",
        actionOnClick: () => {
          MyAnalytics.track(eventNames.OPPORTUNITIES, {
            protocol: `vesu-supply-${pool.assetSymbol}`,
            buttonText: "Supply",
          });
        },
      });
    });

    // 2. Troves Ekubo pools
    const trovesEkuboPools = [
      {
        key: "trovesEkuboBTCxWBTC",
        token1: {
          icon: <Icons.xwbtc className="size-[22px]" />,
          name: "xWBTC",
        },
        token2: {
          icon: <Icons.btcLogo className="size-[22px]" />,
          name: "WBTC",
        },
        yield: trovesEkuboXWBTCYield,
        strategyPath: "ekubo_cl_xwbtcwbtc",
      },
      {
        key: "trovesEkuboBTCxtBTC",
        token1: {
          icon: <Icons.xtbtc className="size-[22px]" />,
          name: "xtBTC",
        },
        token2: {
          icon: <Icons.btcLogo className="size-[22px]" />,
          name: "tBTC",
        },
        yield: trovesEkuboXtBTCYield,
        strategyPath: "ekubo_cl_xtbtctbtc",
      },
      {
        key: "trovesEkuboBTCxLBTC",
        token1: {
          icon: <Icons.xlbtc className="size-[22px]" />,
          name: "xLBTC",
        },
        token2: {
          icon: <Icons.btcLogo className="size-[22px]" />,
          name: "LBTC",
        },
        yield: trovesEkuboXLBTCYield,
        strategyPath: "ekubo_cl_xlbtclbtc",
      },
      {
        key: "trovesEkuboBTCxsBTC",
        token1: {
          icon: <Icons.xsbtc className="size-[22px]" />,
          name: "xsBTC",
        },
        token2: {
          icon: <Icons.btcLogo className="size-[22px]" />,
          name: "solvBTC",
        },
        yield: trovesEkuboXsBTCYield,
        strategyPath: "ekubo_cl_xsbtcsolvbtc",
      },
    ];

    trovesEkuboPools.forEach((pool) => {
      const config = createTrovesEkuboLiquidityConfig(
        pool.key,
        pool.token1,
        pool.token2,
        pool.strategyPath,
        pool.key,
      );
      pools.push({
        id: pool.key,
        tokens: config.tokens,
        protocolIcon: config.protocolIcon,
        protocolName: config.protocolName,
        tokenPair: `${pool.token1.name}/${pool.token2.name}`,
        description: config.description,
        badge: config.badges[0],
        yield: pool.yield.value ?? null,
        capacity: null,
        capacityText: null,
        capacityPercent: 0,
        pointsMultiplier: config.pointsMultiplier,
        externalPointsInfo: config.externalPointsInfo,
        action: config.action!,
        actionLink: config.action!.link,
        actionText: config.action!.buttonText,
        actionOnClick: config.action!.onClick,
      });
    });

    // 3. Ekubo pools
    const ekuboConfig = createEkuboPoolConfig(
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
      "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
      "ekuboSTRK",
    );
    pools.push({
      id: "ekubo",
      tokens: ekuboConfig.tokens,
      protocolIcon: ekuboConfig.protocolIcon,
      protocolName: ekuboConfig.protocolName,
      tokenPair: "xSTRK/STRK",
      description: ekuboConfig.description,
      badge: ekuboConfig.badges[0],
      yield: ekuboYield.value,
      capacity: null,
      capacityText: null,
      capacityPercent: 0,
      pointsMultiplier: ekuboConfig.pointsMultiplier,
      externalPointsInfo: ekuboConfig.externalPointsInfo,
      action: ekuboConfig.action!,
      actionLink: ekuboConfig.action!.link,
      actionText: ekuboConfig.action!.buttonText,
      actionOnClick: ekuboConfig.action!.onClick,
    });

    // Debug: Log pool counts
    console.log("Contributor pools:", {
      vesuPools: vesuContributorSupplyPools.length,
      trovesEkubo: trovesEkuboPools.length,
      ekubo: 1,
      total: pools.length,
    });

    return pools;
  }, [
    vesuContributorSupplyPools,
    trovesEkuboXWBTCYield,
    trovesEkuboXtBTCYield,
    trovesEkuboXLBTCYield,
    trovesEkuboXsBTCYield,
    ekuboYield,
  ]);

  // Vault capacity atoms
  const [hyperxWBTCVaultCapacity] = useAtom(hyperxWBTCVaultCapacityAtom);
  const [hyperxtBTCVaultCapacity] = useAtom(hyperxtBTCVaultCapacityAtom);
  const [hyperxLBTCVaultCapacity] = useAtom(hyperxLBTCVaultCapacityAtom);
  const [hyperxsBTCVaultCapacity] = useAtom(hyperxsBTCVaultCapacityAtom);
  const [hyperxSTRKVaultCapacity] = useAtom(hyperxSTRKVaultCapacityAtom);

  // Price atoms for USD conversion
  const { data: _strkPrice } = useAtomValue(assetPriceAtom);
  const _btcPrice = useAtomValue(btcPriceAtom);

  // Mapping objects for protocol-to-atom relationships
  const protocolYieldMap = useMemo(
    () => ({
      hyperxWBTC: trovesHyperxWBTCYield,
      hyperxtBTC: trovesHyperxtBTCYield,
      hyperxLBTC: trovesHyperxLBTCYield,
      hyperxsBTC: trovesHyperxsBTCYield,
      hyperxSTRK: trovesHyperxSTRKYield,
      ekuboBTCxWBTC: trovesEkuboXWBTCYield,
      ekuboBTCxtBTC: trovesEkuboXtBTCYield,
      ekuboBTCxLBTC: trovesEkuboXLBTCYield,
      ekuboBTCxsBTC: trovesEkuboXsBTCYield,
      vesuBTCxWBTC: vesuBTCxWBTCYield,
      vesuBTCxtBTC: vesuBTCxtBTCYield,
      vesuBTCxLBTC: vesuBTCxLBTCYield,
      vesuBTCxsBTC: vesuBTCxsBTCYield,
    }),
    [
      trovesHyperxWBTCYield,
      trovesHyperxtBTCYield,
      trovesHyperxLBTCYield,
      trovesHyperxsBTCYield,
      trovesHyperxSTRKYield,
      trovesEkuboXWBTCYield,
      trovesEkuboXtBTCYield,
      trovesEkuboXLBTCYield,
      trovesEkuboXsBTCYield,
      vesuBTCxWBTCYield,
      vesuBTCxtBTCYield,
      vesuBTCxLBTCYield,
      vesuBTCxsBTCYield,
    ],
  );

  const protocolCapacityMap = useMemo(
    () => ({
      hyperxWBTC: hyperxWBTCVaultCapacity,
      hyperxtBTC: hyperxtBTCVaultCapacity,
      hyperxLBTC: hyperxLBTCVaultCapacity,
      hyperxsBTC: hyperxsBTCVaultCapacity,
      hyperxSTRK: hyperxSTRKVaultCapacity,
      trovesHyper: hyperxSTRKVaultCapacity,
    }),
    [
      hyperxWBTCVaultCapacity,
      hyperxtBTCVaultCapacity,
      hyperxLBTCVaultCapacity,
      hyperxsBTCVaultCapacity,
      hyperxSTRKVaultCapacity,
    ],
  );

  // Helper function to get vault capacity for a protocol
  const getVaultCapacity = (
    protocol: SupportedDApp,
  ): { used: number; total: number | null } | undefined => {
    const capacityAtom =
      protocolCapacityMap[protocol as keyof typeof protocolCapacityMap];
    const capacity = capacityAtom?.data;
    return capacity
      ? { used: capacity.used, total: capacity.total }
      : undefined;
  };

  // Helper function to get yield for a protocol
  const getProtocolYield = (protocol: SupportedDApp): number | null => {
    const yieldAtom =
      protocolYieldMap[protocol as keyof typeof protocolYieldMap];
    return yieldAtom?.value ?? yields[protocol]?.value ?? null;
  };

  // Asset filter mapping
  const assetFilterMap: Record<AssetFilter, string[]> = {
    all: [],
    xSTRK: ["xSTRK"],
    xtBTC: ["xtBTC"],
    xLBTC: ["xLBTC"],
    xWBTC: ["xWBTC"],
    xsBTC: ["xsBTC", "solvBTC"],
  };

  // Helper function to check if protocol matches asset filter
  const matchesAssetFilter = (
    protocol: SupportedDApp,
    config: ProtocolConfig,
  ): boolean => {
    if (selectedAsset === "all") return true;
    const tokenNames = config.tokens.map((t) => t.name);
    const allowedNames = assetFilterMap[selectedAsset];
    return tokenNames.some((name) => allowedNames.includes(name));
  };

  // Protocol filter mapping
  const protocolFilterMap: Record<ProtocolFilter, (name: string) => boolean> = {
    all: () => true,
    Ekubo: (name) => name.toLowerCase().includes("ekubo"),
    Vesu: (name) => name === "vesu",
    Nostra: (name) => name.includes("nostra"),
    Troves: (name) => name.includes("troves"),
    Opus: (name) => name === "opus",
  };

  // Helper function to check if protocol matches protocol filter
  const matchesProtocolFilter = (config: ProtocolConfig): boolean => {
    const protocolName = config.protocolName.toLowerCase();
    return protocolFilterMap[selectedProtocol](protocolName);
  };

  // Filter contributor pools based on selected filters
  const filteredContributorPools = useMemo(() => {
    return contributorPools.filter((pool) => {
      // Asset filter
      if (selectedAsset !== "all") {
        const allowedNames = assetFilterMap[selectedAsset];
        const tokenNames = pool.tokens.map((t) => t.name);
        const matchesAsset = tokenNames.some((name) =>
          allowedNames.includes(name),
        );
        if (!matchesAsset) return false;
      }

      // Protocol filter
      const protocolName = pool.protocolName.toLowerCase();
      const matchesProtocol = protocolFilterMap[selectedProtocol](protocolName);
      if (!matchesProtocol) return false;

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contributorPools,
    selectedAsset,
    selectedProtocol,
    assetFilterMap,
    protocolFilterMap,
  ]);

  // assumes, we compute net borrow APY by assuming users borrows 80% of LTV of the collateral
  const MAX_BORROWING_ON_LTV_ASSUMPTION = 0.8;

  // Create dynamic protocol configs from Vesu borrow pools using generic atom
  const vesuBorrowConfigs = useMemo(() => {
    const configs: Record<string, ProtocolConfig> = {};
		const vesuUrl = process.env.NEXT_PUBLIC_VESU_URL || "http://vesu.xyz/pro";
		const vesuBorrowEndpoint = `${vesuUrl}/borrow`;
    vesuBorrowPools.forEach((pool, index) => {
      const key = `vesuBorrow_${pool.collateralSymbol}_${pool.debtSymbol}_${index}`;
      const isDebtUSDC = pool.debtSymbol === "USDC";
      configs[key] = {
        tokens: [
          {
            icon: getTokenIcon(pool.collateralSymbol),
            name: pool.collateralSymbol,
          },
          { icon: getTokenIcon(pool.debtSymbol), name: pool.debtSymbol },
        ],
        protocolIcon: <Icons.vesuLogo className="rounded-full" />,
        protocolName: "Vesu",
        badges: [
          {
            type: pool.poolName || "Borrow Pool",
            color: "bg-[#E8F4FD] text-[#1E40AF]",
          },
        ],
        description: `Borrow ${pool.debtSymbol} against ${pool.collateralSymbol} on Vesu`,
        apy:
          pool.borrowApr && pool.supplyApy
            ? ((pool.borrowApr *
                pool.maxLTV *
                MAX_BORROWING_ON_LTV_ASSUMPTION) /
                100 -
                pool.supplyApy) /
              100
            : undefined,
        externalPointsInfo: "+Vesu Points",
        action: {
          type: "borrow",
          link: `${vesuBorrowEndpoint}/${pool.poolId}/${pool.collateralAddress}/${pool.debtAddress}`,
          buttonText: "Borrow",
          onClick: () => {
            MyAnalytics.track(eventNames.OPPORTUNITIES, {
              protocol: "vesuBorrow",
              buttonText: "Borrow",
            });
          },
        },
        pointsMultiplier: {
          min: isDebtUSDC
            ? POINTS_CONFIG.USDC_BORROWING
            : POINTS_CONFIG.STAKING + POINTS_CONFIG.UNDERLYING_BORROWING,
          max: isDebtUSDC
            ? POINTS_CONFIG.USDC_BORROWING + POINTS_CONFIG.STAKING
            : POINTS_CONFIG.UNDERLYING_BORROWING + POINTS_CONFIG.STAKING,
          description: isDebtUSDC
            ? `Earn 3x season 2 points on borrowing stablecoins value + 1x on staked assets value`
            : `Earn 1x season 2 points on staked assets value while borrowing underlying assets. Staking these borrowed assets will earn you additional points, simply depending on the assets you stake.`,
        },
      };
    });
    return configs;
  }, [vesuBorrowPools]);

  // Combine all protocol configs including dynamic Vesu borrow and lending pools
  const protocolConfigsWithBorrow = useMemo(() => {
    return {
      ...protocolConfigs,
      ...vesuBorrowConfigs,
      ...vesuLendingConfigs,
    } as Record<string, ProtocolConfig>;
  }, [vesuBorrowConfigs, vesuLendingConfigs]);

  // Protocols that don't show APY
  const noApyProtocols = new Set([
    "avnu",
    "fibrous",
    "avnuBTCxWBTC",
    "avnuBTCxtBTC",
    "avnuBTCxLBTC",
    "avnuBTCxsBTC",
  ]);

  // Protocols with no capacity limit
  const noLimitProtocols = new Set([
    "vesu",
    "ekuboBTCxWBTC",
    "ekuboBTCxtBTC",
    "ekuboBTCxLBTC",
    "ekuboBTCxsBTC",
    "strkfarmEkubo",
  ]);

  // Get borrow protocol keys (includes Vesu borrow pools and Opus)
  const borrowProtocolKeys = useMemo(() => {
    return [...Object.keys(vesuBorrowConfigs), "opus"];
  }, [vesuBorrowConfigs]);

  // Helper to get capacity for a protocol
  const getProtocolCapacity = (
    protocol: string,
    config: ProtocolConfig,
    tab: "earn" | "borrow" | "contribute-liquidity",
  ): { used: number; total: number | null } | undefined => {
    // Contributors tab - no capacity limits
    if (tab === "contribute-liquidity") {
      return undefined;
    }

    if (tab === "borrow" && config.tokens.length >= 2) {
      const pool = vesuBorrowPools.find(
        (p) =>
          p.collateralSymbol === config.tokens[0].name &&
          p.debtSymbol === config.tokens[1].name,
      );
      if (pool && pool.debtCap > 0 && pool.debtCap >= 0.01) {
        return { used: pool.totalDebt, total: pool.debtCap };
      }
      return undefined;
    }

    // Earn tab
    const protocolKey = protocol as SupportedDApp;
    if (
      protocolKey === "vesu" ||
      protocolKey.startsWith("vesuBTC") ||
      noLimitProtocols.has(protocolKey)
    ) {
      return undefined; // No limit
    }

    // Check if it's a hyper vault that has capacity
    return getVaultCapacity(protocolKey);
  };

  // Get lending protocol keys (including dynamic Vesu lending)
  const lendingProtocolKeys = useMemo(() => {
    return Object.keys(vesuLendingConfigs);
  }, [vesuLendingConfigs]);

  // Filter and sort protocols based on active tab and filters
  const filteredAndSortedProtocols = useMemo(() => {
    const currentProtocols =
      activeTab === "earn"
        ? [...supplyProtocols, ...lendingProtocolKeys]
        : borrowProtocolKeys;
    const configsToUse: Record<string, ProtocolConfig> =
      activeTab === "earn"
        ? ({ ...protocolConfigs, ...vesuLendingConfigs } as Record<
            string,
            ProtocolConfig
          >)
        : protocolConfigsWithBorrow;

    return currentProtocols
      .filter((protocol) => {
        const config = configsToUse[protocol];
        if (!config) return false;

        // Filter for stables only in borrow tab
        if (activeTab === "borrow" && showStablesOnly) {
          // Check if the debt token (second token) is USDC or USDC.e
          const debtToken = config.tokens[1]?.name;
          if (debtToken !== "USDC" && debtToken !== "USDC.e") {
            return false;
          }
        }

        return (
          matchesAssetFilter(protocol as SupportedDApp, config) &&
          matchesProtocolFilter(config)
        );
      })
      .sort((a, b) => {
        // Sort DEX Aggregator to the end
        const configA = configsToUse[a];
        const configB = configsToUse[b];
        const badgeA = configA?.badges[0]?.type;
        const badgeB = configB?.badges[0]?.type;
        if (badgeA === "DEX Aggregator" && badgeB !== "DEX Aggregator")
          return 1;
        if (badgeB === "DEX Aggregator" && badgeA !== "DEX Aggregator")
          return -1;

        // Sort by yield
        // if borrow, sort by negative yield
        const yieldA =
          activeTab === "borrow" && configA?.apy
            ? -1 * configA.apy * 100
            : (getProtocolYield(a as SupportedDApp) ?? -Infinity);
        const yieldB =
          activeTab === "borrow" && configB?.apy
            ? -1 * configB.apy * 100
            : (getProtocolYield(b as SupportedDApp) ?? -Infinity);

        const usedA = getProtocolCapacity(
          a as SupportedDApp,
          configA,
          activeTab,
        )?.used;
        const usedB = getProtocolCapacity(
          b as SupportedDApp,
          configB,
          activeTab,
        )?.used;
        console.log(
          `usedA: ${usedA}, usedB: ${usedB}, configA: ${configA.protocolName}, configB: ${configB.protocolName}`,
        );
        if (usedA && usedB) {
          return usedB - usedA;
        }
        return yieldB - yieldA;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    selectedAsset,
    selectedProtocol,
    showStablesOnly,
    yields,
    trovesHyperxWBTCYield,
    trovesHyperxtBTCYield,
    trovesHyperxLBTCYield,
    trovesHyperxsBTCYield,
    trovesEkuboXWBTCYield,
    trovesEkuboXtBTCYield,
    trovesEkuboXLBTCYield,
    trovesEkuboXsBTCYield,
    vesuBTCxWBTCYield,
    vesuBTCxtBTCYield,
    vesuBTCxLBTCYield,
    vesuBTCxsBTCYield,
    borrowProtocolKeys,
    lendingProtocolKeys,
    protocolConfigsWithBorrow,
    vesuLendingConfigs,
  ]);

  // Helper function to get yield data for a protocol
  const getYieldDataForProtocol = (
    protocol: SupportedDApp,
  ):
    | {
        value: number | null;
        error: Error | null;
        isLoading: boolean;
      }
    | undefined => {
    const shouldShowApy = !noApyProtocols.has(protocol);

    // Check if protocol has a dedicated yield atom
    const yieldAtom =
      protocolYieldMap[protocol as keyof typeof protocolYieldMap];
    if (yieldAtom) {
      return {
        value: yieldAtom.value ?? null,
        error: yieldAtom.error ?? null,
        isLoading: yieldAtom.isLoading ?? false,
      };
    }

    // Other protocols use the yields from protocolYieldsAtom
    return shouldShowApy ? yields[protocol] : undefined;
  };

  const renderProtocols = (protocols: string[]) => {
    return protocols.map((protocol) => {
      const configsToUse: Record<string, ProtocolConfig> =
        activeTab === "earn"
          ? (protocolConfigs as Record<string, ProtocolConfig>)
          : protocolConfigsWithBorrow;
      const config = configsToUse[protocol];
      if (!config) return null;

      const shouldShowApy = !noApyProtocols.has(protocol);

      // For borrow pools, use the apy from config; for supply, use getYieldDataForProtocol
      const yieldData =
        activeTab === "borrow" && config.apy
          ? {
              value: config.apy * 100,
              error: null,
              isLoading: false,
            }
          : getYieldDataForProtocol(protocol as SupportedDApp);

      // Find matching borrow pool data for maxLTV and pool name
      let pool: VesuBorrowPool | undefined;
      let maxLTV: number | undefined;

      if (activeTab === "borrow" && config.tokens.length >= 2) {
        pool = vesuBorrowPools.find(
          (p) =>
            p.collateralSymbol === config.tokens[0].name &&
            p.debtSymbol === config.tokens[1].name,
        );
        if (pool) {
          maxLTV = pool.maxLTV;
        }
      }

      const capacity = getProtocolCapacity(protocol, config, activeTab);

      // Update badges with pool name if available
      const updatedBadges = pool?.poolName
        ? [{ ...config.badges[0], type: pool.poolName }]
        : config.badges;

      if (Array.isArray(config.action)) {
        return config.action.map((action, index) => (
          <DefiCard
            key={`${protocol}-${index}`}
            tokens={config.tokens}
            protocolIcon={config.protocolIcon}
            badges={updatedBadges}
            description={`${config.description} - ${action.buttonText}`}
            apy={shouldShowApy ? yieldData : undefined}
            action={action}
            isBorrow={activeTab === "borrow"}
            maxLTV={maxLTV}
            capacity={capacity}
            pointsMultiplier={config.pointsMultiplier}
            onActionClick={handleCTAClick}
          />
        ));
      }

      return (
        <DefiCard
          key={protocol}
          tokens={config.tokens}
          protocolIcon={config.protocolIcon}
          badges={updatedBadges}
          description={config.description}
          apy={shouldShowApy ? yieldData : undefined}
          action={config.action}
          isBorrow={activeTab === "borrow"}
          maxLTV={maxLTV}
          capacity={capacity}
          pointsMultiplier={config.pointsMultiplier}
          onActionClick={handleCTAClick}
        />
      );
    });
  };

  const assetFilters: AssetFilter[] = [
    "all",
    "xSTRK",
    "xtBTC",
    "xLBTC",
    "xWBTC",
    "xsBTC",
  ];

  const protocolFilters: ProtocolFilter[] = [
    "all",
    "Ekubo",
    "Vesu",
    "Nostra",
    "Troves",
    "Opus",
  ];

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[calc(100vw-1rem)] px-2 lg:max-w-4xl",
        {
          "lg:pl-28": !isPinned,
        },
      )}
    >
      <Dialog
        open={showDisclaimer}
        onOpenChange={(open) => {
          setShowDisclaimer(open);
        }}
      >
        <DialogContent className="max-w-[350px] rounded-[14px] lg:max-w-[500px]">
          <DialogHeader className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#D6973333]">
                <ShieldAlert className="h-5 w-5 text-[#D69733]" />
              </div>
              <DialogTitle className="text-left text-lg font-semibold text-[#1A1F24]">
                Third-Party Protocol Warning
              </DialogTitle>
            </div>
            <DialogDescription className="text-left text-sm font-light text-[#717182]">
              The protocols listed here are third-party services not affiliated
              with or endorsed by Endur. This list is provided for informational
              convenience only. Always do your own research and understand the
              risks before using any DeFi protocol.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleContinue}
              className="w-full rounded-lg border-none bg-[#17876D] px-6 py-2 text-sm text-white outline-none ring-0 transition-opacity hover:bg-[#17876D] focus:outline-none focus:ring-0"
            >
              Continue
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className={cn("w-full")}>
        <MyHeader
          title="DeFi opportunities"
          description="Put your STRK and BTC LSTs to work in Starknet DeFi — earn extra yield, unlock liquidity, and rack up points."
          icon={Icons.blocks}
        />

        <div className="mt-6">
          {/* Main Tabs - Supply & Earn / Borrow */}
          <ShadCNTabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(
                value as "earn" | "borrow" | "contribute-liquidity",
              )
            }
            className="w-full"
          >
            {/* Sticky Header Section - Tabs + Table Headers */}
            <div
              className={cn(
                "sticky top-0 z-40 bg-[#E8F7F4] transition-all duration-200 lg:z-50",
                isScrolling && "shadow-md",
              )}
            >
              {/* Tabs Header */}
              <div className="flex w-full flex-col gap-2 rounded-bl-[14px] rounded-br-[14px] bg-[#E8F7F4] pt-3 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="flex h-auto w-full gap-0 rounded-[14px] border border-[#E5E8EB] bg-white p-1 lg:w-[450px]">
                  {[
                    { value: "earn", label: "Earn" },
                    { value: "borrow", label: "Borrow" },
                    {
                      value: "contribute-liquidity",
                      label: "Contribute liquidity",
                    },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        "min-h-[64px] flex-1 rounded-[10px] border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[#6B7780] transition-all data-[state=active]:border-[#17876D] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#1A1F24] data-[state=active]:shadow-none lg:px-6 lg:py-2.5 lg:text-base",
                      )}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{tab.label}</span>
                        {tab.value === "contribute-liquidity" && (
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-[#D69733]" />
                            <span className="text-xs font-medium text-[#D69733]">
                              70% • 5.25M pts
                            </span>
                          </div>
                        )}
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="hidden w-fit items-center justify-center gap-2 rounded-full border border-[#D69733] bg-[#D697331A] px-2 py-1 text-xs text-[#F59E0B] lg:flex lg:self-end">
                        <OctagonAlert className="h-4 w-4" />
                        Disclaimer
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-xs rounded-md border border-[#D69733] bg-white text-xs text-[#717182]"
                    >
                      The protocols listed here are third-party services not
                      affiliated with or endorsed by Endur. This list is
                      provided for informational convenience only. Always do
                      your own research and understand the risks before using
                      any DeFi protocol.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Filters Section */}
              <div className="w-full rounded-[14px]">
                {(["earn", "borrow", "contribute-liquidity"] as const).map(
                  (tab) => (
                    <TabsContent
                      key={tab}
                      value={tab}
                      className="mt-6 rounded-lg bg-[#17876D26] p-4"
                    >
                      <Filters
                        assetFilters={assetFilters}
                        protocolFilters={protocolFilters}
                        selectedAsset={selectedAsset}
                        selectedProtocol={selectedProtocol}
                        showMoreFilters={showMoreFilters}
                        activeTab={tab}
                        showStablesOnly={showStablesOnly}
                        onAssetChange={setSelectedAsset}
                        onProtocolChange={setSelectedProtocol}
                        onToggleMoreFilters={() =>
                          setShowMoreFilters(!showMoreFilters)
                        }
                        onShowStablesOnlyChange={setShowStablesOnly}
                      />
                    </TabsContent>
                  ),
                )}
              </div>

              {/* Borrow: header row pinned as part of the sticky header section */}
              <div className="hidden lg:block">
                <TabsContent value="borrow" className="mt-2">
                  <div className="grid grid-cols-4">
                    <div className="rounded-tl-[14px] bg-white px-6 py-2 text-left text-sm font-medium text-[#5B616D] shadow-sm">
                      Pair &amp; Pool
                    </div>
                    <div className="bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      <div className="flex items-center justify-center gap-1">
                        Effective Borrow APY
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 shrink-0 cursor-help text-[#6B7780]" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-xs rounded-md border border-[#03624C] bg-white text-xs text-[#03624C]"
                            >
                              <p>
                                Effective Borrow APY assumes borrowing at 80% of
                                max Loan to Value (LTV) and subtracts the LST
                                APY from the borrow APR. This is an estimate for
                                convenience — actual yield depends on how much
                                you borrow.
                              </p>
                              <br />
                              <p>
                                <b>Negative:</b> You are earning more than you
                                are borrowing rate.
                              </p>
                              <p>
                                <b>Positive:</b> You are borrowing rate is more
                                than you are collateral APY.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      Capacity
                    </div>
                    <div className="rounded-tr-[14px] bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      Points Multiplier
                    </div>
                  </div>
                </TabsContent>
              </div>

              {/* Earn: header row pinned as part of the sticky header section */}
              <div className="hidden lg:block">
                <TabsContent value="earn" className="mt-2">
                  <div className="grid grid-cols-4">
                    <div className="rounded-tl-[14px] bg-white px-6 py-2 text-left text-sm font-medium text-[#5B616D] shadow-sm">
                      Vault
                    </div>
                    <div className="bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      Yield
                    </div>
                    <div className="bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      Capacity
                    </div>
                    <div className="rounded-tr-[14px] bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      Points Multiplier
                    </div>
                  </div>
                </TabsContent>
              </div>

              {/* Contribute liquidity: header row pinned as part of the sticky header section */}
              <div className="hidden lg:block">
                <TabsContent value="contribute-liquidity" className="mt-2">
                  <div className="grid grid-cols-4">
                    <div className="rounded-tl-[14px] bg-white px-6 py-2 text-left text-sm font-medium text-[#5B616D] shadow-sm">
                      Vault
                    </div>
                    <div className="bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      Yield
                    </div>
                    <div className="bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      Capacity
                    </div>
                    <div className="rounded-tr-[14px] bg-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                      Points Multiplier
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>

            {/* Content Section - Tables (Desktop) and Cards (Mobile) */}
            <div className="mt-2 w-full">
              {/* Desktop: Tables */}
              <div className="hidden lg:block">
                <TabsContent value="earn" className="mt-0">
                  <div className="w-full">
                    <table className="w-full table-fixed border-separate border-spacing-y-2 rounded-[14px]">
                      <tbody>
                        {filteredAndSortedProtocols.length > 0 ? (
                          filteredAndSortedProtocols.map((protocol) => {
                            const configsToUse: Record<string, ProtocolConfig> =
                              protocolConfigs as Record<string, ProtocolConfig>;
                            const config = configsToUse[protocol];
                            if (!config) return null;

                            const _shouldShowApy = !noApyProtocols.has(protocol);

                            const yieldData = getYieldDataForProtocol(
                              protocol as SupportedDApp,
                            );
                            const apyValue = yieldData?.value ?? null;
                            const isLoading = yieldData?.isLoading ?? false;

                            const tokenPair = config.tokens
                              .map((t: TokenDisplay) => t.name)
                              .join("/");
                            const primaryToken = config.tokens[0];
                            const secondaryToken = config.tokens[1];
                            const badgeType = config.badges[0]?.type || "";

                            // Calculate capacity for earn tab
                            const capacity = getProtocolCapacity(
                              protocol,
                              config,
                              "earn",
                            );

                            // Capacity values from store are already in USD
                            // Check if maxed out (used >= total)
                            const isMaxedOut =
                              capacity &&
                              capacity.total !== null &&
                              capacity.used >= capacity.total;

                            const capacityText = capacity
                              ? capacity.total === null
                                ? null // No limit - will show "No limit" instead
                                : isMaxedOut
                                  ? "Maxed out"
                                  : `$${formatNumber(capacity.used)} used of $${formatNumber(capacity.total)}`
                              : null;
                            const capacityPercent =
                              capacity &&
                              capacity.total !== null &&
                              capacity.total > 0
                                ? Math.min(
                                    (capacity.used / capacity.total) * 100,
                                    100,
                                  )
                                : 0;

                            return (
                              <tr key={protocol}>
                                <td
                                  colSpan={4}
                                  className={cn("p-0", "rounded-2xl")}
                                >
                                  <Card
                                    className={cn("bg-white", "flex flex-col")}
                                  >
                                    {/* Main Row */}
                                    <div
                                      className={cn(
                                        "px-4 py-8",
                                        "flex items-center gap-4",
                                        "shadow-[0_1px_1px_-0.5px_rgba(0,0,0,0.08),_0_3px_3px_-1.5px_rgba(0,0,0,0.08),_0_2px_2px_-2px_rgba(0,0,0,0.08),_0_2px_2px_-6px_rgba(0,0,0,0.08)]",
                                      )}
                                    >
                                      {/* Pair & Pool Column */}
                                      <div className="flex flex-1 items-start gap-3">
                                        <div className="flex items-center -space-x-6">
                                          <div className="flex h-10 w-10 items-center justify-center rounded-full">
                                            {primaryToken.icon}
                                          </div>
                                          {secondaryToken && (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full">
                                              {secondaryToken.icon}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-medium text-[#1A1F24]">
                                            {tokenPair}
                                          </div>
                                          <div className="mt-1.5">
                                            <span
                                              className={cn(
                                                "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
                                                config.badges[0]?.color ||
                                                  "bg-gray-100 text-gray-600",
                                              )}
                                            >
                                              {badgeType}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Yield Column */}
                                      <div className="flex flex-1 flex-col items-center justify-center">
                                        {isLoading ? (
                                          <div className="w-fit animate-pulse rounded-lg bg-gray-200" />
                                        ) : apyValue !== null ? (
                                          <div className="flex flex-col gap-1">
                                            <div className="w-fit rounded-lg border border-[#059669] bg-[#D1FAE5] px-2 py-1 text-sm font-semibold text-[#059669]">
                                              {apyValue.toFixed(2)}%
                                            </div>
                                            {/* <div className="w-fit rounded-lg border border-[#059669] bg-[#D1FAE5] px-2 py-1 text-xs font-semibold text-[#059669]">
                                              +5-20x Endur Points
                                            </div>
                                            <div className="w-fit rounded-lg border border-[#059669] bg-[#D1FAE5] px-2 py-1 text-xs font-semibold text-[#059669]">
                                              +Vesu Points
                                            </div> */}
                                          </div>
                                        ) : (
                                          <span className="text-[#6B7780]">
                                            -
                                          </span>
                                        )}
                                      </div>

                                      {/* Capacity Column */}
                                      <div className="flex flex-1 flex-col items-center justify-center">
                                        {capacity ? (
                                          capacityText ? (
                                            <div>
                                              <div className="mb-2 text-sm text-[#1A1F24]">
                                                {capacityText}
                                              </div>
                                              <Progress
                                                value={Math.min(
                                                  capacityPercent,
                                                  100,
                                                )}
                                                className="h-1.5 bg-[#E6F1EF]"
                                                indicatorClassName="bg-[#38EF7DB2]"
                                              />
                                            </div>
                                          ) : (
                                            <div className="text-sm text-[#1A1F24]">
                                              Limitless
                                            </div>
                                          )
                                        ) : (
                                          <div className="text-sm text-[#1A1F24]">
                                            Limitless
                                          </div>
                                        )}
                                      </div>

                                      {/* Points Multiplier Column */}
                                      <div className="flex flex-1 flex-col items-center justify-center">
                                        {config.pointsMultiplier ? (
                                          <MyDottedTooltip
                                            tooltip={
                                              config.pointsMultiplier
                                                .description
                                            }
                                          >
                                            <div className="flex w-fit items-center gap-1 rounded-lg border border-[#059669] bg-[#D1FAE5] px-2 py-1 text-sm font-semibold text-[#059669]">
                                              <Sparkles className="size-3.5" />
                                              {config.pointsMultiplier.min ===
                                              config.pointsMultiplier.max
                                                ? `${config.pointsMultiplier.min}x`
                                                : `${config.pointsMultiplier.min}x - ${config.pointsMultiplier.max}x`}
                                            </div>
                                          </MyDottedTooltip>
                                        ) : (
                                          <span className="text-[#6B7780]">
                                            -
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Bottom Section */}
                                    <div className="px-6 py-2">
                                      <div className="flex items-center gap-4">
                                        {/* Protocol */}
                                        <div className="flex flex-1 items-center gap-2">
                                          <span className="text-xs text-[#6B7780]">
                                            Provider:
                                          </span>
                                          <div className="flex h-5 w-5 items-center justify-center">
                                            {config.protocolIcon}
                                          </div>
                                          <span className="text-xs font-medium text-[#1A1F24]">
                                            {config.protocolName}
                                          </span>
                                        </div>

                                        {/* Rewards (empty) */}
                                        {/* <div className="flex-1"></div> */}

                                        <div className="flex-2 mx-auto flex w-[50%] min-w-0 items-center justify-end gap-2">
                                          <span className="truncate text-xs text-[#1A1F24]">
                                            {config.description}
                                          </span>
                                          <MyDottedTooltip
                                            tooltip={config.description}
                                          >
                                            <HelpCircle className="h-4 w-4 shrink-0 cursor-help text-[#6B7780]" />
                                          </MyDottedTooltip>
                                        </div>

                                        {/* Description and Action Button */}
                                        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                                          {/* <span className="truncate text-xs text-[#1A1F24]">
                                            34{config.description}
                                          </span>
                                          <MyDottedTooltip
                                            tooltip={config.description}
                                          >
                                            <HelpCircle className="h-4 w-4 shrink-0 cursor-help text-[#6B7780]" />
                                          </MyDottedTooltip> */}
                                          {config.action && (
                                            <button
                                              onClick={() => {
                                                if (config.action?.link) {
                                                  handleCTAClick(
                                                    config.action.link,
                                                    config.action.onClick,
                                                  );
                                                }
                                              }}
                                              className="w-32 whitespace-nowrap rounded-full bg-[#10B981] px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                                            >
                                              {config.action.buttonText}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-8 text-center text-[#6B7780]"
                            >
                              No protocols found matching your filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="borrow" className="mt-0">
                  <div className="w-full">
                    <table className="w-full table-fixed border-separate border-spacing-y-2 rounded-[14px]">
                      <tbody>
                        {filteredAndSortedProtocols.length > 0 ? (
                          filteredAndSortedProtocols
                            .filter((protocol) => {
                              const config =
                                protocolConfigsWithBorrow[protocol];
                              return !!config;
                            })
                            .sort((protocolA, protocolB) => {
                              const configA =
                                protocolConfigsWithBorrow[protocolA];
                              const configB =
                                protocolConfigsWithBorrow[protocolB];
                              if (!configA || !configB) return 0;

                              const borrowDataA = calculateBorrowPoolData(
                                configA,
                                vesuBorrowPools,
                                formatNumber,
                              );
                              const borrowDataB = calculateBorrowPoolData(
                                configB,
                                vesuBorrowPools,
                                formatNumber,
                              );
                              return (
                                borrowDataB.effectiveCapUSD -
                                borrowDataA.effectiveCapUSD
                              );
                            })
                            .map((protocol) => {
                              const config =
                                protocolConfigsWithBorrow[protocol];
                              const {
                                apyValue,
                                isLoading,
                                tokenPair,
                                primaryToken,
                                secondaryToken,
                                badgeType,
                                pool,
                                capacityText,
                                capacityUsed,
                                supplyApy,
                                borrowApr,
                                debtPrice: _debtPrice,
                                debtCap: _debtCap,
                                totalSupplied: _totalSupplied,
                              } = calculateBorrowPoolData(
                                config,
                                vesuBorrowPools,
                                formatNumber,
                              );

                              // Accent colors: green for supply, yellow/orange for borrow
                              const isBorrowPool = activeTab === "borrow";
                              const accentColor =
                                isBorrowPool && apyValue && apyValue > 0
                                  ? {
                                      yieldBg: "bg-[#FEF3C7]",
                                      yieldText: "text-[#D97706]",
                                      buttonBg: "bg-[#F59E0B]",
                                      progressBar: "bg-[#F59E0B]",
                                    }
                                  : {
                                      yieldBg: "bg-[#D1FAE5]",
                                      yieldText: "text-[#059669]",
                                      buttonBg: "bg-[#10B981]",
                                      progressBar: "bg-[#10B981]",
                                    };

                              return (
                                <tr key={protocol}>
                                  <td
                                    colSpan={4}
                                    className={cn("p-0", "rounded-2xl")}
                                  >
                                    <Card
                                      className={cn(
                                        "bg-white",
                                        "flex flex-col",
                                      )}
                                    >
                                      {/* Main Row */}
                                      <div
                                        className={cn(
                                          "px-4 py-8",
                                          "flex items-center gap-4",
                                          "shadow-[0_1px_1px_-0.5px_rgba(0,0,0,0.08),_0_3px_3px_-1.5px_rgba(0,0,0,0.08),_0_2px_2px_-2px_rgba(0,0,0,0.08),_0_2px_2px_-6px_rgba(0,0,0,0.08)]",
                                        )}
                                      >
                                        {/* Pair & Pool Column */}
                                        <div className="flex flex-1 items-start gap-3">
                                          <div className="flex items-center -space-x-6">
                                            {primaryToken && (
                                              <div className="flex h-10 w-10 items-center justify-center rounded-full">
                                                {primaryToken.icon}
                                              </div>
                                            )}
                                            {secondaryToken && (
                                              <div className="flex h-10 w-10 items-center justify-center rounded-full">
                                                {secondaryToken.icon}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-medium text-[#1A1F24]">
                                              {tokenPair}
                                            </div>
                                            <div className="mt-1.5">
                                              <span
                                                className={cn(
                                                  "rounded-full px-2 py-0.5 text-xs font-medium",
                                                  config.badges[0]?.color ||
                                                    "bg-gray-100 text-gray-600",
                                                )}
                                              >
                                                {badgeType}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Yield Column */}
                                        <div className="flex flex-1 flex-col items-center justify-center">
                                          {isLoading ? (
                                            <div className="w-fit animate-pulse rounded-lg bg-gray-200" />
                                          ) : apyValue !== null ? (
                                            <div className="flex flex-col gap-1">
                                              {isBorrowPool ? (
                                                <MyDottedTooltip
                                                  tooltip={
                                                    apyValue < 0
                                                      ? "Negative APR: You earn to borrow"
                                                      : "Positive APR: Borrowing cost dominates LST yield."
                                                  }
                                                >
                                                  <div
                                                    className={cn(
                                                      "w-fit rounded-lg border px-2 py-1 text-sm font-semibold",
                                                      accentColor.yieldBg,
                                                      accentColor.yieldText,
                                                      isBorrowPool &&
                                                        apyValue > 0
                                                        ? "border-[#D97706]"
                                                        : "border-[#059669]",
                                                    )}
                                                  >
                                                    {apyValue.toFixed(2)}%
                                                  </div>
                                                </MyDottedTooltip>
                                              ) : (
                                                <div
                                                  className={cn(
                                                    "w-fit rounded-lg border px-2 py-1 text-sm font-semibold",
                                                    accentColor.yieldBg,
                                                    accentColor.yieldText,
                                                    "border-[#059669]",
                                                  )}
                                                >
                                                  {apyValue.toFixed(2)}%
                                                </div>
                                              )}
                                              {pool && (
                                                <>
                                                  <div className="text-xs text-[#6B7780]">
                                                    Supply yield:{" "}
                                                    {supplyApy.toFixed(2)}%
                                                  </div>
                                                  <div className="text-xs text-[#6B7780]">
                                                    Borrow rate:{" "}
                                                    {borrowApr.toFixed(2)}%
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-[#6B7780]">
                                              -
                                            </span>
                                          )}
                                        </div>

                                        {/* Capacity Column */}
                                        <div className="flex flex-1 flex-col items-center justify-center">
                                          {capacityText ? (
                                            <div>
                                              <div className="mb-2 text-sm text-[#1A1F24]">
                                                {capacityText}
                                              </div>
                                              <Progress
                                                value={Math.min(
                                                  capacityUsed,
                                                  100,
                                                )}
                                                className="h-1.5 bg-[#E6F1EF]"
                                                indicatorClassName={
                                                  accentColor.progressBar
                                                }
                                              />
                                              {pool &&
                                                pool.maxLTV !== undefined && (
                                                  <div className="mt-2 text-xs text-[#6B7780]">
                                                    Max LTV -{" "}
                                                    {pool.maxLTV.toFixed(0)}%
                                                  </div>
                                                )}
                                            </div>
                                          ) : pool ? (
                                            <div>
                                              <div className="text-sm text-[#1A1F24]">
                                                Limitless
                                              </div>
                                              {pool.maxLTV !== undefined && (
                                                <div className="mt-2 text-xs text-[#6B7780]">
                                                  Max LTV -{" "}
                                                  {pool.maxLTV.toFixed(0)}%
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-[#6B7780]">
                                              -
                                            </span>
                                          )}
                                        </div>

                                        {/* Points Multiplier Column */}
                                        <div className="flex flex-1 flex-col items-center justify-center">
                                          {config.pointsMultiplier ? (
                                            <MyDottedTooltip
                                              tooltip={
                                                config.pointsMultiplier
                                                  .description
                                              }
                                            >
                                              <div className="flex w-fit items-center gap-1 rounded-lg border border-[#059669] bg-[#D1FAE5] px-2 py-1 text-sm font-semibold text-[#059669]">
                                                <Sparkles className="size-3.5" />
                                                {config.pointsMultiplier.min ===
                                                config.pointsMultiplier.max
                                                  ? `${config.pointsMultiplier.min}x`
                                                  : `${config.pointsMultiplier.min}x - ${config.pointsMultiplier.max}x`}
                                              </div>
                                            </MyDottedTooltip>
                                          ) : (
                                            <span className="text-[#6B7780]">
                                              -
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Bottom Section */}
                                      <div className="px-6 py-2">
                                        <div className="flex items-center gap-4">
                                          {/* Protocol */}
                                          <div className="flex flex-1 items-center gap-2">
                                            <span className="text-xs text-[#6B7780]">
                                              Provider:
                                            </span>
                                            <div className="flex h-5 w-5 items-center justify-center">
                                              {config.protocolIcon}
                                            </div>
                                            <span className="text-xs font-medium text-[#1A1F24]">
                                              {config.protocolName}
                                            </span>
                                          </div>

                                          {/* Rewards (empty) */}
                                          {/* <div className="flex-1"></div> */}

                                          <div className="flex-2 mx-auto flex w-[50%] min-w-0 items-center justify-end gap-2">
                                            <span className="truncate text-xs text-[#1A1F24]">
                                              {config.description}
                                            </span>
                                            <TooltipProvider delayDuration={0}>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <HelpCircle className="h-4 w-4 shrink-0 cursor-help text-[#6B7780]" />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                  side="top"
                                                  className="max-w-xs rounded-md border border-[#03624C] bg-white text-xs text-[#03624C]"
                                                >
                                                  {config.description}
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          </div>

                                          {/* Description and Action Button */}
                                          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                                            {/* <span className="truncate text-xs text-[#1A1F24]">
                                              44{config.description}
                                            </span>
                                            <TooltipProvider delayDuration={0}>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <HelpCircle className="h-4 w-4 shrink-0 cursor-help text-[#6B7780]" />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                  side="top"
                                                  className="max-w-xs rounded-md border border-[#03624C] bg-white text-xs text-[#03624C]"
                                                >
                                                  456{config.description}
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider> */}
                                            {config.action && (
                                              <button
                                                onClick={() => {
                                                  if (config.action?.link) {
                                                    handleCTAClick(
                                                      config.action.link,
                                                      config.action.onClick,
                                                    );
                                                  }
                                                }}
                                                className={cn(
                                                  "w-32 rounded-full px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90",
                                                  accentColor.buttonBg,
                                                )}
                                              >
                                                {config.action.buttonText}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </Card>
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-8 text-center text-[#6B7780]"
                            >
                              No borrow protocols available at this time
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="contribute-liquidity" className="mt-0">
                  <div className="w-full">
                    <table className="w-full table-fixed border-separate border-spacing-y-2 rounded-[14px]">
                      <tbody>
                        {filteredContributorPools.length > 0 ? (
                          filteredContributorPools.map((pool) => (
                            <tr key={pool.id}>
                              <td
                                colSpan={4}
                                className={cn("p-0", "rounded-2xl")}
                              >
                                <Card
                                  className={cn("bg-white", "flex flex-col")}
                                >
                                  {/* Main Row */}
                                  <div
                                    className={cn(
                                      "px-4 py-8",
                                      "flex items-center gap-4",
                                      "shadow-[0_1px_1px_-0.5px_rgba(0,0,0,0.08),_0_3px_3px_-1.5px_rgba(0,0,0,0.08),_0_2px_2px_-2px_rgba(0,0,0,0.08),_0_2px_2px_-6px_rgba(0,0,0,0.08)]",
                                    )}
                                  >
                                    {/* Pair & Pool Column */}
                                    <div className="flex flex-1 items-start gap-3">
                                      <div className="flex items-center -space-x-6">
                                        {pool.tokens.map((token, idx) => (
                                          <div
                                            key={idx}
                                            className="flex h-10 w-10 items-center justify-center rounded-full"
                                          >
                                            {token.icon}
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium text-[#1A1F24]">
                                          {pool.tokenPair}
                                        </div>
                                        <div className="mt-1.5">
                                          {pool.badge && (
                                            <span
                                              className={cn(
                                                "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
                                                pool.badge.color ||
                                                  "bg-gray-100 text-gray-600",
                                              )}
                                            >
                                              {pool.badge.type}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Yield Column */}
                                    <div className="flex flex-1 flex-col items-center justify-center">
                                      {pool.yield !== null ? (
                                        <div className="flex flex-col gap-1">
                                          <div className="w-fit rounded-lg border border-[#059669] bg-[#D1FAE5] px-2 py-1 text-sm font-semibold text-[#059669]">
                                            {pool.yield.toFixed(2)}%
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-[#6B7780]">
                                          -
                                        </span>
                                      )}
                                    </div>

                                    {/* Capacity Column */}
                                    <div className="flex flex-1 flex-col items-center justify-center">
                                      {pool.capacity ? (
                                        pool.capacityText ? (
                                          <div>
                                            <div className="mb-2 text-sm text-[#1A1F24]">
                                              {pool.capacityText}
                                            </div>
                                            <Progress
                                              value={Math.min(
                                                pool.capacityPercent,
                                                100,
                                              )}
                                              className="h-1.5 bg-[#E6F1EF]"
                                              indicatorClassName="bg-[#38EF7DB2]"
                                            />
                                          </div>
                                        ) : (
                                          <div className="text-sm text-[#1A1F24]">
                                            Limitless
                                          </div>
                                        )
                                      ) : (
                                        <div className="text-sm text-[#1A1F24]">
                                          Limitless
                                        </div>
                                      )}
                                    </div>

                                    {/* Points Multiplier Column */}
                                    <div className="flex flex-1 flex-col items-center justify-center">
                                      {pool.pointsMultiplier ? (
                                        <MyDottedTooltip
                                          tooltip={
                                            pool.pointsMultiplier.description
                                          }
                                        >
                                          <div className="flex w-fit items-center gap-1 rounded-lg border border-[#059669] bg-[#D1FAE5] px-2 py-1 text-sm font-semibold text-[#059669]">
                                            <Sparkles className="size-3.5" />
                                            {pool.pointsMultiplier.min ===
                                            pool.pointsMultiplier.max
                                              ? `${pool.pointsMultiplier.min}x`
                                              : `${pool.pointsMultiplier.min}x - ${pool.pointsMultiplier.max}x`}
                                          </div>
                                        </MyDottedTooltip>
                                      ) : (
                                        <span className="text-[#6B7780]">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Bottom Section */}
                                  <div className="px-6 py-2">
                                    <div className="flex items-center gap-4">
                                      {/* Protocol */}
                                      <div className="flex flex-1 items-center gap-2">
                                        <span className="text-xs text-[#6B7780]">
                                          Provider:
                                        </span>
                                        <div className="flex h-5 w-5 items-center justify-center">
                                          {pool.protocolIcon}
                                        </div>
                                        <span className="text-xs font-medium text-[#1A1F24]">
                                          {pool.protocolName}
                                        </span>
                                      </div>

                                      {/* Rewards (empty) */}
                                      <div className="flex-1"></div>

                                      {/* Description and Action Button */}
                                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                                        <span className="truncate text-xs text-[#1A1F24]">
                                          {pool.description}
                                        </span>
                                        <MyDottedTooltip
                                          tooltip={pool.description}
                                        >
                                          <HelpCircle className="h-4 w-4 shrink-0 cursor-help text-[#6B7780]" />
                                        </MyDottedTooltip>
                                        {pool.action && (
                                          <button
                                            onClick={() => {
                                              if (pool.action?.link) {
                                                handleCTAClick(
                                                  pool.action.link,
                                                  pool.action.onClick,
                                                );
                                              }
                                            }}
                                            className="w-32 whitespace-nowrap rounded-full bg-[#10B981] px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                                          >
                                            {pool.action.buttonText}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="rounded-2xl bg-white px-6 py-8 text-center text-[#6B7780]"
                            >
                              No contributor pools found matching your filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </div>

              {/* Mobile: Cards */}
              <div className="lg:hidden">
                <TabsContent value="earn" className="mt-0">
                  <div className="grid grid-cols-1 gap-5">
                    {filteredAndSortedProtocols.length > 0 ? (
                      renderProtocols(filteredAndSortedProtocols)
                    ) : (
                      <div className="col-span-full py-8 text-center text-[#6B7780]">
                        No protocols found matching your filters
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="borrow" className="mt-0">
                  <div className="grid grid-cols-1 gap-5">
                    {filteredAndSortedProtocols.length > 0 ? (
                      renderProtocols(filteredAndSortedProtocols)
                    ) : (
                      <div className="col-span-full py-8 text-center text-[#6B7780]">
                        No borrow protocols available at this time
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>

              {/* Mobile: Cards */}
              <div className="lg:hidden">
                <TabsContent value="contribute-liquidity" className="mt-0">
                  <div className="grid grid-cols-1 gap-5">
                    {filteredContributorPools.length > 0 ? (
                      filteredContributorPools.map((pool) => (
                        <DefiCard
                          key={pool.id}
                          tokens={pool.tokens}
                          protocolIcon={pool.protocolIcon}
                          badges={pool.badge ? [pool.badge] : []}
                          description={pool.description}
                          apy={
                            pool.yield !== null
                              ? {
                                  value: pool.yield,
                                  error: null,
                                  isLoading: false,
                                }
                              : undefined
                          }
                          capacity={
                            pool.capacity
                              ? {
                                  used: pool.capacity.used,
                                  total: pool.capacity.total,
                                }
                              : undefined
                          }
                          pointsMultiplier={pool.pointsMultiplier}
                          action={pool.action}
                          onActionClick={handleCTAClick}
                        />
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-[#6B7780]">
                        No contributor pools available at this time
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </div>
          </ShadCNTabs>
        </div>
      </div>
    </div>
  );
};

export default Defi;
