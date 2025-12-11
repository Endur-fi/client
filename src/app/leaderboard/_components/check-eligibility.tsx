/* eslint-disable no-spaced-func */

import { useAccount, useSendTransaction } from "@starknet-react/core";
import { Gift, Loader2 } from "lucide-react";
import { Figtree } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { TwitterShareButton } from "react-share";
import { Contract } from "starknet";

import merkleAbi from "@/abi/merkle.abi.json";
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
import {
  getProvider,
  LEADERBOARD_ANALYTICS_EVENTS,
  MERKLE_CONTRACT_ADDRESS_MAINNET,
  STRK_DECIMALS,
} from "@/constants";
import { UPDATE_USER_POINTS } from "@/constants/mutations";
import { GET_USER_COMPLETE_DETAILS } from "@/constants/queries";
import { toast } from "@/hooks/use-toast";
import { MyAnalytics } from "@/lib/analytics";
import { checkSubscription, subscribeUser } from "@/lib/api";
import apolloClient from "@/lib/apollo-client";
import { Web3Number } from "@strkfarm/sdk";

import {
  cn,
  formatNumberWithCommas,
  standariseAddress,
  validateEmail,
} from "@/lib/utils";

const font = Figtree({ subsets: ["latin-ext"] });

const IS_FEE_REBATES_REWARDS_PAUSED =
  process.env.NEXT_PUBLIC_IS_FEE_REBATES_REWARDS_PAUSED === "true";
const TELEGRAM_LINK = "http://endur.fi/tg";
const DEADLINE_DATE = "22nd Jun, 2025";
const CLAIMS_OPEN_DATE = "30th Jun, 2025";
const TWITTER_FOLLOW_DELAY = 10000;
const BONUS_POINTS = 1000;

const MODAL_CONTENT_CLASSES = cn(
  font.className,
  "border-0 bg-[#0C4E3F] px-3 pb-8 pt-12 sm:max-w-[480px] md:px-8",
);

const BUTTON_PRIMARY_CLASSES =
  "h-12 w-full rounded-md bg-white text-[#0C4E3F] hover:bg-white hover:text-[#0C4E3F]";
const BUTTON_SECONDARY_CLASSES =
  "h-10 w-full rounded-md bg-transparent px-6 text-sm text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5]";

export interface UserCompleteDetailsApiResponse {
  user_address: string;
  rank: number;
  points: {
    total_points: bigint;
    regular_points: bigint;
    bonus_points: bigint;
    early_adopter_points: bigint;
    follow_bonus_points: bigint;
    dex_bonus_points: bigint;
  };
  allocation: string;
  proof: string;
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

interface EligibilityState {
  allocation: string | null;
  activeModal: ModalType;
  emailInput: string;
  isEligible: boolean;
  isSubmitting: boolean;
  isFollowClicked: boolean;
  isFollowed: boolean;
  hasAlreadyClaimed: boolean;
  isCheckingClaimed: boolean;
}

interface CheckEligibilityProps {
  userCompleteInfo: UserCompleteDetailsApiResponse | null;
  isLoading: boolean;
}

const trackAnalytics = (event: string, data: Record<string, any>) => {
  MyAnalytics.track(event, { ...data, timestamp: Date.now() });
};

const useEligibilityData = (allocation?: string) => {
  return React.useMemo(() => {
    if (!allocation) return { allocation: null, isEligible: false };
    const isEligible = Number(allocation) > 0;
    return { allocation, isEligible };
  }, [allocation]);
};

const useUserSubscriptionCheck = (
  address: string | undefined,
  submittedEmail: boolean,
) => {
  const [userExists, setUserExists] = React.useState(false);
  const [checkingUser, setCheckingUser] = React.useState(false);

  React.useEffect(() => {
    if (!address) return;

    const checkUser = async () => {
      setCheckingUser(true);
      try {
        const response = await checkSubscription(standariseAddress(address));
        setUserExists(response.isSubscribed);
      } catch (error) {
        console.error("Error checking user:", error);
        setUserExists(false);
      } finally {
        setCheckingUser(false);
      }
    };

    const timer = setTimeout(checkUser, 500); // debounce for 500ms
    return () => clearTimeout(timer);
  }, [address, submittedEmail]);

  return { userExists, checkingUser };
};

const ProgressHeader = React.memo<{ step: string; percentage: number }>(
  ({ step, percentage }) => (
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
  ),
);
ProgressHeader.displayName = "ProgressHeader";

const DisclaimerText = React.memo(() => (
  <DialogDescription className="mt-4 text-center text-sm font-normal text-amber-500">
    Please report any issues before {DEADLINE_DATE} in our{" "}
    <a href={TELEGRAM_LINK} className="underline">
      Official TG group
    </a>
    .
  </DialogDescription>
));
DisclaimerText.displayName = "DisclaimerText";

const RewardItem = React.memo<{
  icon: React.ReactNode;
  label: string;
  value: string;
}>(({ icon, label, value }) => (
  <div className="mt-2 flex items-center justify-between text-sm text-white">
    <p className="flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <span className="font-semibold">{value}</span>
  </div>
));
RewardItem.displayName = "RewardItem";

const VerificationStatus = React.memo<{
  isVerified: boolean;
  isLoading?: boolean;
  label: string;
}>(({ isVerified, isLoading, label }) => (
  <div className="flex w-full items-center gap-2">
    {isLoading ? (
      <Loader2 className="size-3 animate-spin" />
    ) : isVerified ? (
      <Icons.rightCircle className="text-[#2ACF83]" />
    ) : (
      <Icons.wrongCircle className="text-[#F8623F]" />
    )}
    {label}
  </div>
));
VerificationStatus.displayName = "VerificationStatus";

const RewardSummary = React.memo<{
  showBonus?: boolean;
  isFollowed?: boolean;
  allocation: string | null;
  bonusAlreadyAwarded?: boolean;
}>(
  ({
    showBonus = false,
    isFollowed = false,
    allocation,
    bonusAlreadyAwarded = false,
  }) => {
    const { address } = useAccount();
    const { userExists, checkingUser } = useUserSubscriptionCheck(
      address,
      false,
    ); // false is just to avoid type check

    // Format the allocation once
    const formattedAllocation = React.useMemo(
      () => `${Number(allocation).toFixed(2)} xSTRK`,
      [allocation],
    );

    // Determine the Twitter follow status text once
    const twitterStatusText = React.useMemo(
      () =>
        isFollowed || bonusAlreadyAwarded
          ? `X account followed - earned bonus ${BONUS_POINTS.toLocaleString()} points`
          : `X account not followed - missed bonus ${BONUS_POINTS.toLocaleString()} points`,
      [isFollowed, bonusAlreadyAwarded],
    );

    const isTwitterVerified = isFollowed || bonusAlreadyAwarded;

    return (
      <div className="px-2">
        <div className="!mt-5 w-full rounded-lg bg-[#17876D]/30 px-4 py-3">
          <p className="text-base font-bold text-white">
            {showBonus ? "Rewards Claimed" : "Reward Summary"}
          </p>

          <RewardItem
            icon={<Icons.feeRebateIcon className="text-[#DFDFEC]" />}
            label="Fee Rebates"
            value={formattedAllocation}
          />

          {showBonus && (
            <RewardItem
              icon={<Icons.sparklingStar className="size-4 text-[#DFDFEC]" />}
              label="Bonus Points"
              value={BONUS_POINTS.toLocaleString()}
            />
          )}
        </div>

        {!showBonus && (
          <div className="!mt-6 w-full space-y-2 text-sm text-white">
            <VerificationStatus
              isVerified={userExists && !checkingUser}
              isLoading={checkingUser}
              label={
                userExists && !checkingUser
                  ? "Email verified and saved"
                  : "Email not verified"
              }
            />

            <VerificationStatus
              isVerified={isTwitterVerified}
              label={twitterStatusText}
            />
          </div>
        )}
      </div>
    );
  },
);
RewardSummary.displayName = "RewardSummary";

const ModalOverlay = React.memo(() => (
  <DialogOverlay className="bg-white/20 backdrop-blur-sm" />
));
ModalOverlay.displayName = "ModalOverlay";

// Modal Components
const EligibilityModal = React.memo<{
  emailInput: string;
  isSubmitting: boolean;
  onEmailChange: (email: string) => void;
  onNext: () => void;
  userExists: boolean;
  checkingUser: boolean;
  onSkip: () => void;
}>(
  ({
    emailInput,
    isSubmitting,
    onEmailChange,
    onNext,
    userExists,
    checkingUser,
    onSkip,
  }) => (
    <DialogContent hideCloseIcon className={MODAL_CONTENT_CLASSES}>
      <div className="relative w-full">
        <ProgressHeader step="Step 1 of 4" percentage={25} />
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
            Get product updates, transaction alerts, and exclusive rewards
          </DialogDescription>
        </DialogHeader>

        <div className="!mt-6 flex w-full flex-col items-center gap-4 px-2">
          {!userExists && (
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
          )}

          <div className="">
            <div className="flex w-full items-start justify-center gap-2 rounded-lg bg-[#E3EFEC]/5 px-4 py-4 text-sm">
              <Icons.shield className="mt-1 size-10 text-[#2ACF83]" />
              <p className="text-sm text-white/80">
                Your email is safe with us and will not be shared with third
                parties.
              </p>
            </div>
          </div>

          <Button
            onClick={onNext}
            disabled={isSubmitting || (checkingUser && !userExists)}
            className={cn(BUTTON_PRIMARY_CLASSES, {
              "disabled:bg-white disabled:text-black disabled:opacity-50":
                isSubmitting,
            })}
          >
            {checkingUser
              ? "Checking..."
              : isSubmitting
                ? "Sending..."
                : userExists
                  ? "Already subscribed"
                  : "Continue to rewards"}
          </Button>
          <Button
            onClick={onSkip}
            className={cn(BUTTON_SECONDARY_CLASSES, "h-5")}
          >
            Skip
          </Button>
        </div>
      </div>
    </DialogContent>
  ),
);
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
      <ProgressHeader step="Step 2 of 4" percentage={50} />
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
          Power in Numbers
        </DialogTitle>
        <DialogDescription className="!mt-2 text-center text-sm font-normal text-[#DCF6E5]">
          Your follow on X shows our strength and fuels our mission. Plus, never
          miss tiny updates and fun.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex w-full items-center justify-center">
        <Button className="h-10 w-fit cursor-default rounded-md bg-[#17876D]/30 font-dmSans text-lg font-semibold text-white shadow-lg hover:bg-[#17876D]/30">
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
                checking...
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

const FollowBonusAlreadyAwardedModal = React.memo<{ onContinue: () => void }>(
  ({ onContinue }) => (
    <DialogContent
      hideCloseIcon
      className={cn(
        font.className,
        "border-0 bg-[#0C4E3F] px-3 pb-8 pt-12 sm:max-w-[480px] md:px-8",
      )}
    >
      <div className="relative w-full">
        <ProgressHeader step="Step 2 of 4" percentage={50} />
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
            Power in Numbers
          </DialogTitle>
          <DialogDescription className="!mt-2 text-center text-sm font-normal text-[#DCF6E5]">
            Thank you for following us on X! Your support fuels our mission.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex w-full items-center justify-center">
          <Button className="h-10 w-fit cursor-default rounded-md bg-[#17876D]/30 font-dmSans text-base font-semibold text-white shadow-lg hover:bg-[#17876D]/30">
            <Icons.sparklingStar className="size-12 text-[#FAFAFA]" />
            {BONUS_POINTS.toLocaleString()} bonus points already awarded!
          </Button>
        </div>

        <div className="relative !mt-6 flex w-full flex-col items-center justify-center gap-2 px-2">
          <Button
            onClick={onContinue}
            className="h-10 w-full rounded-md bg-white text-[#0C4E3F] hover:bg-white hover:text-[#0C4E3F]"
          >
            Continue to rewards
          </Button>
        </div>
      </div>
    </DialogContent>
  ),
);
FollowBonusAlreadyAwardedModal.displayName = "FollowBonusAlreadyAwardedModal";

const ClaimModal = React.memo<{
  allocation: string | null;
  onBack: () => void;
  claimRewards: () => void;
  isFollowed: boolean;
  bonusAlreadyAwarded: boolean;
  isPending: boolean;
}>(
  ({
    allocation,
    onBack,
    claimRewards,
    isFollowed,
    bonusAlreadyAwarded,
    isPending,
  }) => (
    <DialogContent
      hideCloseIcon
      className={cn(
        font.className,
        "border-0 bg-[#0C4E3F] px-3 pb-8 pt-12 sm:max-w-[480px] md:px-8",
      )}
    >
      <div className="relative w-full">
        <ProgressHeader step="Step 3 of 4" percentage={75} />
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
            Congratulations! You&apos;ve earned fee rebates and bonus points
          </DialogDescription>
          <RewardSummary
            isFollowed={isFollowed}
            allocation={allocation}
            bonusAlreadyAwarded={bonusAlreadyAwarded}
          />
        </DialogHeader>

        <div className="relative !mt-6 flex w-full flex-col items-center justify-center gap-4 px-2">
          <Button
            onClick={claimRewards}
            className="h-12 w-full rounded-md bg-white text-[#0C4E3F] hover:bg-white hover:text-[#0C4E3F]"
            disabled={IS_FEE_REBATES_REWARDS_PAUSED || isPending}
          >
            {IS_FEE_REBATES_REWARDS_PAUSED ? (
              `Claims open after ${CLAIMS_OPEN_DATE}`
            ) : isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Claiming rewards...
              </div>
            ) : (
              <>
                <Gift className="size-5" /> Claim rewards
              </>
            )}
          </Button>
          {!isFollowed && !bonusAlreadyAwarded && (
            <Button
              onClick={onBack}
              disabled={isPending}
              className="h-12 w-full rounded-md border bg-transparent px-6 text-sm text-[#DCF6E5]/80 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5] disabled:opacity-50"
            >
              Go back and earn {BONUS_POINTS.toLocaleString()} points
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  ),
);
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
    </div>
  </DialogContent>
));
NotEligibleModal.displayName = "NotEligibleModal";

const TwitterShareModal = React.memo<{
  onClose: () => void;
  allocation: string | null;
}>(({ onClose, allocation }) => {
  const shareData = React.useMemo(
    () => ({
      url: `https://endur.fi/leaderboard/${allocation}`,
      title: `Just claimed my rewards on @endurfi! 🔥\n\nEndur distributed its 6-month revenue back to the community! You might have something waiting — check your eligibility 👇\n`,
    }),
    [allocation],
  );

  return (
    <DialogContent hideCloseIcon className={MODAL_CONTENT_CLASSES}>
      <div className="relative w-full">
        <ProgressHeader step="Step 4 of 4" percentage={100} />
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
          <RewardSummary showBonus allocation={allocation} />
        </DialogHeader>

        <div className="relative !mt-6 flex w-full flex-col items-center justify-center gap-2 px-2">
          <TwitterShareButton
            url={shareData.url}
            title={shareData.title}
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
          <Button onClick={onClose} className={BUTTON_SECONDARY_CLASSES}>
            Close
          </Button>
        </div>
      </div>
    </DialogContent>
  );
});
TwitterShareModal.displayName = "TwitterShareModal";

// Main Component
const CheckEligibility: React.FC<CheckEligibilityProps> = ({
  userCompleteInfo,
  isLoading,
}) => {
  const [state, setState] = React.useState<EligibilityState>(() => ({
    allocation: null,
    activeModal: null,
    emailInput: "",
    isEligible: false,
    isSubmitting: false,
    isFollowClicked: false,
    isFollowed: false,
    hasAlreadyClaimed: false,
    isCheckingClaimed: false,
  }));

  const { address } = useAccount();
  const eligibilityData = useEligibilityData(userCompleteInfo?.allocation);
  const [submittedEmail, setSubmittedEmail] = React.useState<boolean>(false);
  const { userExists, checkingUser } = useUserSubscriptionCheck(
    address,
    submittedEmail,
  );
  const { sendAsync, isPending, isError, data } = useSendTransaction({});

  const bonusAlreadyAwarded = React.useMemo(
    () => (userCompleteInfo?.points?.follow_bonus_points || 0) > 0,
    [userCompleteInfo?.points?.follow_bonus_points],
  );

  const [isWaitingForConfirmation, setIsWaitingForConfirmation] =
    React.useState(false);

  const contracts = React.useMemo(() => {
    const provider = getProvider();
    return {
      merkleContract: new Contract({
        abi: merkleAbi,
        address: MERKLE_CONTRACT_ADDRESS_MAINNET,
        providerOrAccount: provider,
      }),
    };
  }, []);

  const trackAnalyticsCallback = React.useCallback(
    (event: string, data: Record<string, any>) => {
      trackAnalytics(event, data);
    },
    [],
  );

  const handleEmailChange = React.useCallback((email: string) => {
    setState((prev) => ({ ...prev, emailInput: email }));
  }, []);

  const handleNext = React.useCallback(async () => {
    if (!address) {
      toast({ description: "Connect your wallet first." });
      return;
    }

    if (userExists) {
      return setState((prev) => ({
        ...prev,
        emailInput: "",
        activeModal: "twitterFollow",
      }));
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

      const subscriptionStatus = await checkSubscription(address);

      if (!subscriptionStatus.isSubscribed) {
        const listIds = [parseInt(process.env.ENDUR_BREVO_LIST_ID || "5", 10)];
        const subscriptionResult = await subscribeUser(
          state.emailInput,
          address,
          listIds,
        );
        if (!subscriptionResult.success) {
          toast({ description: "Failed to subscribe. Please try again." });
          return;
        }
        setSubmittedEmail(true);
      }

      trackAnalyticsCallback(LEADERBOARD_ANALYTICS_EVENTS.EMAIL_SUBMITTED, {
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
  }, [
    address,
    state.emailInput,
    state.isEligible,
    userExists,
    trackAnalyticsCallback,
  ]);

  const handleTwitterFollow = React.useCallback(async () => {
    setState((prev) => ({ ...prev, isFollowClicked: true }));

    try {
      const res = await apolloClient.mutate({
        mutation: UPDATE_USER_POINTS,
        variables: {
          input: {
            userAddress: address,
            points: BONUS_POINTS.toString(),
          },
        },
      });

      if (res.data?.addPointsToUser?.success) {
        await apolloClient.refetchQueries({
          include: [GET_USER_COMPLETE_DETAILS],
        });

        return setTimeout(() => {
          toast({
            description: `You have earned ${formatNumberWithCommas(BONUS_POINTS, 0)} points for following us on X!`,
          });

          setState((prev) => ({
            ...prev,
            isFollowClicked: false,
            isFollowed: true,
            activeModal: state.isEligible ? "claim" : "notEligible",
          }));

          if (address) {
            trackAnalyticsCallback(
              LEADERBOARD_ANALYTICS_EVENTS.TWITTER_FOLLOW_CLICKED,
              {
                userAddress: address,
              },
            );
          }
        }, TWITTER_FOLLOW_DELAY);
      }

      if (
        res.data?.addPointsToUser?.message.includes(
          "bonus points already awarded",
        ) &&
        !res.data?.addPointsToUser?.success
      ) {
        toast({
          description: `Bonus points are already awarded to you`,
        });
      }

      setState((prev) => ({
        ...prev,
        isFollowClicked: false,
        isFollowed: true,
        activeModal: state.isEligible ? "claim" : "notEligible",
      }));
    } catch (error) {
      console.error("Error updating user points:", error);
      toast({ description: "Failed to update user points. Please try again." });
    }
  }, [state.isEligible, address, trackAnalyticsCallback]);

  const checkEligibility = React.useCallback(() => {
    if (!address) {
      toast({ description: "Connect your wallet first." });
      return;
    }

    if (state.hasAlreadyClaimed) {
      toast({ description: "You have already claimed your rewards." });
      return;
    }

    trackAnalyticsCallback(
      LEADERBOARD_ANALYTICS_EVENTS.ELIGIBILITY_CHECK_CLICKED,
      {
        userAddress: address,
      },
    );

    const { allocation, isEligible } = eligibilityData;

    trackAnalyticsCallback(LEADERBOARD_ANALYTICS_EVENTS.ELIGIBILITY_RESULT, {
      userAddress: address,
      isEligible,
    });

    setState((prev) => ({
      ...prev,
      allocation,
      isEligible,
      activeModal: "subscribe",
    }));
  }, [
    address,
    eligibilityData,
    state.hasAlreadyClaimed,
    trackAnalyticsCallback,
  ]);

  const closeModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: null }));
  }, []);

  const goToTwitterFollow = React.useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: "twitterFollow" }));
  }, []);

  const goToClaim = React.useCallback(() => {
    MyAnalytics.track(LEADERBOARD_ANALYTICS_EVENTS.TWITTER_FOLLOW_SKIPPED, {
      userAddress: address,
    });
    setState((prev) => ({
      ...prev,
      activeModal: state.isEligible ? "claim" : "notEligible",
    }));
  }, [state.isEligible]);

  const handleClaim = React.useCallback(async () => {
    if (!address) return;

    const { merkleContract } = contracts;

    const allocation = userCompleteInfo?.allocation;
    const proofs: string[] = userCompleteInfo?.proof
      ? JSON.parse(userCompleteInfo?.proof)
      : [];

    if (!allocation || !proofs || proofs.length === 0) {
      toast({ description: "No allocation or proof found." });
      return;
    }

    MyAnalytics.track(LEADERBOARD_ANALYTICS_EVENTS.CLICKED_CLAIM_REWARDS, {
      userAddress: address || "anonymous",
      timestamp: Date.now(),
      isWalletConnected: !!address,
      allocation,
    });

    const allocationWei = new Web3Number(allocation, STRK_DECIMALS).toWei();

    try {
      console.log(proofs, "proofs", allocationWei, allocation);

      // call claim with allocation and any proof (use first proof)
      const claimCall = merkleContract.populate("claim", [
        allocationWei,
        proofs,
      ]);

      const claimRes = await sendAsync([claimCall]);

      console.log("claim response:", claimRes);
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast({ description: "Failed to claim rewards. Please try again." });
    }
  }, [
    address,
    contracts,
    userCompleteInfo?.allocation,
    userCompleteInfo?.proof,
    sendAsync,
  ]);

  const handleSkip = React.useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: "twitterFollow" }));
  }, []);

  React.useEffect(() => {
    const checkClaimedAmount = async () => {
      if (!address) {
        setState((prev) => ({
          ...prev,
          hasAlreadyClaimed: false,
          isCheckingClaimed: false,
        }));
        return;
      }

      setState((prev) => ({ ...prev, isCheckingClaimed: true }));

      try {
        const { merkleContract } = contracts;
        const res = await merkleContract.call("amount_already_claimed", [
          address,
        ]);
        const amountInSTRK = Number(res) / 10 ** STRK_DECIMALS;

        console.log(amountInSTRK, "amountInSTRK");

        setState((prev) => ({
          ...prev,
          hasAlreadyClaimed: amountInSTRK > 0,
          isCheckingClaimed: false,
        }));
      } catch (error) {
        console.error("Error checking claimed amount:", error);
        setState((prev) => ({
          ...prev,
          hasAlreadyClaimed: false,
          isCheckingClaimed: false,
        }));
      }
    };

    checkClaimedAmount();
  }, [address, contracts]);

  const buttonState = React.useMemo(() => {
    if (state.isCheckingClaimed) {
      return { disabled: true, text: "Preparing..." };
    }
    if (state.hasAlreadyClaimed) {
      return { disabled: true, text: "Already claimed" };
    }
    if (isLoading) {
      return { disabled: true, text: "Preparing..." };
    }
    if (isPending && isWaitingForConfirmation) {
      return { disabled: true, text: "Confirming..." };
    }
    if (isPending) {
      return { disabled: true, text: "Transaction pending..." };
    }
    return { disabled: false, text: "Claim rewards" };
  }, [
    state.isCheckingClaimed,
    state.hasAlreadyClaimed,
    isLoading,
    isPending,
    isWaitingForConfirmation,
  ]);

  React.useEffect(() => {
    if (data && isPending) {
      setIsWaitingForConfirmation(true);
      toast({
        description: "Transaction submitted! Waiting for confirmation...",
        duration: 3000,
      });
    }
  }, [data, isPending, setIsWaitingForConfirmation]);

  React.useEffect(() => {
    if (isPending) {
      const allocation = userCompleteInfo?.allocation;
      if (allocation) {
        toast({
          description: `Claiming ${formatNumberWithCommas(allocation)} xSTRK rewards...`,
          duration: 3000,
        });
      }
    }
  }, [isPending, userCompleteInfo?.allocation]);

  React.useEffect(() => {
    if (data && !isPending) {
      setIsWaitingForConfirmation(false);
      const allocation = userCompleteInfo?.allocation;
      if (allocation) {
        toast({
          description: `🎉 Successfully claimed ${formatNumberWithCommas(allocation)} xSTRK rewards!`,
          duration: 5000,
        });

        setState((prev) => ({
          ...prev,
          activeModal: "twitterShare",
          hasAlreadyClaimed: true,
        }));
      }
    }
  }, [
    data,
    isPending,
    userCompleteInfo?.allocation,
    setIsWaitingForConfirmation,
  ]);

  React.useEffect(() => {
    if (isError && !isPending) {
      setIsWaitingForConfirmation(false);
      toast({
        description: "Transaction failed. Please try again.",
        duration: 4000,
      });
    }
  }, [isError, isPending, setIsWaitingForConfirmation]);

  return (
    <div>
      <Button
        className="rounded-md bg-white/20 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/30"
        onClick={checkEligibility}
        disabled={buttonState.disabled}
      >
        {buttonState.text}
      </Button>

      <Dialog
        open={state.activeModal === "subscribe"}
        onOpenChange={closeModal}
      >
        <ModalOverlay />
        <EligibilityModal
          emailInput={state.emailInput}
          isSubmitting={state.isSubmitting}
          onEmailChange={handleEmailChange}
          onNext={handleNext}
          userExists={userExists}
          checkingUser={checkingUser}
          onSkip={handleSkip}
        />
      </Dialog>

      <Dialog
        open={state.activeModal === "twitterFollow"}
        onOpenChange={closeModal}
      >
        <ModalOverlay />
        {bonusAlreadyAwarded ? (
          <FollowBonusAlreadyAwardedModal onContinue={goToClaim} />
        ) : (
          <TwitterFollowModal
            onContinue={goToClaim}
            onFollow={handleTwitterFollow}
            isFollowClicked={state.isFollowClicked}
          />
        )}
      </Dialog>

      <Dialog open={state.activeModal === "claim"} onOpenChange={closeModal}>
        <ModalOverlay />
        <ClaimModal
          allocation={state.allocation}
          onBack={goToTwitterFollow}
          claimRewards={handleClaim}
          isFollowed={state.isFollowed}
          bonusAlreadyAwarded={bonusAlreadyAwarded}
          isPending={isPending}
        />
      </Dialog>

      <Dialog
        open={state.activeModal === "notEligible"}
        onOpenChange={closeModal}
      >
        <ModalOverlay />
        <NotEligibleModal onClose={closeModal} />
      </Dialog>

      <Dialog
        open={state.activeModal === "twitterShare"}
        onOpenChange={closeModal}
      >
        <ModalOverlay />
        <TwitterShareModal onClose={closeModal} allocation={state.allocation} />
      </Dialog>
    </div>
  );
};

export default React.memo(CheckEligibility);
