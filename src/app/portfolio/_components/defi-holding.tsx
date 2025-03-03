"use client";

import { useAtomValue } from "jotai";
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
import { userAddressAtom } from "@/store/common.store";
import { userEkuboxSTRKPositions } from "@/store/ekubo.store";
import { userHaikoBalanceAtom } from "@/store/haiko.store";
import { userxSTRKNostraBalance } from "@/store/nostra.store";
import { uservXSTRKBalanceAtom } from "@/store/vesu.store";

export const chartConfig = {
  // holdings: {
  //   label: "Holdings",
  // },
  nostra: {
    label: "Nostra",
    color: "rgba(230, 139, 138, 1)",
    fillColor: "rgba(230, 139, 138, 0.8)",
  },
  nostraLending: {
    label: "Nostra (Lending)",
    color: "rgba(230, 139, 138, 1)",
    fillColor: "rgba(230, 139, 138, 0.8)",
  },
  nostraDex: {
    label: "Nostra (DEX)",
    color: "rgba(255, 169, 64, 1)",
    fillColor: "rgba(255, 169, 64, 0.8)",
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
  haiko: {
    label: "Haiko (Soon)",
    color: "#19799c", // rgba(25, 121, 156, 1)
    fillColor: "rgba(25, 121, 156, 0.8)",
  },
  opus: {
    label: "Opus (Soon)",
    color: "rgba(106, 138, 81, 1)", // rgba(106, 138, 81, 1)
    fillColor: "rgba(106, 138, 81, 0.8)",
  },
  strkfarm: {
    label: "STRKFarm (Soon)",
    color: "rgba(88, 45, 196, 1)",
    fillColor: "rgba(88, 45, 196, 0.8)",
  },
  endur: {
    label: "Wallet",
    color: "rgba(81, 176, 140, 1)",
    fillColor: "rgba(81, 176, 140, 0.8)",
  },
} satisfies ChartConfig;

const DefiHoldings: React.FC = () => {
  const nostraBal = useAtomValue(userxSTRKNostraBalance(undefined));
  const vxStrkBalance = useAtomValue(uservXSTRKBalanceAtom(undefined));
  const userHaikoBalance = useAtomValue(userHaikoBalanceAtom(undefined));
  const ekuboPosi = useAtomValue(userEkuboxSTRKPositions(undefined));
  const address = useAtomValue(userAddressAtom);

  const { chartData, sumDefiHoldings } = React.useMemo(() => {
    const output = [
      {
        dapp: "nostra",
        holdings: Number(nostraBal.data.xSTRKAmount.toEtherToFixedDecimals(2)),
        fill: chartConfig.nostra.color,
      },
      {
        dapp: "ekubo",
        holdings: Number(ekuboPosi.data.xSTRKAmount.toEtherStr() || 0),
        fill: chartConfig.ekubo.color,
      },
      {
        dapp: "vesu",
        holdings: Number(
          vxStrkBalance.data.xSTRKAmount.toEtherToFixedDecimals(2),
        ),
        fill: chartConfig.vesu.color,
      },
      {
        dapp: "haiko",
        holdings: parseInt(userHaikoBalance.value.toString(), 2),
        fill: chartConfig.haiko.color,
      },
      {
        dapp: "opus",
        holdings: 0,
        fill: chartConfig.opus.color,
      },
      {
        dapp: "strkfarm",
        holdings: 0,
        fill: chartConfig.strkfarm.color,
      },
    ].sort((a, b) => b.holdings - a.holdings);

    const sumDefiHoldings = output.reduce(
      (acc, curr) => acc + curr.holdings,
      0,
    );

    if (sumDefiHoldings === 0 || !address) {
      // set some mock values for the chart
      // they are blurred anyways
      output[0].holdings = 1;
      output[2].holdings = 5;
    }
    return { chartData: output, sumDefiHoldings };
  }, [nostraBal, vxStrkBalance, userHaikoBalance, ekuboPosi]);

  return (
    <Card className="relative flex h-[500px] w-full shrink-0 flex-col rounded-xl border border-[#AACBC4]/30 bg-[#E3EFEC]/70 bg-white font-poppins lg:h-full lg:w-fit">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-normal">
          xSTRK holdings in DeFi
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
            (
            <Pie
              data={chartData}
              dataKey="holdings"
              nameKey="dapp"
              innerRadius={30}
              paddingAngle={3}
              cornerRadius={3}
            />
            )
            <ChartLegend content={<ChartLegendContent />} className="" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {(!address || sumDefiHoldings === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          {!address && (
            <div className="gap-2 p-[10px] text-center">
              <b className="w-full">Connect Wallet</b>
              <p className="text-[13px]">
                You will be able to see your xSTRK distribution across DApps
              </p>
            </div>
          )}
          {address && sumDefiHoldings === 0 && (
            <div className="flex items-center gap-2">
              You have no xSTRK holdings in DeFi
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default DefiHoldings;
