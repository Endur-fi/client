"use client";

import { NextPage } from "next";
import React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import Defi from "@/components/defi";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

const NavigationWrapper = () => {
  return (
    <>
      <Navbar className="px-7" />
      <Defi />
    </>
  );
};

const DefiPage: NextPage = () => {
  return (
    <div className="flex w-full overflow-x-hidden">
      <React.Suspense fallback={<div className="w-72">Loading sidebar...</div>}>
        <AppSidebar />
      </React.Suspense>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex w-full flex-col items-center overflow-hidden pb-3">
          <React.Suspense fallback={<div>Loading DeFi content...</div>}>
            <NavigationWrapper />
          </React.Suspense>
        </div>

        <div className="lg:hidden">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default DefiPage;
