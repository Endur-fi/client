"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import { cn } from "@/lib/utils";

import { LINKS } from "@/constants";
import { ChartColumnDecreasingIcon } from "./ui/chart-column-decreasing";
import { FlameIcon } from "./ui/flame";
import { GaugeIcon } from "./ui/gauge";
import { HandCoinsIcon } from "./ui/hand-coins";
import { MenuIcon } from "./ui/menu";
import { UserIcon } from "./ui/user";

const MobileNav = () => {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const iconRef = React.useRef<HTMLDivElement | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const referrer = searchParams.get("referrer");

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <motion.div className="relative lg:hidden">
        <div className="flex items-center justify-center gap-3">
          <div onClick={() => setOpen(!open)} ref={iconRef}>
            <MenuIcon
              triggerAnimation={open}
              className="size-6 text-[#17876D]"
            />
          </div>

          <Image src="/full_logo.svg" width={80} height={60} alt="full_logo" />
        </div>

        {open && (
          <AnimatePresence>
            <motion.div
              ref={menuRef}
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
                href={LINKS.DUNE_ANALYTICS}
                className={cn(
                  "flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md p-2 px-3 text-sm font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                )}
              >
                <ChartColumnDecreasingIcon className="size-5" />
                xSTRK Analytics
              </Link>

              <Link
                href={LINKS.DASHBOARD_URL}
                className={cn(
                  "flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md p-2 px-3 text-sm font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                )}
              >
                <GaugeIcon className="-ml-0.5 size-5" />
                Staking Dashboard
              </Link>

              <Link
                href="/portfolio"
                className={cn(
                  "flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md p-2 px-3 text-sm font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                  {
                    "bg-[#17876D] text-white": pathname === "/portfolio",
                  },
                )}
              >
                <UserIcon className="-ml-0.5 size-5" />
                Portfolio
              </Link>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};

export default MobileNav;
