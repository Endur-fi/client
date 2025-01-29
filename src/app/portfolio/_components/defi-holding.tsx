"use client";

import React from "react";
import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { dapp: "nostra", holdings: 275, fill: "#FF4240" },
  { dapp: "ekubo", holdings: 200, fill: "#3F1883" },
  { dapp: "strkfarm", holdings: 187, fill: "#9F91F6" },
  { dapp: "fibrous", holdings: 173, fill: "#73FCFD" },
];

const chartConfig = {
  holdings: {
    label: "Holdings",
  },
  nostra: {
    label: "Nostra",
    color: "hsl(var(--chart-1))",
  },
  ekubo: {
    label: "Ekubo",
    color: "hsl(var(--chart-2))",
  },
  strkfarm: {
    label: "Strkfarm",
    color: "hsl(var(--chart-3))",
  },
  fibrous: {
    label: "Fibrous",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const DefiHoldings: React.FC = () => {
  return (
    <Card className="flex h-full w-full shrink-0 flex-col rounded-xl border border-[#AACBC4]/30 bg-[#E3EFEC]/70 font-poppins lg:w-fit">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-normal">
          xSTRK holdings in DeFi
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-full max-h-[350px] w-[300px]"
          style={{ aspectRatio: "1 / 1" }}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="holdings"
              nameKey="dapp"
              innerRadius={40}
              paddingAngle={3}
              cornerRadius={3}
            />
            <ChartLegend content={<ChartLegendContent />} className="" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default DefiHoldings;
