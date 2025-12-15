"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet } from "lucide-react";
import { Icons } from "@/components/Icons";
import { cn } from "@/lib/utils";

export interface ConnectWalletModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConnectStarknet?: () => void;
  onConnectPrivy?: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  open,
  onOpenChange,
  onConnectStarknet,
  onConnectPrivy,
}) => {
  const handleStarknetClick = () => {
    // Close modal immediately before opening StarknetKit modal
    onOpenChange?.(false);
    // Call the connect handler
    onConnectStarknet?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md border-[#ECECED80] bg-white">
        <DialogHeader>
          <DialogTitle className="mb-6 text-center text-xl font-bold text-[#03624C]">
            Connect Wallet
          </DialogTitle>

          <DialogDescription className="mb-6 text-center text-xs text-[#8D9C9C]">
            Choose how you want to connect to Endur
          </DialogDescription>
        </DialogHeader>

        {/* Connection Options */}
        <div className="space-y-4">
          {/* Primary: Starknet Wallets */}
          <button
            onClick={handleStarknetClick}
            className={cn(
              "focus:ring-none flex w-full items-center gap-4 rounded-xl border border-[#ECECED80] bg-[#AACBC433] p-5 transition-all hover:shadow-md focus:outline-none",
            )}
            type="button"
          >
            <Wallet className="h-10 w-10 text-[#17876D]" />

            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-[#03624C]">
                Starknet Wallets
              </div>
              <div className="text-xs text-[#8D9C9C]">
                Argent, Braavos, and more
              </div>
            </div>
          </button>

          {/* Secondary: Privy */}
          <button
            onClick={onConnectPrivy}
            className={cn(
              "focus:ring-none flex w-full items-center gap-4 rounded-xl border border-[#ECECED80] bg-[#AACBC433] p-5 transition-all hover:shadow-md focus:outline-none",
            )}
            type="button"
          >
            <Icons.mail className="h-10 w-10 text-[#17876D]" />

            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-[#03624C]">
                Email & Social
              </div>
              <div className="text-xs text-[#8D9C9C]">
                Connect with Google or Email
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
