"use client";

import { useAtom } from "jotai";
import React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  blockBefore180DayAtom,
  blockBefore1DayAtom,
  blockBefore30DayAtom,
  blockBefore7DayAtom,
  blockBefore90DayAtom,
} from "@/store/portfolio.store";

import { Chart } from "./chart";
import DefiHoldings from "./defi-holding";
import Stats from "./stats";
import { columns, SizeColumn } from "./table/columns";
import { DataTable } from "./table/data-table";

export interface PortfolioPageProps {
  blockBefore1Day: number;
  blockBefore7Day: number;
  blockBefore30Day: number;
  blockBefore90Day: number;
  blockBefore180Day: number;
}

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

const PortfolioPage: React.FC<PortfolioPageProps> = ({
  blockBefore1Day,
  blockBefore7Day,
  blockBefore30Day,
  blockBefore90Day,
  blockBefore180Day,
}) => {
  const [_, setBlock1Day] = useAtom(blockBefore1DayAtom);
  const [__, setBlock7Day] = useAtom(blockBefore7DayAtom);
  const [___, setBlock30Day] = useAtom(blockBefore30DayAtom);
  const [____, setBlock90Day] = useAtom(blockBefore90DayAtom);
  const [_____, setBlock180Day] = useAtom(blockBefore180DayAtom);

  const { isPinned } = useSidebar();

  React.useEffect(() => {
    setBlock1Day(blockBefore1Day);
    setBlock7Day(blockBefore7Day);
    setBlock30Day(blockBefore30Day);
    setBlock90Day(blockBefore90Day);
    setBlock180Day(blockBefore180Day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    blockBefore1Day,
    blockBefore7Day,
    blockBefore30Day,
    blockBefore90Day,
    blockBefore180Day,
  ]);

  return (
    <main
      className={cn("mt-12 flex h-full w-full flex-col", {
        "lg:pl-28": !isPinned,
      })}
    >
      <div className="flex w-full flex-col items-start justify-start gap-5 lg:flex-row">
        <div className="flex w-full flex-col items-start gap-5">
          <Stats />
          <Chart />
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
