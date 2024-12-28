"use client";

import { useAtomValue } from "jotai";
import React from "react";
import Snowfall from "react-snowfall";

import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/footer";
import Merry from "@/components/merry";
import Navbar from "@/components/navbar";
import Tabs from "@/components/Tabs";
import { isMerryChristmasAtom, tabsAtom } from "@/store/merry.store";

export default function Home() {
  const [isMounted, setIsMounted] = React.useState(false);

  const activeTab = useAtomValue(tabsAtom);
  const isMerry = useAtomValue(isMerryChristmasAtom);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const snowflake1 = document.createElement("img");
  snowflake1.src = "/snow1.svg";
  const snowflake2 = document.createElement("img");
  snowflake2.src = "/snow2.svg";

  const images = [snowflake1, snowflake2];

  return (
    <div className="relative flex h-full min-h-screen w-full overflow-x-hidden">
      {activeTab !== "withdraw" && isMerry && (
        <div className="hidden lg:block">
          <Merry />
          <div className="z-30">
            <Snowfall
              images={images}
              snowflakeCount={200}
              radius={[5, 10]}
              wind={[-0.5, 1.0]}
            />
          </div>
        </div>
      )}

      <React.Suspense fallback={<div className="w-72">Loading sidebar...</div>}>
        <AppSidebar />
      </React.Suspense>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex h-full w-full flex-col items-center overflow-hidden px-7 py-3 lg:py-0">
          <Navbar />
          <Tabs avgWaitTime={""} />
        </div>

        <div className="lg:hidden">
          <Footer />
        </div>
      </div>
    </div>
  );
}
