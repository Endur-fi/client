"use client";
import React from "react";
import {
  Tabs as ShadCNTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { columns, type SizeColumn } from "./table/columns";
import { DataTable } from "./table/data-table";
import { cn } from "@/lib/utils";
import { UserCompleteDetailsApiResponse } from "./check-eligibility";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

interface LeaderboardProps {
  allUsers: SizeColumn[];
  leaderboardData: SizeColumn[];
  userCompleteInfo: UserCompleteDetailsApiResponse | null;
	season2LeaderboardData: SizeColumn[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  allUsers,
  leaderboardData,
  userCompleteInfo,
	season2LeaderboardData,
}) => {
  const [activeSeason, setActiveSeason] = React.useState<"season1" | "season2">(
    "season1",
  );

  const EmptyState = React.memo(() => (
    <div className="py-8 text-center">
      <p className="text-[#021B1A]">No leaderboard data available</p>
    </div>
  ));
  EmptyState.displayName = "EmptyState";

  return (
		<>
			<ShadCNTabs
				value={activeSeason}
				onValueChange={(value) => setActiveSeason(value as "season1" | "season2")}
				defaultValue="season1"
			>
				<TabsList className="h-auto w-full gap-0 rounded-[14px] border border-[#E5E8EB] bg-white p-1 lg:w-fit">
					<TabsTrigger
						value="season2"
						className={cn(
							"flex-1 rounded-[10px] border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[#6B7780] transition-all data-[state=active]:border-[#17876D] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#1A1F24] data-[state=active]:shadow-none lg:px-6 lg:py-2.5 lg:text-base",
						)}
					>
						Season 2
					</TabsTrigger>
					<TabsTrigger
						value="season1"
						className={cn(
							"flex-1 rounded-[10px] border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[#6B7780] transition-all data-[state=active]:border-[#17876D] data-[state=active]:bg-[#E8F7F4] data-[state=active]:text-[#1A1F24] data-[state=active]:shadow-none lg:px-6 lg:py-2.5 lg:text-base",
						)}
					>
						Season 1
					</TabsTrigger>
				</TabsList>

				<TabsContent value="season2" className="mt-0">
					<div className="mt-2 lg:mt-4">
						{season2LeaderboardData.length > 0 ? (
							<DataTable
								columns={columns}
								data={season2LeaderboardData}
								userCompleteDetails={userCompleteInfo}
							/>
						) : (
							<EmptyState />
						)}
					</div>
				</TabsContent>

				<TabsContent value="season1" className="mt-0">
					<div className="mt-2 lg:mt-4">
						{allUsers.length > 0 ? (
							<DataTable
								columns={columns}
								data={leaderboardData}
								userCompleteDetails={userCompleteInfo}
							/>
						) : (
							<EmptyState />
						)}
					</div>
				</TabsContent>
			</ShadCNTabs>
			<hr className="mb-3 mt-0 border-[#E5E8EB] lg:mb-6 lg:mt-0" />
			<Alert className="!mb-20 border border-[#03624C] bg-[#E5EFED] p-4 text-[#03624C]">
				<AlertCircleIcon className="size-4 !text-[#03624C]" />
				<AlertTitle className="text-base font-semibold leading-[1]">
					Disclaimer
				</AlertTitle>
				<AlertDescription className="mt-2 flex flex-col items-start -space-y-0.5 text-[#5B616D]">
					<p>
						Point criteria may evolve as Endur develops, and allocations can
						be adjusted if any bugs or inconsistencies are discovered.
					</p>
				</AlertDescription>
			</Alert>
		</>		
  );
};

export default Leaderboard;
