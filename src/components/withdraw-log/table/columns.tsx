"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Info, Loader } from "lucide-react";
import Link from "next/link";
import { Contract } from "starknet";
import { useAccount } from "@starknet-react/core";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { ASSET_ICONS } from "@/components/asset-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getExplorerEndpoint, getProvider } from "@/constants";
import { cn, convertFutureTimestamp } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import WqAbi from "@/abi/wq.abi.json";

// Custom component for amount cell that can use hooks
const AmountCell: React.FC<{ amount: string }> = ({ amount }) => {
  return <>{amount}</>;
};

// Claim button component for rejected withdrawal requests
const ClaimButton: React.FC<{
  queueContract: string;
  requestId: string;
  asset: string;
}> = ({ queueContract, requestId, asset }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { address, account } = useAccount();
  const { toast } = useToast();

  const handleClaim = async () => {
    if (!address || !account) {
      toast({
        description: "Please connect your wallet to claim",
      });
      return;
    }

    setIsLoading(true);

    try {
      const provider = getProvider();
      const contract = new Contract({
        abi: WqAbi,
        address: queueContract,
        providerOrAccount: account,
      });

      const claimCall = contract.populate("claim_withdrawal", [requestId]);

      const result = await account.execute([claimCall]);

      toast({
        description: `Claim transaction submitted for ${asset}`,
      });

      console.log("Claim transaction result:", result);
    } catch (error) {
      console.error("Error claiming withdrawal:", error);
      toast({
        description: "Failed to claim withdrawal. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClaim}
      disabled={isLoading}
      className="group mr-1 flex w-fit items-center justify-end gap-1 text-xs transition-all disabled:opacity-50"
    >
      <span className="text-[#939494] underline transition-all group-hover:text-blue-500">
        {isLoading ? "Claiming..." : "Claim"}
      </span>
      {isLoading && <Loader className="size-4 animate-spin text-[#939494]" />}
    </button>
  );
};

export type Status = "Success" | "Pending" | "Ready";

export type WithdrawLogColumn = {
  queuePosition: string;
  amount: string;
  status: Status;
  claimTime: string;
  txHash: string;
  rank: number;
  asset?: string;
  queueContract?: string;
  requestId?: string;
};

export const withdrawLogColumn: ColumnDef<WithdrawLogColumn>[] = [
  {
    accessorKey: "queuePosition",
    header: () => {
      return (
        <div className="flex items-center gap-2">
          Log ID
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="ml-1" tabIndex={-1} asChild>
                <Info className="size-3 text-black" />
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-[13rem] rounded-md border border-[#03624C] bg-white text-[#03624C]"
              >
                Your position in the withdrawal queue
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
              "border-[#03624C]/10 bg-[#E3EFEC]/30 text-[#03624C]":
                status === "Ready",
            })}
          >
            {status === "Success"
              ? "Withdraw"
              : status === "Ready"
                ? "Ready"
                : "Pending"}
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

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger className="ml-1" tabIndex={-1} asChild>
                    <Info className="size-3 text-[#939494]" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-[13rem] rounded-md border border-[#03624C] bg-white text-[#03624C]"
                  >
                    You can claim within{" "}
                    {convertFutureTimestamp(row.original.claimTime as any)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          )}

          {status === "Ready" && (
            <ClaimButton
              queueContract={row.original.queueContract!}
              requestId={row.original.requestId!}
              asset={row.original.asset || "STRK"}
            />
          )}
        </div>
      );
    },
  },
];
