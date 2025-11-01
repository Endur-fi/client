import React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAtomValue } from "jotai";
import { lstConfigAtom } from "@/store/common.store";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";

interface PlatformCardProps {
  name: string;
  description: React.ReactNode | string;
  icon: React.ReactNode;
  apy: number | null;
  xstrkLent: number | null;
  isSelected: boolean;
  onClick: () => void;
  baseApy?: number | null;
}

export function PlatformCard({
  name,
  description,
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
    <Label>
      <Card
        // onClick={onClick}
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
        <div className="flex w-full flex-col gap-1">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="platform-select-checkbox"
                defaultChecked
                className="rounded-[5px] border-[1.5px] border-[#939494] data-[state=checked]:border-[#17876D] data-[state=checked]:bg-transparent dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-[#17876D]"
                checked={isSelected}
                onCheckedChange={onClick}
                indicatorClassName="rounded-[2.8px] group-data-[state=checked]:bg-[#17876D]"
              />
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-200",
                )}
              >
                {icon}
              </div>

              <div>
                <div
                  className={cn(
                    "text-sm font-semibold leading-[1] transition-colors duration-200",
                    "text-gray-700 group-hover:text-[#03624C]",
                    isSelected && "text-[#03624C]",
                  )}
                >
                  {name}
                </div>

                <div
                  className={cn(
                    "mt-[2.5px] text-xs transition-colors duration-200",
                    "text-gray-700",
                    // isSelected && "text-[#03624C]",
                  )}
                >
                  {description}
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

          <div className="w-full space-y-1 pl-7">
            <div
              className={cn(
                "flex w-full items-center justify-between text-xs transition-colors duration-200",
                "text-gray-500 group-hover:text-gray-600",
                isSelected && "text-gray-600",
              )}
            >
              Base Staking APY
              {apy === -1 ? (
                <span className="font-semibold text-orange-600">Maxed out</span>
              ) : apy !== -1 && typeof baseApy === "number" ? (
                <span
                  className={cn(
                    "text-gray-500 transition-colors duration-200",
                    "group-hover:text-gray-600",
                    isSelected && "text-gray-600",
                  )}
                >
                  {(baseApy * 100).toFixed(2)}%{" "}
                </span>
              ) : (
                <span className="inline-block h-3 w-10 animate-pulse rounded bg-gray-200" />
              )}
            </div>

            <div
              className={cn(
                "flex w-full items-center justify-between text-xs transition-colors duration-200",
                "text-gray-500 group-hover:text-gray-600",
                isSelected && "text-gray-600",
                apy === -1 && "hidden",
              )}
            >
              Vault Boost APY
              {apy !== -1 && typeof apy === "number" ? (
                <span
                  className={cn(
                    "text-gray-500 transition-colors duration-200",
                    "group-hover:text-gray-600",
                    isSelected && "text-gray-600",
                  )}
                >
                  <span className="font-semibold text-[#17876D]">
                    {apy.toFixed(2)}%
                  </span>
                </span>
              ) : (
                <span className="inline-block h-3 w-10 animate-pulse rounded bg-gray-200" />
              )}
            </div>
          </div>
        </div>
      </Card>
    </Label>
  );
}
