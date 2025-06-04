"use client";

import { useAccount } from "@starknet-react/core";
import Image from "next/image";
import React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { GET_ALL_USERS_WITH_DETAILS } from "@/constants/queries";
import apolloClient from "@/lib/apollo-client";
import { cn } from "@/lib/utils";

import CheckEligibility from "./_components/check-eligibility";
import { columns, type SizeColumn } from "./_components/table/columns";
import { DataTable } from "./_components/table/data-table";

const PAGINATION_LIMIT = 100;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
}

interface LoadingState {
  initial: boolean;
  refresh: boolean;
}

interface LeaderboardState {
  data: SizeColumn[];
  loading: LoadingState;
  error: string | null;
  lastFetch: number | null;
}

const useLeaderboardData = () => {
  const [state, setState] = React.useState<LeaderboardState>({
    data: [],
    loading: { initial: true, refresh: false },
    error: null,
    lastFetch: null,
  });

  const fetchUsersData = React.useCallback(async (isRefresh = false) => {
    try {
      setState((prev) => ({
        ...prev,
        loading: {
          initial: !isRefresh && prev.data.length === 0,
          refresh: isRefresh,
        },
        error: null,
      }));

      const { data } = await apolloClient.query({
        query: GET_ALL_USERS_WITH_DETAILS,
        variables: {
          options: {
            page: 1,
            limit: PAGINATION_LIMIT,
          },
        },
        // force refetch on refresh
        fetchPolicy: isRefresh ? "network-only" : "cache-first",
      });

      const result: ApiResponse = data?.getAllUsersWithDetails;

      if (!result?.users) {
        throw new Error("Invalid response format");
      }

      const transformedData: SizeColumn[] = result.users.map((user, index) => ({
        rank: (index + 1).toString(),
        address: user.user_address,
        score: user.total_points,
      }));

      setState((prev) => ({
        ...prev,
        data: transformedData,
        loading: { initial: false, refresh: false },
        error: null,
        lastFetch: Date.now(),
      }));
    } catch (err) {
      console.error("Error fetching users data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load leaderboard data";

      setState((prev) => ({
        ...prev,
        loading: { initial: false, refresh: false },
        error: errorMessage,
      }));
    }
  }, []);

  return {
    ...state,
    fetchUsersData,
    refetch: () => fetchUsersData(true),
  };
};

const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = "Loading leaderboard data...",
}) => (
  <div className="mt-8 flex items-center justify-center">
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#17876D] border-t-transparent" />
      <p className="text-[#021B1A]">{message}</p>
    </div>
  </div>
);

const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="mt-8 flex flex-col items-center justify-center gap-4">
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
      <p className="font-medium text-red-800">
        Failed to load leaderboard data
      </p>
      <p className="mt-1 text-sm text-red-600">{error}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Retry
      </button>
    </div>
  </div>
);

const AnnouncementBanner: React.FC = React.memo(() => (
  <div className="mt-6 flex flex-col items-center gap-3 rounded-md bg-[#0D4E3F] px-6 py-3 text-2xl font-normal tracking-[-1%] text-white md:flex-row">
    <div className="flex items-center gap-4">
      <Image
        src="/leaderboard/announce_sm.svg"
        width={78}
        height={64}
        alt="leaderboard_announce_sm"
        className="md:hidden"
        priority
      />
      <Image
        src="/leaderboard/announce.svg"
        width={78}
        height={64}
        alt="leaderboard_announce"
        className="hidden md:block"
        priority
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
));

AnnouncementBanner.displayName = "AnnouncementBanner";

const Leaderboard: React.FC = () => {
  const { isPinned } = useSidebar();
  const { address } = useAccount();

  const { data, loading, error, lastFetch, fetchUsersData, refetch } =
    useLeaderboardData();

  // initial data fetch
  React.useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  // auto-refresh
  React.useEffect(() => {
    if (!lastFetch) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastFetch >= REFRESH_INTERVAL) {
        refetch();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [lastFetch, refetch]);

  const leaderboardData = React.useMemo(() => {
    if (!address || data.length === 0) return data;

    const normalizedAddress = address.toLowerCase();
    const userIndex = data.findIndex(
      (item) => item.address.toLowerCase() === normalizedAddress,
    );

    if (userIndex === -1) return data;

    const user = data[userIndex];
    const others = data.filter((_, index) => index !== userIndex);

    return [user, ...others];
  }, [data, address]);

  const containerClasses = cn("mt-2 w-full", {
    "lg:pl-28": !isPinned,
  });

  if (loading.initial) {
    return (
      <div className={containerClasses}>
        <h1 className="text-2xl font-semibold tracking-[-1%] text-[#17876D]">
          Leaderboard
        </h1>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className={containerClasses}>
        <h1 className="text-2xl font-semibold tracking-[-1%] text-[#17876D]">
          Leaderboard
        </h1>
        <ErrorDisplay error={error} onRetry={() => fetchUsersData()} />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <h1 className="text-2xl font-semibold tracking-[-1%] text-[#17876D]">
        Leaderboard
      </h1>

      <div className="mt-1">
        <p className="text-sm text-[#021B1A]">
          Your position on the leaderboard is based on the total amount
          you&apos;ve staked on Endur. Learn more in the docs.
        </p>

        <AnnouncementBanner />
      </div>

      <div className="mt-6">
        {data.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {error && (
                  <span className="text-sm text-red-600">Warning: {error}</span>
                )}
              </div>
              <button
                onClick={refetch}
                disabled={loading.refresh}
                className="flex items-center gap-2 rounded text-sm text-[#17876D] transition-colors hover:text-[#0D4E3F] focus:outline-none focus:ring-2 focus:ring-[#17876D] focus:ring-offset-2 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
            <DataTable columns={columns} data={leaderboardData} />
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[#021B1A]">No leaderboard data available</p>
            <button
              onClick={() => fetchUsersData()}
              className="mt-2 rounded text-sm text-[#17876D] hover:text-[#0D4E3F] focus:outline-none focus:ring-2 focus:ring-[#17876D] focus:ring-offset-2"
            >
              Try loading again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
