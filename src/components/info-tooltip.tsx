import React from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface InfoTooltipProps {
  children: React.ReactNode;
  variant?: "info" | "dotted";
  iconClassName?: string;
  tooltipContentClassName?: string;
  side?: "bottom" | "top" | "right" | "left";
  icon?: React.ReactNode;
  showArrow?: boolean; // For dotted variant
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  children,
  variant = "info",
  iconClassName,
  tooltipContentClassName,
  side = "top",
  icon,
  showArrow = true,
}) => {
  const defaultIcon = (
    <Info
      className={cn(
        "h-4 w-4 cursor-help text-gray-500 hover:text-gray-700",
        iconClassName,
      )}
    />
  );

  const triggerElement = icon || defaultIcon;

  if (variant === "dotted") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger
            className={cn("inline-flex", iconClassName)}
            tabIndex={-1}
            asChild
          >
            <span>{triggerElement}</span>
          </TooltipTrigger>
          <TooltipContent
            side={side}
            className={cn(
              "relative z-10 w-[300px] max-w-[300px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-black shadow-lg",
              tooltipContentClassName,
            )}
          >
            {children}
            {showArrow && (
              <div
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 transform border-l-4 border-r-4 border-transparent",
                  side === "top" && "top-full border-t-4 border-t-gray-200",
                  side === "bottom" &&
                    "bottom-full border-b-4 border-b-gray-200",
                  side === "left" &&
                    "left-full top-1/2 -translate-y-1/2 border-l-4 border-l-gray-200",
                  side === "right" &&
                    "right-full top-1/2 -translate-y-1/2 border-r-4 border-r-gray-200",
                )}
              />
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // default "info" variant
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger
          className={cn("inline-flex", iconClassName)}
          tabIndex={-1}
          asChild
        >
          <span>{triggerElement}</span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            "max-w-[13rem] rounded-md border border-[#03624C] bg-white text-[#03624C]",
            tooltipContentClassName,
          )}
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InfoTooltip;
