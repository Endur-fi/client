"use client";

import { useRouter } from "next/navigation";
import React from "react";

function Allocation() {
  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/rewards");
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return <div>Redirecting to leaderboard...</div>;
}

export default Allocation;
