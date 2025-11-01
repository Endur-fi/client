"use client";

import React from "react";
import { Figtree } from "next/font/google";
import { TwitterShareButton } from "react-share";

import { LSTAssetConfig } from "@/constants";
import type { Platform } from "@/features/staking/components/stake-sub-tab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { Icons } from "./Icons";

interface ThankYouDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lstConfig: LSTAssetConfig;
  apyValue: number;
  selectedPlatform: Platform;
  getPlatformYield: (platform: Platform) => number;
  getPlatformConfig: (platform: Platform) => any;
}

const font = Figtree({ subsets: ["latin-ext"] });

const ThankYouDialog: React.FC<ThankYouDialogProps> = ({
  open,
  onOpenChange,
  lstConfig,
  apyValue,
  selectedPlatform,
  getPlatformYield,
  getPlatformConfig,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(font.className, "p-16 sm:max-w-xl")}>
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-semibold text-[#17876D]">
            Thank you for taking a step towards decentralizing Starknet!
          </DialogTitle>
          <DialogDescription className="!mt-5 text-center text-sm">
            While your stake is being processed, if you like Endur, do you mind
            sharing on X/Twitter?
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex items-center justify-center">
          <TwitterShareButton
            url={`https://endur.fi`}
            title={`Just staked my ${lstConfig.SYMBOL} on @endurfi, earning ${(apyValue * 100 + (selectedPlatform !== "none" ? getPlatformYield(selectedPlatform) : 0)).toFixed(2)}% APY! 🚀 \n\n${selectedPlatform !== "none" ? `My ${lstConfig.LST_SYMBOL} is now with an additional ${getPlatformYield(selectedPlatform).toFixed(2)}% yield on ${getPlatformConfig(selectedPlatform).platform}! 📈\n\n` : ""}${lstConfig.SYMBOL !== "STRK" ? `Building the future of Bitcoin staking on Starknet` : `Laying the foundation for decentralising Starknet`} with Endur!\n\n`}
            related={["endurfi", "troves", "karnotxyz"]}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".6rem",
              padding: ".5rem 1rem",
              borderRadius: "8px",
              backgroundColor: "#17876D",
              color: "white",
              textWrap: "nowrap",
            }}
          >
            Share on
            <Icons.X className="size-4 shrink-0" />
          </TwitterShareButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThankYouDialog;
