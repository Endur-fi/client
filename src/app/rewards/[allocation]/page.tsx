"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { getInternalUrl } from "@/lib/utils";

function Allocation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referrer = searchParams.get("referrer");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(getInternalUrl("/rewards", referrer));
    }, 4000);

    return () => clearTimeout(timer);
  }, [router, referrer]);

  return <div>Redirecting to leaderboard...</div>;
}

export default Allocation;
