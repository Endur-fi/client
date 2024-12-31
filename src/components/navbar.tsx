"use client";

import {
  InjectedConnector,
  useAccount,
  useConnect,
  useDisconnect,
  useProvider,
  useSwitchChain,
} from "@starknet-react/core";
import { useAtom, useSetAtom } from "jotai";
import { ChartPie, X } from "lucide-react";
import { Figtree } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { constants, num } from "starknet";
import {
  connect,
  ConnectOptionsWithConnectors,
  disconnect,
  StarknetkitConnector,
} from "starknetkit";
import {
  isInBraavosMobileAppBrowser,
  BraavosMobileConnector,
} from "starknetkit/braavosMobile";
import {
  ArgentMobileConnector,
  isInArgentMobileAppBrowser,
} from "starknetkit/argentMobile";
import { WebWalletConnector } from "starknetkit/webwallet";

import { DASHBOARD_URL, getProvider, NETWORK } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { cn, shortAddress } from "@/lib/utils";
import {
  lastWalletAtom,
  providerAtom,
  userAddressAtom,
} from "@/store/common.store";

import { Icons } from "./Icons";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useSidebar } from "./ui/sidebar";
import MigrateNostra from "./migrate-nostra";
import { MyAnalytics } from "@/lib/analytics";
import TokenSelector from "./paymaster-modal";

const font = Figtree({ subsets: ["latin-ext"] });

export const CONNECTOR_NAMES = ["Braavos", "Argent X", "Argent (mobile)"];

export function getConnectors(isMobile: boolean) {
  const mobileConnector = ArgentMobileConnector.init({
    options: {
      dappName: "Endurfi",
      url: typeof window !== "undefined" ? window.location.hostname : "",
      chainId: constants.NetworkName.SN_MAIN,
    },
    inAppBrowserOptions: {},
  }) as StarknetkitConnector;

  const argentXConnector = new InjectedConnector({
    options: {
      id: "argentX",
      name: "Argent X",
    },
  });

  const braavosConnector = new InjectedConnector({
    options: {
      id: "braavos",
      name: "Braavos",
    },
  });

  const braavosMobile = BraavosMobileConnector.init({
    inAppBrowserOptions: {},
  }) as StarknetkitConnector;

  const webWalletConnector = new WebWalletConnector({
    url: "https://web.argent.xyz",
  }) as StarknetkitConnector;

  const isMainnet = NETWORK === constants.NetworkName.SN_MAIN;

  if (isMainnet) {
    if (isInArgentMobileAppBrowser()) {
      return [mobileConnector];
    } else if (isInBraavosMobileAppBrowser()) {
      return [braavosMobile];
    } else if (isMobile) {
      return [mobileConnector, braavosMobile, webWalletConnector];
    }
    return [
      argentXConnector,
      braavosConnector,
      mobileConnector,
      webWalletConnector,
    ];
  }
  return [argentXConnector, braavosConnector];
}

const Navbar = ({ className }: { className?: string }) => {
  // init analytics
  MyAnalytics.init();

  const { address, connector, chainId } = useAccount();
  const { provider } = useProvider();
  const { connect: connectSnReact } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile } = useSidebar();

  const referrer = searchParams.get("referrer");

  const [__, setAddress] = useAtom(userAddressAtom);
  const [_, setLastWallet] = useAtom(lastWalletAtom);
  const setProvider = useSetAtom(providerAtom);

  // set tracking person
  useEffect(() => {
    if (address) {
      MyAnalytics.setPerson(address);
    }
  }, [address]);

  const connectorConfig: ConnectOptionsWithConnectors = React.useMemo(() => {
    return {
      modalMode: "canAsk",
      modalTheme: "light",
      webWalletUrl: "https://web.argent.xyz",
      argentMobileOptions: {
        dappName: "Endur.fi",
        chainId: NETWORK,
        url: window.location.hostname,
      },
      dappName: "Endur.fi",
      connectors: getConnectors(isMobile) as StarknetkitConnector[],
    };
  }, [isMobile]);

  const requiredChainId = React.useMemo(() => {
    return NETWORK === constants.NetworkName.SN_MAIN
      ? constants.StarknetChainId.SN_MAIN
      : constants.StarknetChainId.SN_SEPOLIA;
  }, []);

  const { switchChain, error } = useSwitchChain({
    params: {
      chainId: requiredChainId,
    },
  });

  async function connectWallet(config = connectorConfig) {
    try {
      const { connector } = await connect(config);

      if (connector) {
        connectSnReact({ connector: connector as any });
      }
    } catch (error) {
      console.error("connectWallet error", error);
    }
  }

  // switch chain if not on the required chain
  React.useEffect(() => {
    if (
      chainId &&
      chainId.toString() !== num.getDecimalString(requiredChainId)
    ) {
      switchChain();
    }
  }, [chainId]);

  React.useEffect(() => {
    if (error) {
      console.error("switchChain error", error);
    }
  }, [error]);

  // attempt to connect wallet on load
  React.useEffect(() => {
    const config = connectorConfig;
    connectWallet({
      ...config,
      modalMode: "neverAsk",
    });
  }, []);

  React.useEffect(() => {
    if (connector) {
      const name: string = connector.name;
      setLastWallet(name);
    }
  }, [connector]);

  React.useEffect(() => {
    setAddress(address);
    setProvider(getProvider());
  }, [address, provider]);

  return (
    <div
      className={cn(
        "flex h-20 w-full items-center justify-end",
        {
          "justify-between": isMobile,
        },
        className,
      )}
    >
      {isMobile && (
        <Sheet>
          <div className="flex items-center justify-center gap-4">
            <SheetTrigger>
              <Icons.hamburger className="size-5" />
            </SheetTrigger>
            <Image
              src="/full_logo.svg"
              width={80}
              height={60}
              alt="full_logo"
            />
          </div>

          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className={cn(
              font.className,
              "bg-sidebar p-0 text-sidebar-foreground",
            )}
            side="left"
          >
            <div className="h-full border border-[#AACBC480]">
              <div className="flex items-center justify-start bg-[#AACBC433] px-6 py-10">
                <Image
                  className=""
                  src="/full_logo.svg"
                  width={160}
                  height={60}
                  alt="full_logo"
                />
              </div>

              <div className="h-full space-y-1 bg-[#AACBC433] px-4 pt-5">
                <Link
                  href={referrer ? `/?referrer=${referrer}` : "/"}
                  className={cn(
                    "group/stake flex cursor-pointer flex-row items-center gap-2 rounded-md px-3 py-2 text-xl font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                    {
                      "bg-[#17876D] text-white": pathname === "/",
                    },
                  )}
                >
                  {pathname === "/" ? (
                    <Icons.stakingLight className="size-5" />
                  ) : (
                    <>
                      <Icons.stakingDark className="size-5 group-hover/stake:hidden" />
                      <Icons.stakingLight className="hidden size-5 group-hover/stake:flex" />
                    </>
                  )}
                  Liquid Staking
                </Link>

                <hr className="border-[#AACBC480]" />

                <Link
                  href={referrer ? `/defi?referrer=${referrer}` : "/defi"}
                  className={cn(
                    "group/defi flex cursor-pointer flex-row items-center gap-2 rounded-md px-3 py-2 text-xl font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white",
                    {
                      "bg-[#17876D] text-white": pathname === "/defi",
                    },
                  )}
                >
                  {pathname === "/defi" ? (
                    <Icons.defiLight className="size-5" />
                  ) : (
                    <>
                      <Icons.defiDark className="size-5 group-hover/defi:hidden" />
                      <Icons.defiLight className="hidden size-5 group-hover/defi:flex" />
                    </>
                  )}
                  xSTRK on DeFi
                </Link>

                <Link
                  href={"https://dune.com/endurfi/xstrk-analytics"}
                  target="_blank"
                >
                  <div className="group/defi flex-co, pointer-events-none flex cursor-pointer flex-row items-center gap-2 rounded-md px-3 py-2 text-xl font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white">
                    <ChartPie className="size-5 shrink-0" />
                    <p className="flex flex-col gap-0">xSTRK Analytics </p>
                  </div>
                </Link>

                <hr className="border-[#AACBC480]" />

                <Link
                  href={DASHBOARD_URL}
                  target="_blank"
                  className="group/dash flex cursor-pointer flex-row items-center gap-2 rounded-md px-3 py-2 text-xl font-semibold text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white"
                >
                  <Icons.dashboardDark className="size-5 shrink-0 group-hover/dash:hidden" />
                  <Icons.dashboardLight className="hidden size-5 shrink-0 group-hover/dash:flex" />
                  Staking Dashboard
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex items-center gap-4">
        {!isMobile && NETWORK == constants.NetworkName.SN_MAIN && (
          <MigrateNostra />
        )}
        {address && <TokenSelector isMobile={isMobile} />}
        <button
          className={cn(
            "flex h-10 items-center justify-center gap-2 rounded-lg border border-[#ECECED80] bg-[#AACBC433] text-sm font-bold text-[#03624C] focus-visible:outline-[#03624C]",
            {
              "h-[34px]": isMobile,
            },
          )}
          onClick={() => !address && connectWallet()}
        >
          {!address && (
            <p
              className={cn(
                "relative flex w-[9.5rem] select-none items-center justify-center gap-1 bg-transparent text-sm",
              )}
            >
              Connect Wallet
            </p>
          )}

          {address && (
            <>
              {!isMobile ? (
                <div className="flex w-[9.5rem] items-center justify-center gap-2">
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast({
                        description: "Address copied to clipboard",
                      });
                    }}
                    className="flex h-9 items-center justify-center gap-2 rounded-md"
                  >
                    <Icons.gradient />
                    <p className="flex items-center gap-1 text-sm">
                      {address && shortAddress(address, 4, 4)}
                    </p>
                  </div>

                  <X
                    onClick={() => (disconnect(), disconnectAsync())}
                    className="size-4 text-[#3F6870]"
                  />
                </div>
              ) : (
                <div className="flex w-[9.5rem] items-center justify-center gap-2">
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast({ description: "Address copied to clipboard" });
                    }}
                    className="flex w-fit items-center justify-center gap-2 rounded-md"
                  >
                    <Icons.wallet className="size-5 text-[#3F6870]" />
                    {shortAddress(address, 4, 4)}
                  </div>

                  <X
                    onClick={() => (disconnect(), disconnectAsync())}
                    className="size-4 text-[#3F6870]"
                  />
                </div>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;