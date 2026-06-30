"use client";

import { useAtom, useAtomValue } from "jotai";
import { Loader } from "lucide-react";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ConnectButton } from "@easyleap/sdk";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn, formatHumanFriendlyDateTime } from "@/lib/utils";
import { MyAnalytics } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { userAddressAtom } from "@/store/common.store";
import { chartFilter } from "@/store/portfolio.store";

import { chartConfig } from "./defi-holding";
import { HoldingInfo } from "./portfolio-page";

function getLast7Days() {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString());
  }
  return result;
}

function getDummyData() {
  const dummyValues = [50, 95, 53, 72, 45, 88, 60];
  return getLast7Days().map((date, index) => {
    return {
      date,
      endur: dummyValues[index],
    };
  });
}

export function Chart({
  chartData,
  lastUpdated,
  lstSymbol = "xSTRK",
  error,
  isLoading,
  onRetry,
}: {
  chartData: HoldingInfo[];
  lastUpdated: Date | null;
  lstSymbol?: string;
  error: string | null;
  isLoading?: boolean;
  onRetry?: () => void;
}) {
  const isBTC = lstSymbol.toLowerCase().includes("btc");
  const valueDecimals = isBTC ? 8 : 2;
  const [timeRange, setTimeRange] = useAtom(chartFilter);
  const address = useAtomValue(userAddressAtom);

  const requestedDays =
    timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "180d" ? 180 : 90;

  const availableDays = React.useMemo(() => {
    if (chartData.length < 2) return 0;
    const start = new Date(chartData[0]!.date).getTime();
    const end = new Date(chartData[chartData.length - 1]!.date).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
    return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
  }, [chartData]);

  const { areaChartData, protocolOrder } = React.useMemo(() => {
    if (chartData.length === 0) {
      return {
        areaChartData: getDummyData().map((i) => ({ ...i, cummulative: i })),
        protocolOrder: ["endur"],
      };
    }
    const protocolKeys = Object.keys(
      chartData[chartData.length - 1],
    ).filter((key) => key !== "date");
    const protocolValues = protocolKeys.map((key) => {
      return {
        key,
        value: Number(
          chartData[chartData.length - 1][
            key as keyof (typeof chartData)[0]
          ],
        ),
      };
    });
    protocolValues.sort((a, b) => b.value - a.value);

    const areaData = chartData.map((item) => {
      const data: Record<string, number | string> = {
        date: item.date,
        nostra: 0,
        ekubo: 0,
        vesu: 0,
        endur: 0,
        strkfarm: 0,
        trovesHyper: 0,
        opus: 0,
      };
      let sum = 0;
      for (const protocol of protocolValues) {
        sum += Number(item[protocol.key as keyof typeof item]);
        const key: Exclude<keyof typeof data, "date"> = protocol.key as Exclude<
          keyof typeof data,
          "date"
        >;
        data[key] = sum;
      }
      return {
        ...item,
        cummulative: data,
      };
    });
    return {
      areaChartData: areaData,
      protocolOrder: protocolValues.map((p) => p.key),
    };
  }, [chartData]);

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const [offset, setOffset] = React.useState(150);

  const handleRangeChange = React.useCallback(
    (newRange: typeof timeRange) => {
      if (newRange === timeRange) return;
      setTimeRange(newRange);
      MyAnalytics.track(AnalyticsEvents.PORTFOLIO_CHART_RANGE_CHANGE, {
        range: newRange,
      });
    },
    [setTimeRange, timeRange],
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newOffset = offset - 1;
      setOffset(newOffset <= 5 ? 150 : newOffset);
    }, 10);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- offset is intentionally excluded to avoid restarting the animation
  }, []);

  return (
    <Card className="w-full overflow-hidden rounded-xl border border-[#AACBC4]/30 shadow-none">
      <CardHeader className="flex items-center gap-2 space-y-0 py-5 pb-2 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="text-sm lg:text-base">
            Your {lstSymbol} holdings over time
          </CardTitle>
          <CardDescription>
            Last updated:{" "}
            {lastUpdated ? formatHumanFriendlyDateTime(lastUpdated) : "-"}
            {availableDays > 0 && availableDays < requestedDays ? (
              <>
                {" "}
                Showing {availableDays} days available
              </>
            ) : null}
          </CardDescription>
        </div>
        <div className="mt-3 flex w-fit overflow-hidden rounded-lg border border-[#AACBC4]/30 shadow-sm lg:ml-auto lg:mt-0">
          <Button
            className={cn(
              "flex h-7 w-10 items-center justify-center rounded-none border-r bg-transparent py-0 text-xs text-black text-muted-foreground shadow-none transition-all ease-linear hover:bg-transparent hover:text-black",
              {
                "bg-border/60 text-black hover:bg-border/60":
                  timeRange === "7d",
              },
            )}
            onClick={() => handleRangeChange("7d")}
          >
            7D
          </Button>
          <Button
            className={cn(
              "flex h-7 w-10 items-center justify-center rounded-none border-r bg-transparent py-0 text-xs text-black text-muted-foreground shadow-none transition-all ease-linear hover:bg-transparent hover:text-black",
              {
                "bg-border/60 text-black hover:bg-border/60":
                  timeRange === "30d",
              },
            )}
            onClick={() => handleRangeChange("30d")}
          >
            1M
          </Button>
          <Button
            className={cn(
              "flex h-7 w-10 items-center justify-center rounded-none border-r bg-transparent py-0 text-xs text-black text-muted-foreground shadow-none transition-all ease-linear hover:bg-transparent hover:text-black",
              {
                "bg-border/60 text-black hover:bg-border/60":
                  timeRange === "90d",
              },
            )}
            onClick={() => handleRangeChange("90d")}
          >
            3M
          </Button>
          <Button
            className={cn(
              "flex h-7 w-10 items-center justify-center rounded-none border-0 bg-transparent py-0 text-xs text-black text-muted-foreground shadow-none transition-all ease-linear hover:bg-transparent hover:text-black",
              {
                "bg-border/60 text-black hover:bg-border/60":
                  timeRange === "180d",
              },
            )}
            onClick={() => handleRangeChange("180d")}
          >
            6M
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative px-2 py-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[400px] w-full sm:h-[250px]"
        >
          <AreaChart accessibilityLayer data={areaChartData}>
            <ChartLegend
              content={<ChartLegendContent innerClassName="w-fit" />}
              className="relative mx-auto mt-4 flex w-fit flex-row items-center gap-4 rounded-lg border px-4 py-2"
            />

            <CartesianGrid vertical={false} />

            <YAxis tickLine={false} />

            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                return formatDate(value);
              }}
            />

            <defs>
              <linearGradient id="loading" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset={`${offset - 50}%`}
                  stopColor={chartConfig["endur"].color}
                  stopOpacity={0.5}
                />
                <stop
                  offset={`${offset}%`}
                  stopColor={chartConfig["endur"].fillColor}
                  stopOpacity={0.25}
                />
              </linearGradient>
            </defs>

            <ChartTooltip
              cursor={true}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return formatDate(value);
                  }}
                  chartData={chartData.length === 0 ? getDummyData() : chartData}
                  indicator="dot"
                  valueSuffix={lstSymbol}
                  valueDecimals={valueDecimals}
                />
              }
            />

            {[...protocolOrder].reverse().map((protocol, index) => (
              <Area
                dataKey={(data) =>
                  data.cummulative[protocol as keyof typeof data.cummulative]
                }
                name={protocol}
                type="monotone"
                fill={
                  chartData.length === 0
                    ? "url(#loading)"
                    : chartConfig[protocol as keyof typeof chartConfig]
                        .fillColor
                }
                stroke={chartConfig[protocol as keyof typeof chartConfig].color}
                fillOpacity={1}
                strokeWidth={2}
                key={`${protocol}-${index}`}
                label={chartConfig[protocol as keyof typeof chartConfig].label}
              />
            ))}
          </AreaChart>
        </ChartContainer>
        {!!address && isLoading && (
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-md border bg-white/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
            <Loader className="size-3.5 animate-spin text-black" />
            Updating...
          </div>
        )}
        {(!address || chartData.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
            {!address && (
              <div className="gap-2 rounded-xl p-[10px] text-center">
                <b className="w-full">Connect Wallet</b>
                <p className="text-[13px]">
                  You will be able to see your {lstSymbol} holding history across
                  DApps
                </p>
                <div className="mt-3 flex justify-center">
                  <ConnectButton className="rounded-xl bg-[#17876D] px-6 py-2 font-medium text-white transition-colors hover:bg-[#17876D]" />
                </div>
              </div>
            )}
            {address && chartData.length === 0 && !error && (
              <div className="my-5 flex w-full items-center justify-center gap-2 p-[10px] text-center">
                {isLoading ? (
                  <>
                    Computing your wallet {lstSymbol} holding history{" "}
                    <Loader className="size-4 animate-spin text-black" />
                  </>
                ) : (
                  <>No holdings history yet for {lstSymbol}.</>
                )}
              </div>
            )}
            {address && error && (
              <div className="gap-2 p-[10px] text-center">
                <b className="w-full">{error}</b>
                <p className="text-[13px]">
                  Please try again later. If the error persists, please contact
                  us on telegram.
                </p>
                {onRetry && (
                  <div className="mt-3 flex justify-center">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={onRetry}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
