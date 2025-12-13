import Link from "next/link";
import React from "react";
import { Star, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import MyNumber from "@/lib/MyNumber";
import { cn, formatNumber } from "@/lib/utils";

export interface TokenDisplay {
  icon: React.ReactNode;
  name: string;
  holding?: MyNumber;
}

export interface ProtocolBadge {
  type: string;
  color: string;
}

export interface ProtocolAction {
  type: string;
  link: string;
  buttonText: string;
  variant?: "primary" | "secondary" | "tertiary";
  onClick?: () => void;
}

interface DefiCardProps {
  tokens: TokenDisplay[];
  protocolIcon: React.ReactNode;
  badges: ProtocolBadge[];
  description: string;
  apy?: { value: number | null; error: Error | null; isLoading: boolean };
  action: ProtocolAction | undefined;
  isBorrow?: boolean;
  maxLTV?: number;
  capacity?: {
    used: number;
    total: number | null; // null means no limit
  };
  rewardPoints?: string;
  onActionClick?: (link: string, onClick?: () => void) => void;
}

const DefiCard: React.FC<DefiCardProps> = ({
  tokens,
  protocolIcon,
  badges,
  description,
  apy,
  action,
  isBorrow = false,
  maxLTV,
  capacity,
  rewardPoints,
  onActionClick,
}) => {
  // Accent colors: green for supply, yellow/orange for borrow
  const accentColor = isBorrow
    ? {
        yieldBg: "bg-[#FEF3C7]",
        yieldText: "text-[#D97706]",
        buttonBg: "bg-[#D69733]",
      }
    : {
        yieldBg: "bg-[#D1FAE5]",
        yieldText: "text-[#059669]",
        buttonBg: "bg-[#10B981]",
      };

  const yieldLabel = isBorrow ? "Borrow rate" : "Supply yield";
  const yieldValue = apy?.isLoading
    ? "-"
    : apy?.value !== null && apy?.value !== undefined && !apy?.error
      ? `${apy.value.toFixed(2)}%`
      : "-";

  const capacityText = capacity
    ? capacity.total === null
      ? null // No limit - will show "No limit" instead
      : isBorrow
        ? `$${formatNumber(capacity.used)} used of $${formatNumber(capacity.total)}`
        : `${formatNumber(capacity.used)} used of ${formatNumber(capacity.total)}`
    : null;
  const capacityPercent =
    capacity && capacity.total !== null && capacity.total > 0
      ? (capacity.used / capacity.total) * 100
      : 0;

  if (apy && apy.isLoading) {
    return (
      <div className="flex h-auto min-h-[280px] w-full flex-col rounded-xl bg-white p-4 shadow-sm">
        <Skeleton className="mb-4 h-6 w-1/2" />
        <Skeleton className="mb-4 h-12 w-24" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-4 h-2 w-full" />
        <Skeleton className="mb-2 h-10 w-full" />
        <Skeleton className="mb-2 h-10 w-full" />
        <Skeleton className="mt-auto h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-auto w-full flex-col gap-4 rounded-xl border-[#E5E8EB] bg-white p-4 shadow-sm">
      {/* Header Section */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          {/* Token Pair */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center -space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full">
                {tokens[0]?.icon}
              </div>
              {tokens[1]?.icon && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full">
                  {tokens[1].icon}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-[#1A1F24]">
              {tokens.map((t) => t.name).join("/")}
            </span>
          </div>
          {/* Badge */}
          {badges[0] && (
            <div
              className={cn(
                "inline-block rounded-full px-2.5 py-1 text-xs font-medium",
                badges[0].color,
              )}
            >
              {badges[0].type}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {/* Protocol Icon */}
          <div className="flex h-6 w-6 items-center justify-center rounded">
            {protocolIcon}
          </div>
          {/* Max LTV */}
          {maxLTV !== undefined && (
            <span className="text-xs text-[#6B7780]">
              Max LTV - {maxLTV.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Yield Section */}
        <div className="mb-4">
          <div className="mb-1.5 text-xs text-[#6B7780]">{yieldLabel}</div>
          <div
            className={cn(
              "inline-block rounded-lg px-3 py-2 text-lg font-bold",
              accentColor.yieldBg,
              accentColor.yieldText,
            )}
          >
            {yieldValue}
          </div>
        </div>

        {/* Capacity Section */}
        {capacity ? (
          capacityText ? (
            <div className="mb-4">
              <div className="mb-2 text-xs text-[#6B7780]">
                <span className="font-medium text-[#1A1F24]">
                  {isBorrow
                    ? `$${formatNumber(capacity.used, 2, true)}`
                    : formatNumber(capacity.used, 2, true)}
                </span>{" "}
                used of{" "}
                {isBorrow
                  ? `$${formatNumber(capacity.total!, 2, true)}`
                  : formatNumber(capacity.total!, 2, true)}
              </div>
              <Progress
                value={Math.min(capacityPercent, 100)}
                className={cn(
                  "h-1.5 bg-[#E5E8EB]",
                  isBorrow ? "[&>div]:bg-[#F59E0B]" : "[&>div]:bg-[#10B981]",
                )}
              />
            </div>
          ) : (
            <div className="mb-4">
              <div className="mb-2 text-xs text-[#6B7780]">
                <span className="font-medium text-[#1A1F24]">No limit</span>
              </div>
            </div>
          )
        ) : null}
      </div>

      {/* Reward Points Section */}
      {rewardPoints && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#F5F5F0] px-3 py-2">
          <Star className="h-4 w-4 text-[#6B7780]" />
          <span className="text-xs text-[#1A1F24]">{rewardPoints}</span>
        </div>
      )}

      {/* Feature Description */}
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#F7F9FA] px-3 py-2">
        <HelpCircle className="h-4 w-4 text-[#6B7780]" />
        <span className="text-xs text-[#1A1F24]">{description}</span>
      </div>

      {/* Action Button */}
      <div className="mt-auto">
        {action ? (
          onActionClick ? (
            <Button
              onClick={() => onActionClick(action.link, action.onClick)}
              className={cn(
                "w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition-opacity",
                accentColor.buttonBg,
              )}
            >
              {action.buttonText}
            </Button>
          ) : (
            <Link
              href={action.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={action.onClick}
            >
              <Button
                className={cn(
                  "w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition-opacity",
                  accentColor.buttonBg,
                )}
              >
                {action.buttonText}
              </Button>
            </Link>
          )
        ) : (
          <Button
            disabled
            className="w-full rounded-lg bg-[#E5E8EB] px-4 py-3 text-sm font-semibold text-[#6B7780]"
          >
            Coming soon
          </Button>
        )}
      </div>
    </div>
  );
};

export default DefiCard;
