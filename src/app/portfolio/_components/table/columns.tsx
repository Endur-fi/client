"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";

export type SizeColumn = {
  asset: string;
  dapp: string;
  amount: string;
  apy: string;
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

export const columns: ColumnDef<SizeColumn>[] = [
  {
    accessorKey: "asset",
    header: "Asset",
    cell: ({ row }) => (
      <div className="flex items-center gap-4 py-3">
        <div className="flex items-center -space-x-2">
          <Icons.endurLogo className="size-5" />
          <Icons.strkLogo className="size-5" />
        </div>
        <p className="flex flex-col items-start gap-0.5 text-sm text-black/90">
          {row.original.asset}
          <span className="text-xs text-muted-foreground">
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
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
        {getDappIcon(row.original.dapp)}

        <span className="">{row.original.dapp}</span>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount in xSTRK",
  },
  {
    accessorKey: "apy",
    header: "APY",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-green-500">
        <span>✦</span>
        {row.original.apy}
      </div>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row: _ }) => (
      <Button className="h-[2rem] rounded-xl border border-[#AACBC4] bg-transparent text-sm font-normal text-[#17876D] shadow-none hover:border-green-500 hover:bg-green-50">
        View in Dapp
      </Button>
    ),
  },
];
