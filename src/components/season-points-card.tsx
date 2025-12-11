"use client";

import React from "react";
import Link from "next/link";
import { Icons } from "./Icons";
import { cn } from "@/lib/utils";

interface SeasonPointsCardProps {
  className?: string;
}

const SeasonPointsCard: React.FC<SeasonPointsCardProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "w-full rounded-xl bg-gradient-to-b from-[#0D5F4E] to-[#11998E] px-2 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icons.stars className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white">
            Season 2 Points Active
          </h4>
          <p className="mt-1 text-xs text-white">
            Stake, use DeFi, or contribute to Endur to earn points.
          </p>
        </div>
      </div>
      <div className="mt-3 flex w-full justify-center">
        <Link
          href="#"
          className="w-full rounded-md bg-[#FFFFFF33] px-4 py-2 text-center text-xs font-medium text-white transition-all hover:bg-[#6BA89A]"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
};

export default SeasonPointsCard;
