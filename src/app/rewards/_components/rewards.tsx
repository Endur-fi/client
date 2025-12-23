import { Icons } from "@/components/Icons";
import React from "react";
import CheckEligibility, {
  UserCompleteDetailsApiResponse,
} from "./check-eligibility";

interface RewardsProps {
  userCompleteInfo: UserCompleteDetailsApiResponse | null;
  isLoading: boolean;
}

const Rewards: React.FC<RewardsProps> = ({ userCompleteInfo, isLoading }) => (
  <div className="flex flex-col gap-3 rounded-[14px] bg-gradient-to-b from-[#0D5F4E] to-[#11998E] p-2 lg:flex-row lg:items-center lg:gap-6 lg:p-4">
    <div className="flex gap-2 lg:flex-shrink-0 lg:gap-3">
      <div className="rounded-lg bg-[#FFFFFF33] p-3 shadow-lg lg:p-4">
        <Icons.gift />
      </div>
      <h2 className="font-bold text-white lg:hidden lg:text-xl">
        250,000 xSTRK Rewards Distributed
      </h2>
    </div>
    <div className="flex-1 space-y-2 lg:block">
      <div className="hidden lg:block">
        <h2 className="font-bold text-white lg:text-xl">
          250,000 xSTRK Rewards Distributed
        </h2>
        <div className="mt-2 h-px w-full bg-white/20"></div>
      </div>
      <p className="lg:text-md text-sm text-white">
        In May 2025, we distributed 250,000 xSTRK in rewards to users from the{" "}
        {"platform’s"} first six months. The distribution was calculated based
        on Season 1 points as recorded at that time.
      </p>
      <p className="lg:text-md text-sm text-white">
        <span className="font-semibold">Claim Deadline: 31st Mar, 2026</span>
      </p>
    </div>
    <div className="lg:flex-shrink-0 lg:self-center">
      <CheckEligibility
        userCompleteInfo={userCompleteInfo}
        isLoading={isLoading}
        buttonClassName="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 font-bold text-[#0D5F4E] transition-opacity hover:opacity-90 lg:w-auto lg:px-6"
      />
    </div>

  </div>
);

export default Rewards;
