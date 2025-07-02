import { gql } from "@apollo/client";

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
