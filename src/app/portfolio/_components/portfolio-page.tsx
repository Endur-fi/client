"use client";

import React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { Chart } from "./chart";
import DataFilters from "./data-filters";
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

const PortfolioPage: React.FC<PortfolioPageProps> = ({
  blockBefore1Day,
  blockBefore7Day,
  blockBefore30Day,
  blockBefore90Day,
  blockBefore180Day,
}) => {
  const { isPinned } = useSidebar();

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

  return (
    <main
      className={cn("mt-12 flex h-full w-full flex-col", {
        "lg:pl-28": !isPinned,
      })}
    >
      <div className="flex w-full flex-col items-start justify-start gap-5 lg:flex-row">
        <div className="flex w-full flex-col items-start gap-5">
          <Stats />
          <Chart
            blockBefore1Day={blockBefore1Day}
            blockBefore7Day={blockBefore7Day}
            blockBefore30Day={blockBefore30Day}
            blockBefore90Day={blockBefore90Day}
            blockBefore180Day={blockBefore180Day}
          />
        </div>

        <DefiHoldings />
      </div>

      <DataFilters />

      <div className="mt-5">
        <DataTable columns={columns} data={data} />
      </div>
    </main>
  );
};

export default PortfolioPage;
