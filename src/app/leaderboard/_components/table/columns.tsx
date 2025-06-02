"use client";

import { useStarkProfile } from "@starknet-react/core";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { Icons } from "@/components/Icons";
import { formatNumber, shortAddress } from "@/lib/utils";

export type SizeColumn = {
  rank: string;
  address: string;
  score: string;
};

const AddressComp = ({ address }: { address: string }) => {
  const { data: profile } = useStarkProfile({
    address: address as `0x${string}`,
  });

  return (
    <Link
      href={`https://starkscan.co/contract/${address}`}
      target="_blank"
      className="group flex w-fit cursor-pointer items-center gap-2 transition-all hover:underline hover:opacity-80"
    >
      {profile?.profilePicture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.profilePicture}
          alt="Profile Avatar"
          width={24}
          height={24}
          className="rounded-full border"
        />
      )}
      {profile?.name ? profile.name : shortAddress(address, 6, 8)}
      <Icons.externalLink className="size-4 transition-all group-hover:translate-x-1" />
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
      return <span>{medal ? medal : rank}</span>;
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
        <div className="ml-auto w-fit pr-12 text-[#17876D]">
          {formatNumber(score)}
        </div>
      );
    },
  },
];
