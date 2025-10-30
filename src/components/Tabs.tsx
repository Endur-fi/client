"use client";

import { useAtom, useAtomValue } from "jotai";
import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import { useSearchParams } from "next/navigation";

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
import { snAPYAtom } from "@/store/staking.store";
import { lstConfigAtom } from "@/store/common.store";

import Stake from "./stake";
import { useSidebar } from "./ui/sidebar";
import {
  Tabs as ShadCNTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import Unstake from "./unstake";
import WithdrawLog from "./withdraw-log";
import { MyDottedTooltip } from "./my-tooltip";

const Header = React.memo(({ isMerry }: { isMerry: boolean }) => (
  <div
    className={cn("mt-6 w-full max-w-xl lg:mt-0", {
      "mb-7 xl:mb-0": !isMerry,
    })}
  >
    <div className="flex flex-wrap items-center gap-3 lg:mt-7">
      <div className="flex items-center gap-2">
        <Icons.strkLogo className="size-8" />
        <h1 className="text-xl font-bold text-black">Starknet Staking</h1>
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
      to earn staking rewards and participate in DeFi opportunities across the
      Starknet ecosystem.
    </p>
  </div>
));
Header.displayName = "Header";

// TODO: separate this as a component and only keep whether it should be shown or not in this file [PausedMessageBox] - SOLVED
const PausedMessageBox: React.FC = () => (
  <div className="-top-[3.25rem] mt-2 w-fit text-balance rounded-lg border border-amber-600 bg-amber-200 px-5 py-2 text-center text-sm text-yellow-700 lg:absolute lg:mt-0">
    Endur is currently undergoing a scheduled upgrade to support Staking V3.{" "}
    <Link
      href="https://x.com/endurfi/status/1966140807968338110"
      target="_blank"
      className="text-blue-500 transition-all hover:underline"
    >
      Learn more
    </Link>
  </div>
);

const Tabs = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [_lstConfig, setLSTConfig] = useAtom(lstConfigAtom);
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useAtom(tabsAtom);
  const [activeSubTab, setActiveSubTab] = useAtom(activeSubTabAtom);
  const apy = useAtomValue(snAPYAtom);

  console.log("Apy", apy.value);

  const isMerry = useAtomValue(isMerryChristmasAtom);

  const { isPinned } = useSidebar();

  const referrer = searchParams.get("referrer");

  React.useEffect(() => {
    //TODO: revisit (Neel's Task)
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

  const validTabs = ["btc", "strk"];

  const handleTabChange = async (tab: string) => {
    if (tab === activeTab) return;

    setActiveTab(tab);

    //TODO: use tab variable and add a check before it using array and includes - SOLVED
    if (validTabs.includes(tab)) {
      router.push(referrer ? `/${tab}?referrer=${referrer}` : `/${tab}`, {
        scroll: false,
      });
    }
  };

  const handleSubTabChange = (subTab: string) => {
    if (subTab === activeSubTab) return;

    setActiveSubTab(subTab);
  };

  return (
    <div className="relative h-full">
      <div
        className={cn("z-30 flex h-full flex-col items-center gap-4", {
          "lg:-ml-56": isPinned,
        })}
      >
        {IS_PAUSED && <PausedMessageBox />}

        <Header isMerry={isMerry} />

        {/* TODO: remove the shadcn tabs for the btc and strk tabs 
			Reason: when we switch the shadcn tab it already renders the element and because we navigate to different route (for eg /strk) it again renders the same thing
			on using the simple approach (that is native elements like div and js to handle the toggle) issue will be solved and it is a clean approach as well
		*/}
        {/* Main Tabs - STRK and BTC */}
        <div className="w-full max-w-xl">
          <ShadCNTabs
            onValueChange={(value) => handleTabChange(value)}
            value={activeTab}
            defaultValue="btc"
            className="col-span-2 h-full w-full lg:mt-0"
          >
            <TabsList
              className={cn(
                "flex w-full items-center gap-2 rounded-none bg-transparent pb-5 pt-8",
              )}
            >
              <TabsTrigger
                value="strk"
                className="group relative inline-flex w-full justify-between rounded-xl border border-[#8D9C9C80] bg-transparent py-3 pl-3 text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-[#17876D] data-[state=active]:bg-[#03624C1A] data-[state=active]:text-[#03624C] data-[state=active]:shadow-none lg:text-base"
              >
                <div className="inline-flex items-center gap-2 text-lg font-bold">
                  <Icons.strkLogo className="h-6 w-6 opacity-20 group-data-[state=active]:opacity-100" />
                  STRK
                </div>
                <div className="pl-2">
                  <p className="text-xs">
                    APY: {(apy.value.strkApy * 100).toFixed(2)}%
                  </p>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="btc"
                className="group relative inline-flex w-full justify-between rounded-xl border border-[#8D9C9C80] bg-transparent py-3 pl-3 text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-[#17876D] data-[state=active]:bg-[#03624C1A] data-[state=active]:text-[#03624C] data-[state=active]:shadow-none lg:text-base"
              >
                <div className="inline-flex items-center gap-2 text-lg font-bold">
                  <Icons.btcLogo className="h-6 w-6 opacity-20 group-data-[state=active]:opacity-100" />
                  BTC
                </div>
                <div className="pl-2">
                  <p className="text-xs">
                    APY: {(apy.value.btcApy * 100).toFixed(2)}%
                  </p>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* TODO: separate the component and use the same component for strk and btc (can name it as <TokenTab>) - SOLVED: Current structure is already well-organized with clear separation */}
            {/* STRK Tab Content */}
            <TabsContent
              value="strk"
              className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
            >
              <div
                className={cn(
                  "mt-6 min-h-[31.5rem] w-full rounded-xl bg-white shadow-xl lg:h-fit lg:pb-5",
                )}
              >
                <ShadCNTabs
                  onValueChange={(value) => handleSubTabChange(value)}
                  value={activeSubTab}
                  defaultValue="stake"
                  className="col-span-2 h-full w-full lg:mt-0"
                >
                  <TabsList
                    className={cn(
                      "flex w-full items-center justify-start rounded-none border-b bg-transparent px-3 pb-5 pt-5 lg:pt-8",
                      {
                        // "lg:pt-10": activeTab !== "withdraw" && isMerry,
                      },
                    )}
                  >
                    <TabsTrigger
                      value="stake"
                      className="group relative rounded-none border-none bg-transparent pl-0 text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:pl-3 lg:text-base"
                    >
                      Stake
                      <div className="absolute -bottom-[7.5px] left-0 hidden h-[2px] w-10 rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-3" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="unstake"
                      className="group relative rounded-none border-none bg-transparent text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
                    >
                      Unstake
                      <div className="absolute -bottom-[7.5px] left-3 hidden h-[2px] w-[3.3rem] rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-3.5" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="withdraw"
                      className="group relative rounded-none border-none bg-transparent text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
                    >
                      Withdraw log
                      {/* TODO: make this a separate common component [InfoTooltip] - SOLVED */}
                      {/* <TooltipProvider delayDuration={0}>
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
                      </TooltipProvider> */}
                      <MyDottedTooltip
                        showDot={false}
                        tooltipClassName="mb-0"
                        tooltip={
                          <div className="bg-white text-[#03624C]">
                            Learn more about withdraw logs{" "}
                            <Link
                              target="_blank"
                              href="https://docs.endur.fi/docs/concepts/withdraw-log"
                              className="text-blue-600 underline"
                            >
                              here
                            </Link>
                          </div>
                        }
                      >
                        <Info className="ml-2 size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                      </MyDottedTooltip>
                      <div className="absolute -bottom-[7.5px] left-3 hidden h-[2px] w-[5rem] rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-[16px]" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="stake"
                    className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
                  >
                    <Stake />
                  </TabsContent>

                  <TabsContent
                    value="unstake"
                    className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
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

              {(activeSubTab === "unstake" || activeSubTab === "stake") && (
                <div
                  className={cn(
                    "mb-2 mt-5 flex items-center rounded-md bg-[#FFC4664D] py-3 pl-4 pr-3 text-xs text-[#D69733] lg:mb-4 lg:text-sm",
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
              )}
            </TabsContent>

            <TabsContent
              value="btc"
              className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
            >
              <div
                className={cn(
                  "mt-6 min-h-[31.5rem] w-full rounded-xl bg-white shadow-xl lg:h-fit lg:pb-5",
                )}
              >
                <ShadCNTabs
                  onValueChange={(value) => handleSubTabChange(value)}
                  value={activeSubTab}
                  defaultValue="stake"
                  className="col-span-2 h-full w-full lg:mt-0"
                >
                  <TabsList
                    className={cn(
                      "flex w-full items-center justify-start rounded-none border-b bg-transparent px-3 pb-5 pt-5 lg:pt-8",
                      {
                        // "lg:pt-10": activeTab !== "withdraw" && isMerry,
                      },
                    )}
                  >
                    <TabsTrigger
                      value="stake"
                      className="group relative rounded-none border-none bg-transparent pl-0 text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:pl-3 lg:text-base"
                    >
                      Stake
                      <div className="absolute -bottom-[7.5px] left-0 hidden h-[2px] w-10 rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-3" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="unstake"
                      className="group relative rounded-none border-none bg-transparent text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
                    >
                      Unstake
                      <div className="absolute -bottom-[7.5px] left-3 hidden h-[2px] w-[3.3rem] rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-3.5" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="withdraw"
                      className="group relative rounded-none border-none bg-transparent text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
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
                      <div className="absolute -bottom-[7.5px] left-3 hidden h-[2px] w-[5rem] rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-[16px]" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="stake"
                    className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
                  >
                    <Stake />
                  </TabsContent>

                  <TabsContent
                    value="unstake"
                    className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
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

              {(activeSubTab === "unstake" || activeSubTab === "stake") && (
                <div
                  className={cn(
                    "mb-2 mt-5 flex items-center rounded-md bg-[#FFC4664D] py-3 pl-4 pr-3 text-xs text-[#D69733] lg:mb-4 lg:text-sm",
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
              )}
            </TabsContent>
          </ShadCNTabs>
        </div>
      </div>
    </div>
  );
};

export default Tabs;
