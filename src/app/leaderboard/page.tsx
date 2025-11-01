"use client";

import { useAccount } from "@starknet-react/core";
import Image from "next/image";
import React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { LEADERBOARD_ANALYTICS_EVENTS } from "@/constants";
import { MyAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useLeaderboardData } from "@/hooks/use-leaderboard-data";

import CheckEligibility, {
  UserCompleteDetailsApiResponse,
} from "@/features/leaderboard/components/check-eligibility";
import {
  columns,
  type SizeColumn,
} from "@/features/leaderboard/components/table/columns";
import { DataTable } from "@/features/leaderboard/components/table/data-table";
import { CurrentUserInfo } from "./types";

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
            <a
              href="https://x.com/endurfi/status/1932785841564487770"
              target="_blank"
              className="underline"
            >
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

        <BtcStakingInfoBanner />

        <AnnouncementBanner
          userCompleteInfo={userCompleteInfo}
          currentUserInfo={currentUserInfo}
        />
      </div>

      <div className="mt-6">
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
    </div>
  );
};

export default Leaderboard;
