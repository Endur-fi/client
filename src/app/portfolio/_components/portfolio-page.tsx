"use client";

import axios from "axios";
import { atom, Atom, useAtom, useAtomValue } from "jotai";
import React, { useEffect, useMemo } from "react";

import {
  getEkuboxSTRKBalance,
  getHaikoxSTRKBalance,
  getNostraxSTRKBalance,
  getVxSTRKBalance,
} from "@/actions";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { chartFilter } from "@/store/portfolio.store";

import { useAccount } from "@starknet-react/core";
import { Chart } from "./chart";
import DefiHoldings from "./defi-holding";
import Stats from "./stats";
import { columns, SizeColumn } from "./table/columns";
import { DataTable } from "./table/data-table";
import { userxSTRKNostraBalance } from "@/store/nostra.store";
import { atomFamily } from "jotai/utils";
import { AtomFamily } from "jotai/vanilla/utils/atomFamily";
import { uservXSTRKBalanceAtom } from "@/store/vesu.store";
import MyNumber from "@/lib/MyNumber";
import { userEkuboxSTRKPositions } from "@/store/ekubo.store";
import { DAppHoldingsAtom } from "@/store/defi.store";
import { exchangeRateByBlockAtom, userXSTRKBalanceByBlockAtom } from "@/store/lst.store";
import { wallet } from "starknet";

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

interface BlockInfo {
  block: number;
  timestamp: number;
  date: string;
}

const holdingHistoryAtom = atomFamily((param: {
  blocks: BlockInfo[], 
  sourceAtom: DAppHoldingsAtom
}) => {
  const { blocks, sourceAtom } = param;
  return atom((get) => {
    const values = blocks.reduce((current, block) => {
      const output = get(sourceAtom(block.block));
      const xSTRKValue = Number(output.data.xSTRKAmount.toEtherToFixedDecimals(4));
      const exchangeRate = get(exchangeRateByBlockAtom(block.block));
      console.log('exchangerate', block.block, exchangeRate.rate, block.block);
      // todo use correct conversion rate
      current[block.block.toString()] = {
        strk: xSTRKValue * exchangeRate.rate,
        usd: xSTRKValue * exchangeRate.rate * 0.25,
      }
      return current;
    }, {} as {[block: string]: {strk: number, usd: number}});
    return values;
  });
})

const PortfolioPage: React.FC = () => {
  const [blocks, setBlocks] = React.useState<BlockInfo[]>([]);

  const timeRange = useAtomValue(chartFilter);
  const { address } = useAccount();

  const { isPinned } = useSidebar();

  React.useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        const res = await axios.get(`/api/blocks/${timeRange.slice(0, -1)}`);
        if (res?.data) {
          setBlocks(res.data.blocks.reverse());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [address, timeRange]);

  // ? ADD_NEW_PROTOCOL: Update this
  const nostraHistory = useAtomValue(holdingHistoryAtom({blocks, sourceAtom: userxSTRKNostraBalance}));
  const vxSTRKHistory = useAtomValue(holdingHistoryAtom({blocks, sourceAtom: uservXSTRKBalanceAtom}));
  const ekuboHistory = useAtomValue(holdingHistoryAtom({blocks, sourceAtom: userEkuboxSTRKPositions}));
  const unusedXSTRKBalance = useAtomValue(holdingHistoryAtom({blocks, sourceAtom: userXSTRKBalanceByBlockAtom}));
  
  useEffect(() => {
    console.log("blocks", blocks);
  }, [blocks]);

  const chartData = useMemo(() => {
    // console.log("chartData", nostraHistory, vxSTRKHistory, JSON.stringify(ekuboHistory));
    return blocks.map((block) => {
      // ? ADD_NEW_PROTOCOL: Update this
      const nostra = nostraHistory[block.block.toString()];
      const vxSTRK = vxSTRKHistory[block.block.toString()];
      const ekubo = ekuboHistory[block.block.toString()];
      const unusedXSTRK = unusedXSTRKBalance[block.block.toString()];
      return {
        date: block.date,
        nostra: nostra?.strk || 0,
        vesu: vxSTRK?.strk || 0,
        ekubo: ekubo?.strk || 0,
        wallet: unusedXSTRK?.strk || 0,
      }
    });
  }, [nostraHistory, vxSTRKHistory, ekuboHistory]);

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
