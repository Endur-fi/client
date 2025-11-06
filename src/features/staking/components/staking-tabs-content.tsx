import React from "react";
import { Info } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import InfoTooltip from "@/components/info-tooltip";
import {
  Tabs as ShadCNTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import StakeSubTab from "./stake-sub-tab";
import UnstakeSubTab from "./unstake-sub-tab";
import WithdrawSubTab from "./withdraw-sub-tab";

interface StakingTabsContentProps {
  value: "strk" | "btc";
  activeSubTab: string;
  handleSubTabChange: (value: string) => void;
  getMessage: () => React.ReactNode;
  useCustomTooltip?: boolean; // Optional flag to control which tooltip component to use
}

export default function StakingTabsContent({
  value,
  activeSubTab,
  handleSubTabChange,
  getMessage,
  useCustomTooltip = true,
}: StakingTabsContentProps) {
  const renderWithdrawLogTooltip = () => {
    if (useCustomTooltip) {
      return (
        <InfoTooltip
          showArrow={false}
          tooltipContentClassName="mb-0"
          icon={
            <Info className="ml-2 size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
          }
        >
          <div className="bg-white text-[#03624C]">
            Learn more about withdraw logs{" "}
            <Link
              target="_blank"
              href="https://docs.endur.fi/docs/concepts/withdraw-log"
              className="text-blue-600 underline"
            >
              here
            </Link>
          </div>
        </InfoTooltip>
      );
    }

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger className="ml-1" tabIndex={-1} asChild>
            <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-[13rem] rounded-md border border-[#03624C] bg-white text-[#03624C]"
          >
            Learn more about withdraw logs{" "}
            <Link
              target="_blank"
              href="https://docs.endur.fi/docs/concepts/withdraw-log"
              className="text-blue-600 underline"
            >
              here
            </Link>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <TabsContent
      value={value}
      className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
    >
      <div
        className={cn(
          "mt-6 min-h-[31.5rem] w-full rounded-xl bg-white shadow-xl lg:h-fit lg:pb-5",
        )}
      >
        <ShadCNTabs
          onValueChange={(value: any) => handleSubTabChange(value)}
          value={activeSubTab}
          defaultValue="stake"
          className="col-span-2 h-full w-full lg:mt-0"
        >
          <TabsList
            className={cn(
              "flex w-full items-center justify-start rounded-none border-b bg-transparent px-3 pb-5 pt-5 lg:pt-8",
            )}
          >
            <TabsTrigger
              value="stake"
              className="group relative rounded-none border-none bg-transparent pl-0 text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:pl-3 lg:text-base"
            >
              Stake
              <div className="absolute -bottom-[7.5px] left-0 hidden h-[2px] w-10 rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-3" />
            </TabsTrigger>
            <TabsTrigger
              value="unstake"
              className="group relative rounded-none border-none bg-transparent text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
            >
              Unstake
              <div className="absolute -bottom-[7.5px] left-3 hidden h-[2px] w-[3.3rem] rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-3.5" />
            </TabsTrigger>
            <TabsTrigger
              value="withdraw"
              className="group relative rounded-none border-none bg-transparent text-sm font-medium text-[#8D9C9C] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-t-0 data-[state=active]:shadow-none lg:text-base"
            >
              Withdraw log
              {renderWithdrawLogTooltip()}
              <div className="absolute -bottom-[7.5px] left-3 hidden h-[2px] w-[5rem] rounded-full bg-black group-data-[state=active]:flex lg:-bottom-[5.5px] lg:left-[16px]" />
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="stake"
            className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
          >
            <StakeSubTab />
          </TabsContent>

          <TabsContent
            value="unstake"
            className="h-full pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 lg:pb-0"
          >
            <UnstakeSubTab />
          </TabsContent>

          <TabsContent
            value="withdraw"
            className="h-full focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <WithdrawSubTab />
          </TabsContent>
        </ShadCNTabs>
      </div>

      {(activeSubTab === "unstake" || activeSubTab === "stake") && (
        <div
          className={cn(
            "mb-2 mt-5 flex items-center rounded-md bg-[#FFC4664D] py-3 pl-4 pr-3 text-xs text-[#D69733] lg:mb-4 lg:text-sm",
            {
              "bg-[#C0D5CE69] text-[#134c3d9e]": activeSubTab === "stake",
            },
          )}
        >
          <span className="mr-3 flex size-4 shrink-0 items-center justify-center rounded-full text-xl lg:size-6">
            {activeSubTab === "unstake" ? "⚠️" : <Info />}
          </span>
          {getMessage()}
        </div>
      )}
    </TabsContent>
  );
}
