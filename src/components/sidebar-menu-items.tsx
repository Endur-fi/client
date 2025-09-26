"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { LINKS } from "@/constants";
import { cn } from "@/lib/utils";

import { ChartColumnDecreasingIcon } from "./ui/chart-column-decreasing";
import { ChartSplineIcon } from "./ui/chart-spline";
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
  const [triggerLeaderboardIconAnimation, setTriggerLeaderboardIconAnimation] =
    React.useState(false);

  // Accordion state
  const [strkExpanded, setStrkExpanded] = React.useState(false);
  const [btcExpanded, setBtcExpanded] = React.useState(false);

  const { open } = useSidebar();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const referrer = searchParams.get("referrer");

  return (
    <React.Fragment>
      <div className="mb-4">
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className={cn(
              "transition-all hover:bg-[#17876D] hover:text-white",
              {
                "bg-[#17876D] text-white":
                  pathname === "/strk" || pathname === "/btc",
              },
            )}
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
                  ? referrer
                    ? `/btc?referrer=${referrer}`
                    : "/btc"
                  : referrer
                    ? `/strk?referrer=${referrer}`
                    : "/strk"
              }
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
      </div>

      <div className="mb-4">
        <div className="mb-2 px-2">
          {open && (
            <button
              onClick={() => setStrkExpanded(!strkExpanded)}
              className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wide text-[#03624C] transition-colors hover:text-[#17876D]"
            >
              <span>STRK</span>
              {strkExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>
          )}
        </div>

        {(!open || strkExpanded) && (
          <>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={cn(
                  "transition-all hover:bg-[#17876D] hover:text-white",
                  {
                    "bg-[#17876D] text-white": pathname === "/defi",
                  },
                )}
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
                className={cn(
                  "transition-all hover:bg-[#17876D] hover:text-white",
                  {
                    "bg-[#17876D] text-white": pathname === "/portfolio",
                  },
                )}
                onMouseEnter={() =>
                  pathname !== "/portfolio" &&
                  setTriggerPortfolioIconAnimation(true)
                }
                onMouseLeave={() =>
                  pathname !== "/portfolio" &&
                  setTriggerPortfolioIconAnimation(false)
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
                  {open && "xSTRK Portfolio"}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        )}
      </div>

      <div className="mb-4">
        <div className="mb-2 px-2">
          {open && (
            <button
              onClick={() => setBtcExpanded(!btcExpanded)}
              className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wide text-[#03624C] transition-colors hover:text-[#17876D]"
            >
              <span>BTC</span>
              {btcExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>
          )}
        </div>

        {(!open || btcExpanded) && (
          <>
            <SidebarMenuItem className="mb-2">
              <SidebarMenuButton
                asChild
                className="transition-all hover:bg-[#17876D] hover:text-white"
                onMouseEnter={() => setTriggerDefiIconAnimation(true)}
                onMouseLeave={() => setTriggerDefiIconAnimation(false)}
              >
                <div className="flex cursor-not-allowed flex-row items-center gap-2 text-nowrap rounded-md px-3 py-2 text-base font-semibold text-[#03624C] opacity-50 transition-all">
                  <HandCoinsIcon
                    className="-ml-0.5 size-5"
                    triggerAnimation={triggerDefiIconAnimation}
                  />
                  {open && (
                    <div>
                      <p>DeFi with xyBTCs</p>
                      <p className="text-xs text-[#8D9C9C]">Coming soon</p>
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="mb-2">
              <SidebarMenuButton
                asChild
                className="transition-all hover:bg-[#17876D] hover:text-white"
                onMouseEnter={() => setTriggerAnalyticsIconAnimation(true)}
                onMouseLeave={() => setTriggerAnalyticsIconAnimation(false)}
              >
                <div className="flex cursor-not-allowed flex-row items-center gap-2 text-nowrap rounded-md px-3 py-2 text-base font-semibold text-[#03624C] opacity-50 transition-all">
                  <ChartColumnDecreasingIcon
                    triggerAnimation={triggerAnalyticsIconAnimation}
                    className="size-5"
                  />
                  {open && (
                    <div>
                      <p>xyBTC Analytics</p>
                      <p className="text-xs text-[#8D9C9C]">Coming soon</p>
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="transition-all hover:bg-[#17876D] hover:text-white"
                onMouseEnter={() => setTriggerPortfolioIconAnimation(true)}
                onMouseLeave={() => setTriggerPortfolioIconAnimation(false)}
              >
                <div className="flex cursor-not-allowed flex-row items-center gap-2 text-nowrap rounded-md px-3 py-2 text-base font-semibold text-[#03624C] opacity-50 transition-all">
                  <UserIcon
                    triggerAnimation={triggerPortfolioIconAnimation}
                    className="-ml-0.5 size-5"
                  />
                  {open && (
                    <div>
                      <p>xyBTCs Portfolio</p>
                      <p className="text-xs text-[#8D9C9C]">Coming soon</p>
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        )}
      </div>

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
              className="-ml-0.5 size-5"
            />
            {open && "Staking Dashboard"}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={cn("transition-all hover:bg-[#17876D] hover:text-white", {
            "bg-[#17876D] text-white": pathname === "/leaderboard",
          })}
          onMouseEnter={() =>
            pathname !== "/leaderboard" &&
            setTriggerLeaderboardIconAnimation(true)
          }
          onMouseLeave={() =>
            pathname !== "/leaderboard" &&
            setTriggerLeaderboardIconAnimation(false)
          }
        >
          <Link
            href="/leaderboard"
            className="flex cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <ChartSplineIcon
              triggerAnimation={triggerLeaderboardIconAnimation}
              className="size-5"
            />
            {open && "Leaderboard"}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </React.Fragment>
  );
};

export default SidebarMenuItems;
