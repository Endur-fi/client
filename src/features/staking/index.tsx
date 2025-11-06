"use client";

import { useAtom, useAtomValue } from "jotai";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import { useSearchParams } from "next/navigation";

import { Icons } from "@/components/Icons";

import { IS_PAUSED, getLSTAssetsByCategory, getSTRKAsset } from "@/constants";
import { cn } from "@/lib/utils";
import {
  isMerryChristmasAtom,
  tabsAtom,
  activeSubTabAtom,
} from "@/store/merry.store";
import { snAPYAtom } from "@/store/staking.store";
import { lstConfigAtom } from "@/store/common.store";
import PausedMessageBox from "@/components/pause-message-box";

import { useSidebar } from "../../components/ui/sidebar";
import {
  Tabs as ShadCNTabs,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import InfoTooltip from "../../components/info-tooltip";
import StakingTabsContent from "./components/staking-tabs-content";

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
      <InfoTooltip icon="xSTRK">
        Liquid staking token (LST) of STRK issued by Endur
      </InfoTooltip>{" "}
      and{" "}
      <InfoTooltip icon="xyBTCs">
        {`xyBTC refers to Endur's family of Bitcoin Liquid Staking Tokens (LSTs), where 'x' is Endur's prefix and 'y' represents different Bitcoin variants. Examples include xWBTC, xtBTC, xLBTC, and xsBTC.`}
      </InfoTooltip>{" "}
      to earn staking rewards and participate in DeFi opportunities across the
      Starknet ecosystem.
    </p>
  </div>
));
Header.displayName = "Header";

const Staking = () => {
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

            {/* TODO: separate the component and use the same component for strk and btc (can name it as <TokenTab>) - SOLVED */}
            {/* STRK Tab Content */}
            <StakingTabsContent
              value="strk"
              activeSubTab={activeSubTab}
              handleSubTabChange={handleSubTabChange}
              getMessage={getMessage}
              useCustomTooltip={true}
            />

            {/* BTC Tab Content */}
            <StakingTabsContent
              value="btc"
              activeSubTab={activeSubTab}
              handleSubTabChange={handleSubTabChange}
              getMessage={getMessage}
              useCustomTooltip={false}
            />
          </ShadCNTabs>
        </div>
      </div>
    </div>
  );
};

export default Staking;
