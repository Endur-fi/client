"use client";

import { useEffect, type ReactNode } from "react";

import { MyAnalytics } from "@/lib/analytics";

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    MyAnalytics.init();
  }, []);

  return children;
}

