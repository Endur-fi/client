"use client";

import { ColumnDef } from "@tanstack/react-table";

import { ProtocolConfig } from "@/components/defi";
import { IconProps, Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import React from "react";

export type SizeColumn = {
  asset: string;
  dapp: string;
  amount: string;
  apy: string;
  logos: ((props: IconProps) => React.JSX.Element)[];
};

const getDappIcon = (dappName: string) => {
  switch (dappName.toLowerCase()) {
    case "ekubo":
      return <Icons.ekuboLogo className="size-5" />;

    case "nostra":
      return <Icons.nostraLogo className="size-5" />;

    default:
      return null;
  }
};

export const columns: ColumnDef<ProtocolConfig>[] = [
  {
    accessorKey: "asset",
    header: "Asset",
    cell: ({ row }) => (
      <div className="flex min-w-[280px] items-center gap-4 py-3">
        <div className="flex items-center -space-x-2">
          {row.original.tokens.map((t, idx) => t.icon)}
        </div>
        <p className="flex flex-col items-start gap-0.5 text-sm text-black/90">
          {row.original.tokens.map((t) => t.name).join("/")}
          <span className="text-xs text-muted-foreground">
            {row.original.description}
          </span>
        </p>
      </div>
    ),
  },
  {
    accessorKey: "dapp",
    header: "Dapp",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.protocolIcon}
        <span className="">{row.original.protocolName}</span>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount in xSTRK",
    cell: ({ row }) => (
      <div className="flex gap-1.5 text-right">
        {row.original.tokens[
          row.original.tokens.findIndex((t) => t.name == "xSTRK")
        ].holding?.toEtherToFixedDecimals(2) || "0.00"}
      </div>
    ),
  },
  {
    accessorKey: "apy",
    header: "APY",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-green-500">
        <span>✦</span>
        {row.original.apy?.toFixed(2) || "0.00"}%
      </div>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <a href={row.original.action?.link} target="_blank">
        <Button className="h-[2rem] rounded-xl border border-[#AACBC4] bg-transparent text-sm font-normal text-[#17876D] shadow-none hover:border-green-500 hover:bg-green-50">
          View in Dapp
        </Button>
      </a>
    ),
  },
];
