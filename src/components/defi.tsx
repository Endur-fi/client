"use client";

import { useAtomValue } from "jotai";
import React, { useMemo } from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { protocolYieldsAtom } from "@/store/defi.store";

import DefiCard, {
  ProtocolAction,
  ProtocolBadge,
  TokenDisplay,
} from "./defi-card";
import { Icons } from "./Icons";

interface ProtocolConfig {
  tokens: TokenDisplay[];
  protocolIcon: React.ReactNode;
  badges: ProtocolBadge[];
  description: string;
  action?: ProtocolAction;
}

export const protocolConfigs: Record<string, ProtocolConfig> = {
  strkfarm: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
    ],
    protocolIcon: <Icons.strkfarmLogo className="size-8" />,
    badges: [{ type: "Yield Farming", color: "bg-[#E9F3F0] text-[#17876D]" }],
    description: "Auto compound defi spring rewards on xSTRK",
    action: undefined,
  },
  vesu: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
    ],
    protocolIcon: <Icons.vesuLogo className="size-8 rounded-full" />,
    badges: [{ type: "Lend/Borrow", color: "bg-[#EEF6FF] text-[#0369A1]" }],
    description:
      "Earn DeFi Spring rewards & yield, use xSTRK as collateral to Borrow and Multiply",
    action: {
      type: "lend",
      link: "https://vesu.xyz/lend?form=true&poolId=2345856225134458665876812536882617294246962319062565703131100435311373119841&collateralAddress=0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
      buttonText: "Lend xSTRK",
    },
  },
  avnu: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.avnuLogo className="size-8 rounded-full border" />,
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xSTRK for STRK on Avnu",
    action: {
      type: "swap",
      link: "https://app.avnu.fi/en?mode=simple&tokenFrom=0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a&tokenTo=0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d&amount=100",
      buttonText: "Swap Tokens",
    },
  },
  fibrous: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.fibrousLogo className="size-8 rounded-full" />,
    badges: [{ type: "DEX Aggregator", color: "bg-[#F3E8FF] text-[#9333EA]" }],
    description: "Swap xSTRK for STRK on Fibrous",
    action: {
      type: "swap",
      link: "https://app.fibrous.finance/en?network=starknet&mode=swap&source=0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a&destination=0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      buttonText: "Swap Tokens",
    },
  },
  "nostra-pool": {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.nostraLogo className="size-8 rounded-full" />,
    badges: [{ type: "Liquidity Pool", color: "bg-[#FFF7ED] text-[#EA580C]" }],
    description:
      "Provide liquidity to the xSTRK/STRK pool on Nostra and earn trading fees",
    action: {
      type: "pool",
      link: "https://app.nostra.finance/pools/xSTRK-STRK/deposit",
      buttonText: "Add Liquidity",
    },
  },
  "nostra-lend": {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
    ],
    protocolIcon: <Icons.nostraLogo className="size-8 rounded-full" />,
    badges: [{ type: "Lend/Borrow", color: "bg-[#EEF6FF] text-[#0369A1]" }],
    description: "Lend your xSTRK on Nostra to earn additional yield",
    action: {
      type: "lend",
      link: "https://app.nostra.finance/lend-borrow/xSTRK/deposit",
      buttonText: "Lend Assets",
    },
  },
  ekubo: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.ekuboLogo className="size-8 rounded-full" />,
    badges: [{ type: "Liquidity Pool", color: "bg-[#FFF7ED] text-[#EA580C]" }],
    description:
      "Provide liquidity to the xSTRK/STRK pool on Ekubo and earn trading fees & DeFi Spring rewards",
    action: {
      type: "pool",
      link: "https://app.ekubo.org/positions/new?quoteCurrency=xSTRK&baseCurrency=STRK",
      buttonText: "Add Liquidity",
    },
  },
  haiko: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.strkLogo className="size-[22px]" />, name: "STRK" },
    ],
    protocolIcon: <Icons.haikoLogo className="size-8 rounded-full" />,
    badges: [{ type: "Liquidity Pool", color: "bg-[#FFF7ED] text-[#EA580C]" }],
    description:
      "Provide liquidity to the xSTRK/STRK pool on Haiko and earn trading fees & rewards",
    action: {
      type: "pool",
      link: "https://app.haiko.xyz/vaults/positions?type=solver&address=0x73cc79b07a02fe5dcd714903d62f9f3081e15aeb34e3725f44e495ecd88a5a1&marketId=0x60a19777e802ecb59ebc67604b28643dec2dd45ddf7683190b085c2cdd5bdcd&tab=deposit",
      buttonText: "Add Liquidity",
    },
  },
  opus: {
    tokens: [
      { icon: <Icons.endurLogo className="size-[22px]" />, name: "xSTRK" },
      { icon: <Icons.cashLogo className="size-[22px]" />, name: "CASH" },
    ],
    protocolIcon: <Icons.opusLogo className="size-8 rounded-full" />,
    badges: [{ type: "Lend/Borrow", color: "bg-[#EEF6FF] text-[#0369A1]" }],
    description:
      "Deposit your xSTRK on Opus to borrow CASH and earn more rewards",
    action: {
      type: "lend",
      link: "https://app.opus.money/",
      buttonText: "Leverage Assets",
    },
  },
};

const Defi: React.FC = () => {
  const { isPinned } = useSidebar();
  const yields: any = useAtomValue(protocolYieldsAtom);

  const sortedProtocols = useMemo(() => {
    return Object.entries(protocolConfigs)
      .filter(([protocol]) => !["avnu", "fibrous"].includes(protocol))
      .sort(([a], [b]) => {
        const yieldA = yields[a]?.value ?? -Infinity;
        const yieldB = yields[b]?.value ?? -Infinity;
        return yieldB - yieldA;
      })
      .map(([protocol]) => protocol);
  }, [yields]);

  return (
    <div
      className={cn("mx-auto mt-12 w-full max-w-7xl px-8", {
        "lg:pl-28": !isPinned,
      })}
    >
      <h1 className="text-2xl font-semibold tracking-[-1%] text-black">
        Earn extra yield by using your xSTRK on DeFi platforms
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
          Opportunities
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sortedProtocols.map((protocol) => {
            const config = protocolConfigs[protocol];
            const shouldShowApy = !["avnu", "fibrous"].includes(protocol);

            if (Array.isArray(config.action)) {
              return config.action.map((action, index) => (
                <DefiCard
                  key={`${protocol}-${index}`}
                  tokens={config.tokens}
                  protocolIcon={config.protocolIcon}
                  badges={config.badges}
                  description={`${config.description} - ${action.buttonText}`}
                  apy={shouldShowApy ? yields[protocol] : undefined}
                  action={action}
                />
              ));
            }

            return (
              <DefiCard
                key={protocol}
                tokens={config.tokens}
                protocolIcon={config.protocolIcon}
                badges={config.badges}
                description={config.description}
                apy={shouldShowApy ? yields[protocol] : undefined}
                action={config.action}
              />
            );
          })}

          {["avnu", "fibrous"].map((protocol) => {
            const config = protocolConfigs[protocol];
            return (
              <DefiCard
                key={protocol}
                tokens={config.tokens}
                protocolIcon={config.protocolIcon}
                badges={config.badges}
                description={config.description}
                action={config.action}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Defi;
