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
import { GET_USER_COMPLETE_DETAILS } from "@/constants/queries";
import { toast } from "@/hooks/use-toast";
import apolloClient from "@/lib/apollo-client";
import { cn } from "@/lib/utils";

const font = Figtree({ subsets: ["latin-ext"] });

interface UserDetails {
  allocation: string;
}

type ModalType = "subscribe" | "claim" | "notEligible" | null;

const CheckEligibility = () => {
  const [allocation, setAllocation] = React.useState<string | null>(null);
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState("");
  const [isEligible, setIsEligible] = React.useState(false);

  const { address } = useAccount();

  // email validation regex
  const emailRegex = React.useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const validateEmail = React.useCallback(
    (email: string): boolean => {
      if (!email) {
        toast({
          description: "Email input is required",
          variant: "destructive",
        });
        return false;
      }

      if (!emailRegex.test(email)) {
        toast({
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return false;
      }

      return true;
    },
    [emailRegex],
  );

  const sendEmail = React.useCallback(
    async (email: string): Promise<boolean> => {
      if (!validateEmail(email)) return false;

      setIsLoading(true);

      try {
        await axios.post("/api/send-email", { email });

        toast({
          description: "Email sent successfully! Check your inbox.",
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
      } finally {
        setIsLoading(false);
      }
    },
    [validateEmail],
  );

  const handleNextClick = React.useCallback(async () => {
    const emailSent = await sendEmail(emailInput);
    if (emailSent || !emailInput) {
      setEmailInput("");
      if (isEligible) {
        setActiveModal("claim");
      } else {
        setActiveModal("notEligible");
      }
    }
  }, [emailInput, isEligible, sendEmail]);

  const checkEligibility = React.useCallback(async () => {
    if (!address) {
      toast({
        description: "Connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await apolloClient.query({
        query: GET_USER_COMPLETE_DETAILS,
        variables: {
          userAddress: address,
        },
      });

      const result: UserDetails | null = data?.getUserCompleteDetails;

      if (result) {
        setAllocation(result.allocation);
        const eligible = Number(result.allocation) > 0;
        setIsEligible(eligible);
        setActiveModal("subscribe");
      } else {
        setIsEligible(false);
        setActiveModal("subscribe");
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      toast({
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const handleSkip = React.useCallback(() => {
    if (isEligible) {
      setActiveModal("claim");
    } else {
      setActiveModal("notEligible");
    }
  }, [isEligible]);

  const EligibilityModal = React.useMemo(
    () => (
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
            onChange={(e) => setEmailInput(e.target.value)}
            className="h-12 w-full rounded-md border-0 bg-[#518176] pl-5 pr-24 text-[#DCF6E5] placeholder:text-[#DCF6E5]/80 focus-visible:ring-0"
            placeholder="Enter email"
            disabled={isLoading}
          />
          <Button
            onClick={handleNextClick}
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
          onClick={handleSkip}
          disabled={isLoading}
          className="mt-1 bg-transparent text-center text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5] disabled:opacity-50"
        >
          Skip
        </Button>
      </DialogContent>
    ),
    [emailInput, isLoading, handleNextClick, handleSkip],
  );

  const ClaimModal = React.useMemo(
    () => (
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
            {allocation ? `Claimed ${allocation} STRK` : "Claim Rewards"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-normal text-[#DCF6E5]">
            You&apos;ve earned it! Grab your fee rebate rewards now.
          </DialogDescription>
        </DialogHeader>

        <div className="relative !mt-3 flex w-full flex-col items-center justify-center gap-2 px-2">
          <Button className="h-12 w-full rounded-md bg-[#518176] text-white hover:bg-[#518176]/90">
            Claim Rewards
          </Button>
          <Button
            onClick={() => setActiveModal("subscribe")}
            className="h-10 rounded-md bg-transparent px-6 text-sm text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5]"
          >
            Back
          </Button>
        </div>
      </DialogContent>
    ),
    [allocation],
  );

  const NotEligibleModal = React.useMemo(
    () => (
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
            onClick={() => setActiveModal("subscribe")}
            className="h-12 w-full rounded-md bg-[#518176] text-white hover:bg-[#518176]/90"
          >
            Back
          </Button>
        </div>
      </DialogContent>
    ),
    [],
  );

  return (
    <div>
      <Dialog
        open={activeModal === "subscribe"}
        onOpenChange={(open) => setActiveModal(open ? "subscribe" : null)}
      >
        <DialogTrigger asChild>
          <Button
            className="bg-[#16876D] hover:bg-[#16876D]"
            onClick={checkEligibility}
            disabled={isLoading}
          >
            {isLoading ? "Checking..." : "Check eligibility"}
          </Button>
        </DialogTrigger>
        {EligibilityModal}
      </Dialog>

      <Dialog
        open={activeModal === "claim"}
        onOpenChange={(open) => setActiveModal(open ? "claim" : null)}
      >
        {ClaimModal}
      </Dialog>

      <Dialog
        open={activeModal === "notEligible"}
        onOpenChange={(open) => setActiveModal(open ? "notEligible" : null)}
      >
        {NotEligibleModal}
      </Dialog>
    </div>
  );
};

export default CheckEligibility;
