/* eslint-disable no-spaced-func */
import { useAccount } from "@starknet-react/core";
import { Gift, Loader2 } from "lucide-react";
import { Figtree } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { TwitterShareButton } from "react-share";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getEndpoint, LEADERBOARD_ANALYTICS_EVENTS } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { MyAnalytics } from "@/lib/analytics";
import { checkSubscription, subscribeUser } from "@/lib/api";
import { cn, formatNumberWithCommas, validateEmail } from "@/lib/utils";

const font = Figtree({ subsets: ["latin-ext"] });

const IS_FEE_REBATES_REWARDS_PAUSED =
  process.env.NEXT_PUBLIC_IS_FEE_REBATES_REWARDS_PAUSED === "true";
const TELEGRAM_LINK = "http://endur.fi/tg";
const DEADLINE_DATE = "22nd Jun, 2025";
const CLAIMS_OPEN_DATE = "30th Jun, 2025";
const TWITTER_FOLLOW_DELAY = 10000;
const BONUS_POINTS = 1000;
const FEE_REBATE_AMOUNT = "$250";

export interface UserCompleteDetailsApiResponse {
  user_address: string;
  rank: number;
  points: {
    total_points: bigint;
    regular_points: bigint;
    bonus_points: bigint;
  };
  allocation: string;
  tags: {
    early_adopter: boolean;
  };
}

type ModalType =
  | "subscribe"
  | "claim"
  | "notEligible"
  | "twitterFollow"
  | "twitterShare"
  | null;

interface CheckEligibilityProps {
  userCompleteInfo: UserCompleteDetailsApiResponse | null;
  isLoading: boolean;
}

interface EligibilityState {
  allocation: string | null;
  activeModal: ModalType;
  emailInput: string;
  isEligible: boolean;
  isSubmitting: boolean;
  isFollowClicked: boolean;
  isFollowed: boolean;
}

const trackAnalytics = (event: string, data: Record<string, any>) => {
  MyAnalytics.track(event, { ...data, timestamp: Date.now() });
};

const ProgressHeader = React.memo<{
  step: string;
  percentage: number;
}>(({ step, percentage }) => (
  <div className="absolute -top-[5.8rem] left-0 w-full sm:left-[-30px] sm:w-[478px]">
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full flex-col items-center gap-2">
        <p className="flex w-full items-center justify-between">
          <span className="text-xs text-white">{step}</span>
          <span className="text-xs text-white">{percentage}%</span>
        </p>
        <Progress value={percentage} className="h-2.5 bg-[#C6D8D4]" />
      </div>
    </div>
  </div>
));
ProgressHeader.displayName = "ProgressHeader";

const DisclaimerText = React.memo(() => (
  <DialogDescription className="mt-4 text-center text-sm font-normal text-amber-500">
    Please report any issues before {DEADLINE_DATE} in our <br />{" "}
    <a href={TELEGRAM_LINK} className="underline">
      Official TG group
    </a>
    .
  </DialogDescription>
));
DisclaimerText.displayName = "DisclaimerText";

const RewardSummary = React.memo<{
  showBonus?: boolean;
  isFollowed?: boolean;
}>(({ showBonus = false, isFollowed = false }) => (
  <div className="px-2">
    <div className="!mt-5 w-full rounded-lg bg-[#17876D]/30 px-4 py-3">
      <p className="text-base font-bold text-white">
        {showBonus ? "Rewards Claimed" : "Reward Summary"}
      </p>
      <div className="mt-2 flex items-center justify-between text-sm text-white">
        <p className="flex items-center gap-1.5">
          <Icons.feeRebateIcon className="text-[#DFDFEC]" />
          Fee Rebates
        </p>
        <span className="font-semibold">{FEE_REBATE_AMOUNT}</span>
      </div>
      {showBonus && (
        <div className="mt-2 flex items-center justify-between text-sm text-white">
          <p className="flex items-center gap-1.5">
            <Icons.sparklingStar className="size-4 text-[#DFDFEC]" />
            Bonus Points
          </p>
          <span className="font-semibold">{BONUS_POINTS.toLocaleString()}</span>
        </div>
      )}
    </div>
    {!showBonus && (
      <div className="!mt-6 w-full space-y-2 text-sm text-white">
        <div className="flex w-full items-center gap-2">
          <Icons.rightCircle className="text-[#2ACF83]" />
          Email verified and saved
        </div>
        <div className="flex w-full items-center gap-2">
          {isFollowed ? (
            <Icons.rightCircle className="text-[#2ACF83]" />
          ) : (
            <Icons.wrongCircle className="text-[#F8623F]" />
          )}
          {isFollowed
            ? `X account followed - earned bonus ${BONUS_POINTS} points`
            : `X account not followed - missed bonus ${BONUS_POINTS} points`}
        </div>
      </div>
    )}
  </div>
));
RewardSummary.displayName = "RewardSummary";

// Modal Components
const EligibilityModal = React.memo<{
  emailInput: string;
  isSubmitting: boolean;
  onEmailChange: (email: string) => void;
  onNext: () => void;
}>(({ emailInput, isSubmitting, onEmailChange, onNext }) => (
  <DialogContent
    hideCloseIcon
    className={cn(
      font.className,
      "border-0 bg-[#0C4E3F] px-3 pb-8 pt-12 sm:max-w-[480px] md:px-8",
    )}
  >
    <div className="relative w-full">
      <ProgressHeader step="Step 1 of 3" percentage={33} />

      <DialogHeader>
        <div className="flex w-full items-center justify-center">
          <Image
            src="/leaderboard/eligibility_illustration.svg"
            width={316}
            height={271}
            alt="eligibility illustration"
          />
        </div>
        <DialogTitle className="!mt-8 text-center text-3xl font-semibold text-white">
          Subscribe to Endur
        </DialogTitle>
        <DialogDescription className="!mt-2 text-center text-sm font-normal text-[#DCF6E5]">
          Receive product updates, transaction updates <br /> and future rewards
        </DialogDescription>
      </DialogHeader>

      <div className="!mt-6 flex w-full flex-col items-center gap-4 px-2">
        <div className="relative w-full">
          <Input
            value={emailInput}
            onChange={(e) => onEmailChange(e.target.value)}
            className="peer/my-input h-11 w-full rounded-lg border-[#F1F7F6]/80 bg-transparent pl-12 pr-24 font-normal text-[#DCF6E5] placeholder:text-white/50 focus:bg-[#083B30] focus-visible:ring-0 active:bg-[#083B30]"
            placeholder="Enter.your.email@example.com"
            disabled={isSubmitting}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), onNext())
            }
          />
          <Icons.email2 className="absolute left-3 top-1/2 size-6 -translate-y-1/2 !text-white/50 peer-focus/my-input:!text-white peer-active/my-input:text-white" />
        </div>

        <Button
          onClick={onNext}
          disabled={isSubmitting || !emailInput}
          className={cn(
            "h-12 w-full rounded-md bg-white px-6 text-sm text-black transition-all hover:bg-white hover:text-black disabled:bg-[#F1F7F6]/30 disabled:text-white disabled:opacity-100",
            {
              "disabled:bg-white disabled:text-black disabled:opacity-50":
                isSubmitting,
            },
          )}
        >
          {isSubmitting ? "Sending..." : "Continue to rewards"}
        </Button>
      </div>

      <div className="mt-7 px-2">
        <div className="flex w-full items-start justify-center gap-2 rounded-lg bg-[#E3EFEC]/5 px-4 py-4 text-sm">
          <Icons.shield className="mt-1 size-6 text-[#2ACF83]" />
          <p className="text-sm text-white/80">
            Your email is secure and will only be used for reward notifications
          </p>
        </div>
      </div>
    </div>
  </DialogContent>
));
EligibilityModal.displayName = "EligibilityModal";

const TwitterFollowModal = React.memo<{
  onContinue: () => void;
  onFollow: () => void;
  isFollowClicked: boolean;
}>(({ onContinue, onFollow, isFollowClicked }) => (
  <DialogContent
    hideCloseIcon
    className={cn(
      font.className,
      "border-0 bg-[#0C4E3F] px-3 pb-8 pt-12 sm:max-w-[480px] md:px-8",
    )}
  >
    <div className="relative w-full">
      <ProgressHeader step="Step 2 of 3" percentage={67} />

      <DialogHeader>
        <div className="flex w-full items-center justify-center">
          <Image
            src="/leaderboard/twitter_modal.svg"
            width={266}
            height={290}
            alt="twitter follow illustration"
          />
        </div>
        <DialogTitle className="!mt-8 text-center text-3xl font-semibold text-white">
          Boost your experience
        </DialogTitle>
        <DialogDescription className="!mt-2 text-center text-sm font-normal text-[#DCF6E5]">
          Join our community for exclusive updates and bonus <br /> rewards!
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex w-full items-center justify-center">
        <Button className="h-10 w-fit rounded-md bg-[#17876D]/30 font-dmSans text-lg font-semibold text-white shadow-lg hover:bg-[#17876D]/30">
          <Icons.sparklingStar className="size-12 text-[#FAFAFA]" />
          Earn {BONUS_POINTS.toLocaleString()} bonus points
        </Button>
      </div>

      <div className="relative !mt-6 flex w-full flex-col items-center justify-center gap-2 px-2">
        <Link href="https://x.com/endurfi" target="_blank" className="w-full">
          <Button
            onClick={onFollow}
            className="h-12 w-full rounded-md bg-white text-[#0C4E3F] hover:bg-white hover:text-[#0C4E3F]"
          >
            {isFollowClicked ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                redirecting...
              </div>
            ) : (
              "Follow us on X"
            )}
          </Button>
        </Link>
        <Button
          onClick={onContinue}
          className="h-10 w-full rounded-md bg-transparent px-6 text-sm text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5]"
        >
          Skip to rewards
        </Button>
      </div>
    </div>
  </DialogContent>
));
TwitterFollowModal.displayName = "TwitterFollowModal";

const ClaimModal = React.memo<{
  allocation: string | null;
  onBack: () => void;
  claimRewards: () => void;
  isFollowed: boolean;
}>(({ allocation, onBack, claimRewards, isFollowed }) => (
  <DialogContent
    hideCloseIcon
    className={cn(
      font.className,
      "border-0 bg-[#0C4E3F] px-3 pb-8 pt-12 sm:max-w-[480px] md:px-8",
    )}
  >
    <div className="relative w-full">
      <ProgressHeader step="Step 3 of 3" percentage={67} />

      <DialogHeader>
        <div className="flex w-full items-center justify-center">
          <Image
            src="/leaderboard/claim_illustration.svg"
            width={266}
            height={290}
            alt="claim illustration"
          />
        </div>
        <DialogTitle className="!mt-8 text-center text-2xl font-semibold text-white">
          {allocation
            ? `Reward ${formatNumberWithCommas(allocation)} xSTRK`
            : "Your reward is ready"}
        </DialogTitle>
        <DialogDescription className="text-center text-sm font-normal text-[#DCF6E5]">
          Congratulations! You&apos;ve earned fee rebates and <br /> bonus
          points
        </DialogDescription>

        <RewardSummary isFollowed={isFollowed} />
      </DialogHeader>

      <DisclaimerText />

      <div className="relative !mt-6 flex w-full flex-col items-center justify-center gap-4 px-2">
        <Button
          onClick={claimRewards}
          className="h-12 w-full rounded-md bg-white text-[#0C4E3F] hover:bg-white hover:text-[#0C4E3F]"
          disabled={IS_FEE_REBATES_REWARDS_PAUSED}
        >
          {IS_FEE_REBATES_REWARDS_PAUSED ? (
            `Claims open after ${CLAIMS_OPEN_DATE}`
          ) : (
            <>
              <Gift className="size-5" /> Claim rewards
            </>
          )}
        </Button>
        {!isFollowed && (
          <Button
            onClick={onBack}
            className="h-12 w-full rounded-md border bg-transparent px-6 text-sm text-[#DCF6E5]/80 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5]"
          >
            Go back and earn {BONUS_POINTS.toLocaleString()} points
          </Button>
        )}
      </div>
    </div>
  </DialogContent>
));
ClaimModal.displayName = "ClaimModal";

const NotEligibleModal = React.memo<{ onClose: () => void }>(({ onClose }) => (
  <DialogContent
    hideCloseIcon
    className={cn(
      font.className,
      "border-0 bg-[#0C4E3F] px-3 pb-8 pt-12 sm:max-w-[480px] md:px-16",
    )}
  >
    <DialogHeader>
      <div className="flex w-full items-center justify-center">
        <Image
          src="/leaderboard/not_eligible_illustration.svg"
          width={340}
          height={357}
          alt="not eligible illustration"
        />
      </div>
      <DialogTitle className="!mt-8 text-center text-2xl font-semibold text-white">
        Not Eligible
      </DialogTitle>
      <DialogDescription className="text-center text-sm font-normal text-[#DCF6E5]">
        Keep holding xSTRK for now and earn future points
      </DialogDescription>
    </DialogHeader>

    <div className="relative !mt-3 flex w-full flex-col items-center justify-center gap-2 px-2">
      <Button
        onClick={onClose}
        className="h-12 w-full rounded-md bg-[#518176] text-white hover:bg-[#518176]/90"
      >
        Close
      </Button>
      <DisclaimerText />
    </div>
  </DialogContent>
));
NotEligibleModal.displayName = "NotEligibleModal";

const TwitterShareModal = React.memo<{ onClose: () => void }>(({ onClose }) => (
  <DialogContent
    hideCloseIcon
    className={cn(
      font.className,
      "border-0 bg-[#0C4E3F] px-3 pb-8 pt-12 sm:max-w-[480px] md:px-8",
    )}
  >
    <div className="relative w-full">
      <ProgressHeader step="Step 3 of 3" percentage={100} />

      <DialogHeader>
        <div className="flex w-full items-center justify-center">
          <Image
            src="/leaderboard/claim_illustration.svg"
            width={266}
            height={290}
            alt="rewards claimed illustration"
          />
        </div>
        <DialogTitle className="!mt-8 text-center text-3xl font-semibold text-white">
          Rewards claimed!
        </DialogTitle>

        <RewardSummary showBonus />
      </DialogHeader>

      <div className="relative !mt-6 flex w-full flex-col items-center justify-center gap-2 px-2">
        <TwitterShareButton
          url={getEndpoint()}
          title={`I just claimed my rewards on Endur.fi! 🎉\n\nCheck your eligibility and join the leaderboard: ${getEndpoint()}`}
          related={["endurfi", "strkfarm", "karnotxyz"]}
          style={{
            height: "44px",
            width: "100%",
            borderRadius: "8px",
            backgroundColor: "white",
            color: "#0C4E3F",
            fontWeight: "500",
          }}
        >
          Share on X
        </TwitterShareButton>
        <Button
          onClick={onClose}
          className="h-10 w-full rounded-md bg-transparent px-6 text-sm text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5]"
        >
          Close
        </Button>
      </div>
    </div>
  </DialogContent>
));
TwitterShareModal.displayName = "TwitterShareModal";

const useEligibilityData = (allocation?: string) => {
  return React.useMemo(() => {
    if (!allocation) return { allocation: null, isEligible: false };
    const isEligible = Number(allocation) > 0;
    return { allocation, isEligible };
  }, [allocation]);
};

// Main Component
const CheckEligibility: React.FC<CheckEligibilityProps> = ({
  userCompleteInfo,
  isLoading,
}) => {
  const [state, setState] = React.useState<EligibilityState>({
    allocation: null,
    activeModal: null,
    emailInput: "",
    isEligible: false,
    isSubmitting: false,
    isFollowClicked: false,
    isFollowed: false,
  });

  const { address } = useAccount();
  const eligibilityData = useEligibilityData(userCompleteInfo?.allocation);

  const handleEmailChange = React.useCallback((email: string) => {
    setState((prev) => ({ ...prev, emailInput: email }));
  }, []);

  const handleNext = React.useCallback(async () => {
    if (!address) {
      toast({ description: "Connect your wallet first." });
      return;
    }

    if (!state.emailInput) {
      toast({ description: "Email input is required" });
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      if (!validateEmail(state.emailInput)) {
        toast({ description: "Invalid email format" });
        return;
      }

      const subscriptionStatus = await checkSubscription(state.emailInput);

      if (!subscriptionStatus.isSubscribed) {
        const subscriptionResult = await subscribeUser(
          state.emailInput,
          address,
        );
        if (!subscriptionResult.success) {
          toast({ description: "Failed to subscribe. Please try again." });
          return;
        }
      }

      trackAnalytics(LEADERBOARD_ANALYTICS_EVENTS.EMAIL_SUBMITTED, {
        userAddress: address,
        email: state.emailInput,
        isEligible: state.isEligible,
        wasAlreadySubscribed: subscriptionStatus.isSubscribed,
      });

      setState((prev) => ({
        ...prev,
        emailInput: "",
        activeModal: "twitterFollow",
      }));
    } catch (error) {
      console.error("Error in subscription flow:", error);
      toast({
        description: "Error processing your request. Please try again.",
      });
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [address, state.emailInput, state.isEligible]);

  const handleTwitterFollow = React.useCallback(() => {
    setState((prev) => ({ ...prev, isFollowClicked: true }));

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isFollowClicked: false,
        isFollowed: true,
        activeModal: state.isEligible ? "claim" : "notEligible",
      }));

      if (address) {
        trackAnalytics(LEADERBOARD_ANALYTICS_EVENTS.TWITTER_FOLLOW_CLICKED, {
          userAddress: address,
        });
      }
    }, TWITTER_FOLLOW_DELAY);
  }, [state.isEligible, address]);

  const checkEligibility = React.useCallback(() => {
    if (!address) {
      toast({ description: "Connect your wallet first." });
      return;
    }

    trackAnalytics(LEADERBOARD_ANALYTICS_EVENTS.ELIGIBILITY_CHECK_CLICKED, {
      userAddress: address,
    });

    const { allocation, isEligible } = eligibilityData;

    trackAnalytics(LEADERBOARD_ANALYTICS_EVENTS.ELIGIBILITY_RESULT, {
      userAddress: address,
      isEligible,
    });

    setState((prev) => ({
      ...prev,
      allocation,
      isEligible,
      activeModal: "subscribe",
    }));
  }, [address, eligibilityData]);

  // Modal handlers
  const closeModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: null }));
  }, []);

  const goToTwitterFollow = React.useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: "twitterFollow" }));
  }, []);

  const goToClaim = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeModal: state.isEligible ? "claim" : "notEligible",
    }));
  }, [state.isEligible]);

  const goToTwitterShare = React.useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: "twitterShare" }));
  }, []);

  return (
    <>
      <Button
        className="bg-[#16876D] hover:bg-[#16876D]"
        onClick={checkEligibility}
        disabled={isLoading}
      >
        {isLoading ? "Checking..." : "Check eligibility"}
      </Button>

      <Dialog
        open={state.activeModal === "subscribe"}
        onOpenChange={closeModal}
      >
        <DialogOverlay className="bg-white/20 backdrop-blur-sm" />
        <EligibilityModal
          emailInput={state.emailInput}
          isSubmitting={state.isSubmitting}
          onEmailChange={handleEmailChange}
          onNext={handleNext}
        />
      </Dialog>

      <Dialog
        open={state.activeModal === "twitterFollow"}
        onOpenChange={closeModal}
      >
        <DialogOverlay className="bg-white/20 backdrop-blur-sm" />
        <TwitterFollowModal
          onContinue={goToClaim}
          onFollow={handleTwitterFollow}
          isFollowClicked={state.isFollowClicked}
        />
      </Dialog>

      <Dialog open={state.activeModal === "claim"} onOpenChange={closeModal}>
        <DialogOverlay className="bg-white/20 backdrop-blur-sm" />
        <ClaimModal
          allocation={state.allocation}
          onBack={goToTwitterFollow}
          claimRewards={goToTwitterShare}
          isFollowed={state.isFollowed}
        />
      </Dialog>

      <Dialog
        open={state.activeModal === "notEligible"}
        onOpenChange={closeModal}
      >
        <DialogOverlay className="bg-white/20 backdrop-blur-sm" />
        <NotEligibleModal onClose={closeModal} />
      </Dialog>

      <Dialog
        open={state.activeModal === "twitterShare"}
        onOpenChange={closeModal}
      >
        <DialogOverlay className="bg-white/20 backdrop-blur-sm" />
        <TwitterShareModal onClose={closeModal} />
      </Dialog>
    </>
  );
};

export default CheckEligibility;
