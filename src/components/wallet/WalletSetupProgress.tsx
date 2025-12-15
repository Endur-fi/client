"use client";

import React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type WalletSetupStep = "idle" | "creating" | "deploying" | "complete";

interface WalletSetupProgressProps {
  step: WalletSetupStep;
  className?: string;
}

export function WalletSetupProgress({
  step,
  className,
}: WalletSetupProgressProps) {
  const steps = [
    {
      key: "creating" as const,
      label: "Creating your wallet...",
      icon: Loader2,
    },
    {
      key: "deploying" as const,
      label: "Deploying your wallet...",
      icon: Loader2,
    },
    {
      key: "complete" as const,
      label: "Wallet ready!",
      icon: CheckCircle2,
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const activeStep = steps[currentStepIndex] || steps[0];

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-[#03624C]",
        className,
      )}
    >
      {step === "creating" || step === "deploying" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : step === "complete" ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : null}
      <span>{activeStep.label}</span>
    </div>
  );
}
