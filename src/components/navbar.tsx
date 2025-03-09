/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  useAccount,
  useDisconnect,
  useProvider,
  useSwitchChain,
} from "@starknet-react/core";
import { useAtom, useSetAtom } from "jotai";
import { X } from "lucide-react";
import React from "react";
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

import { getProvider, NETWORK } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { MyAnalytics } from "@/lib/analytics";
import { cn, shortAddress } from "@/lib/utils";
import {
  lastWalletAtom,
  providerAtom,
  userAddressAtom,
} from "@/store/common.store";

import { Icons } from "./Icons";
import MobileNav from "./mobile-nav";
import { useSidebar } from "./ui/sidebar";
import TokenSelector from "./paymaster-modal";

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
  const { disconnectAsync } = useDisconnect();
  const { connectWallet, config } = useWalletConnection();

  const { isMobile } = useSidebar();

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

  // set tracking person
  React.useEffect(() => {
    if (address) {
      MyAnalytics.setPerson(address);
    }
  }, [address]);

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
        {/* {!isMobile && NETWORK === constants.NetworkName.SN_MAIN && (
          <MigrateNostra />
        )} */}

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