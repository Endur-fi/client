"use client";

import { useAtomValue } from "jotai";
import React from "react";
import { ConnectButton } from "@easyleap/sdk";
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
import { getLSTAssetBySymbol, getSTRKAsset } from "@/constants";
import {
  getLstTokenKeyForAsset,
  portfolioDefiPieSlices,
} from "@/lib/portfolio-types";
import { userAddressAtom } from "@/store/common.store";
import {
  portfolioAssetSymbolAtom,
  portfolioSnapshotAtom,
} from "@/store/portfolio.store";

export const chartConfig = {
  nostra: {
    label: "Nostra",
    color: "rgba(230, 139, 138, 1)",
    fillColor: "rgba(230, 139, 138, 0.8)",
  },
  ekubo: {
    label: "Ekubo",
    color: "rgba(160, 64, 189, 1)",
    fillColor: "rgba(160, 64, 189, 0.8)",
  },
  vesu: {
    label: "Vesu",
    color: "rgba(212, 207, 72, 1)",
    fillColor: "rgba(212, 207, 72, 0.8)",
  },
  opus: {
    label: "Opus",
    color: "rgba(106, 138, 81, 1)",
    fillColor: "rgba(106, 138, 81, 1)",
  },
  strkfarm: {
    label: "Troves",
    color: "rgba(88, 45, 196, 1)",
    fillColor: "rgba(88, 45, 196, 0.8)",
  },
  trovesHyper: {
    label: "Troves Hyper",
    color: "rgba(88, 45, 196, 1)",
    fillColor: "rgba(88, 45, 196, 0.6)",
  },
  endur: {
    label: "Wallet",
    color: "rgba(81, 176, 140, 1)",
    fillColor: "rgba(81, 176, 140, 0.8)",
  },
} satisfies ChartConfig;

const DefiHoldings: React.FC = () => {
  const address = useAtomValue(userAddressAtom);
  const assetSymbol = useAtomValue(portfolioAssetSymbolAtom);
  const { data: snapshot } = useAtomValue(portfolioSnapshotAtom);
  const lstConfig = getLSTAssetBySymbol(assetSymbol) ?? getSTRKAsset();
  const lstTokenKey = getLstTokenKeyForAsset(assetSymbol);
  const portfolioData = snapshot?.byLst?.[lstTokenKey];
  const lstSymbol = lstConfig.LST_SYMBOL;

  const { chartData, sumDefiHoldings } = React.useMemo(() => {
    const slices = portfolioDefiPieSlices(portfolioData, lstConfig.DECIMALS);
    const output = slices
      .filter((s) => s.dapp !== "endur")
      .map((s) => ({
        dapp: s.dapp,
        holdings: s.holdings,
        fill:
          chartConfig[s.dapp as keyof typeof chartConfig]?.color ??
          chartConfig.ekubo.color,
      }))
      .sort((a, b) => b.holdings - a.holdings);

    const sumDefiHoldings = output.reduce(
      (acc, curr) => acc + curr.holdings,
      0,
    );

    if (sumDefiHoldings === 0 && address && output.length > 0) {
      output[0].holdings = 1;
    }

    return { chartData: output, sumDefiHoldings };
  }, [portfolioData, lstConfig.DECIMALS, address]);

  return (
    <Card className="relative flex h-[500px] w-full shrink-0 flex-col overflow-hidden rounded-xl border border-[#AACBC4]/30 bg-white font-poppins lg:h-full lg:w-fit">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-normal">
          {lstSymbol} holdings in DeFi
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer
          config={chartConfig}
          className="z-50 mx-auto h-full max-h-[394px] w-[300px]"
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
              innerRadius={30}
              paddingAngle={3}
              cornerRadius={3}
            />
            <ChartLegend content={<ChartLegendContent />} className="" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {(!address || sumDefiHoldings === 0) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
          {!address && (
            <div className="gap-2 rounded-xl p-[10px] text-center">
              <b className="w-full">Connect Wallet</b>
              <p className="text-[13px]">
                You will be able to see your {lstSymbol} distribution across
                DApps
              </p>
              <div className="mt-3 flex justify-center">
                <ConnectButton className="rounded-xl bg-[#17876D] px-6 py-2 font-medium text-white transition-colors hover:bg-[#17876D]" />
              </div>
            </div>
          )}
          {address && sumDefiHoldings === 0 && (
            <div className="flex items-center gap-2">
              You have no {lstSymbol} holdings in DeFi
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default DefiHoldings;
