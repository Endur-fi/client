import { BigNumber } from "bignumber.js";
import { clsx, type ClassValue } from "clsx";
import { BlockIdentifier, BlockTag, Contract, num } from "starknet";
import { twMerge } from "tailwind-merge";

import {
  BTC_ORACLE_CONTRACT,
  STRK_ORACLE_CONTRACT,
  getProvider,
} from "@/constants";
import { toast } from "@/hooks/use-toast";
import type { Result } from "@/types";

import OracleAbi from "../abi/oracle.abi.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(_address: string, startChars = 4, endChars = 4) {
  const x = num.toHex(num.getDecimalString(_address));
  return truncate(x, startChars, endChars);
}

export function formatNumber(
  num: number | string,
  decimals?: number,
  caps = false,
): string {
  const numberValue = typeof num === "string" ? Number(num) : num;

  console.log("numberValue", numberValue);

  if (numberValue >= 1000000) {
    return `${(numberValue / 1000000).toFixed(decimals ?? 2)}${caps ? "M" : "m"}`;
  } else if (numberValue >= 1000) {
    return `${(numberValue / 1000).toFixed(decimals ?? 2)}${caps ? "K" : "k"}`;
  }
  return `${numberValue}`;
}

export function formatNumberWithCommas(
  value: number | string,
  decimals?: number,
): string {
  // TODO: why are we not using this => num.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) - SOLVED
  const numberValue = typeof value === "string" ? Number(value) : value;
  if (isNaN(numberValue)) return "0";
  return numberValue.toLocaleString("en-IN", {
    minimumFractionDigits: decimals ?? 2,
    maximumFractionDigits: decimals ?? 2,
  });
}

export function truncate(str: string, startChars: number, endChars: number) {
  if (str.length <= startChars + endChars) {
    return str;
  }

  return `${str.slice(0, startChars)}...${str.slice(
    str.length - endChars,
    str.length,
  )}`;
}

export const etherToWeiBN = (amount: any) => {
  if (!amount) {
    return 0;
  }
  const decimals =
    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
  if (!decimals) {
    return 0;
  }
  try {
    const factor = new BigNumber(10).exponentiatedBy(18); // Wei in 1 Ether
    const amountBN = new BigNumber(amount)
      .times(factor)
      .times(new BigNumber(10).exponentiatedBy(decimals))
      .dividedBy(factor)
      .integerValue(BigNumber.ROUND_DOWN);

    // Formatting the result to avoid exponential notation
    const formattedAmount = amountBN.toFixed();
    return formattedAmount;
  } catch (e) {
    console.warn("etherToWeiBN fails with error: ", e);
    return amount;
  }
};

export function generateReferralCode() {
  const code = Math.random().toString(36).slice(2, 8);
  return code;
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function standariseAddress(address: string | bigint) {
  let _a = address;
  if (!address) {
    _a = "0";
  }
  const a = num.getHexString(num.getDecimalString(_a.toString()));
  return a;
}

export function copyReferralLink(refCode: string) {
  navigator.clipboard.writeText(getReferralUrl(refCode));

  toast({
    description: "Referral link copied to clipboard",
  });
}

export function getReferralUrl(referralCode: string) {
  if (window.location.origin.includes("endur.fi")) {
    return `https://endur.fi/r/${referralCode}`;
  }
  return `${window.location.origin}/r/${referralCode}`;
}

export function convertFutureTimestamp(unixTimestamp: number): string {
  const currentTime = Date.now();
  const futureTime = (unixTimestamp + 24 * 60 * 60) * 1000; // Add 24 hours (86400 seconds) and convert to milliseconds
  const difference = futureTime - currentTime;

  if (difference <= 0) {
    return "Anytime soon";
  }

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `within ~${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `within ~${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return "Anytime soon";
}

export const eventNames = {
  STAKE_CLICK: "stake_click",
  STAKE_TX_INIT: "stake_transaction_init",
  STAKE_TX_SUCCESSFUL: "stake_transaction_successful",
  STAKE_TX_REJECTED: "stake_transaction_rejected",
  UNSTAKE_CLICK: "unstake_click",
  UNSTAKE_TX_INIT: "unstake_transaction_init",
  UNSTAKE_TX_SUCCESSFUL: "unstake_transaction_successful",
  UNSTAKE_TX_REJECTED: "unstake_transaction_rejected",
  OPPORTUNITIES: "opportunities",
};

export async function getAssetPrice(isSTRK: boolean = true): Promise<number> {
  // TODO: if we can use constants/getProvider use that here - SOLVED
  const provider = getProvider();

  if (!provider) return 0;

  const oracleContract = isSTRK ? STRK_ORACLE_CONTRACT : BTC_ORACLE_CONTRACT;

  const contract = new Contract({
    abi: OracleAbi,
    address: oracleContract,
    providerOrAccount: provider,
  });
  const data = await contract.call("get_price", []);
  return Number(data) / 10 ** 8;
}

// TODO: separate types - SOLVED (moved to src/types/index.ts)

export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export function isContractNotDeployed(
  blockIdentifier: BlockIdentifier = BlockTag.LATEST,
  deploymentBlock: number,
  maxBlock?: number,
) {
  const lowerCondition =
    Number.isInteger(blockIdentifier) &&
    (blockIdentifier as number) < deploymentBlock;

  const upperCondition =
    maxBlock &&
    ((blockIdentifier as number) > maxBlock ||
      blockIdentifier === BlockTag.LATEST ||
      !blockIdentifier);

  return lowerCondition || upperCondition;
}

export function formatHumanFriendlyDateTime(
  date: Date,
  locale: string = "en-US",
): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): boolean => {
  if (!email) {
    toast({
      description: "Email input is required",
    });
    return false;
  }

  if (!EMAIL_REGEX.test(email)) {
    toast({
      description: "Please enter a valid email address",
    });
    return false;
  }

  return true;
};

// Shared platform configuration helper
export const createTrovesHyperConfig = (lstSymbol: string) => ({
  platform: "Troves",
  name: `Troves' Hyper ${lstSymbol} Vault`,
});

// Helper to build URL with referrer and other query params
export const buildUrlWithReferrer = (
  basePath: string,
  referrer?: string | null,
  additionalParams?: Record<string, string>,
): string => {
  const queryParams = new URLSearchParams();

  if (referrer) {
    queryParams.set("referrer", referrer);
  }

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) queryParams.set(key, value);
    });
  }

  const queryString = queryParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};
