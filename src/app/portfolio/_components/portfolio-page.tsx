"use client";

import axios from "axios";
import { useAtomValue } from "jotai";
import React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { chartFilter } from "@/store/portfolio.store";

import { Chart } from "./chart";
import DefiHoldings from "./defi-holding";
import Stats from "./stats";
import { columns, SizeColumn } from "./table/columns";
import { DataTable } from "./table/data-table";

const data: SizeColumn[] = [
  {
    asset: "xSTRK/STRK",
    dapp: "Ekubo",
    amount: "500",
    apy: "10%",
  },
  {
    asset: "xSTRK/STRK",
    dapp: "Nostra",
    amount: "500",
    apy: "10%",
  },
  {
    asset: "xSTRK/STRK",
    dapp: "Ekubo",
    amount: "500",
    apy: "10%",
  },
  {
    asset: "xSTRK/STRK",
    dapp: "Nostra",
    amount: "500",
    apy: "10%",
  },
  {
    asset: "xSTRK/STRK",
    dapp: "Ekubo",
    amount: "500",
    apy: "10%",
  },
  {
    asset: "xSTRK/STRK",
    dapp: "Nostra",
    amount: "500",
    apy: "10%",
  },
  {
    asset: "xSTRK/STRK",
    dapp: "Ekubo",
    amount: "500",
    apy: "10%",
  },
  {
    asset: "xSTRK/STRK",
    dapp: "Nostra",
    amount: "500",
    apy: "10%",
  },
];

const chartDataDemo = [
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

const PortfolioPage: React.FC = () => {
  const [totalSTRK, setTotalSTRK] = React.useState(0);
  const [chartData, setChartData] = React.useState(chartDataDemo);

  const timeRange = useAtomValue(chartFilter);

  const { isPinned } = useSidebar();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/blocks/${timeRange.slice(0, -1)}`);

        if (res?.data) {
          res.data.blocks.forEach((el: any) => {
            // const balance = atom((get) => {
            //   const { data, error } = get(uservXSTRKBalanceQueryAtom(el.block));
            //   return {
            //     value: error || !data ? MyNumber.fromZero() : data,
            //     error,
            //     isLoading: !data && !error,
            //   };
            // });
            // const {} = uservXSTRKBalanceQueryAtom(el.block);
            // console.log(balance, "balancebalancebalancebalancebalancebalance");
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [timeRange]);

  // const vxStrkBalance = useAtomValue(uservXSTRKBalanceAtom(blockBefore7Day));
  // const userHaikoBalance = useAtomValue(userHaikoBalanceAtom(blockBefore7Day));
  // const nostraBal = useAtomValue(userxSTRKNostraBalance(blockBefore7Day));
  // const ekuboPosi = useAtomValue(userEkuboxSTRKPositions(blockBefore7Day));

  return (
    <main
      className={cn("mt-12 flex h-full w-full flex-col", {
        "lg:pl-28": !isPinned,
      })}
    >
      <div className="flex w-full flex-col items-start justify-start gap-5 lg:flex-row">
        <div className="flex w-full flex-col items-start gap-5">
          <Stats />
          <Chart chartData={chartData} />
        </div>

        <DefiHoldings />
      </div>

      {/* <DataFilters data={data} /> */}

      <div className="mt-5">
        <DataTable columns={columns} data={data} />
      </div>
    </main>
  );
};

export default PortfolioPage;
