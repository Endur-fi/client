"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import { useAccount } from "@starknet-react/core";
import React from "react";

import { UserCompleteDetailsApiResponse } from "@/app/leaderboard/_components/check-eligibility";
import { SizeColumn } from "@/app/leaderboard/_components/table/columns";
import {
  type AllUsersApiResponse,
  type CurrentUserInfo,
  type LeaderboardCache,
  type LeaderboardState,
} from "@/app/leaderboard/types";
import { isMainnet } from "@/constants";
import { defaultOptions } from "@/lib/apollo-client";
import {
  GET_ALL_USERS_WITH_DETAILS,
  GET_USER_COMPLETE_DETAILS,
} from "@/constants/queries";

const PAGINATION_LIMIT = 100;

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

export { useLeaderboardData };
