"use client";

import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StakingRewardsInfoProps {
  className?: string;
}

const StakingRewardsInfo: React.FC<StakingRewardsInfoProps> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        "w-full rounded-[14px] border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-3 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Info className="w-14 text-[#3B82F6]" />
        <p className="text-sm text-[#3B82F6]">
          Staking rewards are automatically claimed and compounded, gradually
          increasing the value of your xSTRK/xyBTCs over time.
        </p>
      </div>
    </div>
  );
};

export default StakingRewardsInfo;
