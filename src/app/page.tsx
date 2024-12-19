"use client";

import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import Tabs from "@/components/Tabs";
import { getAvgWaitTime } from "../../actions";

export default function Home() {
  // const avgWaitTime = await getAvgWaitTime();

  return (
    <div className="flex w-full overflow-x-hidden">
      <AppSidebar />

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex h-full w-full flex-col items-center overflow-hidden px-7 py-3 lg:py-0">
          <Navbar />
          <Tabs avgWaitTime={''} />
        </div>

        <div className="lg:hidden">
          <Footer />
        </div>
      </div>
    </div>
  );
}
