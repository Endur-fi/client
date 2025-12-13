"use client";

import { useAtom, useAtomValue } from "jotai";
import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import { useAccount } from "@starknet-react/core";

import { Icons } from "@/components/Icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IS_PAUSED, getLSTAssetsByCategory, getSTRKAsset } from "@/constants";
import { cn, formatNumberWithCommas } from "@/lib/utils";
import {
  isMerryChristmasAtom,
  tabsAtom,
  activeSubTabAtom,
} from "@/store/merry.store";
import { toast } from "@/hooks/use-toast";
import { validateEmail } from "@/lib/utils";
import { checkSubscription, subscribeUser } from "@/lib/api";

import Stake from "./stake";
import PortfolioSection from "./portfolio-section";
import { useSidebar } from "./ui/sidebar";
import FAQSection from "./faq-section";
import SeasonPointsCard from "./season-points-card";
import StakingRewardsInfo from "./staking-rewards-info";
import {
  Tabs as ShadCNTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import Unstake from "./unstake";
import WithdrawLog from "./withdraw-log";
import { snAPYAtom, strkTVLAtom, btcTVLAtom } from "@/store/staking.store";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { lstConfigAtom } from "@/store/common.store";
import { MyDottedTooltip } from "./my-tooltip";
import { useSearchParams } from "next/navigation";

const Tabs = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [lstConfig, setLSTConfig] = useAtom(lstConfigAtom);
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useAtom(tabsAtom);
  const [activeSubTab, setActiveSubTab] = useAtom(activeSubTabAtom);
  const [waitlistEmail, setWaitlistEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const apy = useAtomValue(snAPYAtom);
  const strkTVL = useAtomValue(strkTVLAtom);
  const btcTVL = useAtomValue(btcTVLAtom);

  console.log("Apy", apy.value);

  // Format TVL for display
  const formatTVL = (value: number): string => {
    if (value === 0) return "$0";
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const isMerry = useAtomValue(isMerryChristmasAtom);
  const { address } = useAccount();

  const { isPinned } = useSidebar();
  const { connectWallet } = useWalletConnection();

  const referrer = searchParams.get("referrer");
  const tabParam = searchParams.get("tab");

  React.useEffect(() => {
    console.log("Pathname Effect - pathname:", pathname);

    if (pathname === "/btc") {
      setActiveTab("btc");
    } else if (pathname === "/strk") {
      setActiveTab("strk");
    } else if (pathname === "/lbtc") {
      setActiveTab("btc");
    } else if (pathname === "/wbtc") {
      setActiveTab("btc");
    } else if (pathname === "/tbtc") {
      setActiveTab("btc");
    } else if (pathname === "/solvbtc") {
      setActiveTab("btc");
    } else {
      setActiveTab("btc");
    }
  }, [pathname, setActiveTab]);

  // Set activeSubTab from URL parameter
  React.useEffect(() => {
    if (tabParam && ["stake", "unstake", "withdraw"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }, [tabParam, setActiveSubTab]);

  React.useEffect(() => {
    if (activeTab === "strk") {
      setLSTConfig(getSTRKAsset());
    } else {
      const btcAssets = getLSTAssetsByCategory("BTC");
      console.log(
        "Available BTC assets:",
        btcAssets.map((asset) => asset.SYMBOL),
      );

      // Check for specific BTC token routes
      if (pathname === "/lbtc") {
        const lbtcAsset = btcAssets.find((asset) => asset.SYMBOL === "LBTC");
        console.log("Looking for LBTC asset:", lbtcAsset);
        if (lbtcAsset) {
          console.log("Setting LST config to LBTC:", lbtcAsset);
          setLSTConfig(lbtcAsset);
          return;
        }
      } else if (pathname === "/wbtc") {
        const wbtcAsset = btcAssets.find((asset) => asset.SYMBOL === "WBTC");
        console.log("Looking for WBTC asset:", wbtcAsset);
        if (wbtcAsset) {
          setLSTConfig(wbtcAsset);
          return;
        }
      } else if (pathname === "/tbtc") {
        const tbtcAsset = btcAssets.find((asset) => asset.SYMBOL === "tBTC");
        console.log("Looking for tBTC asset:", tbtcAsset);
        if (tbtcAsset) {
          setLSTConfig(tbtcAsset);
          return;
        }
      } else if (pathname === "/solvbtc") {
        const solvbtcAsset = btcAssets.find(
          (asset) => asset.SYMBOL === "solvBTC",
        );
        console.log("Looking for solvBTC asset:", solvbtcAsset);
        if (solvbtcAsset) {
          setLSTConfig(solvbtcAsset);
          return;
        }
      }

      const firstBTCAsset = btcAssets[0];
      console.log("Using default BTC asset:", firstBTCAsset);
      if (firstBTCAsset) {
        setLSTConfig(firstBTCAsset);
      }
    }
  }, [activeTab, pathname, setLSTConfig]);

  function getMessage() {
    if (activeSubTab === "unstake") {
      return (
        <p>
          Unstake requests go into a Withdrawal Queue and are processed when
          STRK/BTC is available. While instant unstaking isn{"'"}t possible due
          to staking design, the average wait time is about 2 days now but can
          take longer.{" "}
          <Link
            href="https://docs.starknet.io/staking/overview/#economic_parameters"
            target="_blank"
            className="underline"
          >
            Learn more.
          </Link>
        </p>
      );
    } else if (activeSubTab === "stake") {
      return (
        <p>
          Staking rewards are automatically claimed and compounded, gradually
          increasing the value of your xSTRK/xyBTCs over time.
        </p>
      );
    }
  }

  const handleTabChange = async (tab: string) => {
    if (tab === activeTab) return;

    setActiveTab(tab);

    if (tab === "btc") {
      router.push(referrer ? `/btc?referrer=${referrer}` : "/btc", {
        scroll: false,
      });
    } else if (tab === "strk") {
      router.push(referrer ? `/strk?referrer=${referrer}` : "/strk", {
        scroll: false,
      });
    }
  };

  const handleSubTabChange = (subTab: string) => {
    if (subTab === activeSubTab) return;

    setActiveSubTab(subTab);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast({ description: "Please connect your wallet first." });
      return;
    }

    if (!waitlistEmail.trim()) {
      toast({ description: "Please enter your email address." });
      return;
    }

    if (!validateEmail(waitlistEmail)) {
      toast({ description: "Please enter a valid email address." });
      return;
    }

    setIsSubmitting(true);

    try {
      const subscriptionStatus = await checkSubscription(address);

      if (!subscriptionStatus.isSubscribed) {
        const listIds = [parseInt(process.env.TEST_BREVO_LIST_ID || "7", 10)];
        const subscriptionResult = await subscribeUser(
          waitlistEmail,
          address,
          listIds,
        );

        if (!subscriptionResult.success) {
          toast({
            description: "Failed to subscribe. Please try again.",
            variant: "destructive",
          });
          setWaitlistEmail("");
        }
        toast({
          description: "Successfully joined waitlist.",
          variant: "complete",
        });
      } else {
        toast({
          description: "Already subscribed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      toast({
        description: "Error joining waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainTabs = [
    {
      value: "strk",
      icon: (
        <Icons.strkLogo className="h-8 w-8 grayscale-[0.8] group-data-[state=active]:grayscale-0" />
      ),
      label: "STRK",
      apy: (() => {
        const apyValue = apy.value.strkApy * 100;
        const formattedValue =
          apyValue < 0.01 && apyValue > 0
            ? apyValue.toFixed(6)
            : apyValue.toFixed(2);
        return `${formattedValue}%`;
      })(),
      tvl: formatTVL(strkTVL.value),
    },
    {
      value: "btc",
      icon: (
        <Icons.btcLogo className="h-8 w-8 grayscale-[0.8] group-data-[state=active]:grayscale-0" />
      ),
      label: "BTC",
      apy: (() => {
        const apyValue = apy.value.btcApy * 100;
        const formattedValue =
          apyValue < 0.01 && apyValue > 0
            ? apyValue.toFixed(6)
            : apyValue.toFixed(2);
        return `${formattedValue}%`;
      })(),
      tvl: formatTVL(btcTVL.value),
    },
  ];

  const subTabs = [
    {
      value: "stake",
      label: "Stake",
    },
    {
      value: "unstake",
      label: "Unstake",
    },
    {
      value: "withdraw",
      label: "Withdraw log",
      tooltip: (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger className="ml-1" tabIndex={-1} asChild>
              <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-[13rem] rounded-md border border-[#03624C] bg-white text-[#03624C]"
            >
              Learn more about withdraw logs{" "}
              <Link
                target="_blank"
                href="https://docs.endur.fi/docs/concepts/withdraw-log"
                className="text-blue-600 underline"
              >
                here
              </Link>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
  ];

  return (
    <div className="relative">
      <div className={cn("z-30 flex h-full flex-col items-center gap-4")}>
        {IS_PAUSED && (
          <div className="-top-[3.25rem] mt-2 w-fit text-balance rounded-lg border border-amber-600 bg-amber-200 px-5 py-2 text-center text-sm text-yellow-700 lg:absolute lg:mt-0">
            Endur is currently undergoing a scheduled upgrade to support Staking
            V3.{" "}
            <Link
              href="https://x.com/endurfi/status/1966140807968338110"
              target="_blank"
              className="text-blue-500 transition-all hover:underline"
            >
              Learn more
            </Link>
          </div>
        )}

        <div
          className={cn(
            "flex w-full max-w-[calc(100vw-1rem)] flex-col gap-4 px-2 lg:max-w-4xl lg:items-start lg:px-0",
            {
              "mb-7 xl:mb-0": !isMerry,
            },
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Icons.strkLogo className="size-8" />
              <h1 className="text-left text-xl font-bold text-black">
                Starknet Staking
              </h1>
            </div>
            <Link
              href="https://docs.endur.fi/docs/security"
              target="_blank"
              className="flex w-fit items-center gap-1 rounded-full border border-[#17876D33] bg-[#17876D1A] px-3 py-1 transition-opacity hover:opacity-80 md:mt-0"
            >
              <Icons.shield className="size-3.5 text-[#17876D]" />
              <span className="text-xs text-[#17876D]">Secure and audited</span>
            </Link>
          </div>

          <p className="mt-2 text-sm text-[#8D9C9C]">
            Convert your STRK and BTC tokens into{" "}
            <MyDottedTooltip tooltip="Liquid staking token (LST) of STRK issued by Endur">
              xSTRK
            </MyDottedTooltip>{" "}
            and{" "}
            <MyDottedTooltip tooltip="xyBTC refers to Endur's family of Bitcoin Liquid Staking Tokens (LSTs), where 'x' is Endur's prefix and 'y' represents different Bitcoin variants. Examples include xWBTC, xtBTC, xLBTC, and xsBTC.">
              xyBTCs
            </MyDottedTooltip>{" "}
            to earn staking rewards and participate in DeFi opportunities across
            the Starknet ecosystem.
          </p>
        </div>

        {/* Main Tabs - STRK and BTC */}
        <div className="flex gap-6">
          <div className="flex flex-col gap-3">
            <ShadCNTabs
              onValueChange={(value) => handleTabChange(value)}
              value={activeTab}
              defaultValue="btc"
              className="flex w-full flex-col gap-4"
            >
              <TabsList
                className={cn(
                  "bg-white",
                  "p-2",
                  "flex h-full items-center",
                  "rounded-[14px] border border-[#E5E8EB]",
                  "shadow-[0_1px_2px_-1px_#0000001A,_0_1px_3px_0_#0000001A]",
                )}
              >
                {mainTabs.map((tab) => (
                  <TabsTrigger
                    value={tab.value}
                    key={tab.value}
                    className="group flex w-full flex-col items-start rounded-[10px] bg-transparent px-2 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border data-[state=active]:border-[#81C3B4] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#0D5F4E] data-[state=active]:shadow-none"
                  >
                    <div className="flex items-center gap-1">
                      {tab.icon}
                      <div className="flex flex-col items-start">
                        <p className="text-md group-data-[state=active]:text-black group-data-[state=active]:opacity-100">
                          {tab.label}
                        </p>
                        <div className="flex gap-1 lg:flex-row lg:gap-6">
                          <p className="text-[8px] md:text-xs">
                            APY: {tab.apy}
                          </p>

                          <p className="text-[8px] md:text-xs">
                            TVL: {tab.tvl}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* STRK Tab Content */}
              <TabsContent value="strk" className={cn()}>
                <div
                  className={cn(
                    "w-full max-w-full rounded-xl shadow-xl lg:h-fit lg:max-w-none",
                    "h-full rounded-[14px] bg-white focus-visible:ring-0 focus-visible:ring-offset-0",
                    "rounded-[14px] border border-[#E5E8EB]",
                    "shadow-[0_1px_2px_-1px_#0000001A,_0_1px_3px_0_#0000001A]",
                  )}
                >
                  <ShadCNTabs
                    onValueChange={(value) => handleSubTabChange(value)}
                    value={activeSubTab}
                    defaultValue="stake"
                    className="h-full w-full max-w-full p-2 lg:max-w-none lg:p-5"
                  >
                    <TabsList
                      className={cn(
                        "flex w-full items-center justify-start rounded-none border-b bg-transparent p-0",
                      )}
                    >
                      {subTabs.map((tab) => (
                        <TabsTrigger
                          value={tab.value}
                          key={tab.value}
                          className="group relative h-full rounded-none text-sm text-[#7D8A92] data-[state=active]:border-b-2 data-[state=active]:border-[#0D5F4E] data-[state=active]:text-[#0D5F4E] data-[state=active]:shadow-none"
                        >
                          {tab.label}
                          {tab.tooltip && tab.tooltip}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent
                      value="stake"
                      className="h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <div className="flex w-full max-w-full flex-col gap-4 lg:max-w-none lg:flex-row lg:items-start">
                        <div className="w-full max-w-full lg:max-w-none lg:flex-1">
                          <Stake />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="unstake"
                      className="h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <Unstake />
                    </TabsContent>

                    <TabsContent
                      value="withdraw"
                      className="h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <WithdrawLog />
                    </TabsContent>
                  </ShadCNTabs>
                </div>
              </TabsContent>

              <TabsContent value="btc" className={cn()}>
                <div
                  className={cn(
                    "w-full max-w-full rounded-xl shadow-xl lg:h-fit lg:max-w-none",
                    "h-full rounded-[14px] bg-white focus-visible:ring-0 focus-visible:ring-offset-0",
                    "rounded-[14px] border border-[#E5E8EB]",
                    "shadow-[0_1px_2px_-1px_#0000001A,_0_1px_3px_0_#0000001A]",
                  )}
                >
                  <ShadCNTabs
                    onValueChange={(value) => handleSubTabChange(value)}
                    value={activeSubTab}
                    defaultValue="stake"
                    className="h-full w-full max-w-full p-2 lg:max-w-none lg:p-5"
                  >
                    <TabsList
                      className={cn(
                        "flex w-full items-center justify-start rounded-none border-b bg-transparent",
                      )}
                    >
                      <TabsTrigger
                        value="stake"
                        className="group relative rounded-none border-none text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
                      >
                        Stake
                      </TabsTrigger>
                      <TabsTrigger
                        value="unstake"
                        className="group relative rounded-none border-none text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
                      >
                        Unstake
                      </TabsTrigger>
                      <TabsTrigger
                        value="withdraw"
                        className="group relative rounded-none border-none text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
                      >
                        Withdraw log
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger
                              className="ml-1"
                              tabIndex={-1}
                              asChild
                            >
                              <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-[13rem] rounded-md border border-[#03624C] bg-white text-[#03624C]"
                            >
                              Learn more about withdraw logs{" "}
                              <Link
                                target="_blank"
                                href="https://docs.endur.fi/docs/concepts/withdraw-log"
                                className="text-blue-600 underline"
                              >
                                here
                              </Link>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="stake"
                      className="h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <div className="flex w-full max-w-full flex-col gap-4 lg:max-w-none lg:flex-row lg:items-start">
                        <div className="w-full max-w-full lg:max-w-none lg:flex-1">
                          <Stake />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="unstake"
                      className="h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <Unstake />
                    </TabsContent>

                    <TabsContent
                      value="withdraw"
                      className="h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <WithdrawLog />
                    </TabsContent>
                  </ShadCNTabs>
                </div>
              </TabsContent>
            </ShadCNTabs>

            <div
              className={cn("flex w-full max-w-full flex-col gap-4 lg:hidden")}
            >
              <SeasonPointsCard />
              <StakingRewardsInfo />
              <PortfolioSection />
              <FAQSection />
            </div>
          </div>

          <div className="hidden w-full flex-col gap-6 lg:flex lg:w-[400px]">
            {/* Total Value Staked Card */}
            <div className="flex items-center justify-between rounded-xl border border-[#E5E8EB] bg-white px-4 py-5 shadow-sm">
              <span className="text-sm text-[#6B7780]">Total Value Staked</span>
              <p className="text-xl text-[#1A1F24]">
                $
                {formatNumberWithCommas(
                  ((strkTVL.value || 0) + (btcTVL.value || 0)).toFixed(2),
                )}
              </p>
            </div>

            <PortfolioSection />
            <SeasonPointsCard />
            <StakingRewardsInfo />
            <FAQSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tabs;
