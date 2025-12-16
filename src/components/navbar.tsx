/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useAccount, useProvider } from "@starknet-react/core";
import { useAtom, useSetAtom } from "jotai";
import { X } from "lucide-react";
import React from "react";

import { getProvider } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { MyAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  lastWalletAtom,
  providerAtom,
  userAddressAtom,
} from "@/store/common.store";

import { Icons } from "./Icons";
import MobileNav from "./mobile-nav";
import { useSidebar } from "./ui/sidebar";
import { ConnectWalletModal } from "./wallet/ConnectWalletModal";
import { WalletSetupProgress } from "./wallet/WalletSetupProgress";

const Navbar = ({ className }: { className?: string }) => {
  // init analytics
  MyAnalytics.init();

  const { connector } = useAccount();
  const { provider } = useProvider();
  const {
    isConnected,
    displayAddress,
    activeAddress,
    isWalletModalOpen,
    setIsWalletModalOpen,
    handleConnectWallet,
    handleConnectStarknet,
    handleConnectPrivy,
    handleDisconnect,
    walletSetupStep,
    isLoadingWallet,
    connectionType,
  } = useWalletConnection();

  const { isMobile } = useSidebar();

  const [__, setAddress] = useAtom(userAddressAtom);
  const [_, setLastWallet] = useAtom(lastWalletAtom);
  const setProvider = useSetAtom(providerAtom);

  // set tracking person
  React.useEffect(() => {
    if (activeAddress) {
      MyAnalytics.setPerson(activeAddress);
    }
  }, [activeAddress]);

  React.useEffect(() => {
    if (connector) {
      const name: string = connector.name;
      setLastWallet(name);
    }
  }, [connector]);

  React.useEffect(() => {
    setAddress(activeAddress || undefined);
    setProvider(getProvider());
  }, [activeAddress, provider, setAddress, setProvider]);

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
            "flex h-8 items-center justify-center gap-2 rounded-lg border border-[#ECECED80] bg-[#AACBC433] text-xs font-bold text-[#03624C] focus-visible:outline-[#03624C] md:h-10 md:text-sm",
            {
              "h-[34px]": isMobile,
            },
          )}
          onClick={() =>
            !isConnected && !isLoadingWallet && handleConnectWallet()
          }
        >
          {!isConnected && !isLoadingWallet && (
            <p
              className={cn(
                "relative flex w-[8rem] select-none items-center justify-center gap-1 bg-transparent text-xs md:w-[9.5rem] md:text-sm",
              )}
            >
              Connect Wallet
            </p>
          )}

          {/* Only show Privy wallet setup progress if Privy is the active connection */}
          {isLoadingWallet &&
            walletSetupStep !== "idle" &&
            connectionType === "privy" && (
              <div className="flex w-[8rem] items-center justify-center md:w-[9.5rem]">
                <WalletSetupProgress step={walletSetupStep} />
              </div>
            )}

          {isConnected && !isLoadingWallet && (
            <>
              {!isMobile ? (
                <div className="flex w-[8rem] items-center justify-center gap-2 md:w-[9.5rem]">
                  <div
                    onClick={() => {
                      if (displayAddress) {
                        navigator.clipboard.writeText(activeAddress || "");
                        toast({
                          description: "Address copied to clipboard",
                        });
                      }
                    }}
                    className="flex h-8 items-center justify-center gap-2 rounded-md md:h-9"
                  >
                    <Icons.gradient />
                    <p className="flex items-center gap-1 text-xs md:text-sm">
                      {displayAddress}
                    </p>
                  </div>

                  <X
                    onClick={() => handleDisconnect()}
                    className="size-4 text-[#3F6870]"
                  />
                </div>
              ) : (
                <div className="flex w-[8rem] items-center justify-center gap-2 md:w-[9.5rem]">
                  <div
                    onClick={() => {
                      if (displayAddress) {
                        navigator.clipboard.writeText(activeAddress || "");
                        toast({ description: "Address copied to clipboard" });
                      }
                    }}
                    className="flex w-fit items-center justify-center gap-2 rounded-md"
                  >
                    <Icons.wallet className="size-5 text-[#3F6870]" />
                    {displayAddress}
                  </div>

                  <X
                    onClick={() => handleDisconnect()}
                    className="size-3 text-[#3F6870] md:size-4"
                  />
                </div>
              )}
            </>
          )}
        </button>
      </div>

      {/* Connect Wallet Modal */}
      <ConnectWalletModal
        open={isWalletModalOpen}
        onOpenChange={setIsWalletModalOpen}
        onConnectStarknet={handleConnectStarknet}
        onConnectPrivy={handleConnectPrivy}
      />
    </div>
  );
};

export default Navbar;
