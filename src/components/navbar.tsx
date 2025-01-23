"use client";

import {
  InjectedConnector,
  useAccount,
  useConnect,
  useDisconnect,
  useProvider,
  useSwitchChain,
} from "@starknet-react/core";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { X } from "lucide-react";
import React, { useEffect } from "react";
import { constants, num } from "starknet";
import {
  connect,
  ConnectOptionsWithConnectors,
  disconnect,
  StarknetkitConnector,
} from "starknetkit";
import {
  ArgentMobileConnector,
  isInArgentMobileAppBrowser,
} from "starknetkit/argentMobile";
import {
  BraavosMobileConnector,
  isInBraavosMobileAppBrowser,
} from "starknetkit/braavosMobile";
import { WebWalletConnector } from "starknetkit/webwallet";

import { getProvider, NETWORK } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { MyAnalytics } from "@/lib/analytics";
import { cn, shortAddress } from "@/lib/utils";
import {
  lastWalletAtom,
  providerAtom,
  userAddressAtom,
} from "@/store/common.store";
import { isMerryChristmasAtom, tabsAtom } from "@/store/merry.store";

import { Icons } from "./Icons";
import MigrateNostra from "./migrate-nostra";
import MobileNav from "./mobile-nav";
import { useSidebar } from "./ui/sidebar";

export const CONNECTOR_NAMES = [
  "Braavos",
  "Argent X",
  "Argent (mobile)",
  "Keplr",
];

export function getConnectors(isMobile: boolean) {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  const mobileConnector = ArgentMobileConnector.init({
    options: {
      dappName: "Endurfi",
      url: hostname,
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

  const keplrConnector = new InjectedConnector({
    options: {
      id: "keplr",
      name: "Keplr",
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
      keplrConnector,
      mobileConnector,
      webWalletConnector,
    ];
  }
  return [argentXConnector, braavosConnector, keplrConnector];
}

const Navbar = ({ className }: { className?: string }) => {
  // init analytics
  MyAnalytics.init();

  const { address, connector, chainId } = useAccount();
  const { provider } = useProvider();
  const { connect: connectSnReact } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const { isMobile } = useSidebar();

  const [__, setAddress] = useAtom(userAddressAtom);
  const [_, setLastWallet] = useAtom(lastWalletAtom);
  const setProvider = useSetAtom(providerAtom);
  const activeTab = useAtomValue(tabsAtom);
  const isMerry = useAtomValue(isMerryChristmasAtom);

  // set tracking person
  useEffect(() => {
    if (address) {
      MyAnalytics.setPerson(address);
    }
  }, [address]);

  const connectorConfig: ConnectOptionsWithConnectors = React.useMemo(() => {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";
    return {
      modalMode: "canAsk",
      modalTheme: "light",
      webWalletUrl: "https://web.argent.xyz",
      argentMobileOptions: {
        dappName: "Endur.fi",
        chainId: NETWORK,
        url: hostname,
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
      {isMobile && <MobileNav />}

      <div className="relative flex items-center gap-4">
        {!isMobile && NETWORK === constants.NetworkName.SN_MAIN && (
          <MigrateNostra />
        )}

        <button
          className={cn(
            "flex h-8 items-center justify-center gap-2 rounded-lg border border-[#ECECED80] bg-[#AACBC433] text-xs font-bold text-[#03624C] focus-visible:outline-[#03624C] md:h-10 md:text-sm",
            {
              "h-[34px]": isMobile,
            },
          )}
          onClick={() => !address && connectWallet()}
        >
          {!address && (
            <p
              className={cn(
                "relative flex w-[8rem] select-none items-center justify-center gap-1 bg-transparent text-xs md:w-[9.5rem] md:text-sm",
              )}
            >
              Connect Wallet
            </p>
          )}

          {address && (
            <>
              {!isMobile ? (
                <div className="flex w-[8rem] items-center justify-center gap-2 md:w-[9.5rem]">
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast({
                        description: "Address copied to clipboard",
                      });
                    }}
                    className="flex h-8 items-center justify-center gap-2 rounded-md md:h-9"
                  >
                    <Icons.gradient />
                    <p className="flex items-center gap-1 text-xs md:text-sm">
                      {address && shortAddress(address, 4, 4)}
                    </p>
                  </div>

                  <X
                    onClick={() => (disconnect(), disconnectAsync())}
                    className="size-4 text-[#3F6870]"
                  />
                </div>
              ) : (
                <div className="flex w-[8rem] items-center justify-center gap-2 md:w-[9.5rem]">
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
                    className="size-3 text-[#3F6870] md:size-4"
                  />
                </div>
              )}
            </>
          )}
        </button>

        {/* {activeTab !== "withdraw" && isMerry && (
          <div className="hidden transition-all duration-500 lg:block">
            <div className="group absolute -bottom-[138px] right-12">
              <Icons.bell1Faded className="group-hover:hidden" />
              <Icons.bell1 className="hidden group-hover:block" />
              <p className="absolute -bottom-[4.3rem] -left-12 hidden w-44 rounded-md border border-[#03624C] bg-white p-2 text-sm text-[#03624C] transition-all group-hover:flex">
                May 2025 be a multi-bagger year for you 😉
              </p>
            </div>

            <div className="group absolute -bottom-[65px] right-6">
              <Icons.bell2Faded className="group-hover:hidden" />
              <Icons.bell2 className="hidden group-hover:block" />
              <p className="absolute -bottom-[5.5rem] -left-24 hidden w-44 rounded-md border border-[#03624C] bg-white p-2 text-sm text-[#03624C] transition-all group-hover:flex">
                We love you for being on Starknet and choosing Endur to stake
                with.
              </p>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Navbar;
