"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import { LINKS } from "@/constants";
import { cn } from "@/lib/utils";

import { ChartColumnDecreasingIcon } from "./ui/chart-column-decreasing";
import { FlameIcon } from "./ui/flame";
import { GaugeIcon } from "./ui/gauge";
import { HandCoinsIcon } from "./ui/hand-coins";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar";
import { UserIcon } from "./ui/user";

const SidebarMenuItems = () => {
  const [triggerLSTIconAnimation, setTriggerLSTIconAnimation] =
    React.useState(false);
  const [triggerDefiIconAnimation, setTriggerDefiIconAnimation] =
    React.useState(false);
  const [triggerAnalyticsIconAnimation, setTriggerAnalyticsIconAnimation] =
    React.useState(false);
  const [triggerDashboardIconAnimation, setTriggerDashboardIconAnimation] =
    React.useState(false);
  const [triggerPortfolioIconAnimation, setTriggerPortfolioIconAnimation] =
    React.useState(false);

  const { open } = useSidebar();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const referrer = searchParams.get("referrer");

  return (
    <React.Fragment>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("transition-all hover:bg-[#17876D] hover:text-white", {
            "bg-[#17876D] text-white": pathname === "/",
          })}
          onMouseEnter={() =>
            pathname !== "/" && setTriggerLSTIconAnimation(true)
          }
          onMouseLeave={() =>
            pathname !== "/" && setTriggerLSTIconAnimation(false)
          }
        >
          <Link
            href={referrer ? `/?referrer=${referrer}` : "/"}
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <FlameIcon
              className="-ml-0.5 size-5"
              triggerAnimation={triggerLSTIconAnimation}
            />

            <span>{open && "Liquid Staking"}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("transition-all hover:bg-[#17876D] hover:text-white", {
            "bg-[#17876D] text-white": pathname === "/defi",
          })}
          onMouseEnter={() =>
            pathname !== "/defi" && setTriggerDefiIconAnimation(true)
          }
          onMouseLeave={() =>
            pathname !== "/defi" && setTriggerDefiIconAnimation(false)
          }
        >
          <Link
            href={referrer ? `/defi?referrer=${referrer}` : "/defi"}
            className={cn(
              "group/defi flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all",
            )}
          >
            <HandCoinsIcon
              className="-ml-0.5 size-5"
              triggerAnimation={triggerDefiIconAnimation}
            />
            {open && "DeFi with xSTRK"}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="transition-all hover:bg-[#17876D] hover:text-white"
          onMouseEnter={() => setTriggerAnalyticsIconAnimation(true)}
          onMouseLeave={() => setTriggerAnalyticsIconAnimation(false)}
        >
          <Link
            href={LINKS.DUNE_ANALYTICS}
            target="_blank"
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <ChartColumnDecreasingIcon
              triggerAnimation={triggerAnalyticsIconAnimation}
              className="size-5"
            />
            {open && <p>xSTRK Analytics</p>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="transition-all hover:bg-[#17876D] hover:text-white"
          onMouseEnter={() => setTriggerDashboardIconAnimation(true)}
          onMouseLeave={() => setTriggerDashboardIconAnimation(false)}
        >
          <Link
            href={LINKS.DASHBOARD_URL}
            target="_blank"
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <GaugeIcon
              triggerAnimation={triggerDashboardIconAnimation}
              className="size-5"
            />
            {open && "Staking Dashboard"}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("transition-all hover:bg-[#17876D] hover:text-white", {
            "bg-[#17876D] text-white": pathname === "/portfolio",
          })}
          onMouseEnter={() =>
            pathname !== "/portfolio" && setTriggerPortfolioIconAnimation(true)
          }
          onMouseLeave={() =>
            pathname !== "/portfolio" && setTriggerPortfolioIconAnimation(false)
          }
        >
          <Link
            href="/portfolio"
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <UserIcon
              triggerAnimation={triggerPortfolioIconAnimation}
              className="-ml-0.5 size-5"
            />
            {open && "Portfolio"}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </React.Fragment>
  );
};

export default SidebarMenuItems;
