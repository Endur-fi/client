"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import { cn } from "@/lib/utils";

import { LINKS } from "@/constants";
import { ChartSplineIcon } from "./ui/chart-spline";
import { FlameIcon } from "./ui/flame";
import { GaugeIcon } from "./ui/gauge";
import { MenuIcon } from "./ui/menu";
import { HandCoinsIcon } from "./ui/hand-coins";
import { ChartColumnDecreasingIcon } from "./ui/chart-column-decreasing";

type NavLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  target?: string;
};

const NavLink = ({ href, icon, children, isActive = false, target }: NavLinkProps) => {
  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={cn(
        "flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md p-2 px-3 text-sm font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
        {
          "bg-[#17876D] text-white": isActive,
        },
      )}
    >
      {icon}
      {children}
    </Link>
  );
};

const MobileNav = () => {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const iconRef = React.useRef<HTMLDivElement | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const referrer = searchParams.get("referrer");

  // Calculate Liquid Staking href based on current pathname and referrer
  const getLiquidStakingHref = () => {
    const basePath = pathname === "/btc" ? "/btc" : "/strk";
    return referrer ? `${basePath}?referrer=${referrer}` : basePath;
  };

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
              className="absolute inset-x-0 top-16 z-50 flex max-h-[80vh] w-fit flex-col items-start justify-start gap-4 overflow-y-auto rounded-lg border border-[#17876D33] bg-[#DCECE8] px-2 py-3"
            >
              {/* Liquid Staking - Always on top */}
              <div className="w-full">
                <NavLink
                  href={getLiquidStakingHref()}
                  icon={<FlameIcon className="-ml-0.5 size-5" />}
                  isActive={pathname === "/strk" || pathname === "/btc"}
                >
                  Liquid Staking
                </NavLink>
              </div>

              <NavLink
                href="/defi"
                icon={<HandCoinsIcon
                  className="-ml-0.5 size-5"
                />}
                isActive={pathname === "/defi"}
              >
                DeFi Opportunities
              </NavLink>
              
              <NavLink
                href="/rewards"
                icon={<ChartSplineIcon className="size-5" />}
                isActive={pathname === "/rewards"}
              >
                Rewards
              </NavLink>

              <NavLink
                href={LINKS.DUNE_ANALYTICS}
                target="_blank"
                icon={<ChartColumnDecreasingIcon className="size-5" />}
                isActive={false}
              >
                xSTRK Analytics
              </NavLink>

              <NavLink
                href={LINKS.BTC_DUNE_ANALYTICS}
                target="_blank"
                icon={<ChartColumnDecreasingIcon className="size-5" />}
                isActive={false}
              >
                xyBTC Analytics
              </NavLink>

              <hr className="!my-1 w-full border-[#b9d8d0]" />

              <NavLink
                href={LINKS.DASHBOARD_URL}
                icon={<GaugeIcon className="-ml-0.5 size-5" />}
                target="_blank"
              >
                Native Staking
              </NavLink>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};

export default MobileNav;
