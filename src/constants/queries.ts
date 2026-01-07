import { gql } from "@apollo/client";

export const GET_TOP_100_USERS_SEASON1 = gql`
  query GetTop100UsersSeason1 {
    getTop100UsersSeason1 {
      userAddress
      totalPoints
      weightedTotalPoints
    }
  }
`;

export const GET_USER_NET_TOTAL_POINTS_SEASON1 = gql`
  query GetUserNetTotalPointsSeason1($userAddress: String!) {
    getUserNetTotalPointsSeason1(userAddress: $userAddress) {
      userAddress
      totalPoints
      weightedTotalPoints
      rank
    }
  }
`;

export const GET_TOP_100_USERS_SEASON2 = gql`
  query GetTop100UsersSeason2($overall: Boolean) {
    getTop100UsersSeason2(overall: $overall) {
      userAddress
      totalPoints
      weightedTotalPoints
    }
  }
`;

export const GET_USER_NET_TOTAL_POINTS_SEASON2 = gql`
  query GetUserNetTotalPointsSeason2($userAddress: String!, $overall: Boolean) {
    getUserNetTotalPointsSeason2(userAddress: $userAddress, overall: $overall) {
      userAddress
      totalPoints
      weightedTotalPoints
      rank
    }
  }
`;

// Keep old queries for backward compatibility if needed elsewhere
export const GET_ALL_USERS_WITH_DETAILS = gql`
  query GetAllUsersWithDetails($options: PaginationOptionsInput) {
    getAllUsersWithDetails(options: $options) {
      users {
        user_address
        total_points
      }
      pagination {
        page
        limit
        total
        totalPages
      }
      summary {
        total_users
        total_points_all_users
      }
    }
  }
`;

export const GET_USER_COMPLETE_DETAILS = gql`
  query GetUserCompleteDetails($userAddress: String!) {
    getUserCompleteDetails(userAddress: $userAddress) {
      user_address
      rank
      points {
        total_points
        regular_points
        bonus_points
        early_adopter_points
        follow_bonus_points
        dex_bonus_points
      }
      allocation
      proof
      tags {
        early_adopter
      }
    }
  }
`;

export const CHECK_EMAIL_EXISTS = gql`
  query CheckUserEmail($userAddress: String!) {
    hasEmailSaved(userAddress: $userAddress)
  }
`;

export const GET_USER_POINTS_BREAKDOWN = gql`
  query GetUserPointsBreakdown($userAddress: String!) {
    getUserPointsBreakdown(userAddress: $userAddress) {
      weeklyEarned
      epochsCompleted
      lastPointsMultiplierEndTimestamp
      breakdown {
        userBreakdown {
          title
          multiplier
          weeklyEarned
          overall
        }
        contributorBreakdown {
          title
          multiplier
          weeklyEarned
          overall
        }
      }
    }
  }
`;
