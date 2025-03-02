"use client";

import { useAccount } from "@starknet-react/core";
import axios from "axios";
import { useAtomValue } from "jotai";
import { Loader } from "lucide-react";
import React from "react";

import { BlockInfo } from "@/app/api/holdings/[address]/[nDays]/route";
import { Icons } from "@/components/Icons";
import { ProtocolConfig, protocolConfigs } from "@/components/defi";
import { useSidebar } from "@/components/ui/sidebar";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { cn } from "@/lib/utils";
import {
  DAppHoldings,
  protocolYieldsAtom,
  SupportedDApp,
} from "@/store/defi.store";
import { chartFilter } from "@/store/portfolio.store";

import { Chart } from "./chart";
import DefiHoldings from "./defi-holding";
import Stats from "./stats";
import { columns, SizeColumn } from "./table/columns";
import { DataTable } from "./table/data-table";

const _data: SizeColumn[] = [
  {
    asset: "xSTRK/STRK",
    dapp: "Ekubo",
    amount: "500",
    apy: "10%",
    logos: [Icons.endurLogo, Icons.strkLogo],
  },
  {
    asset: "xSTRK/STRK",
    dapp: "Nostra",
    amount: "500",
    apy: "10%",
    logos: [Icons.endurLogo, Icons.strkLogo],
  },
];

export type HoldingInfo = {
  date: string;
} & Partial<Record<SupportedDApp, number>>;

function serialisedMyNumberToNumber(serialised: {
  bigNumber: string;
  decimals: number;
}): number {
  return Number(
    new MyNumber(serialised.bigNumber, serialised.decimals).toEtherStr(),
  );
}

const PortfolioPage: React.FC = () => {
  const [holdings, setHoldings] = React.useState<HoldingInfo[]>([]);

  const timeRange = useAtomValue(chartFilter);
  const { address } = useAccount();

  const { isPinned } = useSidebar();
  const yields = useAtomValue(protocolYieldsAtom);

  const sortedProtocols: SupportedDApp[] = React.useMemo(() => {
    const keys = Object.entries(protocolConfigs).map(
      ([protocol]) => protocol as SupportedDApp,
    );
    return keys
      .filter((protocol) => !["avnu", "fibrous"].includes(protocol))
      .sort((a, b) => {
        const yieldA = yields[a]?.value ?? -Infinity;
        const yieldB = yields[b]?.value ?? -Infinity;
        return yieldB - yieldA;
      });
  }, [yields]);

  const defiCards = React.useMemo<ProtocolConfig[]>(() => {
    return sortedProtocols
      .map((protocol) => {
        // dont show if no config
        const config = protocolConfigs[protocol];
        if (!config) return null;

        // Dont show if no yield
        const _yield = yields[protocol];
        if (!_yield || !_yield.value) return null;

        // set the apy
        config.apy = _yield.value;

        // set holdings
        const holding =
          (holdings.length ? holdings[holdings.length - 1][protocol] : 0) || 0;
        const xSTRKIndex = config.tokens.findIndex(
          (token) => token.name === "xSTRK",
        );
        config.tokens[xSTRKIndex].holding = MyNumber.fromEther(
          holding.toFixed(6),
          STRK_DECIMALS,
        );
        return config;
      })
      .filter((config) => config !== null);
  }, [yields, sortedProtocols, holdings]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        console.log("fetching holdings");
        const res = await axios.get(
          `/api/holdings/${address}/${timeRange.slice(0, -1)}`,
        );
        if (res?.data) {
          // ? ADD_NEW_PROTOCOL: Update this
          const blocks: BlockInfo[] = res.data.blocks;
          const vesu: DAppHoldings[] = res.data.vesu;
          const nostraLending: DAppHoldings[] = res.data.nostraLending;
          const nostraDex: DAppHoldings[] = res.data.nostraDex;
          const ekubo: DAppHoldings[] = res.data.ekubo;
          const wallet: DAppHoldings[] = res.data.wallet;

          // assert all arrays are of the same length
          if (
            blocks.length !== vesu.length ||
            blocks.length !== nostraLending.length ||
            blocks.length !== nostraDex.length ||
            blocks.length !== ekubo.length ||
            blocks.length !== wallet.length
          ) {
            throw new Error("Invalid holdings data");
          }

          const holdings: HoldingInfo[] = blocks.map((block, idx) => {
            console.log("holdings", nostraLending, nostraLending.length, idx);
            return {
              date: block.date,
              nostraLending: serialisedMyNumberToNumber(
                nostraLending[idx].xSTRKAmount as any,
              ),
              nostraDex: serialisedMyNumberToNumber(
                nostraDex[idx].xSTRKAmount as any,
              ),
              vesu: serialisedMyNumberToNumber(vesu[idx].xSTRKAmount as any),
              ekubo: serialisedMyNumberToNumber(ekubo[idx].xSTRKAmount as any),
              endur: serialisedMyNumberToNumber(wallet[idx].xSTRKAmount as any),
            };
          });
          setHoldings(holdings);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [address, timeRange]);

  return (
    <main
      className={cn("mt-12 flex h-full w-full flex-col", {
        "lg:pl-28": !isPinned,
      })}
    >
      <h1 className="mb-4 font-poppins text-lg font-semibold text-black lg:text-2xl">
        Your xSTRK Portfolio
      </h1>

      <React.Suspense
        fallback={
          <div className="my-5 flex w-full items-center justify-center gap-2 text-center">
            Crunching the latest stats for you{" "}
            <Loader className="size-4 animate-spin text-black" />
          </div>
        }
      >
        <div className="flex w-full flex-col items-start justify-start gap-5 lg:flex-row">
          <div className="flex w-full flex-col items-start gap-5">
            <Stats />
            <Chart chartData={holdings} />
          </div>

          <DefiHoldings />
        </div>

        <div
          className="mb-4 mt-5 rounded-lg border border-[#17876D] bg-[#e7f0ef] p-4 text-xs text-[#17876D] dark:bg-gray-800 dark:text-blue-400 lg:text-sm"
          role="alert"
        >
          <span className="font-medium">
            <b>Note:</b> This portfolio page is still a work in progress, so
            some features may be missing or buggy. If you spot any issues,
            please report them in our TG group. Also, xSTRK debt is not
            displayed.
          </span>
        </div>
      </React.Suspense>

      <div className="">
        <DataTable columns={columns} data={defiCards} />
      </div>
    </main>
  );
};

export default PortfolioPage;
