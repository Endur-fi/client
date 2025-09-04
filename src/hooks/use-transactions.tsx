import React from "react";

import { Icons } from "@/components/Icons";
import { MyAnalytics } from "@/lib/analytics";
import { eventNames } from "@/lib/utils";
import { isTxAccepted } from "@/store/transactions.atom";

import { toast, useToast } from "./use-toast";
import { lstConfigAtom } from "@/store/common.store";
import { useAtomValue } from "jotai";

type TransactionType = "STAKE" | "UNSTAKE";

interface TransactionHandlerProps {
  form: {
    getValues: (key: string) => number | string;
    reset: () => void;
  };
  address: string;
  data: {
    transaction_hash?: string;
  };
  error: {
    name?: string;
  };
  isPending: boolean;
  setShowShareModal?: (show: boolean) => void;
}

const useTransactionHandler = () => {
  const { dismiss } = useToast();
  const lstConfig = useAtomValue(lstConfigAtom)!;

  const handleTransaction = async (
    transactionType: TransactionType,
    {
      form,
      address,
      data,
      error,
      isPending,
      setShowShareModal,
    }: TransactionHandlerProps,
  ) => {
    if (data?.transaction_hash) {
      // Track transaction init analytics
      MyAnalytics.track(
        eventNames[`${transactionType}_TX_INIT` as keyof typeof eventNames],
        {
          address,
          amount: Number(
            form.getValues(`${transactionType.toLowerCase()}Amount`),
          ),
          txHash: data.transaction_hash,
        },
      );
    }

    if (isPending) {
      toast({
        itemID: transactionType.toLowerCase(),
        variant: "pending",
        description: (
          <div className="flex items-center gap-5 border-none">
            <div className="relative shrink-0">
              <div className="absolute left-3 top-3 z-10 size-[52px] rounded-full bg-[#BBC2CC]" />
              <Icons.toastPending className="animate-spin" />
              <Icons.clock className="absolute left-[26.5px] top-[26.5px] z-20" />
            </div>
            <div className="flex flex-col items-start gap-2 text-sm font-medium text-[#3F6870]">
              <span className="text-[18px] font-semibold text-[#075A5A]">
                In Progress..
              </span>
              {transactionType === "STAKE" ? "Staking" : "Unstaking"}{" "}
              {form.getValues(`${transactionType.toLowerCase()}Amount`)}{" "}
              {lstConfig.SYMBOL}
            </div>
          </div>
        ),
      });
    }

    if (error?.name?.includes("UserRejectedRequestError")) {
      // Track transaction rejected analytics
      MyAnalytics.track(
        eventNames[`${transactionType}_TX_REJECTED` as keyof typeof eventNames],
        {
          address,
          amount: Number(
            form.getValues(`${transactionType.toLowerCase()}Amount`),
          ),
          type: error.name,
        },
      );
      dismiss();
    }

    if (error?.name && !error?.name?.includes("UserRejectedRequestError")) {
      // Track transaction rejected analytics
      MyAnalytics.track(
        eventNames[`${transactionType}_TX_REJECTED` as keyof typeof eventNames],
        {
          address,
          amount: Number(
            form.getValues(`${transactionType.toLowerCase()}Amount`),
          ),
          type: error.name,
        },
      );
      toast({
        itemID: transactionType.toLowerCase(),
        variant: "pending",
        description: (
          <div className="flex items-center gap-5 border-none pl-2">
            ❌
            <div className="flex flex-col items-start text-sm font-medium text-[#3F6870]">
              <span className="text-base font-semibold text-[#075A5A]">
                Something went wrong
              </span>
              Please try again
            </div>
          </div>
        ),
      });
    }

    if (data && data?.transaction_hash) {
      const res = await isTxAccepted(data.transaction_hash);

      if (res) {
        // Track transaction successful analytics
        MyAnalytics.track(
          eventNames[
            `${transactionType}_TX_SUCCESSFUL` as keyof typeof eventNames
          ],
          {
            address,
            amount: Number(
              form.getValues(`${transactionType.toLowerCase()}Amount`),
            ),
            txHash: data.transaction_hash,
          },
        );
        toast({
          itemID: transactionType.toLowerCase(),
          variant: "complete",
          duration: 3000,
          description: (
            <div className="flex items-center gap-2 border-none">
              <Icons.toastSuccess />
              <div className="flex flex-col items-start gap-2 text-sm font-medium text-[#3F6870]">
                <span className="text-[18px] font-semibold text-[#075A5A]">
                  Success 🎉
                </span>
                {transactionType === "STAKE" ? "Staked" : "Unstaked"}{" "}
                {form.getValues(`${transactionType.toLowerCase()}Amount`)}{" "}
                {lstConfig.SYMBOL}
              </div>
            </div>
          ),
        });

        if (transactionType === "STAKE" && setShowShareModal) {
          setShowShareModal(true);
        }

        form.reset();
      }
    }
  };

  return { handleTransaction };
};

export { useTransactionHandler };
