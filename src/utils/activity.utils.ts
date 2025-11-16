import type { Getter } from "jotai";
import { isUserActiveAtom } from "@/hooks/useUserActivity";

/**
 * Utility function to create activity-based query options for atomWithQuery
 * This ensures queries only refetch when the user is active
 */
export const createActivityBasedQueryOptions = (get: Getter, baseOptions: any) => {
  return {
    ...baseOptions,
    refetchInterval: () => {
      const isActive = get(isUserActiveAtom);
      const interval = typeof baseOptions.refetchInterval === 'function' 
        ? baseOptions.refetchInterval() 
        : baseOptions.refetchInterval;
      return isActive ? interval : false;
    },
    refetchOnWindowFocus: () => {
      const isActive = get(isUserActiveAtom);
      const shouldRefetch = typeof baseOptions.refetchOnWindowFocus === 'function'
        ? baseOptions.refetchOnWindowFocus()
        : baseOptions.refetchOnWindowFocus ?? true;
      return isActive && shouldRefetch;
    },
    refetchOnMount: () => {
      const isActive = get(isUserActiveAtom);
      const shouldRefetch = typeof baseOptions.refetchOnMount === 'function'
        ? baseOptions.refetchOnMount()
        : baseOptions.refetchOnMount ?? true;
      return isActive && shouldRefetch;
    },
  };
};

/**
 * Common activity-based query options with 60 second refetch interval
 * Use this for most query atoms that need activity-based refetching
 */
export const getStandardActivityQueryOptions = (get: Getter, customOptions: any = {}) => {
  return createActivityBasedQueryOptions(get, {
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...customOptions,
  });
};