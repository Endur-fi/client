"use client";

import { useAtom } from "jotai";
import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { chartFilter } from "@/store/portfolio.store";

const chartConfig = {
  strk: {
    label: "STRK",
    color: "hsl(var(--chart-1))",
  },
  usdt: {
    label: "USDT",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function Chart({
  chartData,
}: {
  chartData: {
    date: string;
    strk: number;
    usdt: number;
  }[];
}) {
  const [timeRange, setTimeRange] = useAtom(chartFilter);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
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

  return (
    <Card className="w-full shadow-none">
      <CardHeader className="flex items-center gap-2 space-y-0 py-5 pb-2 sm:flex-row">
        {/* <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Area Chart - Interactive</CardTitle>
          <CardDescription>
            Showing total visitors for the last 3 months
          </CardDescription>
        </div> */}

        <div className="ml-auto flex w-fit rounded-md border shadow-sm">
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

      <CardContent className="px-2 !pl-0 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {/* <AreaChart data={filteredData}> */}
          <LineChart
            accessibilityLayer
            data={filteredData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <ChartLegend
              content={<ChartLegendContent />}
              className="absolute bottom-[17.5rem] left-8 flex flex-row items-center gap-4 rounded-lg border px-4 py-2"
            />

            {/* <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#17876D" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#17876D" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EC796B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EC796B" stopOpacity={0.1} />
              </linearGradient>
            </defs> */}

            <CartesianGrid vertical={false} />

            <YAxis tickLine={false} />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={true}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />

            <ChartTooltip
              cursor={true}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />

            {/* <Area
              dataKey="strk"
              type="natural"
              fill="url(#fillMobile)"
              stroke="#EC796B"
              stackId="a"
            />
            <Area
              dataKey="usdt"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="#17876D"
              stackId="b"
            /> */}

            <Line
              dataKey="strk"
              type="monotone"
              stroke="#EC796B"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="usdt"
              type="monotone"
              stroke="#17876D"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
          {/* </AreaChart> */}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
