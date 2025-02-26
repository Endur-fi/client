"use client";

import Image from "next/image";
import React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import Tabs from "@/components/Tabs";

export default function Home() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="relative flex h-full min-h-screen w-full overflow-x-hidden">
      <Image
        src="/subtle_tree_bg.svg"
        alt="subtle_tree_bg"
        fill
        className="-z-10 object-cover"
      />

      <React.Suspense fallback={<div className="w-72">Loading sidebar...</div>}>
        <AppSidebar />
      </React.Suspense>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex h-full w-full flex-col items-center overflow-hidden px-7 py-3 lg:py-0">
          <Navbar />
          <Tabs />
        </div>

        <div className="lg:hidden">
          <Footer />
        </div>
      </div>
    </div>
  );
}
