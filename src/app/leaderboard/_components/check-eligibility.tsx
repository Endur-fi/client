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
import { cn } from "@/lib/utils";

const font = Figtree({ subsets: ["latin-ext"] });

const CheckEligibility = () => {
  const [showEligibilityModal, setShowEligibilityModal] = React.useState(false);
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [showNotEligibleModal, setShowNotEligibleModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [emailInput, setEmailInput] = React.useState("");

  async function sendEmail(email: string): Promise<boolean> {
    if (!email) {
      toast({
        description: "Email input is required",
        variant: "destructive",
      });
      return false;
    }

    // basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          description: "Email sent successfully! Check your inbox.",
        });
        return true;
      }
      toast({
        description: data.error || "Failed to send email",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  const handleNextClick = async () => {
    const emailSent = await sendEmail(emailInput);
    if (emailSent || !emailInput) {
      setShowEligibilityModal(false);
      setShowClaimModal(true);
    }
  };

  return (
    <div>
      <Dialog
        open={showEligibilityModal}
        onOpenChange={setShowEligibilityModal}
      >
        <DialogTrigger asChild>
          <Button className="bg-[#16876D] hover:bg-[#16876D]">
            Check eligiblity
          </Button>
        </DialogTrigger>
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
                alt="eligibility_illustration"
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
            We respect your privacy - no spam, no sharing data with third
            parties, ever. Just meaningful updates. You can unsubscribe anytime.
          </p>

          <Button
            onClick={() => {
              setShowEligibilityModal(false);
              setShowClaimModal(true);
            }}
            disabled={isLoading}
            className="mt-1 bg-transparent text-center text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5] disabled:opacity-50"
          >
            Skip
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
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
                alt="eligibility_illustration"
              />
            </div>
            <DialogTitle className="!mt-8 text-center text-2xl font-semibold text-white">
              Claimed 250K STRK
            </DialogTitle>
            <DialogDescription className="text-center text-sm font-normal text-[#DCF6E5]">
              You&apos;ve earned it! Grab your fee rebate rewards now.
            </DialogDescription>
          </DialogHeader>

          <div className="relative !mt-3 flex w-full flex-col items-center justify-center gap-2 px-2">
            <Button
              // TODO: remove later
              onClick={() => {
                setShowClaimModal(false);
                setShowNotEligibleModal(true);
              }}
              className="h-12 w-full rounded-md bg-[#518176] text-white hover:bg-[#518176]/90"
            >
              Claim Rewards
            </Button>
            <Button
              onClick={() => {
                setShowClaimModal(false);
                setShowEligibilityModal(true);
              }}
              className="h-10 rounded-md bg-transparent px-6 text-sm text-[#DCF6E5]/50 shadow-none transition-all hover:bg-transparent hover:text-[#DCF6E5]"
            >
              Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showNotEligibleModal}
        onOpenChange={setShowNotEligibleModal}
      >
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
                alt="not_eligible_illustration"
              />
            </div>
            <DialogTitle className="!mt-8 text-center text-2xl font-semibold text-white">
              Not Eligible : (
            </DialogTitle>
          </DialogHeader>

          <div className="relative !mt-3 flex w-full flex-col items-center justify-center gap-2 px-2">
            <Button
              onClick={() => {
                setShowNotEligibleModal(false);
                setShowClaimModal(true);
              }}
              className="h-12 w-full rounded-md bg-[#518176] text-white hover:bg-[#518176]/90"
            >
              Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckEligibility;
