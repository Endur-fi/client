"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { ASSET_ICONS } from "@/features/staking/components/asset-selector";

import { getExplorerEndpoint } from "@/constants";
import { cn, convertFutureTimestamp } from "@/lib/utils";
import InfoTooltip from "@/components/info-tooltip";

// Custom component for amount cell that can use hooks
const AmountCell: React.FC<{ amount: string }> = ({ amount }) => {
  return <>{amount}</>;
};

export type Status = "Success" | "Pending";

export type WithdrawLogColumn = {
  queuePosition: string;
  amount: string;
  status: Status;
  claimTime: string;
  txHash: string;
  rank: number;
  asset?: string;
};

export const withdrawLogColumn: ColumnDef<WithdrawLogColumn>[] = [
  {
    accessorKey: "queuePosition",
    header: () => {
      return (
        <div className="flex items-center gap-2">
          Log ID
          {/* TODO: use InfoTooltip - SOLVED */}
          <InfoTooltip>Your position in the withdrawal queue</InfoTooltip>
        </div>
      );
    },
    cell: ({ row }) => {
      const requestId = row.original.queuePosition;
      const rank = row.original.rank;
      const status = row.original.status;

      return (
        <div className="flex flex-col items-start gap-1">
          {/* {status !== "Success" && (
            <span className="text-sm font-normal">Rank - {rank}</span>
          )} */}
          <span
            className={cn("text-xs text-[#939494]", {
              "text-sm font-normal text-black/70": status === "Success",
            })}
          >
            ID - {requestId}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "asset",
    header: "Asset",
    cell: ({ row }) => {
      const assetType = row.original.asset || "STRK";

      // Asset icon mapping - using actual icon components from asset selector
      const getAssetIcon = (asset: string) => {
        if (ASSET_ICONS[asset]) {
          return React.createElement(ASSET_ICONS[asset], {
            className: "h-5 w-5",
          });
        }
        // Fallback to STRK icon
        return <Icons.strkLogo className="h-5 w-5" />;
      };

      return (
        <div className="flex items-center gap-2">
          {getAssetIcon(assetType)}
          <span className="text-sm font-medium">{assetType}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group flex h-7 items-center gap-2 bg-transparent text-black shadow-none hover:bg-transparent"
        >
          Amount
          <Icons.arrowUpDown className="!size-3 text-black opacity-60 group-hover:opacity-100" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.original.amount;
      return <AmountCell amount={amount} />;
    },
    sortingFn: (rowA, rowB, _columnId) => {
      return Number(rowA.original.amount) - Number(rowB.original.amount);
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn("rounded-full border px-4 py-1 text-xs font-normal", {
              "border-[#005600]/10 bg-[#C3FAD8]/30 text-[#005600]":
                status === "Success",
              "border-[#4C1100]/10 bg-[#FFEDD1] text-[#4C1100]":
                status === "Pending",
            })}
          >
            {status === "Success" ? "Withdraw" : "Pending"}
          </span>

          {status === "Success" && (
            <Link
              target="_blank"
              href={`${getExplorerEndpoint()}/tx/${row.original.txHash}`}
              className="group mr-1 flex w-fit items-center justify-end gap-1 text-xs transition-all"
            >
              <span className="text-[#939494] underline transition-all group-hover:text-blue-500">
                Link
              </span>
              <Icons.externalLink className="size-4 text-[#939494] group-hover:text-blue-500" />
            </Link>
          )}

          {status === "Pending" && (
            <p className="group mr-1 flex w-fit items-center justify-end gap-2 text-xs transition-all">
              <span className="text-[#939494] transition-all">
                {convertFutureTimestamp(row.original.claimTime as any)}
              </span>
              {/* TODO: use InfoTooltip - SOLVED */}
              <InfoTooltip side="bottom">
                You can claim within{" "}
                {convertFutureTimestamp(row.original.claimTime as any)}
              </InfoTooltip>
            </p>
          )}
        </div>
      );
    },
  },
];
