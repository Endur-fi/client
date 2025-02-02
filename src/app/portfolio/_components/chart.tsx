"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chartFilter } from "@/store/portfolio.store";
import { useAtom } from "jotai";
import { PortfolioPageProps } from "./portfolio-page";

const chartData = [
  { date: "2024-04-01", strk: 222, usdt: 600 },
  { date: "2024-04-02", strk: 97, usdt: 180 },
  { date: "2024-04-03", strk: 167, usdt: 120 },
  { date: "2024-04-04", strk: 242, usdt: 260 },
  { date: "2024-04-05", strk: 373, usdt: 290 },
  { date: "2024-04-06", strk: 301, usdt: 340 },
  { date: "2024-04-07", strk: 245, usdt: 180 },
  { date: "2024-04-08", strk: 409, usdt: 320 },
  { date: "2024-04-09", strk: 59, usdt: 110 },
  { date: "2024-04-10", strk: 261, usdt: 190 },
  { date: "2024-04-11", strk: 327, usdt: 350 },
  { date: "2024-04-12", strk: 292, usdt: 210 },
  { date: "2024-04-13", strk: 342, usdt: 380 },
  { date: "2024-04-14", strk: 137, usdt: 220 },
  { date: "2024-04-15", strk: 120, usdt: 170 },
  { date: "2024-04-16", strk: 138, usdt: 190 },
  { date: "2024-04-17", strk: 446, usdt: 360 },
  { date: "2024-04-18", strk: 364, usdt: 410 },
  { date: "2024-04-19", strk: 243, usdt: 180 },
  { date: "2024-04-20", strk: 89, usdt: 150 },
  { date: "2024-04-21", strk: 137, usdt: 200 },
  { date: "2024-04-22", strk: 224, usdt: 170 },
  { date: "2024-04-23", strk: 138, usdt: 230 },
  { date: "2024-04-24", strk: 387, usdt: 290 },
  { date: "2024-04-25", strk: 215, usdt: 250 },
  { date: "2024-04-26", strk: 75, usdt: 130 },
  { date: "2024-04-27", strk: 383, usdt: 420 },
  { date: "2024-04-28", strk: 122, usdt: 180 },
  { date: "2024-04-29", strk: 315, usdt: 240 },
  { date: "2024-04-30", strk: 454, usdt: 380 },
  { date: "2024-05-01", strk: 165, usdt: 220 },
  { date: "2024-05-02", strk: 293, usdt: 310 },
  { date: "2024-05-03", strk: 247, usdt: 190 },
  { date: "2024-05-04", strk: 385, usdt: 420 },
  { date: "2024-05-05", strk: 481, usdt: 390 },
  { date: "2024-05-06", strk: 498, usdt: 520 },
  { date: "2024-05-07", strk: 388, usdt: 300 },
  { date: "2024-05-08", strk: 149, usdt: 210 },
  { date: "2024-05-09", strk: 227, usdt: 180 },
  { date: "2024-05-10", strk: 293, usdt: 330 },
  { date: "2024-05-11", strk: 335, usdt: 270 },
  { date: "2024-05-12", strk: 197, usdt: 240 },
  { date: "2024-05-13", strk: 197, usdt: 160 },
  { date: "2024-05-14", strk: 448, usdt: 490 },
  { date: "2024-05-15", strk: 473, usdt: 380 },
  { date: "2024-05-16", strk: 338, usdt: 400 },
  { date: "2024-05-17", strk: 499, usdt: 420 },
  { date: "2024-05-18", strk: 315, usdt: 350 },
  { date: "2024-05-19", strk: 235, usdt: 180 },
  { date: "2024-05-20", strk: 177, usdt: 230 },
  { date: "2024-05-21", strk: 82, usdt: 140 },
  { date: "2024-05-22", strk: 81, usdt: 120 },
  { date: "2024-05-23", strk: 252, usdt: 290 },
  { date: "2024-05-24", strk: 294, usdt: 220 },
  { date: "2024-05-25", strk: 201, usdt: 250 },
  { date: "2024-05-26", strk: 213, usdt: 170 },
  { date: "2024-05-27", strk: 420, usdt: 460 },
  { date: "2024-05-28", strk: 233, usdt: 190 },
  { date: "2024-05-29", strk: 78, usdt: 130 },
  { date: "2024-05-30", strk: 340, usdt: 280 },
  { date: "2024-05-31", strk: 178, usdt: 230 },
  { date: "2024-06-01", strk: 178, usdt: 200 },
  { date: "2024-06-02", strk: 470, usdt: 410 },
  { date: "2024-06-03", strk: 103, usdt: 160 },
  { date: "2024-06-04", strk: 439, usdt: 380 },
  { date: "2024-06-05", strk: 88, usdt: 140 },
  { date: "2024-06-06", strk: 294, usdt: 250 },
  { date: "2024-06-07", strk: 323, usdt: 370 },
  { date: "2024-06-08", strk: 385, usdt: 320 },
  { date: "2024-06-09", strk: 438, usdt: 480 },
  { date: "2024-06-10", strk: 155, usdt: 200 },
  { date: "2024-06-11", strk: 92, usdt: 150 },
  { date: "2024-06-12", strk: 492, usdt: 420 },
  { date: "2024-06-13", strk: 81, usdt: 130 },
  { date: "2024-06-14", strk: 426, usdt: 380 },
  { date: "2024-06-15", strk: 307, usdt: 350 },
  { date: "2024-06-16", strk: 371, usdt: 310 },
  { date: "2024-06-17", strk: 475, usdt: 520 },
  { date: "2024-06-18", strk: 107, usdt: 170 },
  { date: "2024-06-19", strk: 341, usdt: 290 },
  { date: "2024-06-20", strk: 408, usdt: 450 },
  { date: "2024-06-21", strk: 169, usdt: 210 },
  { date: "2024-06-22", strk: 317, usdt: 270 },
  { date: "2024-06-23", strk: 480, usdt: 530 },
  { date: "2024-06-24", strk: 132, usdt: 180 },
  { date: "2024-06-25", strk: 141, usdt: 190 },
  { date: "2024-06-26", strk: 434, usdt: 380 },
  { date: "2024-06-27", strk: 448, usdt: 490 },
  { date: "2024-06-28", strk: 149, usdt: 200 },
  { date: "2024-06-29", strk: 103, usdt: 160 },
  { date: "2024-06-30", strk: 600, usdt: 400 },
];

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
  blockBefore1Day,
  blockBefore7Day,
  blockBefore30Day,
  blockBefore90Day,
  blockBefore180Day,
}: PortfolioPageProps) {
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
