/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useAccount, useProvider, useSwitchChain } from "@starknet-react/core";
import { useAtom, useSetAtom } from "jotai";
import React, { useEffect } from "react";
import { constants, num } from "starknet";

import { ConnectButton } from "@easyleap/sdk";

import { getProvider, NETWORK } from "@/constants";
import { MyAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  lastWalletAtom,
  providerAtom,
  userAddressAtom,
} from "@/store/common.store";

import MobileNav from "./mobile-nav";
import { useSidebar } from "./ui/sidebar";

export const CONNECTOR_NAMES = [
  "Braavos",
  "Argent X",
  "Argent (mobile)",
  "Keplr",
];

const Navbar = ({ className }: { className?: string }) => {
  // init analytics
  MyAnalytics.init();

  const { address, connector, chainId } = useAccount();
  const { provider } = useProvider();

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
        "h-20 w-full items-center justify-end",
        {
          "justify-between": isMobile,
          "flex flex-col gap-4": isMobile,
          "flex": !isMobile,
        },
        className,
      )}
    >
      {isMobile && <MobileNav />}

      <ConnectButton
        style={{
          buttonStyles: {
            width: "100%",
          },
        }}
      />
    </div>
  );
};

export default Navbar;
