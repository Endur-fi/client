"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { LINKS } from "@/constants";

interface NativeStakingWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NativeStakingWarningDialog: React.FC<
  NativeStakingWarningDialogProps
> = ({ open, onOpenChange }) => {
  const handleStay = () => {
    onOpenChange(false);
  };

  const handleContinue = () => {
    window.open(LINKS.DASHBOARD_URL, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[350px] rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-white p-3 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] lg:max-w-[478px] lg:p-6">
        <DialogHeader className="space-y-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(214,151,51,0.2)]">
                <AlertTriangle className="h-6 w-6 text-[#D69733]" />
              </div>
              <DialogTitle className="text-md text-left leading-6 text-[#0a0a0a] lg:text-xl">
                You're switching to Native Staking
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <DialogDescription className="space-y-2 pt-4 text-left text-[10px] text-[#717182] lg:text-sm">
          <p>
            You're about to leave the liquid staking interface and move to
            Starknet's native staking dashboard.
          </p>
          <p>
            While this dashboard is also{" "}
            <span className="font-semibold">built by Endur</span>, native
            staking is not liquid staking and does not offer liquidity or LST
            benefits.
          </p>
          <p>
            To continue with liquid staking and its advantages, stay on
            app.endur.fi.
          </p>
        </DialogDescription>
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleContinue}
            className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.1)] bg-white p-2 text-[10px] font-medium leading-5 text-black transition-opacity hover:opacity-80 lg:text-sm"
          >
            Continue to Native Staking
          </button>
          <button
            onClick={handleStay}
            className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#17876d] p-2 text-[10px] leading-5 text-white shadow-[0px_0px_0px_0.098px_rgba(161,161,161,0.02)] transition-opacity hover:opacity-90 lg:text-sm"
          >
            Stay on Liquid Staking
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
