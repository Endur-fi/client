import React from "react";

import { Icons } from "@/components/Icons";
import { MyAnalytics } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
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

/**
 * Flatten a wallet/RPC error (and any nested `message`/`baseError`/`cause`/
 * `data`) into a single searchable string. Used to detect standard SNIP
 * wallet-api error codes (e.g. `USER_REFUSED_OP`) regardless of how deeply
 * the wallet/connector nests them, since `error.name` alone doesn't always
 * carry them.
 */
export function flattenErrorText(
  error: unknown,
  seen = new Set<unknown>(),
): string {
  if (!error || seen.has(error)) return "";
  seen.add(error);

  if (typeof error === "string") return error;
  if (typeof error !== "object") return "";

  const err = error as {
    message?: unknown;
    name?: unknown;
    baseError?: unknown;
    cause?: unknown;
    data?: unknown;
  };

  return [
    typeof err.name === "string" ? err.name : "",
    typeof err.message === "string" ? err.message : "",
    flattenErrorText(err.baseError, seen),
    flattenErrorText(err.cause, seen),
    flattenErrorText(err.data, seen),
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * True when the user cancelled/rejected the wallet confirmation prompt.
 * Wallets surface this several ways — SNIP `USER_REFUSED_OP`, starknet.js
 * `UserRejectedRequestError`, or a plain "User rejected Starknet invoke
 * request" message — so we match any of them on the flattened error text.
 */
export function isUserRejectionError(error: unknown): boolean {
  const text = flattenErrorText(error).toLowerCase();
  return (
    text.includes("user_refused_op") ||
    text.includes("userrejectedrequesterror") ||
    text.includes("user rejected")
  );
}

/**
 * Console-log an invoke failure (and its nested `message`/`baseError`/`cause`)
 * under a consistent tag. Shared by the privacy stake/unstake `invokeAsync`
 * catch blocks so they don't each hand-roll the same dump.
 */
export function logInvokeError(tag: string, error: unknown): void {
  console.error(tag, error);
  if (error && typeof error === "object") {
    const err = error as {
      message?: unknown;
      baseError?: unknown;
      cause?: unknown;
    };
    console.error(`${tag}:message`, err.message);
    console.error(`${tag}:baseError`, err.baseError);
    console.error(`${tag}:cause`, err.cause);
  }
}

/**
 * Shared toast templates for the "❌ rejected/failed" and "✅ success" states.
 * Both the standard flow (below, driven by `useSendTransaction`) and the
 * privacy/shielded flow (driven by `invokeAsync`, e.g. in `stake.tsx`) hit
 * the same outcomes but can't share a single call site, so they share these
 * renderers instead of duplicating the JSX.
 */
export function showRejectedToast(itemID: string) {
  toast({
    itemID,
    variant: "pending",
    description: (
      <div className="flex items-center gap-5 border-none pl-2">
        ❌
        <div className="flex flex-col items-start text-sm font-medium text-[#3F6870]">
          <span className="text-base font-semibold text-[#075A5A]">
            Transaction rejected
          </span>
          You rejected the request in your wallet
        </div>
      </div>
    ),
  });
}

export function showFailedToast(
  itemID: string,
  title: string,
  message: string,
) {
  toast({
    itemID,
    variant: "pending",
    description: (
      <div className="flex items-center gap-5 border-none pl-2">
        ❌
        <div className="flex flex-col items-start text-sm font-medium text-[#3F6870]">
          <span className="text-base font-semibold text-[#075A5A]">
            {title}
          </span>
          {message}
        </div>
      </div>
    ),
  });
}

export function showSuccessToast(itemID: string, message: React.ReactNode) {
  toast({
    itemID,
    variant: "complete",
    duration: 3000,
    description: (
      <div className="flex items-center gap-2 border-none">
        <Icons.toastSuccess />
        <div className="flex flex-col items-start gap-2 text-sm font-medium text-[#3F6870]">
          <span className="text-[18px] font-semibold text-[#075A5A]">
            Success 🎉
          </span>
          {message}
        </div>
      </div>
    ),
  });
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
  // Extra context forwarded by the caller (platform, method, referrer, etc.)
  metadata?: Record<string, unknown>;
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
      metadata,
    }: TransactionHandlerProps,
  ) => {
    // Common props sent with every event for this TX
    const baseProps = {
      address,
      amount: Number(form.getValues(`${transactionType.toLowerCase()}Amount`)),
      asset: lstConfig.SYMBOL,
      ...metadata,
    };

    if (data?.transaction_hash) {
      MyAnalytics.track(
        transactionType === "STAKE"
          ? AnalyticsEvents.STAKE_TX_INIT
          : AnalyticsEvents.UNSTAKE_TX_INIT,
        {
          ...baseProps,
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

    // Standard SNIP wallet-api rejection code (code 113); some wallets/
    // connectors surface this instead of (or alongside) `UserRejectedRequestError`.
    // Others use a plain "User rejected Starknet invoke request" message.
    if (isUserRejectionError(error)) {
      MyAnalytics.track(
        transactionType === "STAKE"
          ? AnalyticsEvents.STAKE_TX_REJECTED
          : AnalyticsEvents.UNSTAKE_TX_REJECTED,
        {
          ...baseProps,
          type: error?.name || "USER_REFUSED_OP",
        },
      );
      dismiss();
      showRejectedToast(transactionType.toLowerCase());
    } else if (error?.name) {
      MyAnalytics.track(
        transactionType === "STAKE"
          ? AnalyticsEvents.STAKE_TX_REJECTED
          : AnalyticsEvents.UNSTAKE_TX_REJECTED,
        {
          ...baseProps,
          type: error.name,
        },
      );
      // Show the underlying message only when the error originated from our
      // paymaster route (rate limit, below-min, deploy-once, etc.). Upstream
      // AVNU errors and chain reverts keep the generic copy.
      const endurMessage = getEndurPaymasterMessage(error);
      showFailedToast(
        transactionType.toLowerCase(),
        endurMessage ? "Transaction failed" : "Something went wrong",
        endurMessage ?? "Please try again",
      );
    }

    if (data && data?.transaction_hash) {
      const res = await isTxAccepted(data.transaction_hash);

      if (res) {
        MyAnalytics.track(
          transactionType === "STAKE"
            ? AnalyticsEvents.STAKE_TX_SUCCESSFUL
            : AnalyticsEvents.UNSTAKE_TX_SUCCESSFUL,
          {
            ...baseProps,
            txHash: data.transaction_hash,
          },
        );
        showSuccessToast(
          transactionType.toLowerCase(),
          <>
            {transactionType === "STAKE" ? "Staked" : "Unstaked"}{" "}
            {form.getValues(`${transactionType.toLowerCase()}Amount`)}{" "}
            {lstConfig.SYMBOL}
          </>,
        );

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
