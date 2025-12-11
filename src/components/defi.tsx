"use client";

import { useAtomValue } from "jotai";
import React, { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  HelpCircle,
  OctagonAlert,
  ShieldAlert,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { MyAnalytics } from "@/lib/analytics";
import { cn, eventNames } from "@/lib/utils";
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
  trovesEkuboBTCxWBTCYieldAtom,
  trovesEkuboBTCxtBTCYieldAtom,
  trovesEkuboBTCxLBTCYieldAtom,
  trovesEkuboBTCxsBTCYieldAtom,
  vesuBorrowPoolsAtom,
  VesuBorrowPool,
} from "@/store/defi.store";
import { useAtom } from "jotai";

import DefiCard, {
  ProtocolAction,
  ProtocolBadge,
  TokenDisplay,
} from "./defi-card";
import { Icons } from "./Icons";
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
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ChevronDown } from "lucide-react";

export interface ProtocolConfig {
  tokens: TokenDisplay[];
  protocolIcon: React.ReactNode;
  protocolName: string;
  badges: ProtocolBadge[];
  description: string;
  apy?: number; // not %
  action?: ProtocolAction;
}

// STRK protocol configurations
export const strkProtocolConfigs: Partial<
  Record<SupportedDApp, ProtocolConfig>
> = {
  strkfarm: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [{ type: "Yield Farming", color: "bg-[#E9F3F0] text-[#17876D]" }],
    description: "Leveraged xSTRK strategy on Vesu",
    action: {
      type: "lend",
      link: "https://app.troves.fi/strategy/xstrk_sensei",
      buttonText: "Invest",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "troves",
          buttonText: "Invest",
        });
      },
    },
  },
  strkfarmEkubo: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Automated Liquidity Pool",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Auto-managed liquidity vault for Ekubo's xSTRK/STRK pool. Rebalances range and compounds fees and rewards automatically.",
    action: {
      type: "pool",
      link: "https://app.troves.fi/strategy/ekubo_cl_xstrkstrk",
      buttonText: "Add Liquidity",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesEkubo",
          buttonText: "Add Liquidity",
        });
      },
    },
  },
  vesu: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
    ],
    protocolIcon: <Icons.vesuLogo className="rounded-full" />,
    protocolName: "Vesu",
    badges: [{ type: "Lend/Borrow", color: "bg-[#EEF6FF] text-[#0369A1]" }],
    description:
      "Earn DeFi Spring rewards & yield, use xSTRK as collateral to Borrow and Multiply",
    action: {
      type: "lend",
      link: "https://vesu.xyz/lend?form=true&poolId=2345856225134458665876812536882617294246962319062565703131100435311373119841&collateralAddress=0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
      buttonText: "Lend xSTRK",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesu",
          buttonText: "Lend xSTRK",
        });
      },
    },
  },
  avnu: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.avnuLogo className="rounded-full border" />,
    protocolName: "Avnu",
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xSTRK for STRK on Avnu",
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
  ekubo: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.ekuboLogo className="rounded-full" />,
    protocolName: "Ekubo",
    badges: [{ type: "Liquidity Pool", color: "bg-[#FFF7ED] text-[#EA580C]" }],
    description:
      "Provide liquidity to the xSTRK/STRK pool on Ekubo and earn trading fees & DeFi Spring rewards",
    action: {
      type: "pool",
      link: "https://app.ekubo.org/positions/new?quoteCurrency=xSTRK&baseCurrency=STRK",
      buttonText: "Add Liquidity",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "ekubo",
          buttonText: "Add Liquidity",
        });
      },
    },
  },
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
    action: {
      type: "lend",
      link: "https://app.opus.money/",
      buttonText: "Leverage Assets",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "opus",
          buttonText: "Leverage Assets",
        });
      },
    },
  },
};

// BTC-specific protocol configurations
export const btcProtocolConfigs: Partial<
  Record<SupportedDApp, ProtocolConfig>
> = {
  // BTC Concentrated Liquidity Strategies
  ekuboBTCxWBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xWBTC" },
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "WBTC" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Automated Liquidity Pool",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Auto-managed liquidity vault for Ekubo's xWBTC/WBTC pool. Rebalances range and compounds fees and rewards automatically.",
    action: {
      type: "pool",
      link: "https://app.troves.fi/strategy/ekubo_cl_xwbtcwbtc",
      buttonText: "Add Liquidity",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesEkuboBTCxWBTC",
          buttonText: "Add Liquidity",
        });
      },
    },
  },
  ekuboBTCxtBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xtBTC" },
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "tBTC" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Automated Liquidity Pool",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Auto-managed liquidity vault for Ekubo's xtBTC/tBTC pool. Rebalances range and compounds fees and rewards automatically.",
    action: {
      type: "pool",
      link: "https://app.troves.fi/strategy/ekubo_cl_xtbtctbtc",
      buttonText: "Add Liquidity",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesEkuboBTCxtBTC",
          buttonText: "Add Liquidity",
        });
      },
    },
  },
  ekuboBTCxLBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xLBTC" },
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "LBTC" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Automated Liquidity Pool",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Auto-managed liquidity vault for Ekubo's xLBTC/LBTC pool. Rebalances range and compounds fees and rewards automatically.",
    action: {
      type: "pool",
      link: "https://app.troves.fi/strategy/ekubo_cl_xlbtclbtc",
      buttonText: "Add Liquidity",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesEkuboBTCxLBTC",
          buttonText: "Add Liquidity",
        });
      },
    },
  },
  ekuboBTCxsBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xsBTC" },
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "solvBTC" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Automated Liquidity Pool",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Auto-managed liquidity vault for Ekubo's xsBTC/solvBTC pool. Rebalances range and compounds fees and rewards automatically.",
    action: {
      type: "pool",
      link: "https://app.troves.fi/strategy/ekubo_cl_xsbtcsolvbtc",
      buttonText: "Add Liquidity",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesEkuboBTCxsBTC",
          buttonText: "Add Liquidity",
        });
      },
    },
  },
  // BTC Hyper Vault Strategies
  hyperxWBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xWBTC" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Hyper Vault",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Automated hyper vault strategy for xWBTC. Maximizes yield through advanced DeFi strategies and auto-compounding.",
    action: {
      type: "vault",
      link: "https://app.troves.fi/strategy/hyper_xwbtc",
      buttonText: "Invest",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesHyperBTCxWBTC",
          buttonText: "Invest",
        });
      },
    },
  },
  hyperxtBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xtBTC" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Hyper Vault",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Automated hyper vault strategy for xtBTC. Maximizes yield through advanced DeFi strategies and auto-compounding.",
    action: {
      type: "vault",
      link: "https://app.troves.fi/strategy/hyper_xtbtc",
      buttonText: "Invest",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesHyperBTCxtBTC",
          buttonText: "Invest",
        });
      },
    },
  },
  hyperxsBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xsBTC" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Hyper Vault",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Automated hyper vault strategy for xsBTC. Maximizes yield through advanced DeFi strategies and auto-compounding.",
    action: {
      type: "vault",
      link: "https://app.troves.fi/strategy/hyper_xsbtc",
      buttonText: "Invest",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesHyperBTCxsBTC",
          buttonText: "Invest",
        });
      },
    },
  },
  hyperxLBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xLBTC" },
    ],
    protocolIcon: <Icons.trovesLogoLight className="rounded-full" />,
    protocolName: "Troves",
    badges: [
      {
        type: "Hyper Vault",
        color: "bg-[#E9F3F0] text-[#17876D]",
      },
    ],
    description:
      "Automated hyper vault strategy for xLBTC. Maximizes yield through advanced DeFi strategies and auto-compounding.",
    action: {
      type: "vault",
      link: "https://app.troves.fi/strategy/hyper_xlbtc",
      buttonText: "Invest",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesHyperBTCxLBTC",
          buttonText: "Invest",
        });
      },
    },
  },
  // BTC Token Swapping on Avnu
  avnuBTCxWBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xWBTC" },
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "WBTC" },
    ],
    protocolIcon: <Icons.avnuLogo className="rounded-full border" />,
    protocolName: "Avnu",
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xWBTC for WBTC on Avnu DEX aggregator",
    action: {
      type: "swap",
      link: "https://app.avnu.fi/en?mode=simple&tokenFrom=0x6a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13&tokenTo=0x3fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac&amount=100",
      buttonText: "Swap Tokens",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "avnuBTCxWBTC",
          buttonText: "Swap Tokens",
        });
      },
    },
  },
  avnuBTCxtBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xtBTC" },
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "tBTC" },
    ],
    protocolIcon: <Icons.avnuLogo className="rounded-full border" />,
    protocolName: "Avnu",
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xtBTC for tBTC on Avnu DEX aggregator",
    action: {
      type: "swap",
      link: "https://app.avnu.fi/en?mode=simple&tokenFrom=0x43a35c1425a0125ef8c171f1a75c6f31ef8648edcc8324b55ce1917db3f9b91&tokenTo=0x4daa17763b286d1e59b97c283c0b8c949994c361e426a28f743c67bdfe9a32f&amount=100",
      buttonText: "Swap Tokens",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "avnuBTCxtBTC",
          buttonText: "Swap Tokens",
        });
      },
    },
  },
  avnuBTCxLBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xLBTC" },
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "LBTC" },
    ],
    protocolIcon: <Icons.avnuLogo className="rounded-full border" />,
    protocolName: "Avnu",
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xLBTC for LBTC on Avnu DEX aggregator",
    action: {
      type: "swap",
      link: "https://app.avnu.fi/en?mode=simple&tokenFrom=0x7dd3c80de9fcc5545f0cb83678826819c79619ed7992cc06ff81fc67cd2efe0&tokenTo=0x036834a40984312f7f7de8d31e3f6305b325389eaeea5b1c0664b2fb936461a4&amount=100",
      buttonText: "Swap Tokens",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "avnuBTCxLBTC",
          buttonText: "Swap Tokens",
        });
      },
    },
  },
  avnuBTCxsBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xsBTC" },
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "solvBTC" },
    ],
    protocolIcon: <Icons.avnuLogo className="rounded-full border" />,
    protocolName: "Avnu",
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xsBTC for solvBTC on Avnu DEX aggregator",
    action: {
      type: "swap",
      link: "https://app.avnu.fi/en?mode=simple&tokenFrom=0x580f3dc564a7b82f21d40d404b3842d490ae7205e6ac07b1b7af2b4a5183dc9&tokenTo=0x0593e034dda23eea82d2ba9a30960ed42cf4a01502cc2351dc9b9881f9931a68&amount=100",
      buttonText: "Swap Tokens",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "avnuBTCxsBTC",
          buttonText: "Swap Tokens",
        });
      },
    },
  },
  // Vesu BTC Borrow Pools
  vesuBTCxWBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xWBTC" },
    ],
    protocolIcon: <Icons.vesuLogo className="rounded-full" />,
    protocolName: "Vesu",
    badges: [{ type: "Lending Pool", color: "bg-[#E8F4FD] text-[#1E40AF]" }],
    description: "Lend and borrow against xWBTC on Vesu",
    action: {
      type: "lend",
      link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
      buttonText: "Lend & Borrow",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesuBTCxWBTC",
          buttonText: "Lend & Borrow",
        });
      },
    },
  },
  vesuBTCxtBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xtBTC" },
    ],
    protocolIcon: <Icons.vesuLogo className="rounded-full" />,
    protocolName: "Vesu",
    badges: [{ type: "Lending Pool", color: "bg-[#E8F4FD] text-[#1E40AF]" }],
    description: "Lend and borrow against xtBTC on Vesu",
    action: {
      type: "lend",
      link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
      buttonText: "Lend & Borrow",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesuBTCxtBTC",
          buttonText: "Lend & Borrow",
        });
      },
    },
  },
  vesuBTCxLBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xLBTC" },
    ],
    protocolIcon: <Icons.vesuLogo className="rounded-full" />,
    protocolName: "Vesu",
    badges: [{ type: "Lending Pool", color: "bg-[#E8F4FD] text-[#1E40AF]" }],
    description: "Lend and borrow against xLBTC on Vesu",
    action: {
      type: "lend",
      link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
      buttonText: "Lend & Borrow",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesuBTCxLBTC",
          buttonText: "Lend & Borrow",
        });
      },
    },
  },
  vesuBTCxsBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xsBTC" },
    ],
    protocolIcon: <Icons.vesuLogo className="rounded-full" />,
    protocolName: "Vesu",
    badges: [{ type: "Lending Pool", color: "bg-[#E8F4FD] text-[#1E40AF]" }],
    description: "Lend and borrow against xsBTC on Vesu",
    action: {
      type: "lend",
      link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
      buttonText: "Lend & Borrow",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesuBTCxsBTC",
          buttonText: "Lend & Borrow",
        });
      },
    },
  },
};

// Combine all protocol configs
const allProtocolConfigs: Partial<Record<SupportedDApp, ProtocolConfig>> = {
  ...strkProtocolConfigs,
  ...btcProtocolConfigs,
};

// Categorize protocols by type
const supplyProtocols: SupportedDApp[] = [
  "strkfarm",
  "strkfarmEkubo",
  "vesu",
  "ekubo",
  "nostraDex",
  "opus",
  "hyperxWBTC",
  "hyperxtBTC",
  "hyperxsBTC",
  "hyperxLBTC",
  "ekuboBTCxWBTC",
  "ekuboBTCxtBTC",
  "ekuboBTCxLBTC",
  "ekuboBTCxsBTC",
  "vesuBTCxWBTC",
  "vesuBTCxtBTC",
  "vesuBTCxLBTC",
  "vesuBTCxsBTC",
  "avnu",
  "fibrous",
  "avnuBTCxWBTC",
  "avnuBTCxtBTC",
  "avnuBTCxLBTC",
  "avnuBTCxsBTC",
];

const borrowProtocols: SupportedDApp[] = [
  // Add borrow-specific protocols here when available
];

// Asset filter options
type AssetFilter = "all" | "xSTRK" | "xtBTC" | "xLBTC" | "xWBTC" | "xSolvBTC";

// Protocol filter options
type ProtocolFilter = "all" | "Ekubo" | "Vesu" | "Nostra" | "RE7Labs";

// Filters Component
interface FiltersProps {
  assetFilters: AssetFilter[];
  protocolFilters: ProtocolFilter[];
  selectedAsset: AssetFilter;
  selectedProtocol: ProtocolFilter;
  showMoreFilters: boolean;
  onAssetChange: (asset: AssetFilter) => void;
  onProtocolChange: (protocol: ProtocolFilter) => void;
  onToggleMoreFilters: () => void;
}

const Filters: React.FC<FiltersProps> = ({
  assetFilters,
  protocolFilters,
  selectedAsset,
  selectedProtocol,
  showMoreFilters,
  onAssetChange,
  onProtocolChange,
  onToggleMoreFilters,
}) => {
  return (
    <>
      {/* Asset Filters */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-[#5B616D]">Assets</p>
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
        </div>
        <div className="flex flex-wrap gap-2">
          {assetFilters.map((asset) => (
            <button
              key={asset}
              onClick={() => onAssetChange(asset)}
              className={cn(
                "rounded-lg border border-[#0000000D] bg-white px-3 py-2 text-xs font-medium text-[#5B616D] shadow-sm",
                {
                  "bg-[#17876D] text-white": selectedAsset === asset,
                },
              )}
            >
              {asset === "all" ? "All Assets" : asset}
            </button>
          ))}
        </div>
      </div>

      {/* Protocol Filters */}
      <div
        className={cn("mb-4 lg:mb-6", {
          hidden: !showMoreFilters,
        })}
      >
        <p className="mb-2 text-sm font-medium text-[#1A1F24]">Protocols</p>
        <div className="flex flex-wrap gap-2">
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

const UnifiedDefi: React.FC = () => {
  const { isPinned } = useSidebar();
  const yields: any = useAtomValue(protocolYieldsAtom);
  const [activeTab, setActiveTab] = useState<"supply" | "borrow">("supply");
  const [selectedAsset, setSelectedAsset] = useState<AssetFilter>("all");
  const [selectedProtocol, setSelectedProtocol] =
    useState<ProtocolFilter>("all");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleContinue = () => {
    setShowDisclaimer(false);
  };

  // BTC yield atoms
  const [trovesHyperxWBTCYield] = useAtom(trovesHyperxWBTCYieldAtom);
  const [trovesHyperxtBTCYield] = useAtom(trovesHyperxtBTCYieldAtom);
  const [trovesHyperxLBTCYield] = useAtom(trovesHyperxLBTCYieldAtom);
  const [trovesHyperxsBTCYield] = useAtom(trovesHyperxsBTCYieldAtom);
  const [trovesEkuboXWBTCYield] = useAtom(trovesEkuboBTCxWBTCYieldAtom);
  const [trovesEkuboXtBTCYield] = useAtom(trovesEkuboBTCxtBTCYieldAtom);
  const [trovesEkuboXLBTCYield] = useAtom(trovesEkuboBTCxLBTCYieldAtom);
  const [trovesEkuboXsBTCYield] = useAtom(trovesEkuboBTCxsBTCYieldAtom);
  const [vesuBTCxWBTCYield] = useAtom(vesuBTCxWBTCYieldAtom);
  const [vesuBTCxtBTCYield] = useAtom(vesuBTCxtBTCYieldAtom);
  const [vesuBTCxLBTCYield] = useAtom(vesuBTCxLBTCYieldAtom);
  const [vesuBTCxsBTCYield] = useAtom(vesuBTCxsBTCYieldAtom);
  const vesuBorrowPools = useAtomValue(vesuBorrowPoolsAtom);

  // Helper function to get yield for a protocol
  const getProtocolYield = (protocol: SupportedDApp): number | null => {
    if (protocol === "hyperxWBTC") return trovesHyperxWBTCYield?.value ?? null;
    if (protocol === "hyperxtBTC") return trovesHyperxtBTCYield?.value ?? null;
    if (protocol === "hyperxLBTC") return trovesHyperxLBTCYield?.value ?? null;
    if (protocol === "hyperxsBTC") return trovesHyperxsBTCYield?.value ?? null;
    if (protocol === "ekuboBTCxWBTC")
      return trovesEkuboXWBTCYield?.value ?? null;
    if (protocol === "ekuboBTCxtBTC")
      return trovesEkuboXtBTCYield?.value ?? null;
    if (protocol === "ekuboBTCxLBTC")
      return trovesEkuboXLBTCYield?.value ?? null;
    if (protocol === "ekuboBTCxsBTC")
      return trovesEkuboXsBTCYield?.value ?? null;
    if (protocol === "vesuBTCxWBTC") return vesuBTCxWBTCYield?.value ?? null;
    if (protocol === "vesuBTCxtBTC") return vesuBTCxtBTCYield?.value ?? null;
    if (protocol === "vesuBTCxLBTC") return vesuBTCxLBTCYield?.value ?? null;
    if (protocol === "vesuBTCxsBTC") return vesuBTCxsBTCYield?.value ?? null;
    return yields[protocol]?.value ?? null;
  };

  // Helper function to check if protocol matches asset filter
  const matchesAssetFilter = (
    protocol: SupportedDApp,
    config: ProtocolConfig,
  ): boolean => {
    if (selectedAsset === "all") return true;
    const tokenNames = config.tokens.map((t) => t.name);
    return tokenNames.some((name) => {
      if (selectedAsset === "xSTRK") return name === "xSTRK";
      if (selectedAsset === "xtBTC") return name === "xtBTC";
      if (selectedAsset === "xLBTC") return name === "xLBTC";
      if (selectedAsset === "xWBTC") return name === "xWBTC";
      if (selectedAsset === "xSolvBTC")
        return name === "xsBTC" || name === "solvBTC";
      return false;
    });
  };

  // Helper function to check if protocol matches protocol filter
  const matchesProtocolFilter = (config: ProtocolConfig): boolean => {
    if (selectedProtocol === "all") return true;
    const protocolName = config.protocolName.toLowerCase();
    if (selectedProtocol === "Ekubo") return protocolName === "ekubo";
    if (selectedProtocol === "Vesu") return protocolName === "vesu";
    if (selectedProtocol === "Nostra") return protocolName.includes("nostra");
    if (selectedProtocol === "RE7Labs") return protocolName.includes("re7");
    return false;
  };

  // Create dynamic protocol configs from Vesu borrow pools
  const vesuBorrowConfigs = useMemo(() => {
    const configs: Record<string, ProtocolConfig> = {};
    vesuBorrowPools.forEach((pool, index) => {
      const key = `vesuBorrow_${pool.collateralSymbol}_${pool.debtSymbol}_${index}`;
      const collateralIcon =
        pool.collateralSymbol === "xSTRK" ? (
          <Icons.endurLogo className="size-[22px]" />
        ) : (
          <Icons.btcLogo className="size-[22px]" />
        );
      const debtIcon =
        pool.debtSymbol === "STRK" ? (
          <Icons.strkLogo className="size-[22px]" />
        ) : pool.debtSymbol.includes("BTC") ? (
          <Icons.btcLogo className="size-[22px]" />
        ) : pool.debtSymbol === "USDC" || pool.debtSymbol === "USDC.e" ? (
          <Icons.usdcLogo className="size-[22px]" />
        ) : (
          <Icons.btcLogo className="size-[22px]" />
        );

      configs[key] = {
        tokens: [
          { icon: collateralIcon, name: pool.collateralSymbol },
          { icon: debtIcon, name: pool.debtSymbol },
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
        apy: pool.borrowApr ? pool.borrowApr / 100 : undefined,
        action: {
          type: "borrow",
          link: `https://vesu.xyz/lend?form=true&poolId=${pool.poolId}&collateralAddress=${pool.collateralAddress}`,
          buttonText: "Borrow",
          onClick: () => {
            MyAnalytics.track(eventNames.OPPORTUNITIES, {
              protocol: "vesuBorrow",
              buttonText: "Borrow",
            });
          },
        },
      };
    });
    return configs;
  }, [vesuBorrowPools]);

  // Combine all protocol configs including dynamic Vesu borrow pools
  const allProtocolConfigsWithBorrow = useMemo(() => {
    return { ...allProtocolConfigs, ...vesuBorrowConfigs } as Record<
      string,
      ProtocolConfig
    >;
  }, [vesuBorrowConfigs]);

  // Get borrow protocol keys
  const borrowProtocolKeys = useMemo(() => {
    return Object.keys(vesuBorrowConfigs);
  }, [vesuBorrowConfigs]);

  // Filter and sort protocols based on active tab and filters
  const filteredAndSortedProtocols = useMemo(() => {
    const currentProtocols =
      activeTab === "supply" ? supplyProtocols : borrowProtocolKeys;
    const configsToUse: Record<string, ProtocolConfig> =
      activeTab === "supply"
        ? (allProtocolConfigs as Record<string, ProtocolConfig>)
        : allProtocolConfigsWithBorrow;

    return currentProtocols
      .filter((protocol) => {
        const config = configsToUse[protocol];
        if (!config) return false;
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
        const yieldA =
          activeTab === "borrow" && configA?.apy
            ? configA.apy * 100
            : (getProtocolYield(a as SupportedDApp) ?? -Infinity);
        const yieldB =
          activeTab === "borrow" && configB?.apy
            ? configB.apy * 100
            : (getProtocolYield(b as SupportedDApp) ?? -Infinity);
        return yieldB - yieldA;
      });
  }, [
    activeTab,
    selectedAsset,
    selectedProtocol,
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
    allProtocolConfigsWithBorrow,
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
    const shouldShowApy = ![
      "avnu",
      "fibrous",
      "avnuBTCxWBTC",
      "avnuBTCxtBTC",
      "avnuBTCxLBTC",
      "avnuBTCxsBTC",
    ].includes(protocol);

    if (protocol === "hyperxWBTC") {
      return {
        value: trovesHyperxWBTCYield?.value ?? null,
        error: trovesHyperxWBTCYield?.error ?? null,
        isLoading: trovesHyperxWBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "hyperxtBTC") {
      return {
        value: trovesHyperxtBTCYield?.value ?? null,
        error: trovesHyperxtBTCYield?.error ?? null,
        isLoading: trovesHyperxtBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "hyperxLBTC") {
      return {
        value: trovesHyperxLBTCYield?.value ?? null,
        error: trovesHyperxLBTCYield?.error ?? null,
        isLoading: trovesHyperxLBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "hyperxsBTC") {
      return {
        value: trovesHyperxsBTCYield?.value ?? null,
        error: trovesHyperxsBTCYield?.error ?? null,
        isLoading: trovesHyperxsBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "ekuboBTCxWBTC") {
      return {
        value: trovesEkuboXWBTCYield?.value ?? null,
        error: trovesEkuboXWBTCYield?.error ?? null,
        isLoading: trovesEkuboXWBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "ekuboBTCxtBTC") {
      return {
        value: trovesEkuboXtBTCYield?.value ?? null,
        error: trovesEkuboXtBTCYield?.error ?? null,
        isLoading: trovesEkuboXtBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "ekuboBTCxLBTC") {
      return {
        value: trovesEkuboXLBTCYield?.value ?? null,
        error: trovesEkuboXLBTCYield?.error ?? null,
        isLoading: trovesEkuboXLBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "ekuboBTCxsBTC") {
      return {
        value: trovesEkuboXsBTCYield?.value ?? null,
        error: trovesEkuboXsBTCYield?.error ?? null,
        isLoading: trovesEkuboXsBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "vesuBTCxWBTC") {
      return {
        value: vesuBTCxWBTCYield?.value ?? null,
        error: vesuBTCxWBTCYield?.error ?? null,
        isLoading: vesuBTCxWBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "vesuBTCxtBTC") {
      return {
        value: vesuBTCxtBTCYield?.value ?? null,
        error: vesuBTCxtBTCYield?.error ?? null,
        isLoading: vesuBTCxtBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "vesuBTCxLBTC") {
      return {
        value: vesuBTCxLBTCYield?.value ?? null,
        error: vesuBTCxLBTCYield?.error ?? null,
        isLoading: vesuBTCxLBTCYield?.isLoading ?? false,
      };
    } else if (protocol === "vesuBTCxsBTC") {
      return {
        value: vesuBTCxsBTCYield?.value ?? null,
        error: vesuBTCxsBTCYield?.error ?? null,
        isLoading: vesuBTCxsBTCYield?.isLoading ?? false,
      };
    } else {
      // Other protocols use the yields from protocolYieldsAtom
      return shouldShowApy ? yields[protocol] : undefined;
    }
  };

  const renderProtocols = (protocols: string[]) => {
    return protocols.map((protocol) => {
      const configsToUse: Record<string, ProtocolConfig> =
        activeTab === "supply"
          ? (allProtocolConfigs as Record<string, ProtocolConfig>)
          : allProtocolConfigsWithBorrow;
      const config = configsToUse[protocol];
      if (!config) return null;

      const shouldShowApy = ![
        "avnu",
        "fibrous",
        "avnuBTCxWBTC",
        "avnuBTCxtBTC",
        "avnuBTCxLBTC",
        "avnuBTCxsBTC",
      ].includes(protocol);

      // For borrow pools, use the apy from config; for supply, use getYieldDataForProtocol
      const yieldData =
        activeTab === "borrow" && config.apy
          ? {
              value: config.apy * 100,
              error: null,
              isLoading: false,
            }
          : getYieldDataForProtocol(protocol as SupportedDApp);

      // Find matching borrow pool data for capacity, maxLTV, and pool name
      let pool: VesuBorrowPool | undefined;
      let maxLTV: number | undefined;
      let capacity: { used: number; total: number } | undefined;

      if (activeTab === "borrow" && config.tokens.length >= 2) {
        pool = vesuBorrowPools.find(
          (p) =>
            p.collateralSymbol === config.tokens[0].name &&
            p.debtSymbol === config.tokens[1].name,
        );
        if (pool) {
          maxLTV = pool.maxLTV;
          capacity = {
            used: pool.totalDebt,
            total: pool.debtCap,
          };
        }
      }

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
        />
      );
    });
  };

  const renderTableRows = (protocols: string[]) => {
    return protocols.map((protocol) => {
      const configsToUse =
        activeTab === "supply"
          ? (allProtocolConfigs as Record<string, ProtocolConfig>)
          : allProtocolConfigsWithBorrow;
      const config = configsToUse[protocol];
      if (!config) return null;

      const shouldShowApy = ![
        "avnu",
        "fibrous",
        "avnuBTCxWBTC",
        "avnuBTCxtBTC",
        "avnuBTCxLBTC",
        "avnuBTCxsBTC",
      ].includes(protocol);

      // For borrow pools, use the apy from config; for supply, use getYieldDataForProtocol
      const apyValue =
        activeTab === "borrow" && config.apy
          ? config.apy * 100
          : (getYieldDataForProtocol(protocol as SupportedDApp)?.value ?? null);
      const isLoading =
        activeTab === "borrow"
          ? false
          : (getYieldDataForProtocol(protocol as SupportedDApp)?.isLoading ??
            false);

      // Get token pair display
      const tokenPair = config.tokens.map((t) => t.name).join("/");
      const primaryToken = config.tokens[0];
      const secondaryToken = config.tokens[1];

      // Get badge type
      const badgeType = config.badges[0]?.type || "";

      return (
        <TableRow
          key={protocol}
          className="border-b border-[#E5E8EB] bg-white hover:bg-[#F7F9FA]"
        >
          <TableCell className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white">
                  {primaryToken.icon}
                </div>
                {secondaryToken && (
                  <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white">
                    {secondaryToken.icon}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium text-[#1A1F24]">{tokenPair}</div>
                <div className="mt-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      config.badges[0]?.color || "bg-gray-100 text-gray-600",
                    )}
                  >
                    {badgeType}
                  </span>
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell className="px-6 py-4">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-200" />
            ) : apyValue !== null ? (
              <div className="inline-flex flex-col gap-1">
                <div className="rounded-lg bg-[#FEF3C7] px-3 py-1.5 text-sm font-semibold text-[#D97706]">
                  {apyValue.toFixed(2)}%
                </div>
                <div className="text-xs text-[#6B7780]">Supply yield: 0%</div>
              </div>
            ) : (
              <span className="text-[#6B7780]">-</span>
            )}
          </TableCell>
          <TableCell className="px-6 py-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-[#1A1F24]">$13.32M of $50M used</div>
              <Progress
                value={26.64}
                className="h-1.5 bg-[#E5E8EB]"
                indicatorClassName="bg-[#10B981]"
              />
            </div>
          </TableCell>
          <TableCell className="px-6 py-4 text-right">
            {config.action && (
              <Button
                onClick={() => {
                  if (config.action?.onClick) {
                    config.action.onClick();
                  }
                  if (config.action?.link) {
                    window.open(config.action.link, "_blank");
                  }
                }}
                className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {activeTab === "supply" ? "Supply" : "Borrow"}
              </Button>
            )}
          </TableCell>
        </TableRow>
      );
    });
  };

  const assetFilters: AssetFilter[] = [
    "all",
    "xSTRK",
    "xtBTC",
    "xLBTC",
    "xWBTC",
    "xSolvBTC",
  ];

  const protocolFilters: ProtocolFilter[] = ["all", "Ekubo", "Vesu", "Nostra"];

  return (
    <>
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

      <div
        className={cn("w-full", {
          "lg:pl-28": !isPinned,
        })}
      >
        <div className="grid grid-cols-[30px_auto] place-items-center gap-2">
          <div className="rounded-full bg-gradient-to-b from-[#0D5F4E] to-[#11998E] p-2">
            <Icons.blocks className="h-4 w-4" />
          </div>
          <div className="w-full">
            <h1 className="font-semibold text-[#1A1F24] lg:text-lg">
              DeFi opportunities
            </h1>
          </div>
          <div className="col-span-full w-full lg:col-start-2">
            <p className="text-xs text-[#5F6C72] lg:text-sm">
              Convert your STRK, BTC into xSTRK, xyBTC to earn staking and
              participate in DeFi opportunities across the Starknet ecosystem.
            </p>
          </div>
        </div>

        <div className="mt-6">
          {/* Main Tabs - Supply & Earn / Borrow */}
          <ShadCNTabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "supply" | "borrow")
            }
            className="w-full"
          >
            {/* Header Section: Tabs and Filters */}
            <div className="w-full rounded-[14px] border border-[#E5E8EB] bg-white p-2">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="flex h-auto w-full gap-0 rounded-[14px] border border-[#E5E8EB] bg-white p-1 lg:w-[350px]">
                  {[
                    { value: "supply", label: "Supply & Earn" },
                    { value: "borrow", label: "Borrow" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        "flex-1 rounded-[10px] border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[#6B7780] transition-all data-[state=active]:border-[#17876D] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#1A1F24] data-[state=active]:shadow-none lg:px-6 lg:py-2.5 lg:text-base",
                      )}
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <button
                  onClick={() => setShowDisclaimer(true)}
                  className="flex w-fit items-center justify-center gap-2 rounded-full border border-[#D69733] bg-[#D697331A] px-2 py-1 text-xs text-[#F59E0B] lg:self-end"
                >
                  <OctagonAlert className="h-4 w-4" />
                  Disclaimer
                </button>
              </div>

              {(["supply", "borrow"] as const).map((tab) => (
                <TabsContent
                  key={tab}
                  value={tab}
                  className="mt-6 rounded-lg bg-[#17876D08] p-2"
                >
                  <Filters
                    assetFilters={assetFilters}
                    protocolFilters={protocolFilters}
                    selectedAsset={selectedAsset}
                    selectedProtocol={selectedProtocol}
                    showMoreFilters={showMoreFilters}
                    onAssetChange={setSelectedAsset}
                    onProtocolChange={setSelectedProtocol}
                    onToggleMoreFilters={() =>
                      setShowMoreFilters(!showMoreFilters)
                    }
                  />
                </TabsContent>
              ))}
            </div>

            {/* Content Section - Tables (Desktop) and Cards (Mobile) */}
            <div className="mt-6 w-full">
              {/* Desktop: Tables */}
              <div className="hidden lg:block">
                <TabsContent value="supply" className="mt-0">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full table-fixed border-separate border-spacing-y-2">
                      <thead>
                        <tr>
                          <th className="w-[25%] rounded-tl-[14px] bg-gradient-to-b from-[#F0F9F7] to-white px-6 py-2 text-left text-sm font-medium text-[#5B616D] shadow-sm">
                            Pair & Pool
                          </th>
                          <th className="w-[25%] bg-gradient-to-b from-[#F0F9F7] to-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                            Yield
                          </th>
                          <th className="w-[25%] bg-gradient-to-b from-[#F0F9F7] to-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                            Capacity
                          </th>
                          <th className="w-[25%] rounded-tr-[14px] bg-gradient-to-b from-[#F0F9F7] to-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedProtocols.length > 0 ? (
                          filteredAndSortedProtocols.map((protocol) => {
                            const configsToUse: Record<string, ProtocolConfig> =
                              allProtocolConfigs as Record<
                                string,
                                ProtocolConfig
                              >;
                            const config = configsToUse[protocol];
                            if (!config) return null;

                            const shouldShowApy = ![
                              "avnu",
                              "fibrous",
                              "avnuBTCxWBTC",
                              "avnuBTCxtBTC",
                              "avnuBTCxLBTC",
                              "avnuBTCxsBTC",
                            ].includes(protocol);

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
                                        "shadow-[0_1px_1px_-0.5px_rgba(0,0,0,0.08),_0_3px_3px_-1.5px_rgba(0,0,0,0.08),_0_20px_20px_-12px_rgba(0,0,0,0.08),_0_32px_32px_-16px_rgba(0,0,0,0.08)]",
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
                                            <div className="w-fit rounded-lg border border-[#059669] bg-[#D1FAE5] px-2 py-1 text-sm font-semibold text-[#059669]">
                                              {apyValue.toFixed(2)}%
                                            </div>
                                            <div className="text-xs text-[#6B7780]">
                                              Supply yield: 0%
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
                                        <div>
                                          <div className="mb-2 text-sm text-[#1A1F24]">
                                            $13.32M of $50M used
                                          </div>
                                          <Progress
                                            value={26.64}
                                            className="h-1.5 bg-[#E6F1EF]"
                                            indicatorClassName="bg-[#38EF7DB2]"
                                          />
                                        </div>
                                      </div>

                                      {/* Action Column */}
                                      <div className="flex flex-1 flex-col items-center justify-center">
                                        {config.action && (
                                          <button
                                            onClick={() => {
                                              if (config.action?.onClick) {
                                                config.action.onClick();
                                              }
                                              if (config.action?.link) {
                                                window.open(
                                                  config.action.link,
                                                  "_blank",
                                                );
                                              }
                                            }}
                                            className="w-36 rounded-full bg-[#10B981] px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                                          >
                                            {config.action.buttonText}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Bottom Section */}
                                    <div className="px-6 py-2">
                                      <div className="flex items-center gap-4">
                                        {/* Protocol */}
                                        <div className="flex flex-1 items-center gap-2">
                                          <span className="text-xs text-[#6B7780]">
                                            Protocol:
                                          </span>
                                          <div className="flex h-5 w-5 items-center justify-center">
                                            {config.protocolIcon}
                                          </div>
                                          <span className="text-xs font-medium text-[#1A1F24]">
                                            {config.protocolName}
                                          </span>
                                        </div>

                                        {/* Rewards (empty) */}
                                        <div className="flex-1"></div>

                                        {/* Description */}
                                        <div className="flex flex-1"></div>

                                        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
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
                  <div className="w-full overflow-x-auto">
                    <table className="w-full table-fixed border-separate border-spacing-y-2">
                      <thead>
                        <tr>
                          <th className="w-[25%] rounded-tl-[14px] bg-gradient-to-b from-[#F0F9F7] to-white px-6 py-2 text-left text-sm font-medium text-[#5B616D] shadow-sm">
                            Pair & Pool
                          </th>
                          <th className="w-[25%] bg-gradient-to-b from-[#F0F9F7] to-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                            Yield
                          </th>
                          <th className="w-[25%] bg-gradient-to-b from-[#F0F9F7] to-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm">
                            Capacity
                          </th>
                          <th className="w-[25%] rounded-tr-[14px] bg-gradient-to-b from-[#F0F9F7] to-white px-6 py-2 text-center text-sm font-medium text-[#5B616D] shadow-sm"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedProtocols.length > 0 ? (
                          filteredAndSortedProtocols.map((protocol) => {
                            const config =
                              allProtocolConfigsWithBorrow[protocol];
                            if (!config) return null;

                            // For borrow pools, use the apy from config
                            const apyValue =
                              config.apy !== undefined
                                ? config.apy * 100
                                : null;
                            const isLoading = false;

                            const tokenPair = config.tokens
                              .map((t: TokenDisplay) => t.name)
                              .join("/");
                            const primaryToken = config.tokens[0];
                            const secondaryToken = config.tokens[1];
                            const badgeType = config.badges[0]?.type || "";

                            // Find the corresponding pool for capacity data
                            const pool = vesuBorrowPools.find(
                              (p) =>
                                primaryToken &&
                                secondaryToken &&
                                p.collateralSymbol === primaryToken.name &&
                                p.debtSymbol === secondaryToken.name,
                            );
                            const capacityUsed =
                              pool && pool.debtCap > 0
                                ? (pool.totalDebt / pool.debtCap) * 100
                                : 0;

                            // Format capacity text - values are already converted from wei/base units
                            // Format: "$X.XXM of $YM used" (matching image design)
                            const formatCapacityValue = (
                              value: number,
                            ): string => {
                              if (value >= 1e6) {
                                const millions = value / 1e6;
                                // Show decimals only if not a whole number
                                return millions % 1 === 0
                                  ? `$${millions.toFixed(0)}M`
                                  : `$${millions.toFixed(2)}M`;
                              } else if (value >= 1e3) {
                                const thousands = value / 1e3;
                                return thousands % 1 === 0
                                  ? `$${thousands.toFixed(0)}K`
                                  : `$${thousands.toFixed(2)}K`;
                              } else {
                                return `$${value.toFixed(2)}`;
                              }
                            };

                            const capacityText = pool
                              ? `${formatCapacityValue(pool.totalDebt)} of ${formatCapacityValue(pool.debtCap)} used`
                              : "$0 of $0 used";

                            // Accent colors: green for supply, yellow/orange for borrow
                            const isBorrowPool = activeTab === "borrow";
                            const accentColor = isBorrowPool
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
                                    className={cn("bg-white", "flex flex-col")}
                                  >
                                    {/* Main Row */}
                                    <div
                                      className={cn(
                                        "px-4 py-8",
                                        "flex items-center gap-4",
                                        "shadow-[0_1px_1px_-0.5px_rgba(0,0,0,0.08),_0_3px_3px_-1.5px_rgba(0,0,0,0.08),_0_20px_20px_-12px_rgba(0,0,0,0.08),_0_32px_32px_-16px_rgba(0,0,0,0.08)]",
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
                                          {pool &&
                                            pool.maxLTV !== undefined && (
                                              <div className="mt-2 text-xs text-[#6B7780]">
                                                Max LTV -{" "}
                                                {pool.maxLTV.toFixed(0)}%
                                              </div>
                                            )}
                                        </div>
                                      </div>

                                      {/* Yield Column */}
                                      <div className="flex flex-1 flex-col items-center justify-center">
                                        {isLoading ? (
                                          <div className="w-fit animate-pulse rounded-lg bg-gray-200" />
                                        ) : apyValue !== null ? (
                                          <div className="flex flex-col gap-1">
                                            <div
                                              className={cn(
                                                "w-fit rounded-lg border px-2 py-1 text-sm font-semibold",
                                                accentColor.yieldBg,
                                                accentColor.yieldText,
                                                isBorrowPool
                                                  ? "border-[#D97706]"
                                                  : "border-[#059669]",
                                              )}
                                            >
                                              {apyValue.toFixed(2)}%
                                            </div>
                                            <div className="text-xs text-[#6B7780]">
                                              {isBorrowPool
                                                ? "Borrow yield"
                                                : "Supply yield: 0%"}
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
                                        <div>
                                          <div className="mb-2 text-sm text-[#1A1F24]">
                                            {capacityText}
                                          </div>
                                          <Progress
                                            value={Math.min(capacityUsed, 100)}
                                            className="h-1.5 bg-[#E6F1EF]"
                                            indicatorClassName={
                                              accentColor.progressBar
                                            }
                                          />
                                        </div>
                                      </div>

                                      {/* Action Column */}
                                      <div className="flex flex-1 flex-col items-center justify-center">
                                        {config.action && (
                                          <button
                                            onClick={() => {
                                              if (config.action?.onClick) {
                                                config.action.onClick();
                                              }
                                              if (config.action?.link) {
                                                window.open(
                                                  config.action.link,
                                                  "_blank",
                                                );
                                              }
                                            }}
                                            className={cn(
                                              "w-36 rounded-full px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90",
                                              accentColor.buttonBg,
                                            )}
                                          >
                                            {config.action.buttonText}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Bottom Section */}
                                    <div className="px-6 py-2">
                                      <div className="flex items-center gap-4">
                                        {/* Protocol */}
                                        <div className="flex flex-1 items-center gap-2">
                                          <span className="text-xs text-[#6B7780]">
                                            Protocol:
                                          </span>
                                          <div className="flex h-5 w-5 items-center justify-center">
                                            {config.protocolIcon}
                                          </div>
                                          <span className="text-xs font-medium text-[#1A1F24]">
                                            {config.protocolName}
                                          </span>
                                        </div>

                                        {/* Rewards (empty) */}
                                        <div className="flex-1"></div>

                                        {/* Description */}
                                        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
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
              </div>

              {/* Mobile: Cards */}
              <div className="lg:hidden">
                <TabsContent value="supply" className="mt-0">
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
            </div>
          </ShadCNTabs>
        </div>
      </div>
    </>
  );
};

export default UnifiedDefi;
