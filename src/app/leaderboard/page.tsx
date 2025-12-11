"use client";

import { useAccount } from "@starknet-react/core";
import React from "react";
import {
  Calendar,
  ChevronRight,
  Clock,
  TrendingUp,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { isMainnet, LEADERBOARD_ANALYTICS_EVENTS } from "@/constants";
import {
  GET_ALL_USERS_WITH_DETAILS,
  GET_USER_COMPLETE_DETAILS,
} from "@/constants/queries";
import { MyAnalytics } from "@/lib/analytics";
import { defaultOptions } from "@/lib/apollo-client";
import { cn, formatNumber } from "@/lib/utils";
import {
  Tabs as ShadCNTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { Button } from "@/components/ui/button";

import {
  UserCompleteDetailsApiResponse,
} from "./_components/check-eligibility";
import { columns, type SizeColumn } from "./_components/table/columns";
import { DataTable } from "./_components/table/data-table";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { Icons } from "@/components/Icons";
import Link from "next/link";

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

const apolloClient = new ApolloClient({
  uri: isMainnet()
    ? "https://graphql.mainnet.endur.fi"
    : "https://graphql.sepolia.endur.fi",
  // uri: "http://localhost:4000",
  cache: new InMemoryCache(),
  defaultOptions,
});

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
          leaderboardCache.currentUserInfo.address === address &&
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

const Season2Banner = React.memo(() => (
  <div className="mt-6 flex flex-col gap-3 rounded-xl bg-[#17876D26] px-2 py-2 lg:flex-row lg:items-center lg:gap-6 lg:px-4 lg:py-2">
    <div className="flex gap-2 lg:flex-shrink-0 lg:gap-3">
      <Icons.announcement />
      <div className="flex flex-col gap-1 lg:hidden lg:gap-2">
        <h4 className="text-sm font-bold text-[#17876D] lg:text-base">
          Season 2 Points Program Active
        </h4>
        <span className="w-fit rounded-full bg-[#38EF7D] px-4 py-1 text-xs font-bold text-[#0D5F4E] lg:px-5 lg:py-1.5 lg:text-sm">
          LIVE
        </span>
        <p className="text-xs text-[#17876D] lg:text-sm">
          Earn points by staking on Endur throughout the season
        </p>
      </div>
    </div>
    <div className="hidden flex-1 space-y-2 lg:block">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-bold text-[#17876D] lg:text-base">
          Season 2 Points Program Active
        </h4>
        <span className="w-fit rounded-full bg-[#38EF7D] px-4 py-1 text-xs font-bold text-[#0D5F4E] lg:px-2 lg:py-0">
          LIVE
        </span>
      </div>
      <p className="text-xs text-[#17876D] lg:text-sm">
        Earn points by staking on Endur throughout the season
      </p>
    </div>
    <div className="lg:flex-shrink-0 lg:self-center">
      <Button className="w-full rounded-md bg-[#17876D] px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 lg:w-auto lg:px-6 lg:text-sm">
        View details
      </Button>
    </div>
  </div>
));
Season2Banner.displayName = "Season2Banner";

const BtcStakingInfoBanner = React.memo(() => (
  <div className="mt-4 flex items-center gap-3 rounded-md border border-[#17876D]/20 bg-[#17876D]/5 px-4 py-3">
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#17876D]/10">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#17876D]"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </svg>
    </div>
    <p className="text-sm font-medium text-[#021B1A]">
      Points for BTC staking will be added soon
    </p>
  </div>
));
BtcStakingInfoBanner.displayName = "BtcStakingInfoBanner";

const EmptyState = React.memo(() => (
  <div className="py-8 text-center">
    <p className="text-[#021B1A]">No leaderboard data available</p>
  </div>
));
EmptyState.displayName = "EmptyState";

const Leaderboard: React.FC = () => {
  const { isPinned } = useSidebar();
  const { address } = useAccount();
  const { connectWallet } = useWalletConnection();
  const [activeSeason, setActiveSeason] = React.useState<"season1" | "season2">(
    "season2",
  );

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

  function getDurationString(start: Date, end: Date): string {
    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays >= 365) {
      const years = Math.floor(diffInDays / 365);
      return `${years} year${years > 1 ? "s" : ""} duration`;
    } else if (diffInDays >= 30) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? "s" : ""} duration`;
    } else if (diffInDays >= 7) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} duration`;
    } 
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} duration`;
  }

  const seasons = [
    {
      season: 2,
      isActive: true,
      startDate: new Date("2024-05-10T00:00:00Z"),
      endDate: new Date("2024-06-10T23:59:59Z"),
      points: 75000000,
    },
    {
      season: 1,
      isActive: false,
      startDate: new Date("2024-03-01T00:00:00Z"),
      endDate: new Date("2024-04-01T23:59:59Z"),
      points: 10000000,
    },
  ];

  return (
    <div className={containerClasses}>
      <div className="flex items-start justify-between">
        <div className="flex flex-1 flex-col gap-2 lg:gap-3">
          <div className="flex items-center gap-2">
            <Icons.rewards />
            <h1 className="text-xl font-normal tracking-[-1%] text-[#1A1F24] lg:text-2xl">
              Rewards & Leaderboard
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#021B1A] lg:text-base">
            Track your ranking and earn rewards. your position on the
            leaderboard is based on the total amount {"you've"} staked on Endur.
            Learn more in the{" "}
            <a
              href="https://docs.endur.fi/docs"
              target="_blank"
              className="text-[#3B82F6] underline"
            >
              docs.
            </a>
          </p>
        </div>
      </div>

      <div className="pt-3 lg:pt-6">
        <div className="flex flex-col gap-3 rounded-[14px] bg-gradient-to-b from-[#0D5F4E] to-[#11998E] p-2 lg:flex-row lg:items-center lg:gap-6 lg:p-4">
          <div className="flex gap-2 lg:flex-shrink-0 lg:gap-3">
            <div className="rounded-lg bg-[#FFFFFF33] p-3 shadow-lg lg:p-4">
              <Icons.gift />
            </div>
            <h2 className="font-bold text-white lg:hidden lg:text-xl">
              125,000 STRK Rewards Distributed
            </h2>
          </div>
          <div className="flex-1 space-y-2 lg:block">
            <div className="hidden lg:block">
              <h2 className="font-bold text-white lg:text-xl">
                125,000 STRK Rewards Distributed
              </h2>
              <div className="mt-2 h-px w-full bg-white/20"></div>
            </div>
            <p className="text-sm text-white lg:text-base">
              Season 1 rewards have been successfully distributed to all
              eligible participants. Check if {"you're"} eligible for upcoming
              Season 2 rewards based on your staking activity and position on
              the leaderboard.
            </p>
          </div>
          <div className="lg:flex-shrink-0 lg:self-center">
            <Link href="/">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 font-bold text-[#0D5F4E] transition-opacity hover:opacity-90 lg:w-auto lg:px-6">
                Check Eligibility <ChevronRight />
              </button>
            </Link>
          </div>
        </div>

        <Season2Banner />

        {/* Timeline & Points Allocation Boxes */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
          {seasons.map((season, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-[14px] border border-[#E5E8EB] bg-white p-4 shadow-sm lg:gap-4 lg:p-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn("rounded-full bg-[#5B616D] p-2 shadow-sm", {
                    "bg-gradient-to-b from-[#0D5F4E] to-[#11998E]":
                      season.isActive,
                  })}
                >
                  <Icons.trophy />
                </div>

                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1A1F24]">
                  Season {season.season}
                </h3>

                <span
                  className={cn(
                    "flex items-center gap-1 rounded-md bg-[#5B616D] px-2 py-0.5 text-xs font-medium text-white",
                    { "bg-[#0C4E3F]": season.isActive },
                  )}
                >
                  {season.isActive && <Icons.dot />}

                  {season.isActive ? "ACTIVE" : "ENDED"}
                </span>
              </div>

              <div className="space-y-2 rounded-lg bg-[#F7FBFA] px-2 py-4">
                <div className="flex items-center gap-2">
                  <Calendar
                    className={cn("h-4 w-4 text-[#5B616D]", {
                      "text-[#17876D]": season.isActive,
                    })}
                  />
                  <span className={cn("text-sm font-bold text-[#021B1A]")}>
                    Timeline
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[#5B616D]">
                    {season.startDate.toDateString()} -{" "}
                    {season.endDate.toDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-[#5B616D]" />
                    <p className="text-xs text-[#5B616D]">
                      {getDurationString(season.startDate, season.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-lg border border-[#E5E8EB] bg-[#F7F9FA] px-2 py-3",
                  {
                    "bg-gradient-to-b from-[#E8F7F4] to-[#F7FBFA]":
                      season.isActive,
                    "border-[#D4E8E3]": season.isActive,
                  },
                )}
              >
                <div className="inline-flex items-center gap-2">
                  <TrendingUp
                    className={cn("h-4 w-4 text-[#5B616D]", {
                      "text-[#17876D]": season.isActive,
                    })}
                  />
                  <p
                    className={cn("font-semibold", {
                      "text-[#1A1F24]": season.isActive,
                    })}
                  >
                    Points Pool
                  </p>
                </div>
                <div>
                  <p
                    className={cn("text-lg font-bold text-[#5B616D]", {
                      "text-[#17876D]": season.isActive,
                    })}
                  >
                    {formatNumber(season.points)} Points
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#5B616D]">
                    {season.isActive
                      ? "Allocated weekly throughout the season"
                      : "Points have been descaled (1000:1 ratio) to a max of 10M points"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ShadCNTabs
          value={activeSeason}
          onValueChange={(value) =>
            setActiveSeason(value as "season1" | "season2")
          }
          defaultValue="season2"
          className="mt-6 lg:mt-8"
        >
          <TabsList className="h-auto w-full gap-0 rounded-[14px] border border-[#E5E8EB] bg-white p-1 lg:w-fit">
            <TabsTrigger
              value="season2"
              className={cn(
                "flex-1 rounded-[10px] border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[#6B7780] transition-all data-[state=active]:border-[#17876D] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#1A1F24] data-[state=active]:shadow-none lg:px-6 lg:py-2.5 lg:text-base",
              )}
            >
              Season 2
            </TabsTrigger>
            <TabsTrigger
              value="season1"
              className={cn(
                "flex-1 rounded-[10px] border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[#6B7780] transition-all data-[state=active]:border-[#17876D] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#1A1F24] data-[state=active]:shadow-none lg:px-6 lg:py-2.5 lg:text-base",
              )}
            >
              Season 1
            </TabsTrigger>
          </TabsList>

          <TabsContent value="season2" className="mt-0">
            <div className="mt-6 lg:mt-8">
              {allUsers.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={leaderboardData}
                  userCompleteDetails={userCompleteInfo}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </TabsContent>

          <TabsContent value="season1" className="mt-0">
            <div className="mt-6 lg:mt-8">
              {allUsers.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={leaderboardData}
                  userCompleteDetails={userCompleteInfo}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </TabsContent>
        </ShadCNTabs>
      </div>
    </div>
  );
};

export default Leaderboard;
