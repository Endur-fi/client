/**
 * Paymaster rate-limit enforcement and usage recording.
 *
 * Reads/writes the `paymaster_usage` Postgres table via Prisma. All knobs
 * (RPH, window, per-asset thresholds) live in `paymaster-rate-config.ts`.
 *
 * Two entry points:
 *   - checkRateLimit:  read-only; called for every stake/unstake paymaster
 *                      request (build & execute) so the user gets early
 *                      feedback before signing.
 *   - recordPaymasterUsage: write; called only after AVNU returns 2xx for
 *                      paymaster_executeTransaction. Build-only retries are
 *                      free; failed executes don't burn quota.
 */
import { Web3Number } from "@strkfarm/sdk";

import { LST_CONFIG } from "@/constants";

import { PAYMASTER_RATE_CONFIG } from "./paymaster-rate-config";
import { PrismaClient } from "@prisma/client";

export type RateLimitKind =
  | "stake"
  | "stake+hyper"
  | "unstake-endur"
  | "unstake-avnu";

export type RateCheckResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

function isStakeKind(kind: RateLimitKind): boolean {
  return kind === "stake" || kind === "stake+hyper";
}

/**
 * Convert a human-readable amount (e.g. "10000") to raw on-chain units
 * using the asset's decimals. Throws on malformed input — callers should
 * pass values from the config object only.
 *
 * Uses Web3Number for consistency with the rest of the codebase (stake.tsx,
 * defi.store.ts). `toWei()` returns a decimal string (no precision loss for
 * decimals up to 18) which we lift to bigint.
 */
function toWeiBNum(amount: string, decimals: number): bigint {
  return BigInt(new Web3Number(amount, decimals).toWei());
}

/**
 * Check whether a stake/unstake request is allowed under the rate limit.
 *
 * Order of checks (matches the spec):
 *   1. amount > bypassThreshold -> allow, do not consult the window
 *   2. amount < min{Stake|Unstake} -> reject 400
 *   3. min <= amount <= bypass    -> allow only if window count < rph,
 *                                    else reject 429
 */
export async function checkRateLimit(
  prisma: PrismaClient,
  privyUserId: string,
  kind: RateLimitKind,
  assetSymbol: string,
  amountWei: bigint,
): Promise<RateCheckResult> {
  const cfg = PAYMASTER_RATE_CONFIG.perAsset[assetSymbol];
  if (!cfg) {
    return {
      ok: false,
      status: 400,
      message: `Asset ${assetSymbol} is not configured for sponsorship`,
    };
  }

  const lst = LST_CONFIG[assetSymbol];
  if (!lst) {
    return {
      ok: false,
      status: 400,
      message: `Asset ${assetSymbol} is not in LST_CONFIG`,
    };
  }

  const decimals = lst.DECIMALS;
  const bypassWei = toWeiBNum(cfg.bypassThreshold, decimals);
  const minAmount = isStakeKind(kind) ? cfg.minStake : cfg.minUnstake;
  const minWei = toWeiBNum(minAmount, decimals);
  const action = isStakeKind(kind) ? "stake" : "unstake";

  if (amountWei > bypassWei) {
    return { ok: true };
  }

  if (amountWei < minWei) {
    return {
      ok: false,
      status: 400,
      // Surfaced verbatim in the client toast (see use-transactions.tsx).
      // This limit is specifically enforced for requests keyed by the Privy
      // user (privyUserId), so we call it out as a Privy-flow constraint.
      message: `Privy flow ${action} minimum is ${minAmount} ${assetSymbol}. Please increase the amount.`,
    };
  }

  const since = new Date(Date.now() - PAYMASTER_RATE_CONFIG.windowMs);
  let count: number = 0;
  try {
    count = await prisma.paymasterUsage.count({
      where: {
        privyUserId,
        createdAt: { gt: since },
      },
    });
  } catch (err) {
    console.error("[paymaster] failed to check rate limit", err);
    return {
      ok: false,
      status: 500,
      message: "Internal server error",
    };
  }

  if (count >= PAYMASTER_RATE_CONFIG.rph) {
    return {
      ok: false,
      status: 429,
      message: `Privy flow transaction limit reached. Please try again later.`,
    };
  }

  return { ok: true };
}

/**
 * Persist a successful sponsored op so it counts toward the rate-limit
 * window for subsequent requests. Best-effort: errors are logged but do
 * not surface to the user (the AVNU sponsorship has already happened).
 */
export async function recordPaymasterUsage(
  prisma: any,
  privyUserId: string,
  kind: RateLimitKind,
  assetSymbol: string,
  amountWei: bigint,
): Promise<void> {
  try {
    await prisma.paymasterUsage.create({
      data: {
        privyUserId,
        kind,
        asset: assetSymbol,
        amountWei: amountWei.toString(),
      },
    });
  } catch (err) {
    console.error("[paymaster] failed to record usage", {
      privyUserId,
      kind,
      assetSymbol,
      err,
    });
  }
}
