import { useAccount } from "@starknet-react/core";
import axios from "axios";
import { Figtree } from "next/font/google";
import Image from "next/image";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn, formatNumberWithCommas } from "@/lib/utils";

const font = Figtree({ subsets: ["latin-ext"] });

// Constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserCompleteDetailsApiResponse {
  user_address: string;
  points: {
    total_points: bigint;
    regular_points: bigint;
    bonus_points: bigint;
    referrer_points: bigint;
  };
  allocation: string;
  tags: {
    early_adopter: boolean;
  };
}

type ModalType = "subscribe" | "claim" | "notEligible" | null;

interface CheckEligibilityProps {
  userCompleteInfo: UserCompleteDetailsApiResponse | null;
}

interface EligibilityState {
  allocation: string | null;
  activeModal: ModalType;
  isLoading: boolean;
  emailInput: string;
  isEligible: boolean;
}

// Utility functions
const validateEmail = (email: string): boolean => {
  if (!email) {
    toast({
      description: "Email input is required",
      variant: "destructive",
    });
    return false;
  }

  if (!EMAIL_REGEX.test(email)) {
    toast({
      description: "Please enter a valid email address",
      variant: "destructive",
    });
    return false;
  }

  return true;
};

const sendEmailRequest = async (email: string): Promise<boolean> => {
  try {
    await axios.post("/api/send-email", { email });
    toast({
      description: "Endur's email subscription activated",
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.error || "Failed to send email"
      : "Network error. Please try again.";

    toast({
      description: errorMessage,
      variant: "destructive",
    });
    return false;
  }
};

// Modal Components
const EligibilityModal = React.memo(
  ({
    emailInput,
    isLoading,
    onEmailChange,
    onNext,
    onSkip,
  }: {
    emailInput: string;
    isLoading: boolean;
    onEmailChange: (email: string) => void;
    onNext: () => void;
    onSkip: () => void;
  }) => (
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
            src="/leaderboard/eligibility_illustration.svg"
            width={316}
            height={271}
            alt="eligibility illustration"
          />
        </div>
        <DialogTitle className="!mt-8 text-center text-2xl font-semibold text-white">
          Stay Updated with Endur
        </DialogTitle>
        <DialogDescription className="text-center text-sm font-normal text-[#DCF6E5]">
          Get notified when claims open, new product updates, and upcoming
          programs
        </DialogDescription>
      </DialogHeader>

      <div className="relative !mt-3 w-full px-2">
        <Input
          value={emailInput}
          onChange={(e) => onEmailChange(e.target.value)}
          className="h-12 w-full rounded-md border-0 bg-[#518176] pl-5 pr-24 text-[#DCF6E5] placeholder:text-[#DCF6E5]/80 focus-visible:ring-0"
          placeholder="Enter email"
          disabled={isLoading}
        />
        <Button
          onClick={onNext}
          disabled={isLoading}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-[#0D4E3F] px-6 text-sm text-white hover:bg-[#0D4E3F] disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Next"}
        </Button>
      </div>

      <p className="px-4 text-center text-xs text-[#DCF6E5]">
        We respect your privacy - no spam, no sharing data with third parties,
        ever. Just meaningful updates. You can unsubscribe anytime.
      </p>

      <Button
        onClick={onSkip}
        disabled={isLoading}
        className="mt-1 bg-transparent text-center text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5] disabled:opacity-50"
      >
        Skip
      </Button>
    </DialogContent>
  ),
);
EligibilityModal.displayName = "EligibilityModal";

const ClaimModal = React.memo(
  ({
    allocation,
    onClose,
  }: {
    allocation: string | null;
    onClose: () => void;
  }) => (
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
            src="/leaderboard/claim_illustration.svg"
            width={266}
            height={290}
            alt="claim illustration"
          />
        </div>
        <DialogTitle className="!mt-8 text-center text-2xl font-semibold text-white">
          {allocation
            ? `Reward ${formatNumberWithCommas(allocation)} STRK`
            : "Claim Rewards"}
        </DialogTitle>
        {/* <DialogDescription className="text-center text-sm font-normal text-[#DCF6E5]">
          You&apos;ve earned it! Grab your fee rebate rewards now.
        </DialogDescription> */}
        {/* <DialogDescription className="text-center text-sm font-normal text-[#DCF6E5]">
          If you have any concerns, please fill this{" "}
          <a href="" className="underline">
            form
          </a>
          .
        </DialogDescription> */}
      </DialogHeader>

      <div className="relative !mt-3 flex w-full flex-col items-center justify-center gap-2 px-2">
        <Button
          className="h-12 w-full rounded-md bg-[#518176] text-white hover:bg-[#518176]/90"
          disabled={true}
        >
          Claims open after 22nd Jun, 2025
        </Button>
        <Button
          onClick={onClose}
          className="h-10 rounded-md bg-transparent px-6 text-sm text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5]"
        >
          Close
        </Button>
      </div>
    </DialogContent>
  ),
);
ClaimModal.displayName = "ClaimModal";

const NotEligibleModal = React.memo(({ onClose }: { onClose: () => void }) => (
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
        Not Eligible :(
      </DialogTitle>
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

const CheckEligibility: React.FC<CheckEligibilityProps> = ({
  userCompleteInfo,
}) => {
  const [state, setState] = React.useState<EligibilityState>({
    allocation: null,
    activeModal: null,
    isLoading: false,
    emailInput: "",
    isEligible: false,
  });

  const { address } = useAccount();

  const handleEmailChange = React.useCallback((email: string) => {
    setState((prev) => ({ ...prev, emailInput: email }));
  }, []);

  const handleEmailSend = React.useCallback(
    async (email: string): Promise<boolean> => {
      if (!validateEmail(email)) return false;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        return await sendEmailRequest(email);
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [],
  );

  const handleNext = React.useCallback(async () => {
    const { emailInput, isEligible } = state;

    let emailSent = true;
    if (emailInput) {
      emailSent = await handleEmailSend(emailInput);
    }

    if (emailSent) {
      setState((prev) => ({
        ...prev,
        emailInput: "",
        activeModal: isEligible ? "claim" : "notEligible",
      }));
    }
  }, [state.emailInput, state.isEligible, handleEmailSend]);

  const handleSkip = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeModal: prev.isEligible ? "claim" : "notEligible",
    }));
  }, []);

  const handleClose = React.useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: null, allocation: null }));
  }, []);

  const checkEligibility = React.useCallback(() => {
    if (!address) {
      toast({
        description: "Connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const allocation = userCompleteInfo?.allocation || null;
      const isEligible = allocation ? Number(allocation) > 0 : false;

      setState((prev) => ({
        ...prev,
        allocation,
        isEligible,
        activeModal: "subscribe",
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error checking eligibility:", error);
      toast({
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [address, userCompleteInfo?.allocation]);

  const closeModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: null }));
  }, []);

  return (
    <div>
      <Dialog
        open={state.activeModal === "subscribe"}
        onOpenChange={(open) =>
          setState((prev) => ({
            ...prev,
            activeModal: open ? "subscribe" : null,
          }))
        }
      >
        <DialogTrigger asChild>
          <Button
            className="bg-[#16876D] hover:bg-[#16876D]"
            onClick={checkEligibility}
            disabled={state.isLoading}
          >
            {state.isLoading ? "Checking..." : "Check eligibility"}
          </Button>
        </DialogTrigger>
        <EligibilityModal
          emailInput={state.emailInput}
          isLoading={state.isLoading}
          onEmailChange={handleEmailChange}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      </Dialog>

      <Dialog
        open={state.activeModal === "claim"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <ClaimModal allocation={state.allocation} onClose={handleClose} />
      </Dialog>

      <Dialog
        open={state.activeModal === "notEligible"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <NotEligibleModal onClose={handleClose} />
      </Dialog>
    </div>
  );
};

export default CheckEligibility;
