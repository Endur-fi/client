"use client";

import { Icons } from "@/components/Icons";
import { shortAddress } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export type SizeColumn = {
  rank: string;
  address: string;
  score: string;
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
      return <span>{medal ? medal : rank}</span>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;

      return (
        <div className="flex w-fit cursor-pointer items-center gap-2">
          {shortAddress(address, 6, 8)}
          <Icons.externalLink className="size-4" />
        </div>
      );
    },
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => {
      const score = row.getValue("score") as string;

      return <div className="ml-auto w-fit pr-12 text-[#17876D]">{score}</div>;
    },
  },
];
