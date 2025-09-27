"use client";

import { useAtomValue } from "jotai";
import React, { useMemo } from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { MyAnalytics } from "@/lib/analytics";
import { cn, eventNames } from "@/lib/utils";
import { SupportedDApp } from "@/store/defi.store";

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
};

// BTC-specific yield atom - Using dummy data for now, will update later
const btcProtocolYieldsAtom: Partial<
  Record<
    SupportedDApp,
    {
      value: number | null;
      totalSupplied: number | null;
      error: Error | null;
      isLoading: boolean;
    }
  >
> = {
  ekuboBTCxWBTC: {
    value: null,
    totalSupplied: null,
    error: null,
    isLoading: false,
  },
  ekuboBTCxtBTC: {
    value: null,
    totalSupplied: null,
    error: null,
    isLoading: false,
  },
  ekuboBTCxLBTC: {
    value: null,
    totalSupplied: null,
    error: null,
    isLoading: false,
  },
  ekuboBTCxsBTC: {
    value: null,
    totalSupplied: null,
    error: null,
    isLoading: false,
  },
};

const BtcDefi: React.FC = () => {
  const { isPinned } = useSidebar();

  const sortedProtocols = useMemo(() => {
    return Object.entries(btcProtocolConfigs)
      .sort(([a], [b]) => {
        const yieldA =
          btcProtocolYieldsAtom[a as SupportedDApp]?.value ?? -Infinity;
        const yieldB =
          btcProtocolYieldsAtom[b as SupportedDApp]?.value ?? -Infinity;
        return yieldB - yieldA;
      })
      .map(([protocol]) => protocol);
  }, []);

  return (
    <div
      className={cn("mt-12 w-full", {
        "lg:pl-28": !isPinned,
      })}
    >
      <h1 className="text-2xl font-semibold tracking-[-1%] text-black">
        Earn extra yield by using your xyBTC on DeFi platforms
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

            return (
              <DefiCard
                key={protocol}
                tokens={config.tokens}
                protocolIcon={config.protocolIcon}
                badges={config.badges}
                description={config.description}
                apy={btcProtocolYieldsAtom[protocol as SupportedDApp]}
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
