import { protocolYieldsAtom } from "@/store/defi.store";
import { useAtomValue } from "jotai";
import Image from "next/image";
import React from "react";

import { MyAnalytics } from "@/lib/analytics";
import { useAccount } from "@starknet-react/core";
import { protocolConfigs } from "./defi";
import DefiCard from "./defi-card";
import { Icons } from "./Icons";

const Merry: React.FC = () => {
  const { address } = useAccount();

  const yields: any = useAtomValue(protocolYieldsAtom);

  const sortedProtocols = React.useMemo(() => {
    return Object.entries(protocolConfigs)
      .filter(([protocol]) => !["avnu", "fibrous"].includes(protocol))
      .sort(([a], [b]) => {
        const yieldA = yields[a]?.value ?? -Infinity;
        const yieldB = yields[b]?.value ?? -Infinity;
        return yieldB - yieldA;
      })
      .map(([protocol]) => protocol);
  }, [yields]);

  const renderDefiCard = React.useCallback(
    (protocol: any) => {
      const config = protocolConfigs[protocol];

      return (
        <DefiCard
          key={protocol}
          tokens={config.tokens}
          protocolIcon={config.protocolIcon}
          badges={config.badges}
          description={config.description}
          apy={yields[protocol]}
          action={config.action}
        />
      );
    },
    [yields],
  );

  return (
    <div className="hidden transition-all duration-1000 lg:block">
      <Image
        src="/merry_bg.svg"
        alt="Merry"
        fill
        className="-z-10 object-cover"
      />

      <div
        className="group fixed bottom-0 left-24 hover:z-40"
        onMouseEnter={() => {
          MyAnalytics.track("Hovered on haiko gift box", {
            address,
          });
        }}
      >
        <Icons.gift1Faded className="group-hover:hidden" />
        <Icons.gift1 className="hidden group-hover:block" />
        <div className="absolute -right-36 -top-[13rem] hidden rounded-md border border-[#03624C] bg-white p-2 text-sm text-[#03624C] transition-all group-hover:flex">
          {renderDefiCard(
            sortedProtocols.find((protocol) => protocol === "haiko"),
          )}
        </div>
      </div>

      <div
        className="group fixed bottom-0 left-56 hover:z-40"
        onMouseEnter={() => {
          MyAnalytics.track("Hovered on ekubo gift box", {
            address,
          });
        }}
      >
        <Icons.gift2Faded className="group-hover:hidden" />
        <Icons.gift2 className="hidden group-hover:block" />
        <div className="absolute -right-20 -top-44 hidden rounded-md border border-[#03624C] bg-white p-2 text-sm text-[#03624C] transition-all group-hover:flex">
          {renderDefiCard(
            sortedProtocols.find((protocol) => protocol === "ekubo"),
          )}
        </div>
      </div>

      <div
        className="group fixed bottom-0 right-[286px] z-20 hover:z-40"
        onMouseEnter={() => {
          MyAnalytics.track("Hovered on nostra-pool box", {
            address,
          });
        }}
      >
        <Icons.gift3Faded className="group-hover:hidden" />
        <Icons.gift3 className="hidden group-hover:block" />
        <div className="absolute -right-24 -top-[14.2rem] hidden rounded-md border border-[#03624C] bg-white p-2 text-sm text-[#03624C] transition-all group-hover:flex">
          {renderDefiCard(
            sortedProtocols.find((protocol) => protocol === "nostra-pool"),
          )}
        </div>
      </div>

      <div
        className="group fixed bottom-0 right-[185px] z-20 hover:z-40"
        onMouseEnter={() => {
          MyAnalytics.track("Hovered on vesu gift box", {
            address,
          });
        }}
      >
        <Icons.gift4Faded className="group-hover:hidden" />
        <Icons.gift4 className="hidden group-hover:block" />
        <div className="absolute -right-28 -top-[13rem] hidden rounded-md border border-[#03624C] bg-white p-2 text-sm text-[#03624C] transition-all group-hover:flex">
          {renderDefiCard(
            sortedProtocols.find((protocol) => protocol === "vesu"),
          )}
        </div>
      </div>

      <div
        className="group fixed bottom-0 right-[104px] z-20 hover:z-40"
        onMouseEnter={() => {
          MyAnalytics.track("Hovered on nostra-lend gift box", {
            address,
          });
        }}
      >
        <Icons.gift5Faded className="group-hover:hidden" />
        <Icons.gift5 className="hidden group-hover:block" />
        <div className="absolute -right-24 -top-[14.2rem] hidden rounded-md border border-[#03624C] bg-white p-2 text-sm text-[#03624C] transition-all group-hover:flex">
          {renderDefiCard(
            sortedProtocols.find((protocol) => protocol === "nostra-lend"),
          )}
        </div>
      </div>

      <div
        className="group fixed bottom-0 right-2 z-20 hover:z-40"
        onMouseEnter={() => {
          MyAnalytics.track("Hovered on opus gift box", {
            address,
          });
        }}
      >
        <Icons.gift6Faded className="group-hover:hidden" />
        <Icons.gift6 className="hidden group-hover:block" />
        <div className="absolute -top-[13.7rem] right-0 hidden rounded-md border border-[#03624C] bg-white p-2 text-sm text-[#03624C] transition-all group-hover:flex">
          {renderDefiCard(
            sortedProtocols.find((protocol) => protocol === "opus"),
          )}
        </div>
      </div>

      <div className="group fixed -right-10 bottom-[120px] z-10">
        <Icons.cTreeFaded className="group-hover:hidden" />
        <Icons.cTree className="hidden group-hover:block" />
        <p className="absolute -top-14 right-24 hidden rounded-md border border-[#03624C] bg-white p-2 text-base text-[#03624C] transition-all group-hover:flex">
          Merry Christmas and a Happy new year
        </p>
      </div>
    </div>
  );
};

export default Merry;
