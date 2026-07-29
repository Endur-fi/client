"use client";

import { Check, ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ShieldAndStakeBannerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSelected: boolean;
  onSelectedChange: (selected: boolean) => void;
  /** When true, the wallet doesn't support shielded mode: disable the option. */
  disabled?: boolean;
  /** When false (no wallet connected), the tooltip prompts to connect a wallet instead. */
  isWalletConnected?: boolean;
};

export const ShieldAndStakeBanner = ({
  isOpen,
  onOpenChange,
  isSelected,
  onSelectedChange,
  disabled = false,
  isWalletConnected = true,
}: ShieldAndStakeBannerProps) => {
  const option = (
    <button
      type="button"
      onClick={() => !disabled && onSelectedChange(!isSelected)}
      aria-disabled={disabled}
      className={cn(
        "box-border flex w-full flex-none grow-0 flex-row items-start gap-3 self-stretch rounded-[10px] border px-4 py-[13px] text-left transition-all",
        isSelected
          ? "border-[#81C3B4] bg-[#E8F7F4]"
          : "border-[#E5E8EB] bg-white hover:border-[#81C3B4]/60",
        disabled &&
          "cursor-not-allowed select-none bg-[#F5F7FA] opacity-60 hover:border-[#E5E8EB]",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors",
          isSelected ? "bg-[#17876D]" : "border border-[#81C3B4] bg-white",
          disabled && "border-[#C4CBCF] bg-[#E5E8EB]",
        )}
      >
        {isSelected && (
          <Check className="size-2.5 text-white" strokeWidth={3} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className={cn(
            "text-sm font-semibold",
            isSelected ? "text-[#0D5F4E]" : "text-[#6B7780]",
            disabled && "text-[#8D9C9C]",
          )}
        >
          Shield and Stake
        </p>
        <p
          className={cn(
            "text-xs leading-relaxed",
            isSelected ? "text-[#3F6870]" : "text-[#8D9C9C]",
            disabled && "text-[#ACB4B8]",
          )}
        >
          Enable privacy shielding for your deposit. Your assets will be
          hidden using zero-knowledge proofs while earning yield.
        </p>
      </div>
    </button>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-[#17876D] hover:opacity-80">
        <h3 className="font-semibold">Shield & Stake</h3>
        <span className="text-[#8D9C9C]">(optional)</span>
        <ChevronDown className="size-3 text-[#8D9C9C] transition-transform duration-200 data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        {disabled ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>{option}</TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-60 rounded-md border border-[#03624C] bg-white text-center text-[#03624C]"
              >
                {isWalletConnected
                  ? "Your connected wallet doesn't support shielding"
                  : "Please connect wallet"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          option
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
