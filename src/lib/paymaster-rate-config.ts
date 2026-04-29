/**
 * Paymaster rate-limit configuration.
 *
 * All knobs for /api/paymaster's stake/unstake rate limiting live in this
 * single object so they can be tuned without touching the route or guard.
 *
 * Logic (per request, per Privy user):
 *   1. amount > bypassThresholdEther       -> allow, do NOT count
 *   2. amount < min{Stake|Unstake}Ether    -> reject 400
 *   3. min <= amount <= bypass             -> allow only if usage in the last
 *                                              `windowMs` is below `rph`,
 *                                              else 429
 *
 * Deploy operations are NOT subject to this and are gated separately by
 * `wallet.isDeployed` (one deploy per Privy user, ever).
 */
export type RateLimitAssetConfig = {
  bypassThreshold: string;
  minStake: string;
  minUnstake: string;
};

export type RateLimitConfig = {
  rph: number;
  windowMs: number;
  perAsset: Record<string, RateLimitAssetConfig>;
};

export const PAYMASTER_RATE_CONFIG: RateLimitConfig = {
  rph: 5,
  windowMs: 60 * 60 * 1000,

  // Placeholder values: tune as needed. Keys are LST symbols from LST_CONFIG.
  perAsset: {
    STRK: {
      bypassThreshold: "10000",
      minStake: "0.1",
      minUnstake: "0.1",
    },
    WBTC: {
      bypassThreshold: "0.1",
      minStake: "0.0001",
      minUnstake: "0.0001",
    },
    tBTC: {
      bypassThreshold: "0.1",
      minStake: "0.0001",
      minUnstake: "0.0001",
    },
    LBTC: {
      bypassThreshold: "0.1",
      minStake: "0.0001",
      minUnstake: "0.0001",
    },
    solvBTC: {
      bypassThreshold: "0.1",
      minStake: "0.0001",
      minUnstake: "0.0001",
    },
  },
};
