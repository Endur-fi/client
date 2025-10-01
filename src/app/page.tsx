"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture search parameters
    const params = searchParams.toString();
    const redirectUrl = params ? `/btc?${params}` : "/btc";
    
    console.log(`redirecting to ${redirectUrl}`);
    router.push(redirectUrl);
  }, [router, searchParams]);

  return null; // This component doesn't render anything
}
