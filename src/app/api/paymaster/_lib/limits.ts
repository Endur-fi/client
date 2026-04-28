type PaymasterLimits = {
  minStakeAmount: bigint;
  minUnstakeAmount: bigint;
  largeAmountExemptStake: bigint;
  largeAmountExemptUnstake: bigint;
  middleBandRatePerHour: number;
};

function bigintFromDecimalEnv(key: string, fallback: bigint): bigint {
  const v = process.env[key];
  if (!v) return fallback;
  try {
    return BigInt(v.trim());
  } catch {
    throw new Error(`Invalid env var ${key}: expected decimal integer string`);
  }
}

function numberFromDecimalEnv(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number(v.trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw new Error(`Invalid env var ${key}: expected non-negative integer`);
  }
  return n;
}

export function readPaymasterLimitsFromEnv(): PaymasterLimits {
  return {
    minStakeAmount: bigintFromDecimalEnv("ENDUR_MIN_STAKE_AMOUNT", BigInt(0)),
    minUnstakeAmount: bigintFromDecimalEnv("ENDUR_MIN_UNSTAKE_AMOUNT", BigInt(0)),
    largeAmountExemptStake: bigintFromDecimalEnv(
      "ENDUR_LARGE_AMOUNT_EXEMPT_STAKE",
      BigInt(0),
    ),
    largeAmountExemptUnstake: bigintFromDecimalEnv(
      "ENDUR_LARGE_AMOUNT_EXEMPT_UNSTAKE",
      BigInt(0),
    ),
    middleBandRatePerHour: numberFromDecimalEnv("ENDUR_MIDDLE_BAND_RPH", 5),
  };
}

export type EndurOpKind = "stake" | "unstake";

export function enforceAmountLimitsOrThrow(
  op: EndurOpKind,
  amount: bigint,
  limits: PaymasterLimits,
): void {
  const min = op === "stake" ? limits.minStakeAmount : limits.minUnstakeAmount;
  const exempt =
    op === "stake" ? limits.largeAmountExemptStake : limits.largeAmountExemptUnstake;

  const isLargeExempt = amount > exempt;
  if (!isLargeExempt && amount < min) {
    throw new Error(op === "stake" ? "Stake amount below minimum" : "Unstake amount below minimum");
  }
}

export async function enforceRateLimitOrThrow(
  prisma: {
    endurSponsorEvent: {
      count: (args: {
        where: { privyUserId: string; createdAt: { gte: Date } };
      }) => Promise<number>;
      create: (args: { data: { privyUserId: string } }) => Promise<unknown>;
    };
  },
  userId: string,
  limits: PaymasterLimits,
  nowMs: number,
): Promise<void> {
  if (limits.middleBandRatePerHour <= 0) return;
  const since = new Date(nowMs - 60 * 60 * 1000);
  const used = await prisma.endurSponsorEvent.count({
    where: { privyUserId: userId, createdAt: { gte: since } },
  });
  if (used >= limits.middleBandRatePerHour) {
    throw new Error("Rate limit exceeded for this action");
  }
  await prisma.endurSponsorEvent.create({ data: { privyUserId: userId } });
}

