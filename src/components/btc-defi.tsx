"use client";

import React, { useMemo } from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { MyAnalytics } from "@/lib/analytics";
import { cn, eventNames } from "@/lib/utils";
import {
  SupportedDApp,
  trovesHyperxWBTCYieldAtom,
  trovesHyperBTCxtBTCYieldAtom,
  trovesHyperBTCxLBTCYieldAtom,
  trovesHyperBTCxsBTCYieldAtom,
  trovesEkuboBTCxWBTCYieldAtom,
  trovesEkuboBTCxtBTCYieldAtom,
  trovesEkuboBTCxLBTCYieldAtom,
  trovesEkuboBTCxsBTCYieldAtom,
  vesuBTCxWBTCYieldAtom,
  vesuBTCxtBTCYieldAtom,
  vesuBTCxLBTCYieldAtom,
  vesuBTCxsBTCYieldAtom,
} from "@/store/defi.store";
import { useAtom } from "jotai";

import DefiCard, {
  ProtocolAction,
  ProtocolBadge,
  TokenDisplay,
} from "./defi-card";
import { Icons } from "./Icons";

export interface ProtocolConfig {
  tokens: TokenDisplay[];
  protocolIcon: React.ReactNode;
  protocolName: string;
  badges: ProtocolBadge[];
  description: string;
  apy?: number; // not %
  action?: ProtocolAction;
}

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
      link: "https://beta.troves.fi/strategy/ekubo_cl_xwbtcwbtc",
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
      link: "https://beta.troves.fi/strategy/ekubo_cl_xtbtctbtc",
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
      link: "https://beta.troves.fi/strategy/ekubo_cl_xlbtclbtc",
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
      link: "https://beta.troves.fi/strategy/ekubo_cl_xsbtcsolvbtc",
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
      link: "https://beta.troves.fi/strategy/hyper_xwbtc",
      buttonText: "Invest",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesHyperBTCxWBTC",
          buttonText: "Invest",
        });
      },
    },
  },
  hyperBTCxtBTC: {
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
      link: "https://beta.troves.fi/strategy/hyper_xtbtc",
      buttonText: "Invest",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesHyperBTCxtBTC",
          buttonText: "Invest",
        });
      },
    },
  },
  hyperBTCxsBTC: {
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
      link: "https://beta.troves.fi/strategy/hyper_xsbtc",
      buttonText: "Invest",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "trovesHyperBTCxsBTC",
          buttonText: "Invest",
        });
      },
    },
  },
  hyperBTCxLBTC: {
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
      link: "https://beta.troves.fi/strategy/hyper_xlbtc",
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
  // Vesu BTC Lending Pools
  vesuBTCxWBTC: {
    tokens: [
      { icon: <Icons.btcLogo className="size-[22px]" />, name: "xWBTC" },
    ],
    protocolIcon: <Icons.vesuLogo className="rounded-full" />,
    protocolName: "Vesu",
    badges: [{ type: "Lending Pool", color: "bg-[#E8F4FD] text-[#1E40AF]" }],
    description:
      "Lend xWBTC on Vesu to earn yield and access leveraged strategies",
    action: {
      type: "lend",
      link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
      buttonText: "Lend xWBTC",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesuBTCxWBTC",
          buttonText: "Lend xWBTC",
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
    description:
      "Lend xtBTC on Vesu to earn yield and access leveraged strategies",
    action: {
      type: "lend",
      link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
      buttonText: "Lend xtBTC",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesuBTCxtBTC",
          buttonText: "Lend xtBTC",
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
    description:
      "Lend xLBTC on Vesu to earn yield and access leveraged strategies",
    action: {
      type: "lend",
      link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
      buttonText: "Lend xLBTC",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesuBTCxLBTC",
          buttonText: "Lend xLBTC",
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
    description:
      "Lend xsBTC on Vesu to earn yield and access leveraged strategies",
    action: {
      type: "lend",
      link: "http://vesu.xyz/earn?onlyV2Markets=true&includeIsolatedMarkets=true",
      buttonText: "Lend xsBTC",
      onClick: () => {
        MyAnalytics.track(eventNames.OPPORTUNITIES, {
          protocol: "vesuBTCxsBTC",
          buttonText: "Lend xsBTC",
        });
      },
    },
  },
};

const BtcDefi: React.FC = () => {
  const { isPinned } = useSidebar();

  // Get yield data for all strategies using atoms
  const [vesuXWBTCYield] = useAtom(vesuBTCxWBTCYieldAtom);
  const [vesuXtBTCYield] = useAtom(vesuBTCxtBTCYieldAtom);
  const [vesuXLBTCYield] = useAtom(vesuBTCxLBTCYieldAtom);
  const [vesuXsBTCYield] = useAtom(vesuBTCxsBTCYieldAtom);

  // Troves Hyper Vault yields
  const [trovesHyperxWBTCYield] = useAtom(trovesHyperxWBTCYieldAtom);
  const [trovesHyperXtBTCYield] = useAtom(trovesHyperBTCxtBTCYieldAtom);
  const [trovesHyperXLBTCYield] = useAtom(trovesHyperBTCxLBTCYieldAtom);
  const [trovesHyperXsBTCYield] = useAtom(trovesHyperBTCxsBTCYieldAtom);

  // Troves Ekubo yields
  const [trovesEkuboXWBTCYield] = useAtom(trovesEkuboBTCxWBTCYieldAtom);
  const [trovesEkuboXtBTCYield] = useAtom(trovesEkuboBTCxtBTCYieldAtom);
  const [trovesEkuboXLBTCYield] = useAtom(trovesEkuboBTCxLBTCYieldAtom);
  const [trovesEkuboXsBTCYield] = useAtom(trovesEkuboBTCxsBTCYieldAtom);

  const sortedProtocols = useMemo(() => {
    return Object.entries(btcProtocolConfigs)
      .sort(([a], [b]) => {
        let yieldA = -Infinity;
        let yieldB = -Infinity;

        // Handle all strategies with real data
        if (a === "vesuBTCxWBTC") yieldA = vesuXWBTCYield?.value ?? -Infinity;
        else if (a === "vesuBTCxtBTC")
          yieldA = vesuXtBTCYield?.value ?? -Infinity;
        else if (a === "vesuBTCxLBTC")
          yieldA = vesuXLBTCYield?.value ?? -Infinity;
        else if (a === "vesuBTCxsBTC")
          yieldA = vesuXsBTCYield?.value ?? -Infinity;
        else if (a === "hyperxWBTC")
          yieldA = trovesHyperxWBTCYield?.value ?? -Infinity;
        else if (a === "hyperBTCxtBTC")
          yieldA = trovesHyperXtBTCYield?.value ?? -Infinity;
        else if (a === "hyperBTCxLBTC")
          yieldA = trovesHyperXLBTCYield?.value ?? -Infinity;
        else if (a === "hyperBTCxsBTC")
          yieldA = trovesHyperXsBTCYield?.value ?? -Infinity;
        else if (a === "ekuboBTCxWBTC")
          yieldA = trovesEkuboXWBTCYield?.value ?? -Infinity;
        else if (a === "ekuboBTCxtBTC")
          yieldA = trovesEkuboXtBTCYield?.value ?? -Infinity;
        else if (a === "ekuboBTCxLBTC")
          yieldA = trovesEkuboXLBTCYield?.value ?? -Infinity;
        else if (a === "ekuboBTCxsBTC")
          yieldA = trovesEkuboXsBTCYield?.value ?? -Infinity;
        else if (
          a === "avnuBTCxWBTC" ||
          a === "avnuBTCxtBTC" ||
          a === "avnuBTCxLBTC" ||
          a === "avnuBTCxsBTC"
        )
          yieldA = -Infinity; // Avnu strategies don't have yield data yet
        else yieldA = -Infinity;

        if (b === "vesuBTCxWBTC") yieldB = vesuXWBTCYield?.value ?? -Infinity;
        else if (b === "vesuBTCxtBTC")
          yieldB = vesuXtBTCYield?.value ?? -Infinity;
        else if (b === "vesuBTCxLBTC")
          yieldB = vesuXLBTCYield?.value ?? -Infinity;
        else if (b === "vesuBTCxsBTC")
          yieldB = vesuXsBTCYield?.value ?? -Infinity;
        else if (b === "hyperxWBTC")
          yieldB = trovesHyperxWBTCYield?.value ?? -Infinity;
        else if (b === "hyperBTCxtBTC")
          yieldB = trovesHyperXtBTCYield?.value ?? -Infinity;
        else if (b === "hyperBTCxLBTC")
          yieldB = trovesHyperXLBTCYield?.value ?? -Infinity;
        else if (b === "hyperBTCxsBTC")
          yieldB = trovesHyperXsBTCYield?.value ?? -Infinity;
        else if (b === "ekuboBTCxWBTC")
          yieldB = trovesEkuboXWBTCYield?.value ?? -Infinity;
        else if (b === "ekuboBTCxtBTC")
          yieldB = trovesEkuboXtBTCYield?.value ?? -Infinity;
        else if (b === "ekuboBTCxLBTC")
          yieldB = trovesEkuboXLBTCYield?.value ?? -Infinity;
        else if (b === "ekuboBTCxsBTC")
          yieldB = trovesEkuboXsBTCYield?.value ?? -Infinity;
        else if (
          b === "avnuBTCxWBTC" ||
          b === "avnuBTCxtBTC" ||
          b === "avnuBTCxLBTC" ||
          b === "avnuBTCxsBTC"
        )
          yieldB = -Infinity; // Avnu strategies don't have yield data yet
        else yieldB = -Infinity;

        return yieldB - yieldA;
      })
      .map(([protocol]) => protocol);
  }, [
    vesuXWBTCYield,
    vesuXtBTCYield,
    vesuXLBTCYield,
    vesuXsBTCYield,
    trovesHyperxWBTCYield,
    trovesHyperXtBTCYield,
    trovesHyperXLBTCYield,
    trovesHyperXsBTCYield,
    trovesEkuboXWBTCYield,
    trovesEkuboXtBTCYield,
    trovesEkuboXLBTCYield,
    trovesEkuboXsBTCYield,
  ]);

  return (
    <div
      className={cn("mt-12 w-full", {
        "lg:pl-28": !isPinned,
      })}
    >
      <h1 className="text-2xl font-semibold tracking-[-1%] text-black">
        Earn extra yield by using your xyBTCs on DeFi platforms
      </h1>

      <div className="mt-6">
        <div className="mb-6 rounded-md border border-[#17876D33] bg-[#17876D0A] p-4">
          <p className="text-sm text-[#03624C]">
            <b>Please note:</b> The protocols listed here are third-party
            services not affiliated with or endorsed by Endur. This list is
            provided for informational convenience only. Always do your own
            research and understand the risks before using any DeFi protocol.
          </p>
        </div>

        <p className="text-2xl font-normal tracking-[-1%] text-black">
          BTC DeFi Opportunities
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sortedProtocols.map((protocol) => {
            const config = btcProtocolConfigs[protocol as SupportedDApp];

            if (!config) return null;

            // Get the correct yield data for each protocol and map to DefiCard format
            let yieldData:
              | {
                  value: number | null;
                  error: Error | null;
                  isLoading: boolean;
                }
              | undefined = undefined;

            if (protocol === "vesuBTCxWBTC") {
              yieldData = {
                value: vesuXWBTCYield?.value ?? null,
                error: vesuXWBTCYield?.error ?? null,
                isLoading: vesuXWBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "vesuBTCxtBTC") {
              yieldData = {
                value: vesuXtBTCYield?.value ?? null,
                error: vesuXtBTCYield?.error ?? null,
                isLoading: vesuXtBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "vesuBTCxLBTC") {
              yieldData = {
                value: vesuXLBTCYield?.value ?? null,
                error: vesuXLBTCYield?.error ?? null,
                isLoading: vesuXLBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "vesuBTCxsBTC") {
              yieldData = {
                value: vesuXsBTCYield?.value ?? null,
                error: vesuXsBTCYield?.error ?? null,
                isLoading: vesuXsBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "hyperxWBTC") {
              yieldData = {
                value: trovesHyperxWBTCYield?.value ?? null,
                error: trovesHyperxWBTCYield?.error ?? null,
                isLoading: trovesHyperxWBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "hyperBTCxtBTC") {
              yieldData = {
                value: trovesHyperXtBTCYield?.value ?? null,
                error: trovesHyperXtBTCYield?.error ?? null,
                isLoading: trovesHyperXtBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "hyperBTCxLBTC") {
              yieldData = {
                value: trovesHyperXLBTCYield?.value ?? null,
                error: trovesHyperXLBTCYield?.error ?? null,
                isLoading: trovesHyperXLBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "hyperBTCxsBTC") {
              yieldData = {
                value: trovesHyperXsBTCYield?.value ?? null,
                error: trovesHyperXsBTCYield?.error ?? null,
                isLoading: trovesHyperXsBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "ekuboBTCxWBTC") {
              yieldData = {
                value: trovesEkuboXWBTCYield?.value ?? null,
                error: trovesEkuboXWBTCYield?.error ?? null,
                isLoading: trovesEkuboXWBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "ekuboBTCxtBTC") {
              yieldData = {
                value: trovesEkuboXtBTCYield?.value ?? null,
                error: trovesEkuboXtBTCYield?.error ?? null,
                isLoading: trovesEkuboXtBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "ekuboBTCxLBTC") {
              yieldData = {
                value: trovesEkuboXLBTCYield?.value ?? null,
                error: trovesEkuboXLBTCYield?.error ?? null,
                isLoading: trovesEkuboXLBTCYield?.isLoading ?? false,
              };
            } else if (protocol === "ekuboBTCxsBTC") {
              yieldData = {
                value: trovesEkuboXsBTCYield?.value ?? null,
                error: trovesEkuboXsBTCYield?.error ?? null,
                isLoading: trovesEkuboXsBTCYield?.isLoading ?? false,
              };
            }

            // Avnu strategies don't have yield data yet, so yieldData remains undefined

            return (
              <DefiCard
                key={protocol}
                tokens={config.tokens}
                protocolIcon={config.protocolIcon}
                badges={config.badges}
                description={config.description}
                apy={yieldData}
                action={config.action}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BtcDefi;
