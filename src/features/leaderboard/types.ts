import { UserCompleteDetailsApiResponse } from "./components/check-eligibility";
import { SizeColumn } from "./components/table/columns";

export interface AllUsersApiResponse {
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

export interface CurrentUserInfo {
  address: string;
  points: string;
  rank: number | null;
  isLoading: boolean;
}

export interface LeaderboardState {
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

export interface LeaderboardCache {
  data: SizeColumn[];
  timestamp: number;
  totalUsers: number | null;
  currentUserInfo: CurrentUserInfo;
  userCompleteInfo: UserCompleteDetailsApiResponse | null;
}
