import React from "react";

import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface InfoTooltipInterface {
  children: React.ReactNode;
  tooltip: React.ReactNode;
  tooltipTriggerClassName?: string;
  tooltipContentClassName?: string;
  side?: "bottom" | "top" | "right" | "left" | undefined;
}

const InfoTooltip: React.FC<InfoTooltipInterface> = ({
  children,
  tooltipTriggerClassName,
  tooltip,
  tooltipContentClassName,
  side,
}) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger
          className={cn("ml-1", tooltipTriggerClassName)}
          tabIndex={-1}
          asChild
        >
          {tooltip}
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
