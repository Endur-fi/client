"use client";

import { useAccount } from "@starknet-react/core";
import Image from "next/image";
import React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { LEADERBOARD_ANALYTICS_EVENTS } from "@/constants";
import {
  GET_ALL_USERS_WITH_DETAILS,
  GET_USER_COMPLETE_DETAILS,
} from "@/constants/queries";
import { MyAnalytics } from "@/lib/analytics";
import apolloClient from "@/lib/apollo-client";
import { cn } from "@/lib/utils";

import CheckEligibility, {
  UserCompleteDetailsApiResponse,
} from "./_components/check-eligibility";
import { columns, type SizeColumn } from "./_components/table/columns";
import { DataTable } from "./_components/table/data-table";

const PAGINATION_LIMIT = 100;

interface AllUsersApiResponse {
  users: {
    user_address: string;
    total_points: string;
  }[];
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

interface CurrentUserInfo {
  address: string;
  points: string;
  rank: number | null;
  isLoading: boolean;
}

interface LeaderboardState {
  data: SizeColumn[];
  loading: {
    initial: boolean;
    refresh: boolean;
  };
  error: string | null;
  lastFetch: number | null;
  totalUsers: number | null;
  currentUserInfo: CurrentUserInfo;
  userCompleteInfo: UserCompleteDetailsApiResponse | null;
}

interface LeaderboardCache {
  data: SizeColumn[];
  timestamp: number;
  totalUsers: number | null;
  currentUserInfo: CurrentUserInfo;
  userCompleteInfo: UserCompleteDetailsApiResponse | null;
}

const CACHE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
let leaderboardCache: LeaderboardCache | null = null;

const useLeaderboardData = () => {
  const [state, setState] = React.useState<LeaderboardState>({
    data: [],
    loading: { initial: true, refresh: false },
    error: null,
    lastFetch: null,
    totalUsers: null,
    currentUserInfo: { points: "0", rank: null, address: "", isLoading: false },
    userCompleteInfo: null,
  });

  const { address } = useAccount();

  const fetchUsersData = React.useCallback(
    async (isRefresh = false) => {
      try {
        if (
          !isRefresh &&
          leaderboardCache &&
          // refresh, even if address changes
          leaderboardCache.currentUserInfo.address == address &&
          Date.now() - leaderboardCache.timestamp < CACHE_EXPIRY_MS
        ) {
          setState({
            data: leaderboardCache.data,
            loading: { initial: false, refresh: false },
            error: null,
            lastFetch: leaderboardCache.timestamp,
            totalUsers: leaderboardCache.totalUsers,
            currentUserInfo: leaderboardCache.currentUserInfo,
            userCompleteInfo: leaderboardCache.userCompleteInfo,
          });
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: {
            initial: !isRefresh && prev.data.length === 0,
            refresh: isRefresh,
          },
          currentUserInfo: {
            ...prev.currentUserInfo,
            isLoading: true,
          },
          error: null,
        }));

        const [usersResult, currentUserResult] = await Promise.allSettled([
          apolloClient.query({
            query: GET_ALL_USERS_WITH_DETAILS,
            variables: {
              options: {
                page: 1,
                limit: PAGINATION_LIMIT,
              },
            },
            fetchPolicy: "network-only", // fetch fresh data when we bypass cache
          }),
          address
            ? apolloClient.query({
                query: GET_USER_COMPLETE_DETAILS,
                variables: {
                  userAddress: address,
                },
              })
            : Promise.resolve({
                data: { getUserCompleteDetails: null },
              }),
        ]);

        if (usersResult.status === "rejected") {
          throw new Error(
            usersResult.reason?.message || "Failed to fetch users",
          );
        }

        const apiResponse: AllUsersApiResponse =
          usersResult.value.data?.getAllUsersWithDetails;
        if (!apiResponse?.users) {
          throw new Error("Invalid response format");
        }

        const currentUserData: UserCompleteDetailsApiResponse | null =
          currentUserResult.status === "fulfilled"
            ? currentUserResult.value.data?.getUserCompleteDetails
            : null;

        const transformedData: SizeColumn[] = apiResponse.users.map(
          (user, index) => ({
            rank: (index + 1).toString(),
            address: user.user_address,
            score: user.total_points,
          }),
        );

        const currentUserInfo: CurrentUserInfo = {
          points: currentUserData?.points.total_points.toString() || "0",
          address: address || "",
          isLoading: false,
          rank: currentUserData
            ? currentUserData.rank
            : apiResponse.summary.total_users
              ? apiResponse.summary.total_users + 1
              : null,
        };

        // update cache
        leaderboardCache = {
          data: transformedData,
          timestamp: Date.now(),
          totalUsers: apiResponse.summary.total_users,
          currentUserInfo,
          userCompleteInfo: currentUserData,
        };

        setState({
          data: transformedData,
          loading: { initial: false, refresh: false },
          error: null,
          lastFetch: Date.now(),
          totalUsers: apiResponse.summary.total_users,
          currentUserInfo,
          userCompleteInfo: currentUserData,
        });
      } catch (err) {
        console.error("Error fetching users data:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load leaderboard data";

        setState((prev) => ({
          ...prev,
          loading: { initial: false, refresh: false },
          error: errorMessage,
          currentUserInfo: {
            ...prev.currentUserInfo,
            isLoading: false,
          },
        }));
      }
    },
    [address],
  );

  return {
    ...state,
    fetchUsersData,
    refetch: React.useCallback(() => fetchUsersData(true), [fetchUsersData]),
  };
};

const LoadingSpinner = React.memo(
  ({ message = "Loading leaderboard data..." }: { message?: string }) => (
    <div className="mt-8 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#17876D] border-t-transparent" />
        <p className="text-[#021B1A]">{message}</p>
      </div>
    </div>
  ),
);
LoadingSpinner.displayName = "LoadingSpinner";

const ErrorDisplay = React.memo(({ error }: { error: string }) => (
  <div className="mt-8 flex flex-col items-center justify-center gap-4">
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
      <p className="font-medium text-red-800">Unable to load leaderboard</p>
      <p className="mt-1 text-sm text-red-600">{error}</p>
    </div>
  </div>
));
ErrorDisplay.displayName = "ErrorDisplay";

const AnnouncementBanner = React.memo(
  ({
    userCompleteInfo,
    currentUserInfo,
  }: {
    userCompleteInfo: UserCompleteDetailsApiResponse | null;
    currentUserInfo: CurrentUserInfo;
  }) => (
    // <></>
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

      <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex flex-col items-center gap-0.5 text-white sm:items-start">
          <p className="text-center text-base font-bold md:text-xl">
            Check Your Fee Rebate Rewards
          </p>
          <p className="text-center text-sm font-normal text-white/80 md:text-base">
            Early adopters may have earned fee rebates.{" "}
            <a href="" className="underline">
              Learn more.
            </a>
          </p>
        </div>
        <CheckEligibility
          userCompleteInfo={userCompleteInfo}
          isLoading={currentUserInfo.isLoading}
        />
      </div>
    </div>
  ),
);
AnnouncementBanner.displayName = "AnnouncementBanner";

const EmptyState = React.memo(() => (
  <div className="py-8 text-center">
    <p className="text-[#021B1A]">No leaderboard data available</p>
  </div>
));
EmptyState.displayName = "EmptyState";

const Leaderboard: React.FC = () => {
  const { isPinned } = useSidebar();
  const { address } = useAccount();

  const {
    data: allUsers,
    loading,
    error,
    fetchUsersData,
    currentUserInfo,
    userCompleteInfo,
  } = useLeaderboardData();

  React.useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  React.useEffect(() => {
    MyAnalytics.track(LEADERBOARD_ANALYTICS_EVENTS.LEADERBOARD_PAGE_VIEW, {
      userAddress: address || "anonymous",
      timestamp: Date.now(),
      isWalletConnected: !!address,
    });
  }, [address]);

  const leaderboardData = React.useMemo(() => {
    if (!address || allUsers.length === 0) return allUsers;

    const existingUserIndex = allUsers.findIndex(
      (user) => user.address.toLowerCase() === address,
    );

    if (existingUserIndex !== -1) {
      const userData = allUsers[existingUserIndex];
      const filteredUsers = allUsers.filter(
        (_, index) => index !== existingUserIndex,
      );
      return [userData, ...filteredUsers];
    }

    const currentUserData: SizeColumn = {
      address,
      rank: currentUserInfo.rank?.toString() || "N/A",
      score: currentUserInfo.points,
    };
    return [currentUserData, ...allUsers];
  }, [address, allUsers, currentUserInfo.points, currentUserInfo]);

  const containerClasses = React.useMemo(
    () =>
      cn("mt-2 lg:mt-10 w-full max-w-[1200px]", {
        "lg:pl-28": !isPinned,
      }),
    [isPinned],
  );

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

  if (error && allUsers.length === 0) {
    return (
      <div className={containerClasses}>
        <h1 className="text-2xl font-semibold tracking-[-1%] text-[#17876D]">
          Leaderboard
        </h1>
        <ErrorDisplay error={error} />
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
          Your position on the leaderboard based on your xSTRK holding activity.
          Points updated daily.{" "}
          <a
            href="https://blog.endur.fi/points?utm_source=leaderboard-page&utm_medium=website"
            target="_blank"
            className="underline"
          >
            More Info.
          </a>
        </p>

        <AnnouncementBanner
          userCompleteInfo={userCompleteInfo}
          currentUserInfo={currentUserInfo}
        />
      </div>

      <div className="mt-6">
        {allUsers.length > 0 ? (
          <DataTable columns={columns} data={leaderboardData} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
