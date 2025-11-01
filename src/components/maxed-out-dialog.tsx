"use client";

import React from "react";
import { Figtree } from "next/font/google";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const font = Figtree({ subsets: ["latin-ext"] });

const MaxedOutDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(font.className, "p-8 sm:max-w-md")}
        hideCloseIcon
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-[#17876D]">
            Vault Maxed Out
          </DialogTitle>
          <DialogDescription className="!mt-3 text-center text-sm text-[#8D9C9C]">
            The vault is currently maxed out, may open in future.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => onOpenChange(false)}
            className="rounded-lg bg-[#17876D] px-6 py-2 text-sm font-semibold text-white hover:bg-[#17876D]/90 focus:outline-none focus:ring-0"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaxedOutDialog;
