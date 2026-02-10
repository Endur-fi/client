/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useAccount, useProvider } from "@starknet-react/core";
import { ConnectButton } from "@easyleap/sdk";
import { useAtom, useSetAtom } from "jotai";
import React from "react";

import { getProvider } from "@/constants";
import { MyAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  lastWalletAtom,
  providerAtom,
  userAddressAtom,
} from "@/store/common.store";

import MobileNav from "./mobile-nav";
import { useSidebar } from "./ui/sidebar";
import { VipNavbarChip } from "./vip-card";

const Navbar = ({ className }: { className?: string }) => {
  // init analytics
  MyAnalytics.init();

  const { address, connector } = useAccount();
  const { provider } = useProvider();

  const { isMobile } = useSidebar();

  const [__, setAddress] = useAtom(userAddressAtom);
  const [_, setLastWallet] = useAtom(lastWalletAtom);
  const setProvider = useSetAtom(providerAtom);

  // set tracking person
  React.useEffect(() => {
    if (address) {
      MyAnalytics.setPerson(address);
    }
  }, [address]);

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

				<VipNavbarChip />

        <ConnectButton
          className={cn(
            "flex h-8 items-center justify-center gap-2 rounded-lg border border-[#ECECED80] bg-[#AACBC433] text-xs font-bold text-[#03624C] focus-visible:outline-[#03624C] md:h-10 md:text-sm",
            {
              "h-[34px]": isMobile,
            },
          )}
          style={{
            buttonStyles: {
              color: "#03624C",
              backgroundColor: "#AACBC433",
              border: "1px solid #ECECED80",
            },
          }}
        />
      </div>
    </div>
  );
};

export default Navbar;
