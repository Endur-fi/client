import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import MyNumber from "@/lib/MyNumber";

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
}

const TokenPairDisplay: React.FC<{ tokens: TokenDisplay[] }> = ({ tokens }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center border-white bg-white">
      <div className="size-6 rounded-full border-[1.5px] border-white bg-white">
        <img src="https://app.endur.fi/logo.svg" />
      </div>
      {tokens[1]?.icon && (
        <div className="-ml-2 size-6 rounded-full border-[1.5px] border-white bg-white">
          {tokens[1].icon}
        </div>
      )}
    </div>
    <span className="text-sm font-medium">
      {tokens.map((t) => t.name).join("/")}
    </span>
  </div>
);

const ApyDisplay: React.FC<{ apy: DefiCardProps["apy"] }> = ({ apy }) => {
  if (!apy) return null;

  const renderValue = () => {
    if (apy.isLoading) return <Skeleton className="h-6 w-16" />;
    if (!apy.value || apy.error) return "-";
    return `${apy.value.toFixed(2)}%`;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#8D9C9C]">APY</span>
      <span className="text-lg font-semibold text-[#17876D]">
        {renderValue()}
      </span>
    </div>
  );
};

const ProtocolBadges: React.FC<{ badges: ProtocolBadge[] }> = ({ badges }) => (
  <div className="flex max-w-[180px] flex-wrap justify-end gap-1.5">
    {badges.map((badge, index) => (
      <div
        key={index}
        className={cn(
          "whitespace-nowrap rounded-full px-2.5 py-1 text-xs",
          badge.color,
        )}
      >
        {badge.type}
      </div>
    ))}
  </div>
);

const ActionButtons: React.FC<{ action: ProtocolAction | undefined }> = ({
  action,
}) => {
  if (!action) {
    return (
      <Button className="w-full rounded-xl bg-[#E9F3F0] px-4 py-2.5 text-sm font-medium text-[#17876D] hover:bg-[#DBE9E4]">
        Coming soon
      </Button>
    );
  }

  return (
    <Link
      href={action.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full"
      onClick={action.onClick}
    >
      <Button
        className={cn(
          "w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
          "bg-[#17876D] text-white hover:bg-[#146D57]",
        )}
      >
        {action.buttonText}
      </Button>
    </Link>
  );
};

const DefiCard: React.FC<DefiCardProps> = ({
  tokens,
  protocolIcon,
  badges,
  description,
  apy,
  action,
}) => {
  if (apy && apy.isLoading) {
    return (
      <div className="flex h-auto min-h-[200px] w-full min-w-[330px] flex-col rounded-xl bg-white p-5">
        <Skeleton className="mb-2 h-6 w-1/2" />
        <Skeleton className="mb-4 h-6 w-1/3" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-4 h-4 w-2/3" />
        <Skeleton className="mt-auto h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-auto min-h-[200px] w-full min-w-[330px] flex-col rounded-xl bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <TokenPairDisplay tokens={tokens} />
          <ApyDisplay apy={apy} />
        </div>

        <div className="flex items-center gap-2">
          <ProtocolBadges badges={badges} />
          <div className="w-[30px]">{protocolIcon}</div>
        </div>
      </div>

      <h3 className="mt-4 text-sm text-[#4B5563]">{description}</h3>

      <div className="mt-auto pt-4">
        <ActionButtons action={action} />
      </div>
    </div>
  );
};

export default DefiCard;
