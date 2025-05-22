"use client";

import { useAccount } from "@starknet-react/core";
import Image from "next/image";
import React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import CheckEligibility from "./_components/check-eligibility";
import { columns, type SizeColumn } from "./_components/table/columns";
import { DataTable } from "./_components/table/data-table";

const RAW_DATA: SizeColumn[] = [
  {
    rank: "1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    score: "1000",
  },
  {
    rank: "2",
    address:
      "0x05d3a8f378500497479d3a16cfcd54657246dc37da8270b52e49319fac139939",
    score: "900",
  },
  {
    rank: "3",
    address: "0x7890abcdef1234567890abcdef1234567890abcd",
    score: "800",
  },
  {
    rank: "4",
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    score: "700",
  },
  {
    rank: "5",
    address: "0x4567890abcdef1234567890abcdef1234567890",
    score: "600",
  },
  {
    rank: "6",
    address: "0xabcdef1234567890abcdef1234567890abcdef34",
    score: "500",
  },
  {
    rank: "7",
    address: "0x1234567890abcdef1234567890abcdef12345690",
    score: "400",
  },
  {
    rank: "8",
    address: "0xabcdef1234567890abcdef1234567890abcdef563",
    score: "300",
  },
  {
    rank: "9",
    address: "0xabcdef1234567890abcdef1234567890abcdef78",
    score: "100",
  },
  {
    rank: "10",
    address: "0xabcdef1234567890abcdef1234567890abcdef79",
    score: "190",
  },
];

const Leaderboard: React.FC = () => {
  const { isPinned } = useSidebar();
  const { address } = useAccount();

  const [data, _setData] = React.useState<SizeColumn[]>(RAW_DATA);

  const leaderboardData = React.useMemo(() => {
    if (!address) return data;
    const user = data.find((item) => item.address === address);
    const others = data.filter((item) => item.address !== address);
    return user ? [user, ...others] : others;
  }, [data, address]);

  return (
    <div
      className={cn("mt-2 w-full", {
        "lg:pl-28": !isPinned,
      })}
    >
      <h1 className="text-2xl font-semibold tracking-[-1%] text-[#17876D]">
        Leaderboard
      </h1>

      <div className="mt-1">
        <p className="text-sm text-[#021B1A]">
          Your position on the leaderboard is based on the total amount
          you&apos;ve staked on Endur. Learn more in the docs.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 rounded-md bg-[#0D4E3F] px-6 py-3 text-2xl font-normal tracking-[-1%] text-white md:flex-row">
          <div className="flex items-center gap-4">
            <Image
              src="/leaderboard/announce_sm.svg"
              width={78}
              height={64}
              alt="leaderboard_announce_sm"
              className="md:hidden"
            />
            <Image
              src="/leaderboard/announce.svg"
              width={78}
              height={64}
              alt="leaderboard_announce"
              className="hidden md:block"
            />
          </div>

          <div className="flex w-full flex-col items-center justify-between gap-3 pb-3 sm:flex-row">
            <div className="flex flex-col items-center gap-0.5 text-white sm:items-start">
              <p className="text-center text-base font-bold md:text-xl">
                Claim Your Fee Rebate Rewards
              </p>
              <p className="text-center text-sm font-normal text-white/80 md:text-base">
                You&apos;ve earned rewards based on your activity.
              </p>
            </div>

            <CheckEligibility />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DataTable columns={columns} data={leaderboardData} />
      </div>
    </div>
  );
};

export default Leaderboard;
