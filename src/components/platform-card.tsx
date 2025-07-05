import React from "react";

import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

interface PlatformCardProps {
  name: string;
  icon: React.ReactNode;
  apy: number | null;
  xstrkLent: number | null;
  isSelected: boolean;
  onClick: () => void;
  baseApy?: number | null;
}

export function PlatformCard({
  name,
  icon,
  apy,
  xstrkLent,
  isSelected,
  onClick,
  baseApy,
}: PlatformCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative w-[49.2%] cursor-pointer border p-3 transition-all duration-200",
        "bg-white/50 hover:bg-white",
        "border-gray-100 hover:border-[#17876D]",
        "shadow-sm hover:shadow",
        isSelected && "!border-[#17876D] !bg-white !shadow",
        {
          "!w-full py-3": name.includes("Troves"),
        },
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "transition-opacity duration-200",
              "opacity-40 group-hover:opacity-100",
              isSelected && "opacity-100",
            )}
          >
            {icon}
          </div>
          <div>
            <div
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                "text-gray-400 group-hover:text-[#03624C]",
                isSelected && "text-[#03624C]",
              )}
            >
              {name}
            </div>
            <div
              className={cn(
                "text-xs transition-colors duration-200",
                "text-gray-400 group-hover:text-gray-500",
                isSelected && "text-gray-500",
              )}
            >
              APY:{" "}
              {apy && baseApy ? (
                <span
                  className={cn(
                    "text-gray-400 transition-colors duration-200",
                    "group-hover:text-[#03624C]",
                    isSelected && "text-[#03624C]",
                  )}
                >
                  {(baseApy * 100).toFixed(2)}%{" "}
                  <span className="font-semibold text-[#17876D]">
                    + {apy.toFixed(2)}%
                  </span>
                </span>
              ) : (
                <span className="inline-block h-3 w-10 animate-pulse rounded bg-gray-200" />
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-lg font-semibold transition-colors duration-200",
              "text-gray-400 group-hover:text-[#03624C]",
              isSelected && "text-[#03624C]",
            )}
          >
            {typeof xstrkLent === "number" ? (
              `${formatNumber(xstrkLent, 2, true)}`
            ) : (
              <span className="inline-block h-5 w-12 animate-pulse rounded bg-gray-200" />
            )}
          </div>
          <div
            className={cn(
              "text-xs transition-colors duration-200",
              "text-gray-400 group-hover:text-gray-500",
              isSelected && "text-gray-500",
            )}
          >
            Supplied
          </div>
        </div>
      </div>
    </Card>
  );
}
