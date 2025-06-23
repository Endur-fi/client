"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import React from "react";

import { ProtocolConfig } from "@/components/defi";
import { IconProps, Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { formatNumberWithCommas } from "@/lib/utils";

export type SizeColumn = {
  asset: string;
  dapp: string;
  amount: string;
  apy: string;
  logos: ((props: IconProps) => React.JSX.Element)[];
};

const _getDappIcon = (dappName: string) => {
  switch (dappName.toLowerCase()) {
    case "ekubo":
      return <Icons.ekuboLogo className="size-5" />;

    case "nostra":
      return <Icons.nostraLogo className="size-5" />;

    default:
      return null;
  }
};

export function getPortfolioDAppAsset(row: { original: ProtocolConfig }) {
  return (
    <div className="flex min-w-[280px] items-center gap-4 py-3">
      <div className="flex items-center -space-x-2">
        {row.original.tokens.map((t, _idx) => t.icon)}
      </div>
      <p className="flex flex-col items-start gap-0.5 text-sm text-black/90">
        {row.original.tokens.map((t) => t.name).join("/")}
        {row.original.description && (
          <span className="text-xs text-muted-foreground">
            {row.original.description}
          </span>
        )}
      </p>
    </div>
  );
}

export function getPortfolioDAppName(row: { original: ProtocolConfig }) {
  return (
    <div className="flex items-center gap-2 text-[14px]">
      <span className="w-[20px] shrink-0">{row.original.protocolIcon}</span>
      <span className="">{row.original.protocolName}</span>
    </div>
  );
}

export function getPortfolioDAppAmount(row: { original: ProtocolConfig }) {
  return (
    <div className="flex gap-1.5 text-right">
      {formatNumberWithCommas(
        row.original.tokens[
          row.original.tokens.findIndex((t) => t.name === "xSTRK")
        ].holding?.toEtherToFixedDecimals(2) ?? "0.00",
      )}
    </div>
  );
}

export function getPortfolioDAppAPY(row: { original: ProtocolConfig }) {
  return (
    <div className="flex gap-1.5 text-right text-green-500">
      <span>✦</span>
      {row.original.apy?.toFixed(2) || "0.00"}%
    </div>
  );
}

export function getPortfolioDAppAction(row: { original: ProtocolConfig }) {
  return (
    <a href={row.original.action?.link} target="_blank">
      <Button className="h-[2rem] rounded-xl border border-[#AACBC4] bg-transparent text-sm font-normal text-[#17876D] shadow-none hover:border-green-500 hover:bg-green-50">
        View in Dapp
      </Button>
    </a>
  );
}

export function getProtocolType(protocolName: string) {
  switch (protocolName.toLowerCase()) {
    case "nostra (dex)":
      return "dex";
    case "nostra (lending)":
      return "lend";
    case "ekubo":
      return "dex";
    case "vesuu":
      return "lend";
    case "troves":
      return "strategies";
  }
}

export const columns: ColumnDef<ProtocolConfig>[] = [
  {
    accessorKey: "asset",
    header: "Asset",
    cell: ({ row }) => getPortfolioDAppAsset(row),
  },
  {
    accessorKey: "dapp",
    header: "Dapp",
    cell: ({ row }) => getPortfolioDAppName(row),
    enableColumnFilter: true,
    filterFn: (
      row: Row<ProtocolConfig>,
      columnId: string,
      filterValues: string[],
    ) => {
      if (filterValues.length === 0) return true;

      const dappName =
        row.original.protocolName.toLowerCase() === "vesu"
          ? "vesuu"
          : row.original.protocolName.toLowerCase();
      const dappType = getProtocolType(dappName);

      const dexLendOptions = filterValues.filter(
        (option) =>
          option === "dex" || option === "lend" || option === "strategies",
      ) as string[];
      const dappOptions = filterValues.filter(
        (option) =>
          option === "ekubo" ||
          option === "nostra" ||
          option === "vesuu" ||
          option === "troves",
      ) as string[];

      const hasDexLendOptions = dexLendOptions.length > 0;
      const hasDappOptions = dappOptions.length > 0;

      console.log("filterValues", {
        hasDexLendOptions,
        hasDappOptions,
        dexLendOptions: dexLendOptions.includes(dappType!),
        dappOptions: dappOptions.includes(dappName.split(" ")[0]),
        dappName,
        dappType,
      });
      if (hasDexLendOptions && hasDappOptions) {
        return (
          dexLendOptions.includes(dappType!) &&
          dappOptions.includes(dappName.split(" ")[0])
        );
      }

      if (hasDexLendOptions) {
        return dexLendOptions.includes(dappType!);
      }

      if (hasDappOptions) {
        return dappOptions.includes(dappName.split(" ")[0]);
      }

      return true;
    },
  },
  {
    accessorKey: "amount",
    header: "Amount in xSTRK",
    cell: ({ row }) => getPortfolioDAppAmount(row),
  },
  {
    accessorKey: "apy",
    header: "APY",
    cell: ({ row }) => getPortfolioDAppAPY(row),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => getPortfolioDAppAction(row),
  },
];
