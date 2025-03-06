"use client";
import React from "react";
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import Tabs from "@/components/Tabs";
const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
    <main className="h-full w-full">
      <Tabs />
    </main>
    </QueryClientProvider>

  );
}
