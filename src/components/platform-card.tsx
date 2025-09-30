import React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAtomValue } from "jotai";
import { lstConfigAtom } from "@/store/common.store";

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
  const lstConfig = useAtomValue(lstConfigAtom)!;
  const isBtc = lstConfig.LST_SYMBOL.toLowerCase().includes("btc");
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative w-full cursor-pointer border p-4 transition-all duration-200",
        "bg-white",
        "border-gray-200",
        "shadow-sm",
        isSelected && "!border-[#17876D] !bg-white !shadow-md",
        !isSelected && "opacity-60 grayscale-[0.3]",
        isSelected && "hover:border-[#17876D] hover:bg-white",
        !isSelected && "hover:border-[#17876D]",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-all duration-200",
              "group-hover:bg-gray-50",
              isSelected && "bg-gray-50",
            )}
          >
            {icon}
          </div>
          <div>
            <div
              className={cn(
                "text-sm font-semibold transition-colors duration-200",
                "text-gray-700 group-hover:text-[#03624C]",
                isSelected && "text-[#03624C]",
              )}
            >
              {name}
            </div>
            <div
              className={cn(
                "text-xs transition-colors duration-200",
                "text-gray-500 group-hover:text-gray-600",
                isSelected && "text-gray-600",
              )}
            >
              APY:{" "}
              {typeof apy === "number" && typeof baseApy === "number" ? (
                <span
                  className={cn(
                    "text-gray-500 transition-colors duration-200",
                    "group-hover:text-gray-600",
                    isSelected && "text-gray-600",
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
              "text-lg font-bold transition-colors duration-200",
              "text-gray-700 group-hover:text-[#03624C]",
              isSelected && "text-[#03624C]",
            )}
          >
            {typeof xstrkLent === "number" ? (
              `${xstrkLent.toFixed(isBtc ? 8 : 2)}`
            ) : (
              <span className="inline-block h-5 w-12 animate-pulse rounded bg-gray-200" />
            )}
          </div>
          <div
            className={cn(
              "text-xs transition-colors duration-200",
              "text-gray-500 group-hover:text-gray-600",
              isSelected && "text-gray-600",
            )}
          >
            Supplied
          </div>
        </div>
      </div>
    </Card>
  );
}
