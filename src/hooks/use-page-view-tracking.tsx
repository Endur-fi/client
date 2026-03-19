"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAtomValue } from "jotai";

import { MyAnalytics } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { userAddressAtom } from "@/store/common.store";

export function usePageViewTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userAddress = useAtomValue(userAddressAtom);

  useEffect(() => {
    if (!pathname) return;

    const search = searchParams.toString();

    MyAnalytics.track(AnalyticsEvents.PAGE_VIEW, {
      pathname,
      search: search || undefined,
      userAddress: userAddress || "anonymous",
      isWalletConnected: !!userAddress,
    });
  }, [pathname, searchParams, userAddress]);
}

