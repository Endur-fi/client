"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import { LINKS } from "@/constants";
import { cn, getInternalUrl } from "@/lib/utils";

import { ChartColumnDecreasingIcon } from "./ui/chart-column-decreasing";
import { ChartSplineIcon } from "./ui/chart-spline";
import { FlameIcon } from "./ui/flame";
import { GaugeIcon } from "./ui/gauge";
import { HandCoinsIcon } from "./ui/hand-coins";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar";
import { NativeStakingWarningDialog } from "./native-staking-warning-dialog";

const SidebarMenuItems = () => {
  const [triggerLSTIconAnimation, setTriggerLSTIconAnimation] =
    React.useState(false);
  const [triggerDefiIconAnimation, setTriggerDefiIconAnimation] =
    React.useState(false);
  const [triggerAnalyticsIconAnimation, setTriggerAnalyticsIconAnimation] =
    React.useState(false);
  const [triggerDashboardIconAnimation, setTriggerDashboardIconAnimation] =
    React.useState(false);
  const [_triggerPortfolioIconAnimation, _setTriggerPortfolioIconAnimation] =
    React.useState(false);
  const [triggerLeaderboardIconAnimation, setTriggerLeaderboardIconAnimation] =
    React.useState(false);
  const [showNativeStakingDialog, setShowNativeStakingDialog] =
    React.useState(false);

  const { open } = useSidebar();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const referrer = searchParams.get("referrer");

  return (
    <React.Fragment>
      {/* Liquidity Staking */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("opacity-70 transition-all hover:opacity-100", {
            "bg-[rgba(23,135,109,0.2)] font-bold text-[#17876d] opacity-100":
              pathname === "/strk" || pathname === "/btc",
          })}
          onMouseEnter={() =>
            pathname !== "/strk" &&
            pathname !== "/btc" &&
            setTriggerLSTIconAnimation(true)
          }
          onMouseLeave={() =>
            pathname !== "/strk" &&
            pathname !== "/btc" &&
            setTriggerLSTIconAnimation(false)
          }
        >
          <Link
            href={
              pathname === "/btc"
                ? getInternalUrl("/btc", referrer)
                : getInternalUrl("/strk", referrer)
            }
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-[12px] text-base font-semibold text-[#03624C] transition-all"
          >
            <FlameIcon
              className="-ml-0.5 size-5"
              triggerAnimation={triggerLSTIconAnimation}
            />
            <span>{open && "Liquid Staking"}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* DeFi with xSTRK */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("opacity-70 transition-all hover:opacity-100", {
            "rounded-[6px] bg-[rgba(23,135,109,0.2)] font-bold text-[#17876d] opacity-100":
              pathname === "/defi",
          })}
          onMouseEnter={() =>
            pathname !== "/defi" && setTriggerDefiIconAnimation(true)
          }
          onMouseLeave={() =>
            pathname !== "/defi" && setTriggerDefiIconAnimation(false)
          }
        >
          <Link
            href={getInternalUrl("/defi", referrer)}
            className={cn(
              "group/defi flex cursor-pointer flex-row items-center gap-2 text-nowrap text-base font-semibold text-[#03624C] transition-all",
              pathname === "/defi" ? "rounded-[6px]" : "rounded-[12px]",
            )}
          >
            <HandCoinsIcon
              className="-ml-0.5 size-5"
              triggerAnimation={triggerDefiIconAnimation}
            />
            {open && "DeFi Opportunities"}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Portfolio */}
      {/* TODO: Add link to portfolio page */}
      {/* <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("opacity-70 transition-all hover:opacity-100", {
            "bg-[rgba(23,135,109,0.2)] font-bold text-[#17876d] opacity-100":
              pathname === "/portfolio",
          })}
          onMouseEnter={() =>
            pathname !== "/portfolio" && _setTriggerPortfolioIconAnimation(true)
          }
          onMouseLeave={() =>
            pathname !== "/portfolio" && _setTriggerPortfolioIconAnimation(false)
          }
        >
          <Link
            href="/portfolio"
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-[12px] text-base font-semibold text-[#03624C] transition-all"
          >
            <UserIcon
              triggerAnimation={_triggerPortfolioIconAnimation}
              className="-ml-0.5 size-5"
            />
            {open && "Portfolio"}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem> */}

      {/* Leaderboard */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("opacity-70 transition-all hover:opacity-100", {
            "bg-[rgba(23,135,109,0.2)] font-bold text-[#17876d] opacity-100":
              pathname === "/rewards",
          })}
          onMouseEnter={() =>
            pathname !== "/rewards" && setTriggerLeaderboardIconAnimation(true)
          }
          onMouseLeave={() =>
            pathname !== "/rewards" && setTriggerLeaderboardIconAnimation(false)
          }
        >
          <Link
            href={getInternalUrl("/rewards", referrer)}
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-[12px] text-base font-semibold text-[#03624C] transition-all"
          >
            <ChartSplineIcon
              triggerAnimation={triggerLeaderboardIconAnimation}
              className="size-5"
            />
            {open && "Rewards"}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* xSTRK Analytics */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="opacity-70 transition-all hover:opacity-100"
          onMouseEnter={() => setTriggerAnalyticsIconAnimation(true)}
          onMouseLeave={() => setTriggerAnalyticsIconAnimation(false)}
        >
          <Link
            href={LINKS.DUNE_ANALYTICS}
            target="_blank"
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-[12px] text-base font-semibold text-[#03624C] transition-all"
          >
            <ChartColumnDecreasingIcon
              triggerAnimation={triggerAnalyticsIconAnimation}
              className="size-5"
            />
            {open && <p>xSTRK Analytics</p>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* xyBTC Analytics */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="opacity-70 transition-all hover:opacity-100"
          onMouseEnter={() => setTriggerAnalyticsIconAnimation(true)}
          onMouseLeave={() => setTriggerAnalyticsIconAnimation(false)}
        >
          <Link
            href={LINKS.BTC_DUNE_ANALYTICS}
            target="_blank"
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-[12px] text-base font-semibold text-[#03624C] transition-all"
          >
            <ChartColumnDecreasingIcon
              triggerAnimation={triggerAnalyticsIconAnimation}
              className="size-5"
            />
            {open && <p>xyBTC Analytics</p>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <hr className="!my-2 border-[#E5E7EB]" />

      {/* Staking Dashboard */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="opacity-70 transition-all hover:opacity-100"
          onMouseEnter={() => setTriggerDashboardIconAnimation(true)}
          onMouseLeave={() => setTriggerDashboardIconAnimation(false)}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowNativeStakingDialog(true);
            }}
            className="flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-[12px] text-left text-base font-semibold text-[#03624C] transition-all"
          >
            <GaugeIcon
              triggerAnimation={triggerDashboardIconAnimation}
              className="-ml-0.5 size-5"
            />
            {open && "Native Staking"}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <NativeStakingWarningDialog
        open={showNativeStakingDialog}
        onOpenChange={setShowNativeStakingDialog}
      />
    </React.Fragment>
  );
};

export default SidebarMenuItems;
