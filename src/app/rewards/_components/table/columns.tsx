"use client";

import { useAccount, useStarkProfile } from "@starknet-react/core";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import React from "react";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { formatNumber, shortAddress } from "@/lib/utils";

export type SizeColumn = {
  rank: string;
  address: string;
  score: string;
};

const AddressComp = ({ address }: { address: string }) => {
  const { address: currentAddress } = useAccount();
  const { data: profile } = useStarkProfile({
    address: address as `0x${string}`,
  });

  const isCurrentUser = currentAddress?.toLowerCase() === address.toLowerCase();

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    toast({
      description: "Address copied to clipboard",
      duration: 2000,
    });
  };

  if (isCurrentUser) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#1A1F24] md:text-sm">Your rank 🔥</span>
      </div>
    );
  }

  return (
    <Link
      href={`https://starkscan.co/contract/${address}`}
      target="_blank"
      className="group flex w-fit cursor-pointer items-center gap-1.5 transition-all hover:underline hover:opacity-80 md:gap-2"
    >
      {profile?.profilePicture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.profilePicture}
          alt="Profile Avatar"
          width={20}
          height={20}
          className="hidden rounded-full border sm:block md:h-6 md:w-6"
        />
      )}
      <span className="text-xs text-[#1A1F24] md:text-sm">
        {profile?.name ? (
          profile.name
        ) : (
          <>
            <span className="md:hidden">{shortAddress(address, 4, 4)}</span>
            <span className="hidden md:inline">
              {shortAddress(address, 6, 8)}
            </span>
          </>
        )}
      </span>
      <Copy
        className="h-3 w-3 text-[#6B7780] opacity-0 transition-opacity group-hover:opacity-100 md:opacity-0"
        onClick={handleCopy}
      />
    </Link>
  );
};

export const columns: ColumnDef<SizeColumn>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => {
      const rank = row.original.rank;
      let medal = "";
      if (rank === "1") medal = "🥇";
      else if (rank === "2") medal = "🥈";
      else if (rank === "3") medal = "🥉";
      return <span className="text-xs md:text-sm">{medal ? medal : rank}</span>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;

      return <AddressComp address={address} />;
    },
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => {
      const score = row.getValue("score") as string;

      return (
        <div className="ml-auto w-fit pr-4 text-xs text-[#17876D] md:pr-12 md:text-sm lg:text-base">
          {formatNumber(score, 2)}
        </div>
      );
    },
  },
];
