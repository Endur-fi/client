"use client";

import React from "react";

import { usePageViewTracking } from "@/hooks/use-page-view-tracking";

interface PageViewWrapperProps {
  children: React.ReactNode;
}

export function PageViewWrapper({ children }: PageViewWrapperProps) {
  usePageViewTracking();
  return children;
}

