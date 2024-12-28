"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import { DASHBOARD_URL } from "@/constants";
import { cn } from "@/lib/utils";

import { ChartColumnDecreasingIcon } from "./ui/chart-column-decreasing";
import { FlameIcon } from "./ui/flame";
import { GaugeIcon } from "./ui/gauge";
import { HandCoinsIcon } from "./ui/hand-coins";
import { MenuIcon } from "./ui/menu";

const MobileNav = () => {
  const [open, setOpen] = React.useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const referrer = searchParams.get("referrer");

  return (
    <>
      <motion.div
        animate={{
          borderRadius: open ? "4px" : "2rem",
        }}
        key={String(open)}
        className="relative mt-4 py-2 lg:hidden"
      >
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <div onClick={() => setOpen(!open)}>
            <MenuIcon
              triggerAnimation={open}
              className="size-6 text-[#17876D]"
            />
          </div>

          <Image src="/full_logo.svg" width={80} height={60} alt="full_logo" />
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-16 z-50 flex w-fit flex-col items-start justify-start gap-4 rounded-lg border border-[#17876D33] bg-[#DCECE8] px-2 py-3"
            >
              <Link
                href={referrer ? `/?referrer=${referrer}` : "/"}
                className={cn(
                  "flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md p-2 px-3 text-sm font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                  {
                    "bg-[#17876D] text-white": pathname === "/",
                  },
                )}
              >
                <FlameIcon className="-ml-0.5 size-5" />
                Liquid Staking
              </Link>

              <Link
                href={referrer ? `/defi?referrer=${referrer}` : "/defi"}
                className={cn(
                  "flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md p-2 px-3 text-sm font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                  {
                    "bg-[#17876D] text-white": pathname === "/defi",
                  },
                )}
              >
                <HandCoinsIcon className="-ml-0.5 size-5" />
                DeFi with xSTRK
              </Link>

              <Link
                href={"https://dune.com/endurfi/xstrk-analytics"}
                className={cn(
                  "flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md p-2 px-3 text-sm font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                )}
              >
                <ChartColumnDecreasingIcon className="size-5" />
                xSTRK Analytics
              </Link>

              <Link
                href={DASHBOARD_URL}
                className={cn(
                  "flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md p-2 px-3 text-sm font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                )}
              >
                <GaugeIcon className="-ml-0.5 size-5" />
                Staking Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default MobileNav;
