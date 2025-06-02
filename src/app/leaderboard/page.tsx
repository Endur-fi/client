"use client";

import { useAccount } from "@starknet-react/core";
import Image from "next/image";
import React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import CheckEligibility from "./_components/check-eligibility";
import { columns, type SizeColumn } from "./_components/table/columns";
import { DataTable } from "./_components/table/data-table";

interface ApiUser {
  user_address: string;
  total_points: string;
  regular_points: string;
  bonus_points: string;
  referrer_points: string;
  allocation?: string;
  first_activity_date?: string;
  last_activity_date?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    users: ApiUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total_users: number;
      total_points_all_users: string;
    };
  };
  message?: string;
  error?: string;
}

const API_BASE_URL = "http://localhost:4000";

const Leaderboard: React.FC = () => {
  const { isPinned } = useSidebar();
  const { address } = useAccount();

  const [data, setData] = React.useState<SizeColumn[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchUsersData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/users?page=1&limit=100&sortBy=total_points&sortOrder=desc`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch users data");
      }

      const transformedData: SizeColumn[] = result.data.users.map(
        (user, index) => ({
          rank: (index + 1).toString(),
          address: user.user_address,
          score: user.total_points,
        }),
      );

      setData(transformedData);
    } catch (err) {
      console.error("Error fetching users data:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  const leaderboardData = React.useMemo(() => {
    if (!address || data.length === 0) return data;

    const userIndex = data.findIndex(
      (item) => item.address.toLowerCase() === address.toLowerCase(),
    );

    if (userIndex === -1) return data;

    const user = data[userIndex];
    const others = data.filter((_, index) => index !== userIndex);

    return [user, ...others];
  }, [data, address]);

  const handleRetry = () => {
    fetchUsersData();
  };

  if (loading) {
    return (
      <div
        className={cn("mt-2 w-full", {
          "lg:pl-28": !isPinned,
        })}
      >
        <h1 className="text-2xl font-semibold tracking-[-1%] text-[#17876D]">
          Leaderboard
        </h1>
        <div className="mt-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#17876D] border-t-transparent"></div>
            <p className="text-[#021B1A]">Loading leaderboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn("mt-2 w-full", {
          "lg:pl-28": !isPinned,
        })}
      >
        <h1 className="text-2xl font-semibold tracking-[-1%] text-[#17876D]">
          Leaderboard
        </h1>
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
            <p className="font-medium text-red-800">
              Failed to load leaderboard data
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        {data.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[#021B1A]">
                {/* Showing {data.length} users */}
              </p>
              <button
                onClick={handleRetry}
                className="text-sm text-[#17876D] transition-colors hover:text-[#0D4E3F]"
              >
                Refresh
              </button>
            </div>
            <DataTable columns={columns} data={leaderboardData} />
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[#021B1A]">No leaderboard data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
