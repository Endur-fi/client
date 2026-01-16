"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import { cn, formatNumber, formatNumberWithCommas } from "@/lib/utils";
import { Calendar, Clock, Flame, TrendingUp, Trophy } from "lucide-react";
import { useAccount } from "@starknet-react/core";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useQuery } from "@apollo/client";
import { GET_USER_POINTS_BREAKDOWN } from "@/constants/queries";
import { pointsApolloClient } from "@/lib/apollo-client";
import React, { useState, useEffect } from "react";

const seasons = [
  {
    season: 2,
    isActive: true,
    startDate: new Date("2025-12-16:00:00Z"),
    endDate: new Date("2026-06-15T00:00:00Z"),
    points: 7500000,
  },
  {
    season: 1,
    isActive: false,
    startDate: new Date("2024-11-27T00:00:00Z"),
    endDate: new Date("2025-12-15T00:00:00Z"),
    points: 10000000,
  },
];

function getDurationString(start: Date, end: Date): string {
  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays >= 365) {
    const years = Math.floor(diffInDays / 365);
    return `${years} year${years > 1 ? "s" : ""} duration`;
  } else if (diffInDays >= 30) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? "s" : ""} duration`;
  } else if (diffInDays >= 7) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} duration`;
  }
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} duration`;
}

/**
 * Calculates the next Tuesday at 10:00 UTC based on lastPointsMultiplierEndTimestamp
 * @param lastPointsMultiplierEndTimestamp Unix timestamp (seconds) of the last points multiplier end timestamp
 * @returns Date object representing the next Tuesday at 10:00 UTC
 */
function getNextDropTime(lastPointsMultiplierEndTimestamp: number | null | undefined): Date {
  const now = new Date();
  
  // If we have a lastPointsMultiplierEndTimestamp, use it as the reference point
  if (lastPointsMultiplierEndTimestamp) {
		const referenceDate = new Date(lastPointsMultiplierEndTimestamp * 1000);
    
    // Check if lastPointsMultiplierEndTimestamp is today (Tuesday)
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const referenceDay = new Date(referenceDate);
    referenceDay.setUTCHours(0, 0, 0, 0);
    
    // If lastPointsMultiplierEndTimestamp is today (Tuesday), skip today and use next Tuesday
    if (referenceDay.getTime() === today.getTime() && referenceDate.getUTCDay() === 2) {
      // It's today (Tuesday), so next drop is next Tuesday at 10 UTC
      const nextDrop = new Date(referenceDate);
      nextDrop.setUTCDate(referenceDate.getUTCDate() + 7);
      nextDrop.setUTCHours(10, 0, 0, 0);
      return nextDrop;
    }
  }
  
  // Fallback to current time logic if no timestamp provided
  const currentDay = now.getUTCDay();
  const targetDay = 2; // Tuesday
  
  let daysUntilTuesday = (targetDay - currentDay + 7) % 7;
  
  if (daysUntilTuesday === 0) {
    const currentHour = now.getUTCHours();
    if (currentHour >= 10) {
      daysUntilTuesday = 7; // Next Tuesday
    }
  }
  
  const nextDrop = new Date(now);
  nextDrop.setUTCDate(now.getUTCDate() + daysUntilTuesday);
  nextDrop.setUTCHours(10, 0, 0, 0);
  
  return nextDrop;
}

/**
 * Formats the time difference as "X Days, Y Hours"
 * @param targetDate The target date to count down to
 * @returns Formatted string like "6 Days, 5 Hours"
 */
function formatTimeUntilDrop(targetDate: Date): string {
  const now = new Date();
  const diffInMs = targetDate.getTime() - now.getTime();
  
  if (diffInMs <= 0) {
    return "0 Days, 0 Hours";
  }
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const days = Math.floor(diffInSeconds / 86400);
  const hours = Math.floor((diffInSeconds % 86400) / 3600);
  
	if (days > 0) {
		return `${days} Day${days !== 1 ? "s" : ""}, ${hours} Hour${hours !== 1 ? "s" : ""}`;
	}
	const minutes = Math.floor((diffInSeconds % 3600) / 60);
	return `${hours} Hour${hours !== 1 ? "s" : ""}, ${minutes} Minute${minutes !== 1 ? "s" : ""}`;
}

/**
 * Hook to get the time until next drop, updating every minute
 * @param lastPointsMultiplierEndTimestamp Unix timestamp (seconds) of the last points multiplier end timestamp
 */
function useNextDropCountdown(lastPointsMultiplierEndTimestamp: number | null | undefined): string {
  const [countdown, setCountdown] = useState<string>(() => {
    const nextDrop = getNextDropTime(lastPointsMultiplierEndTimestamp);
    return formatTimeUntilDrop(nextDrop);
  });

  useEffect(() => {
    const updateCountdown = () => {
      const nextDrop = getNextDropTime(lastPointsMultiplierEndTimestamp);
      setCountdown(formatTimeUntilDrop(nextDrop));
    };

    // Update immediately
    updateCountdown();

    // Update every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [lastPointsMultiplierEndTimestamp]);

  return countdown;
}

const SeasonInfoCards = ({ season }: { season: (typeof seasons)[0] }) => {
  return (
    <div
      key={season.season}
      className="flex flex-col gap-3 rounded-[14px] border border-[#E5E8EB] bg-white p-4 shadow-sm lg:gap-4 lg:p-4"
    >
      <div className="flex items-center gap-2">
        <div
          className={cn("rounded-full bg-[#5B616D] p-2 shadow-sm", {
            "bg-gradient-to-b from-[#0D5F4E] to-[#11998E]": season.isActive,
          })}
        >
          <Icons.trophy />
        </div>

        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1A1F24]">
          Season {season.season}
        </h3>

        <span
          className={cn(
            "flex items-center gap-1 rounded-md bg-[#5B616D] px-2 py-0.5 text-xs font-medium text-white",
            { "bg-[#0C4E3F]": season.isActive },
          )}
        >
          {season.isActive && <Icons.dot />}

          {season.isActive ? "ACTIVE" : "ENDED"}
        </span>
      </div>

      <div className="space-y-2 rounded-lg bg-[#F7FBFA] px-2 py-4">
        <div className="flex items-center gap-2">
          <Calendar
            className={cn("h-4 w-4 text-[#5B616D]", {
              "text-[#17876D]": season.isActive,
            })}
          />
          <span className={cn("text-sm font-bold text-[#021B1A]")}>
            Timeline
          </span>
        </div>
        <div>
          <p className="text-xs text-[#5B616D]">
            {season.startDate.toDateString()} - {season.endDate.toDateString()}
          </p>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-[#5B616D]" />
            <p className="text-xs text-[#5B616D]">
              {getDurationString(season.startDate, season.endDate)}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border border-[#E5E8EB] bg-[#F7F9FA] px-2 py-3",
          {
            "bg-gradient-to-b from-[#E8F7F4] to-[#F7FBFA]": season.isActive,
            "border-[#D4E8E3]": season.isActive,
          },
        )}
      >
        <div className="inline-flex items-center gap-2">
          <TrendingUp
            className={cn("h-4 w-4 text-[#5B616D]", {
              "text-[#17876D]": season.isActive,
            })}
          />
          <p
            className={cn("font-semibold", {
              "text-[#1A1F24]": season.isActive,
            })}
          >
            Points Pool
          </p>
        </div>
        <div>
          <p
            className={cn("text-lg font-bold text-[#5B616D]", {
              "text-[#17876D]": season.isActive,
            })}
          >
            {formatNumber(season.points)} Points
          </p>
        </div>
        <div>
          {/* TODO Add blog link */}
          <p className="text-xs text-[#5B616D]">
            {season.season === 2 ? (
              <span>
                Allocated 288k points weekly throughout the season. 70% of the
                points will be allocated to contributors and 30% to the users.{" "}
                <span className="font-semibold text-[#17876D]">
                  <a
                    className="text-[#17876D] underline"
                    href="https://docs.endur.fi/docs/community/endur-season-2"
                    target="_blank"
                  >
                    Learn more
                  </a>
                </span>
              </span>
            ) : (
              <span>
                Points based on STRK and BTC LSTs held in wallet or supported
                DeFi platforms. Overall points have been scaled down to 10M
                points.{" "}
                <span className="font-semibold">
                  <a
                    className="text-[#5B616D] underline"
                    href="https://blog.endur.fi/points"
                    target="_blank"
                  >
                    Learn more
                  </a>
                </span>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const StatsItem = ({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col gap-1">
      <span className="text-[12px] font-medium text-[#5B616D]">{label}</span>
      <h3
        className={cn("text-[14px] font-medium text-[#000]", valueClass ?? "")}
      >
        {value}
      </h3>
    </div>
  );
};

interface pointsBreakdownItem {
  multiplier: string;
  type: string;
  weekly: string;
  total: string;
}

const pointsBreakdownClassNameMaps: Record<
  string,
  { bg: string; border: string; text: string; chipBg: string }
> = {
  Contributor: {
    bg: "bg-[#D697330D]",
    border: "border-[#D6973340]",
    text: "text-[#D69733]",
    chipBg: "bg-[#D6973326]",
  },
  User: {
    bg: "bg-[#fff]",
    border: "border-[#D4E8E3]",
    text: "text-[#17876D]",
    chipBg: "bg-[#E8F5F2]",
  },
};

const PointsBreakdownItem = ({
  multiplier,
  type,
  weekly,
  total,
  title,
}: {
  multiplier: string;
  type: string;
  weekly: string;
  total: string;
  title: string;
}) => (
  <div className="flex flex-1 flex-row items-center gap-3">
    <div className="flex flex-1 flex-row items-center gap-3">
      <span
        className={cn(
          "rounded-[4px] bg-[#fff] px-2.5 py-[3px] text-[12px] font-medium text-[#17876D]",
          pointsBreakdownClassNameMaps[title].chipBg,
          pointsBreakdownClassNameMaps[title].text,
        )}
      >
        {multiplier}x
      </span>
      <span className={cn("text-[14px] font-medium text-[#021B1A]")}>
        {type}
      </span>
    </div>
		<div className="flex flex-row gap-3 items-start" >
			<div className="flex flex-col">
				<span className="text-[12px] font-medium text-[#868898]">Weekly</span>
				<span className="text-[14px] text-[#021B1A] leading-[20px]">+{weekly}</span>
			</div>
			<div className="flex flex-col">
				<span className="text-[12px] font-medium text-[#868898]">Total</span>
				<span className="text-[16px] font-medium text-[#17876D] leading-[20px]">{total}</span>
			</div>
		</div>
  </div>
);

const PointsBreakdownCard = ({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: pointsBreakdownItem[];
}) => {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 rounded-[14px] border border-[#D4E8E3] bg-white p-4 min-w-[340px]",
        pointsBreakdownClassNameMaps[title].border,
        pointsBreakdownClassNameMaps[title].bg,
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <h3 className="ledaing-[27px] text-[18px] font-medium text-[#021B1A]">
          {title}
        </h3>
        <span
          className={cn(
            "rounded-[4px] bg-white px-2 py-[3px] text-[12px] font-medium text-[#17876D]",
            pointsBreakdownClassNameMaps[title].text,
            pointsBreakdownClassNameMaps[title].chipBg,
          )}
        >
          {subtitle}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <PointsBreakdownItem
            key={item.type}
            title={title}
            multiplier={item.multiplier}
            type={item.type}
            weekly={item.weekly}
            total={item.total}
          />
        ))}
      </div>
    </div>
  );
};

const Season2Points = ({
  pointsBreakdown,
  userSeason2Points,
  weeklyEarned,
  epochsCompleted,
  lastPointsMultiplierEndTimestamp,
  isLoading,
}: {
  pointsBreakdown: {
    title: string;
    subtitle: string;
    items: pointsBreakdownItem[];
  }[];
  userSeason2Points: {
    rank: number|null;
    points: string;
  };
  weeklyEarned?: string;
  epochsCompleted?: number;
  lastPointsMultiplierEndTimestamp?: number;
  isLoading?: boolean;
}) => {
  const weeklyEarnedFormatted = weeklyEarned 
    ? `+${formatNumber(parseFloat(weeklyEarned) || 0, 2)} Pts`
    : "+0 Pts";
  const nextDropCountdown = useNextDropCountdown(lastPointsMultiplierEndTimestamp);
  const epochsCompletedFormatted = epochsCompleted !== undefined ? `${epochsCompleted}/26` : "1/26";

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#E5E8EB] bg-white px-4 py-3">
      {/* header */}
      <div className="flex flex-row gap-2">
        <div className="flex flex-1 flex-row items-center gap-2.5">
          <div className="h-10 w-10 rounded-[10px] bg-gradient-to-b from-[#0D5F4E] to-[#11998E] p-1.5">
            <Flame
              className="h-full w-full"
              color="#FFFFFF"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-[15px] font-medium text-[#021B1A]">
            Your Season 2
          </h3>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] font-medium text-[#5B616D]">
            Total Points
          </span>
          <h2 className="text-[24px] font-semibold leading-[28px] text-[#17876D]">
            {formatNumberWithCommas(userSeason2Points.points, 2)}
          </h2>
        </div>
      </div>
      {/* stats */}
      <div className="flex flex-1 flex-row flex-wrap gap-2 gap-y-4 rounded-[10px] bg-[#F7FBFA] p-3.5">
        <StatsItem
          label="Your Rank"
          value={userSeason2Points.rank ? `#${userSeason2Points.rank}` : "-"}
          valueClass="text-[20px] leading-[24px]"
        />
        <StatsItem
          label="Weekly Earned"
          value={isLoading ? "..." : weeklyEarnedFormatted}
          valueClass="text-[16px] text-[#17876D]"
        />
        <StatsItem 
          label="Epoch Completed" 
          value={isLoading ? "..." : epochsCompletedFormatted} 
        />
        <StatsItem label="Next Drop" value={nextDropCountdown} />
      </div>
      {/* points breakdown */}
      <div className="flex flex-1 flex-row flex-wrap gap-4">
        {isLoading ? (
          <div className="w-full flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#17876D] border-t-transparent" />
              <p className="text-[#021B1A]">Loading points data...</p>
            </div>
          </div>
        ) : pointsBreakdown.length > 0 ? (
          pointsBreakdown.map((item) => (
            <PointsBreakdownCard
              key={item.title}
              title={item.title}
              subtitle={item.subtitle}
              items={item.items}
            />
          ))
        ) : (
          <div className="w-full text-center text-sm text-[#5B616D] py-4">
            No points breakdown available
          </div>
        )}
      </div>
    </div>
  );
};

interface UserPointsBreakdownResponse {
  getUserPointsBreakdown: {
    weeklyEarned: string;
    epochsCompleted: number;
    lastPointsMultiplierEndTimestamp: number;
    breakdown: {
      userBreakdown: {
        title: string;
        multiplier: number;
        weeklyEarned: string;
        overall: string;
      }[];
      contributorBreakdown: {
        title: string;
        multiplier: number;
        weeklyEarned: string;
        overall: string;
      }[];
    };
  } | null;
}

const Points = ({ userSeason1Points, userSeason2Points }: { userSeason1Points: { rank: number|null, points: string }, userSeason2Points: { rank: number|null, points: string } }) => {
  const { address } = useAccount();
  const { connectWallet } = useWalletConnection();
  
  const { data: breakdownData, loading: breakdownLoading } = useQuery<UserPointsBreakdownResponse>(
    GET_USER_POINTS_BREAKDOWN,
    {
      client: pointsApolloClient,
      variables: { userAddress: address || "" },
      skip: !address,
      fetchPolicy: "network-only",
    }
  );

  // Transform API response to component format
  const pointsBreakdown: {
    title: string;
    subtitle: string;
    items: pointsBreakdownItem[];
  }[] = React.useMemo(() => {
    if (!breakdownData?.getUserPointsBreakdown) {
      return [];
    }

    const { userBreakdown, contributorBreakdown } = breakdownData.getUserPointsBreakdown.breakdown;

    const transformed: {
      title: string;
      subtitle: string;
      items: pointsBreakdownItem[];
    }[] = [];

    // Add contributor breakdown if there are items
    if (contributorBreakdown && contributorBreakdown.length > 0) {
      transformed.push({
        title: "Contributor",
        subtitle: "Liquidity Provider",
        items: contributorBreakdown.map((item) => ({
          multiplier: item.multiplier.toFixed(0),
          type: item.title,
          weekly: formatNumber(parseFloat(item.weeklyEarned) || 0, 2),
          total: formatNumber(parseFloat(item.overall) || 0, 2),
        })),
      });
    }

    // Add user breakdown if there are items
    if (userBreakdown && userBreakdown.length > 0) {
      transformed.push({
        title: "User",
        subtitle: "LST Power User",
        items: userBreakdown.map((item) => ({
          multiplier: item.multiplier.toFixed(0),
          type: item.title,
          weekly: formatNumber(parseFloat(item.weeklyEarned) || 0, 2),
          total: formatNumber(parseFloat(item.overall) || 0, 2),
        })),
      });
    }

    return transformed;
  }, [breakdownData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-[14px] bg-[#17876D26] px-4 py-1.5 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-row items-start gap-4 lg:items-center">
            <Image
              src="/leaderboard/announce.svg"
              width={80}
              height={80}
              alt="announce illustration"
              className="h-[50px] w-[50px] flex-shrink-0 lg:h-[80px] lg:w-[80px]"
            />

            <div className="flex flex-1 flex-col">
              <span className="flex flex-row items-center gap-2">
                <h2 className="text-[16px] font-semibold text-[#17876D] sm:text-[18px]">
                  Season 2 Points Program
                </h2>
                <span className="rounded-[100px] bg-[#38EF7D] px-[10px] py-[3px] text-[10px] font-[900] text-[#0D5F4E] sm:text-[11px]">
                  LIVE
                </span>
              </span>
              <p className="text-[12px] text-[#17876D] sm:text-[14px]">
                Earn points by staking on Endur throughout the season
              </p>
            </div>
          </div>

          <a href="https://docs.endur.fi/docs/community/endur-season-2" target="_blank"><Button className="flex-shrink-0 bg-[#17876D] text-[#F1F7F6]">
            View Details
          </Button></a>
        </div>
        {/* Timeline & Points Allocation Boxes */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
          {seasons.map((season) => (
            <SeasonInfoCards key={season.season} season={season} />
          ))}
        </div>
      </div>
      {/* your points */}
      {!address ? (
        <Button className="w-full bg-['transparent'] text-[#17876D] border border-[#17876D] hover:bg-[#17876D] hover:text-[#F1F7F6] py-6" onClick={() => connectWallet()}>
          Connect Wallet to View Your Points
        </Button>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-row rounded-[14px] border border-[#E5E8EB] bg-white px-4 py-3">
            <div className="flex flex-1 flex-row items-center gap-2.5">
              <div className="h-10 w-10 rounded-[10px] bg-[#939494] p-1.5">
                <Trophy
                  className="h-full w-full"
                  color="#FFFFFF"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-[15px] font-medium text-[#939494]">
                Your Season 1
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium text-[#939494]">
                Total Points
              </span>
              <h2 className="text-[24px] font-semibold leading-[28px] text-[#5B616D]">
                {formatNumberWithCommas(userSeason1Points.points, 2)}
              </h2>
            </div>
          </div>
          {/* season 2 points */}
          <Season2Points 
            pointsBreakdown={pointsBreakdown} 
            userSeason2Points={userSeason2Points}
            weeklyEarned={breakdownData?.getUserPointsBreakdown?.weeklyEarned}
            epochsCompleted={breakdownData?.getUserPointsBreakdown?.epochsCompleted}
            lastPointsMultiplierEndTimestamp={breakdownData?.getUserPointsBreakdown?.lastPointsMultiplierEndTimestamp}
            isLoading={breakdownLoading}
          />
        </div>
      )}
    </div>
  );
};

export default Points;
