import { gql } from "@apollo/client";

export const GET_ALL_USERS_WITH_DETAILS = gql`
  query GetAllUsersWithDetails($options: PaginationOptionsInput) {
    getAllUsersWithDetails(options: $options) {
      pagination {
        page
        limit
        total
        totalPages
      }
      users {
        user_address
        total_points
        regular_points
        bonus_points
        referrer_points
        allocation
        first_activity_date
        last_activity_date
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
      points {
        total_points
        regular_points
        bonus_points
        referrer_points
      }
      allocation
      activity {
        first_activity_date
        last_activity_date
        total_deposits
        total_withdrawals
      }
      eligibility {
        early_user_bonus {
          eligible
          points_before_cutoff
          bonus_awarded
          cutoff_date
        }
        six_month_bonus {
          eligible
          minimum_amount
          bonus_awarded
          period {
            start_date
            end_date
          }
        }
        referral_bonus {
          eligible
          is_referred_user
          referrer_address
          bonus_awarded
        }
      }
      tags {
        early_adopter
      }
    }
  }
`;
