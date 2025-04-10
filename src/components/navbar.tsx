/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useProvider } from "@starknet-react/core";
import { useAtom, useSetAtom } from "jotai";
import React, { useEffect } from "react";
import { ConnectButton, useAccount } from "@easyleap/sdk";

import { getProvider } from "@/constants";
import { MyAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { providerAtom, userAddressAtom } from "@/store/common.store";

import MobileNav from "./mobile-nav";
import { useSidebar } from "./ui/sidebar";

const Navbar = ({ className }: { className?: string }) => {
  // init analytics
  MyAnalytics.init();

  const { addressDestination } = useAccount();
  const { provider } = useProvider();
  const { isMobile } = useSidebar();
  const [__, setAddress] = useAtom(userAddressAtom);
  const setProvider = useSetAtom(providerAtom);

  // set tracking person
  useEffect(() => {
    if (addressDestination) {
      MyAnalytics.setPerson(addressDestination);
    }
  }, [addressDestination]);

  React.useEffect(() => {
    setAddress(addressDestination);
  }, [addressDestination]);

  React.useEffect(() => {
    setAddress(addressDestination);
    setProvider(getProvider());
  }, [addressDestination, provider]);

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
