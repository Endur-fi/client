import React from "react";

import { Icons } from "@/components/Icons";
import { MyAnalytics } from "@/lib/analytics";
import { eventNames } from "@/lib/utils";
import { isTxAccepted } from "@/store/transactions.atom";
import { lstConfigAtom } from "@/store/common.store";
import { useAtomValue } from "jotai";

import { toast, useToast } from "./use-toast";

type TransactionType = "STAKE" | "UNSTAKE";

/**
 * Extract a user-facing message from an Endur paymaster rejection.
 *
 * Our /api/paymaster route emits JSON-RPC 2.0 error envelopes tagged with
 * `data: { source: "endur" }` so we can distinguish them from upstream AVNU
 * errors and on-chain reverts. starknet.js wraps the JSON-RPC error in an
 * `RpcError` whose `baseError` is the parsed `{ code, message, data }`.
 *
 * Returns the message only when the discriminator is present; otherwise
 * `null`, so the caller falls back to its generic toast copy.
 */
function getEndurPaymasterMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  // Walk error.baseError and error.cause?.baseError (RpcError may be wrapped
  // by easyleap/starknet-react before reaching the React boundary).
  const candidates: Array<{ data?: unknown; message?: unknown }> = [];
  const e = error as { baseError?: unknown; cause?: unknown };
  if (e.baseError && typeof e.baseError === "object") {
    candidates.push(e.baseError as { data?: unknown; message?: unknown });
  }
  if (
    e.cause &&
    typeof e.cause === "object" &&
    "baseError" in e.cause &&
    typeof (e.cause as { baseError?: unknown }).baseError === "object"
  ) {
    candidates.push(
      (e.cause as { baseError: { data?: unknown; message?: unknown } })
        .baseError,
    );
  }

  for (const c of candidates) {
    const data = c.data as { source?: unknown } | undefined;
    if (data?.source === "endur" && typeof c.message === "string") {
      return c.message;
    }
  }
  return null;
}

interface TransactionHandlerProps {
  form: {
    getValues: (key: string) => number | string;
    reset: () => void;
  };
  address: string;
  data: {
    transaction_hash?: string;
  };
  // Accept the raw error object (typically starknet.js's RpcError). Earlier
  // call sites narrowed this to `{ name }`, which discarded `baseError` and
  // made it impossible to surface paymaster-specific messages downstream.
  error: (Error & { baseError?: unknown; cause?: unknown }) | null | undefined;
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
      // Show the underlying message only when the error originated from our
      // paymaster route (rate limit, below-min, deploy-once, etc.). Upstream
      // AVNU errors and chain reverts keep the generic copy.
      const endurMessage = getEndurPaymasterMessage(error);
      toast({
        itemID: transactionType.toLowerCase(),
        variant: "pending",
        description: (
          <div className="flex items-center gap-5 border-none pl-2">
            ❌
            <div className="flex flex-col items-start text-sm font-medium text-[#3F6870]">
              <span className="text-base font-semibold text-[#075A5A]">
                {endurMessage ? "Transaction failed" : "Something went wrong"}
              </span>
              {endurMessage ?? "Please try again"}
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
