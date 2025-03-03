"use client";

import { useAtom, useAtomValue } from "jotai";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn, formatHumanFriendlyDateTime } from "@/lib/utils";
import { chartFilter } from "@/store/portfolio.store";
import { chartConfig } from "./defi-holding";
import { HoldingInfo } from "./portfolio-page";
import { userAddressAtom } from "@/store/common.store";
import { Loader } from "lucide-react";

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

export function Chart({ chartData, lastUpdated, error }: { chartData: HoldingInfo[], lastUpdated: Date | null, error: string | null }) {
  const [timeRange, setTimeRange] = useAtom(chartFilter);
  const address = useAtomValue(userAddressAtom);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-11-25");
    let daysToSubtract = 90;

    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const { areaChartData, protocolOrder } = React.useMemo(() => {
    if (filteredData.length === 0) {
      return {
        areaChartData: getDummyData().map((i) => ({ ...i, cummulative: i })),
        protocolOrder: ["endur"],
      };
    }
    // sort protocol key with highest value as on latest date
    const protocolKeys = Object.keys(
      filteredData[filteredData.length - 1],
    ).filter((key) => key !== "date");
    const protocolValues = protocolKeys.map((key) => {
      return {
        key,
        value: Number(
          filteredData[filteredData.length - 1][
            key as keyof (typeof filteredData)[0]
          ],
        ),
      };
    });
    protocolValues.sort((a, b) => b.value - a.value);

    // taking protocol ordered by highest value,
    // sum the values to lower value protocols
    // to create a stacked area chart
    const areaData = filteredData.map((item) => {
      const data: (typeof filteredData)[0] = {
        date: item.date,
        nostraLending: 0,
        nostraDex: 0,
        ekubo: 0,
        vesu: 0,
        endur: 0,
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
  }, [filteredData]);

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const [offset, setOffset] = React.useState(150);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newOffset = offset - 1;
      setOffset(newOffset <= 5 ? 150 : newOffset);
    }, 10);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <Card className="w-full shadow-none">
      <CardHeader className="flex items-center gap-2 space-y-0 py-5 pb-2 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="text-sm lg:text-base">
            Your xSTRK holdings over time
          </CardTitle>
          <CardDescription>Last updated: {lastUpdated ? formatHumanFriendlyDateTime(lastUpdated) : '-'}</CardDescription>
        </div>
        <div className="mt-3 flex w-fit rounded-md border shadow-sm lg:ml-auto lg:mt-0">
          <Button
            className={cn(
              "flex h-7 w-10 items-center justify-center rounded-none rounded-l-[5px] border-r bg-transparent py-0 text-xs text-black text-muted-foreground shadow-none transition-all ease-linear hover:bg-transparent hover:text-black",
              {
                "bg-border/60 text-black hover:bg-border/60":
                  timeRange === "7d",
              },
            )}
            onClick={() => {
              setTimeRange("7d");
            }}
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
            onClick={() => {
              setTimeRange("30d");
            }}
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
            onClick={() => {
              setTimeRange("90d");
            }}
          >
            3M
          </Button>
          <Button
            className={cn(
              "flex h-7 w-10 items-center justify-center rounded-none rounded-r-[5px] border-0 bg-transparent py-0 text-xs text-black text-muted-foreground shadow-none transition-all ease-linear hover:bg-transparent hover:text-black",
              {
                "bg-border/60 text-black hover:bg-border/60":
                  timeRange === "180d",
              },
            )}
            onClick={() => {
              setTimeRange("180d");
            }}
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
          {/* <AreaChart data={filteredData}> */}
          <AreaChart
            accessibilityLayer
            data={areaChartData}
            // margin={{
            //   left: 12,
            //   right: 12,
            // }}
          >
            <ChartLegend
              content={<ChartLegendContent innerClassName="w-fit" />}
              className="relative mx-auto mt-4 flex w-fit flex-row items-center gap-4 rounded-lg border px-4 py-2"
            />

            <CartesianGrid vertical={false} />

            <YAxis tickLine={false} />

            <XAxis
              dataKey="date"
              // tickLine={false}
              // axisLine={true}
              // tickMargin={8}
              // minTickGap={32}
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
                  chartData={
                    filteredData.length === 0 ? getDummyData() : filteredData
                  }
                  indicator="dot"
                />
              }
            />

            {protocolOrder.reverse().map((protocol, index) => (
              <Area
                dataKey={(data) =>
                  data.cummulative[protocol as keyof typeof data.cummulative]
                }
                name={protocol}
                type="monotone"
                fill={
                  filteredData.length === 0
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
          {/* </AreaChart> */}
        </ChartContainer>
        {(!address || filteredData.length == 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            {!address && (
              <div className="gap-2 p-[10px] text-center">
                <b className="w-full">Connect Wallet</b>
                <p className="text-[13px]">
                  You will be able to see your xSTRK holding history across
                  DApps
                </p>
              </div>
            )}
            {address && filteredData.length == 0 && !error && (
              <div className="my-5 flex w-full items-center justify-center gap-2 p-[10px] text-center">
                Computing your wallet xSTRK holding history{" "}
                <Loader className="size-4 animate-spin text-black" />
              </div>
            )}
            {address && error && (
              <div className="gap-2 p-[10px] text-center">
                <b className="w-full">{error}</b>
                <p className="text-[13px]">Please try again later. If the error persists, please contact us on telegram.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
