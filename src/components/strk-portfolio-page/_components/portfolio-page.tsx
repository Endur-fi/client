"use client";

import { useAccount } from "@starknet-react/core";
import { useAtomValue } from "jotai";
import React from "react";

import { BlockInfo } from "@/app/api/holdings/[address]/[nDays]/route";
import { ProtocolConfig, protocolConfigs } from "@/components/defi";
import { useSidebar } from "@/components/ui/sidebar";
import { STRK_DECIMALS } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { MyAnalytics } from "@/lib/analytics";
import MyNumber from "@/lib/MyNumber";
import { cn, formatNumberWithCommas } from "@/lib/utils";
import {
  DAppHoldings,
  protocolYieldsAtom,
  SupportedDApp,
} from "@/store/defi.store";
import { chartFilter } from "@/store/portfolio.store";

import { Chart } from "./chart";
import DefiHoldings from "./defi-holding";
import Stats from "./stats";
import {
  columns,
  getPortfolioDAppAction,
  getPortfolioDAppAPY,
  getPortfolioDAppAsset,
} from "./table/columns";
import { DataTable } from "./table/data-table";

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
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [isFetchError, setIsFetchError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const timeRange = useAtomValue(chartFilter);
  const { address } = useAccount();

  const { isPinned } = useSidebar();
  const isMobile = useIsMobile();

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
      .filter((config) => config !== null)
      .sort((a, b) => {
        const aAmount = a.tokens.find((t) => t.name === "xSTRK")?.holding;
        const bAmount = b.tokens.find((t) => t.name === "xSTRK")?.holding;
        return (
          (Number(bAmount?.toEtherStr()) || 0) -
          (Number(aAmount?.toEtherStr()) || 0)
        );
      });
  }, [yields, sortedProtocols, holdings]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        console.log("fetching holdings");
        setHoldings([]);
        setIsFetchError(false);
        setErrorMessage(null);
        const res = await fetch(
          `/api/holdings/${address}/${timeRange.slice(0, -1)}`,
        );

        // Check if the response is ok
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        // Check if response has content
        const text = await res.text();
        if (!text) {
          throw new Error("Empty response from server");
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("Response text:", text);
          throw new Error("Invalid JSON response from server");
        }

        // Check if the response contains an error
        if (data.error) {
          throw new Error(data.error);
        }

        if (data) {
          // ? ADD_NEW_PROTOCOL: Update this
          const blocks: BlockInfo[] = data.blocks;
          const vesu: DAppHoldings[] = data.vesu;
          const nostraLending: DAppHoldings[] = data.nostraLending;
          const nostraDex: DAppHoldings[] = data.nostraDex;
          const ekubo: DAppHoldings[] = data.ekubo;
          const wallet: DAppHoldings[] = data.wallet;
          const strkfarm: DAppHoldings[] = data.strkfarm;
          const strkfarmEkubo: DAppHoldings[] = data.strkfarmEkubo;
          const opus: DAppHoldings[] = data.opus;

          setLastUpdated(new Date(data.lastUpdated));
          // assert all arrays are of the same length
          if (
            blocks.length !== vesu.length ||
            blocks.length !== nostraLending.length ||
            blocks.length !== nostraDex.length ||
            blocks.length !== ekubo.length ||
            blocks.length !== wallet.length ||
            blocks.length !== strkfarm.length ||
            blocks.length !== strkfarmEkubo.length ||
            blocks.length !== opus.length
          ) {
            throw new Error("Invalid holdings data");
          }

          const holdings: HoldingInfo[] = blocks.map((block, idx) => {
            console.log("holdings", nostraLending, nostraLending.length, idx);
            return {
              date: block.date,
              nostraLending: serialisedMyNumberToNumber(
                nostraLending[idx].lstAmount as any,
              ),
              nostraDex: serialisedMyNumberToNumber(
                nostraDex[idx].lstAmount as any,
              ),
              vesu: serialisedMyNumberToNumber(vesu[idx].lstAmount as any),
              ekubo: serialisedMyNumberToNumber(ekubo[idx].lstAmount as any),
              endur: serialisedMyNumberToNumber(wallet[idx].lstAmount as any),
              strkfarm: serialisedMyNumberToNumber(
                strkfarm[idx].lstAmount as any,
              ),
              strkfarmEkubo: serialisedMyNumberToNumber(
                strkfarmEkubo[idx].lstAmount as any,
              ),
              opus: serialisedMyNumberToNumber(opus[idx].lstAmount as any),
            };
          });
          holdings.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
          setHoldings(holdings);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsFetchError(true);
        setErrorMessage(
          error instanceof Error ? error.message : "Unknown error occurred",
        );
      }
    };
    fetchData();
  }, [address, timeRange]);

  // merging common dapps
  // to avoid too much splitting on chart, we merge some parts of dapps
  // ADD_NEW_PROTOCOL
  const summaryPieChartHoldings = React.useMemo(() => {
    const summary: HoldingInfo[] = [];
    holdings.forEach((holding) => {
      const strkfarmSum =
        (holding.strkfarm || 0) + (holding.strkfarmEkubo || 0);
      summary.push({
        date: holding.date,
        nostra: (holding.nostraDex || 0) + (holding.nostraLending || 0),
        vesu: holding.vesu,
        ekubo: holding.ekubo,
        endur: holding.endur,
        strkfarm: strkfarmSum,
        opus: holding.opus,
      });
    });
    return summary;
  }, [holdings]);

  React.useEffect(() => {
    MyAnalytics.track("Open Portfolio", {});
  }, []);

  return (
    <main
      className={cn(
        "mx-auto mt-12 flex h-full w-full max-w-[1200px] flex-col",
        {
          "lg:pl-28": !isPinned,
        },
      )}
    >
      <h1 className="mb-4 font-poppins text-lg font-semibold text-black lg:text-2xl">
        Your xSTRK Portfolio
        <span className="ml-2 inline-flex items-center rounded-full bg-white px-2.5 py-0.5 align-middle text-xs font-medium text-gray-800 shadow-[0px_0px_2px_grey]">
          Beta
        </span>
      </h1>

      <div
        className="mb-4 rounded-lg border border-[#17876D] bg-[#e7f0ef] p-4 text-xs text-[#17876D] dark:bg-gray-800 dark:text-blue-400 lg:text-sm"
        role="alert"
      >
        <b>Note:</b>
        <br />
        <span className="font-medium">
          1. This portfolio page is still a work in progress, so some features
          may be missing or buggy. If you spot any issues, please report them in
          our{" "}
          <a href="/tg" target="_blank">
            <b>TG group</b>
          </a>
        </span>
        <br />
        <span className="font-medium">
          2. xSTRK debt is not used in our calculations and isn{"'"}t displayed
          here
        </span>
      </div>

      <div className="flex w-full flex-col items-start justify-start gap-5 lg:flex-row">
        <div className="flex w-full flex-col items-start gap-5">
          <Stats />
          <Chart
            chartData={summaryPieChartHoldings}
            lastUpdated={lastUpdated}
            error={isFetchError ? errorMessage || "Failed to fetch data" : null}
          />
        </div>

        <DefiHoldings />
      </div>

      <div className={cn("w-full items-center", isMobile ? "mt-10" : "")}>
        {isMobile && (
          <h2 className="text-md font-poppins font-semibold text-black lg:text-2xl">
            Detailed information
          </h2>
        )}
        <div className="">
          {!isMobile && <DataTable columns={columns} data={defiCards} />}

          {isMobile &&
            defiCards.map((card, idx) => (
              <div
                key={idx}
                className={cn(
                  "float-left mt-2 w-full border-0 bg-white p-[10px] hover:bg-white",
                )}
              >
                <div className="justify flex justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-[25px]">{card.protocolIcon}</span>
                    <span>{card.protocolName}</span>
                  </div>
                  <div>{getPortfolioDAppAction({ original: card })}</div>
                </div>
                <div className="mt-2 text-[12px] text-[#939494]">
                  {card.description}
                </div>
                <div className="justify flex w-full justify-between">
                  <div className="max-w-[60%]">
                    {getPortfolioDAppAsset({
                      original: { ...card, description: "" },
                    })}
                  </div>
                  <div className="py-3">
                    {getPortfolioDAppAPY({ original: card })}
                  </div>
                </div>
                <div>
                  <span className="text-[12px] text-[#03624C]">
                    <b>Your Holding:</b>
                  </span>
                  <span className="flex">
                    {formatNumberWithCommas(
                      card.tokens[
                        card.tokens.findIndex((t) => t.name === "xSTRK")
                      ].holding?.toEtherToFixedDecimals(2) ?? "0.00",
                    )}{" "}
                    xSTRK
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
};

export default PortfolioPage;
