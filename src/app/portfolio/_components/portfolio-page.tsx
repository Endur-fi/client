"use client";

import { useAtomValue } from "jotai";
import React from "react";

import { BlockInfo } from "@/app/api/holdings/[address]/[nDays]/route";
import { ProtocolConfig, protocolConfigs } from "@/components/defi";
import { useSidebar } from "@/components/ui/sidebar";
import { getLSTAssetBySymbol, getSTRKAsset } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { MyAnalytics } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import MyNumber from "@/lib/MyNumber";
import {
  getHoldingsKeyForProtocol,
  isProtocolAllowedForAsset,
} from "@/lib/portfolio-types";
import { BalanceWithLargeSubscript } from "@/components/balance-with-large-subscript";
import { cn } from "@/lib/utils";
import {
  DAppHoldings,
  protocolYieldsAtom,
  SupportedDApp,
} from "@/store/defi.store";
import { userAddressAtom } from "@/store/common.store";
import { chartFilter, portfolioAssetSymbolAtom } from "@/store/portfolio.store";

import { Chart } from "./chart";
import DefiHoldings from "./defi-holding";
import PortfolioAssetSelector from "./portfolio-asset-selector";
import Stats from "./stats";
import {
  createPortfolioColumns,
  getPortfolioDAppAction,
  getPortfolioDAppAPY,
  getPortfolioDAppAsset,
} from "./table/columns";
import { DataTable } from "./table/data-table";

export type HoldingInfo = {
  date: string;
  [key: string]: string | number | undefined;
};

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
  const [holdingsTimeRange, setHoldingsTimeRange] = React.useState<
    string | null
  >(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [isFetchError, setIsFetchError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isFetchingHoldings, setIsFetchingHoldings] = React.useState(false);
  const [retryNonce, setRetryNonce] = React.useState(0);
  const holdingsFetchSeqRef = React.useRef(0);
  const holdingsAbortRef = React.useRef<AbortController | null>(null);

  const timeRange = useAtomValue(chartFilter);
  const address = useAtomValue(userAddressAtom);
  const assetSymbol = useAtomValue(portfolioAssetSymbolAtom);
  const lstConfig = getLSTAssetBySymbol(assetSymbol) ?? getSTRKAsset();
  const lstSymbol = lstConfig.LST_SYMBOL;
  const decimals = lstConfig.DECIMALS;
  const isBTC = lstConfig.SYMBOL?.toLowerCase().includes("btc");
  const balanceDecimals = isBTC ? 8 : 2;

  const { isPinned } = useSidebar();
  const isMobile = useIsMobile();

  const yields = useAtomValue(protocolYieldsAtom);
  const tableColumns = React.useMemo(
    () => createPortfolioColumns(lstSymbol),
    [lstSymbol],
  );

  const sortedProtocols: SupportedDApp[] = React.useMemo(() => {
    const keys = Object.entries(protocolConfigs).map(
      ([protocol]) => protocol as SupportedDApp,
    );
    return keys
      .filter((protocol) => !["avnu", "fibrous"].includes(protocol))
      .filter((protocol) => !protocol.startsWith("avnuBTC"))
      .filter((protocol) => isProtocolAllowedForAsset(protocol, assetSymbol))
      .sort((a, b) => {
        const yieldA = yields[a]?.value ?? -Infinity;
        const yieldB = yields[b]?.value ?? -Infinity;
        return yieldB - yieldA;
      });
  }, [yields, assetSymbol]);

  const defiCards = React.useMemo<ProtocolConfig[]>(() => {
    const latest = holdings.length ? holdings[holdings.length - 1] : null;

    return sortedProtocols
      .map((protocol) => {
        const config = protocolConfigs[protocol];
        if (!config) return null;

        const _yield = yields[protocol];
        if (!_yield || !_yield.value) return null;

        const holdingsKey = getHoldingsKeyForProtocol(protocol);
        const holding = (latest?.[holdingsKey] as number | undefined) ?? 0;

        if (!holding || holding <= 0) {
          return null;
        }

        const lstIndex = config.tokens.findIndex(
          (token) => token.name === lstSymbol,
        );
        if (lstIndex < 0) {
          return null;
        }

        const cardConfig: ProtocolConfig = {
          ...config,
          apy: _yield.value,
          tokens: config.tokens.map((token) => ({ ...token })),
        };

        cardConfig.tokens[lstIndex].holding = MyNumber.fromEther(
          holding.toFixed(6),
          decimals,
        );

        return cardConfig;
      })
      .filter((config) => config !== null)
      .sort((a, b) => {
        const aAmount = a.tokens.find((t) => t.name === lstSymbol)?.holding;
        const bAmount = b.tokens.find((t) => t.name === lstSymbol)?.holding;
        return (
          (Number(bAmount?.toEtherStr()) || 0) -
          (Number(aAmount?.toEtherStr()) || 0)
        );
      });
  }, [yields, sortedProtocols, holdings, lstSymbol, decimals]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        const fetchSeq = ++holdingsFetchSeqRef.current;
        holdingsAbortRef.current?.abort();
        const controller = new AbortController();
        holdingsAbortRef.current = controller;

        setIsFetchingHoldings(true);
        setIsFetchError(false);
        setErrorMessage(null);
        const url = `/api/holdings/${address}/${timeRange.slice(0, -1)}?lstSymbol=${assetSymbol}`;
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          let apiMessage: string | undefined;
          try {
            if (res.headers.get("content-type")?.includes("application/json")) {
              const maybeJson = await res.json();
              apiMessage =
                typeof maybeJson?.error === "string"
                  ? maybeJson.error
                  : undefined;
            }
          } catch {
            // ignore non-JSON error bodies
          }
          throw new Error(
            apiMessage ||
              `Couldn’t load holdings history (HTTP ${res.status}). Please retry.`,
          );
        }

        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const blocks: BlockInfo[] = data.blocks;
        const vesu: DAppHoldings[] = data.vesu;
        const nostraLending: DAppHoldings[] = data.nostraLending;
        const nostraDex: DAppHoldings[] = data.nostraDex;
        const ekubo: DAppHoldings[] = data.ekubo;
        const wallet: DAppHoldings[] = data.wallet;
        const strkfarm: DAppHoldings[] = data.strkfarm;
        const strkfarmEkubo: DAppHoldings[] = data.strkfarmEkubo;
        const trovesHyper: DAppHoldings[] = data.trovesHyper ?? [];
        const opus: DAppHoldings[] = data.opus;

        setLastUpdated(new Date(data.lastUpdated));

        const len = blocks.length;
        const arrays = [
          vesu,
          nostraLending,
          nostraDex,
          ekubo,
          wallet,
          strkfarm,
          strkfarmEkubo,
          trovesHyper,
          opus,
        ];
        if (arrays.some((a) => a.length !== len)) {
          throw new Error("Invalid holdings data");
        }

        const parsed: HoldingInfo[] = blocks.map((block, idx) => ({
          date: block.date,
          nostraLending: serialisedMyNumberToNumber(
            nostraLending[idx].lstAmount as any,
          ),
          nostraDex: serialisedMyNumberToNumber(nostraDex[idx].lstAmount as any),
          vesu: serialisedMyNumberToNumber(vesu[idx].lstAmount as any),
          ekubo: serialisedMyNumberToNumber(ekubo[idx].lstAmount as any),
          endur: serialisedMyNumberToNumber(wallet[idx].lstAmount as any),
          strkfarm: serialisedMyNumberToNumber(strkfarm[idx].lstAmount as any),
          strkfarmEkubo: serialisedMyNumberToNumber(
            strkfarmEkubo[idx].lstAmount as any,
          ),
          trovesHyper: serialisedMyNumberToNumber(
            trovesHyper[idx]?.lstAmount as any,
          ),
          opus: serialisedMyNumberToNumber(opus[idx].lstAmount as any),
        }));
        parsed.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        // If a newer range request started while this was in-flight, ignore this response.
        if (fetchSeq !== holdingsFetchSeqRef.current) {
          return;
        }
        setHoldings(parsed);
        setHoldingsTimeRange(timeRange);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setIsFetchError(true);
        setErrorMessage(
          error instanceof Error ? error.message : "Unknown error occurred",
        );
      } finally {
        setIsFetchingHoldings(false);
      }
    };
    fetchData();
  }, [address, timeRange, assetSymbol, retryNonce]);

  const summaryPieChartHoldings = React.useMemo(() => {
    const summary: HoldingInfo[] = [];
    holdings.forEach((holding) => {
      const num = (v: string | number | undefined) => Number(v ?? 0);
      const strkfarmSum = num(holding.strkfarm) + num(holding.strkfarmEkubo);
      summary.push({
        date: holding.date,
        nostra: num(holding.nostraDex) + num(holding.nostraLending),
        vesu: num(holding.vesu),
        ekubo: num(holding.ekubo),
        endur: num(holding.endur),
        strkfarm: strkfarmSum,
        trovesHyper: num(holding.trovesHyper),
        opus: num(holding.opus),
      });
    });
    return summary;
  }, [holdings]);

  const chartHoldings = React.useMemo(() => {
    if (holdingsTimeRange !== timeRange) return [];
    return summaryPieChartHoldings;
  }, [summaryPieChartHoldings, holdingsTimeRange, timeRange]);

  const chartIsLoading =
    isFetchingHoldings || holdingsTimeRange !== timeRange;

  React.useEffect(() => {
    MyAnalytics.track(AnalyticsEvents.OPEN_PORTFOLIO, {});
  }, []);

  React.useEffect(() => {
    MyAnalytics.track(AnalyticsEvents.PORTFOLIO_TIME_RANGE_CHANGE, {
      timeRange,
    });
  }, [timeRange]);

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
        Your {lstSymbol} Portfolio
        <span className="ml-2 inline-flex items-center rounded-full bg-white px-2.5 py-0.5 align-middle text-xs font-medium text-gray-800 shadow-[0px_0px_2px_grey]">
          Beta
        </span>
      </h1>

      <PortfolioAssetSelector />

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
          2. {lstSymbol} debt is not used in our calculations and isn{"'"}t
          displayed here
        </span>
      </div>

      <div className="flex w-full flex-col items-start justify-start gap-5 lg:flex-row">
        <div className="flex w-full flex-col items-start gap-5">
          <Stats />
          <Chart
            chartData={chartHoldings}
            lastUpdated={lastUpdated}
            lstSymbol={lstSymbol}
            error={
              isFetchError && (!chartHoldings.length || !lastUpdated)
                ? errorMessage || "Failed to fetch data"
                : null
            }
            isLoading={chartIsLoading}
            onRetry={() => setRetryNonce((n) => n + 1)}
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
          {!isMobile && <DataTable columns={tableColumns} data={defiCards} />}

          {isMobile &&
            defiCards.map((card, idx) => (
              <div
                key={idx}
                className={cn(
                  "float-left mt-2 w-full rounded-xl border border-[#AACBC4]/30 bg-white p-[10px] hover:bg-white",
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
                    <BalanceWithLargeSubscript
                      value={
                        card.tokens[
                          card.tokens.findIndex((t) => t.name === lstSymbol)
                        ].holding?.toEtherToFixedDecimals(balanceDecimals) ?? "0"
                      }
                      decimals={balanceDecimals}
                    />{" "}
                    {lstSymbol}
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
