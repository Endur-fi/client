"use client";

import { useAtom, useAtomValue } from "jotai";
import { HelpCircle, Info, Star } from "lucide-react";
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
import { cn } from "@/lib/utils";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
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

  return (
    <div className="relative">
      <div
        className={cn("z-30 flex h-full flex-col items-center gap-4", {
          //   "lg:-ml-56": isPinned,
        })}
      >
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
          <div className="">
            <ShadCNTabs
              onValueChange={(value) => handleTabChange(value)}
              value={activeTab}
              defaultValue="btc"
              className="flex h-full w-full flex-col gap-4"
            >
              <TabsList
                className={cn(
                  "bg-white",
                  "h-fit w-full p-2",
                  "flex items-center gap-2",
                  "rounded-[14px] border border-[#E5E8EB]",
                  "shadow-[0_1px_2px_-1px_#0000001A,_0_1px_3px_0_#0000001A]",
                )}
              >
                <TabsTrigger
                  value="strk"
                  className="group relative flex w-full flex-col items-start rounded-[10px] bg-transparent px-3 py-4 text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border data-[state=active]:border-[#81C3B4] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#0D5F4E] data-[state=active]:shadow-none lg:text-base"
                >
                  <div className="inline-flex items-center gap-3">
                    <Icons.strkLogo className="h-8 w-8 grayscale-[0.8] group-data-[state=active]:grayscale-0" />
                    <div className="flex items-start gap-2 lg:flex-col">
                      <p className="text-lg group-data-[state=active]:text-black group-data-[state=active]:opacity-100">
                        {" "}
                        STRK
                      </p>
                      <div className="flex flex-col gap-1 lg:flex-row lg:gap-6">
                        <p className="text-xs">
                          APY: {(apy.value.strkApy * 100).toFixed(2)}%
                        </p>

                        <p className="text-xs">
                          TVL: {formatTVL(strkTVL.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="btc"
                  className="group relative flex w-full flex-col items-start rounded-[10px] bg-transparent px-3 py-4 text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border data-[state=active]:border-[#81C3B4] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#0D5F4E] data-[state=active]:shadow-none lg:text-base"
                >
                  <div className="inline-flex items-center gap-3">
                    <Icons.btcLogo className="h-8 w-8 grayscale-[0.8] group-data-[state=active]:grayscale-0" />
                    <div className="flex items-start gap-2 lg:flex-col">
                      <p className="text-lg group-data-[state=active]:text-black group-data-[state=active]:opacity-100">
                        {" "}
                        BTC
                      </p>
                      <div className="flex flex-col gap-1 lg:flex-row lg:gap-6">
                        <p className="text-xs">
                          APY: {(apy.value.btcApy * 100).toFixed(2)}%
                        </p>
                        <p className="text-xs">
                          TVL: {formatTVL(btcTVL.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
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
                        <div className="flex w-full max-w-full flex-col gap-4 lg:hidden">
                          <PortfolioSection />
                          {/* Season 2 Points Active Card */}
                          <div className="w-full rounded-xl bg-[#17876D] p-2 lg:p-4">
                            <div className="flex items-start gap-3">
                              <Star className="h-5 w-5 shrink-0 fill-white text-white" />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white">
                                  Season 2 Points Active
                                </h4>
                                <p className="mt-1 text-xs text-white">
                                  Earn 5X points on all staking
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex w-full justify-center">
                              <Link
                                href="#"
                                className="w-full rounded-md bg-[#81C3B4] px-4 py-2 text-center text-xs font-medium text-white transition-all hover:bg-[#6BA89A]"
                              >
                                Learn More
                              </Link>
                            </div>
                          </div>
                          {/* FAQ Section */}
                          <div className="w-full rounded-xl border border-[#E5E8EB] bg-white p-2 lg:p-4">
                            <div className="mb-4 flex items-center gap-2">
                              <HelpCircle className="h-5 w-5 text-[#17876D]" />
                              <h3 className="text-sm font-bold uppercase text-[#17876D]">
                                Frequently Asked Questions
                              </h3>
                            </div>
                            <Accordion
                              type="single"
                              collapsible
                              defaultValue="item-1"
                            >
                              <AccordionItem
                                value="item-1"
                                className="border-b border-[#E5E8EB]"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#17876D] data-[state=open]:[&>svg]:text-[#17876D]">
                                  How to stake?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  Select your preferred token (STRK or BTC),
                                  enter the amount you want to stake, optionally
                                  choose a DeFi protocol for additional yield,
                                  and click the Stake button. You{"'ll"} receive
                                  liquid staking tokens (xSTRK or xBTC) that
                                  represent your staked position.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem
                                value="item-2"
                                className="border-b border-[#E5E8EB]"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                                  How to unstake?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  To unstake, navigate to the Unstake tab, enter
                                  the amount of liquid staking tokens (xSTRK or
                                  xBTC) you want to unstake, and click the
                                  Unstake button. Your tokens will be queued for
                                  withdrawal.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem
                                value="item-3"
                                className="border-b border-[#E5E8EB]"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                                  What is liquid staking?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  Liquid staking allows you to stake your tokens
                                  while maintaining liquidity. You receive
                                  liquid staking tokens (LSTs) that represent
                                  your staked position and can be used in DeFi
                                  protocols or traded while still earning
                                  staking rewards.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem
                                value="item-4"
                                className="border-b border-[#E5E8EB]"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                                  Where does the yield come from?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  The yield comes from staking rewards generated
                                  by validators on the Starknet network.
                                  Additionally, you can earn extra yield by
                                  deploying your liquid staking tokens to
                                  supported DeFi protocols.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem
                                value="item-5"
                                className="border-b-0"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                                  What are Security and Audits of the protocol?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  Our protocol has undergone comprehensive
                                  security audits by leading blockchain security
                                  firms. We maintain strict security standards
                                  and regularly update our smart contracts to
                                  ensure the safety of user funds. Detailed
                                  audit reports are available in our
                                  documentation.
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
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

                {/* {(activeSubTab === "unstake" || activeSubTab === "stake") && (
                  <div
                    className={cn(
                      "flex items-center rounded-md bg-[#FFC4664D] text-xs text-[#D69733] lg:text-sm",
                      {
                        "bg-[#C0D5CE69] text-[#134c3d9e]":
                          activeSubTab === "stake",
                      },
                    )}
                  >
                    <span className="mr-3 flex size-4 shrink-0 items-center justify-center rounded-full text-xl lg:size-6">
                      {activeSubTab === "unstake" ? "⚠️" : <Info />}
                    </span>
                    {getMessage()}
                  </div>
                )} */}
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
                        <div className="flex w-full max-w-full flex-col gap-4 lg:hidden">
                          <PortfolioSection />
                          {/* Season 2 Points Active Card */}
                          <div className="w-full rounded-xl bg-[#17876D] p-2 lg:p-4">
                            <div className="flex items-start gap-3">
                              <Star className="h-5 w-5 shrink-0 fill-white text-white" />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white">
                                  Season 2 Points Active
                                </h4>
                                <p className="mt-1 text-xs text-white">
                                  Earn 5X points on all staking
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex w-full justify-center">
                              <Link
                                href="#"
                                className="w-full rounded-md bg-[#81C3B4] px-4 py-2 text-center text-xs font-medium text-white transition-all hover:bg-[#6BA89A]"
                              >
                                Learn More
                              </Link>
                            </div>
                          </div>
                          {/* FAQ Section */}
                          <div className="w-full rounded-xl border border-[#E5E8EB] bg-white p-2 lg:p-4">
                            <div className="mb-4 flex items-center gap-2">
                              <HelpCircle className="h-5 w-5 text-[#17876D]" />
                              <h3 className="text-sm font-bold uppercase text-[#17876D]">
                                Frequently Asked Questions
                              </h3>
                            </div>
                            <Accordion
                              type="single"
                              collapsible
                              defaultValue="item-1"
                            >
                              <AccordionItem
                                value="item-1"
                                className="border-b border-[#E5E8EB]"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#17876D] data-[state=open]:[&>svg]:text-[#17876D]">
                                  How to stake?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  Select your preferred token (STRK or BTC),
                                  enter the amount you want to stake, optionally
                                  choose a DeFi protocol for additional yield,
                                  and click the Stake button. You{"'ll"} receive
                                  liquid staking tokens (xSTRK or xBTC) that
                                  represent your staked position.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem
                                value="item-2"
                                className="border-b border-[#E5E8EB]"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                                  How to unstake?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  To unstake, navigate to the Unstake tab, enter
                                  the amount of liquid staking tokens (xSTRK or
                                  xBTC) you want to unstake, and click the
                                  Unstake button. Your tokens will be queued for
                                  withdrawal.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem
                                value="item-3"
                                className="border-b border-[#E5E8EB]"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                                  What is liquid staking?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  Liquid staking allows you to stake your tokens
                                  while maintaining liquidity. You receive
                                  liquid staking tokens (LSTs) that represent
                                  your staked position and can be used in DeFi
                                  protocols or traded while still earning
                                  staking rewards.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem
                                value="item-4"
                                className="border-b border-[#E5E8EB]"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                                  Where does the yield come from?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  The yield comes from staking rewards generated
                                  by validators on the Starknet network.
                                  Additionally, you can earn extra yield by
                                  deploying your liquid staking tokens to
                                  supported DeFi protocols.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem
                                value="item-5"
                                className="border-b-0"
                              >
                                <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                                  What are Security and Audits of the protocol?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#6B7780]">
                                  Our protocol has undergone comprehensive
                                  security audits by leading blockchain security
                                  firms. We maintain strict security standards
                                  and regularly update our smart contracts to
                                  ensure the safety of user funds. Detailed
                                  audit reports are available in our
                                  documentation.
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
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

                {/* {(activeSubTab === "unstake" || activeSubTab === "stake") && (
                  <div
                    className={cn(
                      "flex items-center rounded-md bg-[#FFC4664D] text-xs text-[#D69733] lg:text-sm",
                      {
                        "bg-[#C0D5CE69] text-[#134c3d9e]":
                          activeSubTab === "stake",
                      },
                    )}
                  >
                    <span className="mr-3 flex size-4 shrink-0 items-center justify-center rounded-full text-xl lg:size-6">
                      {activeSubTab === "unstake" ? "⚠️" : <Info />}
                    </span>
                    {getMessage()}
                  </div>
                )} */}
              </TabsContent>
            </ShadCNTabs>
          </div>

          <div className="hidden w-full flex-col gap-4 lg:flex lg:w-[400px]">
            <PortfolioSection />

            {/* Season 2 Points Active Card */}
            <div className="w-full rounded-xl bg-[#17876D] p-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 shrink-0 fill-white text-white" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">
                    Season 2 Points Active
                  </h4>
                  <p className="mt-1 text-xs text-white">
                    Earn 5X points on all staking
                  </p>
                </div>
              </div>
              <div className="mt-3 flex w-full justify-center">
                <Link
                  href="#"
                  className="w-full rounded-md bg-[#81C3B4] px-4 py-2 text-center text-xs font-medium text-white transition-all hover:bg-[#6BA89A]"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Staking Rewards Info */}
            {/* <div className="w-full rounded-lg border border-blue-400 bg-[#EBF5FF] p-3">
              <div className="flex items-start gap-3">
                <Info className="h-8 w-8 text-blue-500" />
                <p className="text-sm leading-relaxed text-blue-500">
                  Staking rewards are automatically claimed and compounded,
                  gradually increasing the value of your xSTRK/xyBTCs over time.
                </p>
              </div>
            </div> */}

            {/* FAQ Section */}
            <div className="w-full rounded-xl border border-[#E5E8EB] bg-white p-3 lg:p-4">
              <div className="mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#17876D]" />
                <h3 className="text-sm font-bold uppercase text-[#17876D]">
                  Frequently Asked Questions
                </h3>
              </div>
              <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem
                  value="item-1"
                  className="border-b border-[#E5E8EB]"
                >
                  <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#17876D] data-[state=open]:[&>svg]:text-[#17876D]">
                    How to stake?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6B7780]">
                    Select your preferred token (STRK or BTC), enter the amount
                    you want to stake, optionally choose a DeFi protocol for
                    additional yield, and click the Stake button. You{"'ll"}{" "}
                    receive liquid staking tokens (xSTRK or xBTC) that represent
                    your staked position.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-2"
                  className="border-b border-[#E5E8EB]"
                >
                  <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                    How to unstake?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6B7780]">
                    To unstake, navigate to the Unstake tab, enter the amount of
                    liquid staking tokens (xSTRK or xBTC) you want to unstake,
                    and click the Unstake button. Your tokens will be queued for
                    withdrawal.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-3"
                  className="border-b border-[#E5E8EB]"
                >
                  <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                    What is liquid staking?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6B7780]">
                    Liquid staking allows you to stake your tokens while
                    maintaining liquidity. You receive liquid staking tokens
                    (LSTs) that represent your staked position and can be used
                    in DeFi protocols or traded while still earning staking
                    rewards.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-4"
                  className="border-b border-[#E5E8EB]"
                >
                  <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                    Where does the yield come from?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6B7780]">
                    The yield comes from staking rewards generated by validators
                    on the Starknet network. Additionally, you can earn extra
                    yield by deploying your liquid staking tokens to supported
                    DeFi protocols.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5" className="border-b-0">
                  <AccordionTrigger className="text-left font-semibold text-[#1A1F24] hover:no-underline [&>svg]:text-[#6B7780] data-[state=open]:[&>svg]:text-[#17876D]">
                    What are Security and Audits of the protocol?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6B7780]">
                    Our protocol has undergone comprehensive security audits by
                    leading blockchain security firms. We maintain strict
                    security standards and regularly update our smart contracts
                    to ensure the safety of user funds. Detailed audit reports
                    are available in our documentation.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* <p
          className={cn(
            "mt-4 flex items-center text-xs text-[#707D7D] lg:mb-1 lg:mt-auto lg:text-sm",
          )}
        >
          Made with 💚 by{" "}
          <Link
            href="https://unwraplabs.com"
            target="_blank"
            className="mx-1 cursor-pointer font-semibold hover:underline"
          >
            Unwrap Labs
          </Link>{" "}
          and{" "}
          <Link
            href="https://karnot.xyz"
            target="_blank"
            className="mx-1 cursor-pointer font-semibold hover:underline"
          >
            Karnot
          </Link>
        </p> */}
      </div>
    </div>
  );
};

export default Tabs;
