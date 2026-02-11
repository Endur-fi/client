import { BigNumber } from "bignumber.js";
import { clsx, type ClassValue } from "clsx";
import {
  BlockIdentifier,
  BlockTag,
  Contract,
  num,
  RpcProvider,
} from "starknet";
import { twMerge } from "tailwind-merge";

import { BTC_ORACLE_CONTRACT, STRK_ORACLE_CONTRACT } from "@/constants";
import { toast } from "@/hooks/use-toast";

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
  // Handle null, undefined, or non-numeric types
  if (
    num === null ||
    num === undefined ||
    (typeof num !== "number" && typeof num !== "string")
  ) {
    return "0";
  }

  const numberValue = typeof num === "string" ? parseFloat(num) : num;

  if (isNaN(numberValue) || !isFinite(numberValue)) return "0";

  // Handle trillions, billions, millions, and thousands
  // Check in descending order to ensure correct formatting
  if (numberValue >= 1000000000000) {
    // Trillions (1T = 1,000,000,000,000)
    const trillions = numberValue / 1000000000000;
    return `${trillions.toFixed(decimals ?? 2)}${caps ? "T" : "t"}`;
  } else if (numberValue >= 1000000000) {
    // Billions (1B = 1,000,000,000)
    const billions = numberValue / 1000000000;
    return `${billions.toFixed(decimals ?? 2)}${caps ? "B" : "b"}`;
  } else if (numberValue >= 1000000) {
    // Millions (1M = 1,000,000)
    const millions = numberValue / 1000000;
    return `${millions.toFixed(decimals ?? 2)}${caps ? "M" : "m"}`;
  } else if (numberValue >= 1000) {
    // Thousands (1K = 1,000)
    const thousands = numberValue / 1000;
    return `${thousands.toFixed(decimals ?? 2)}${caps ? "K" : "k"}`;
  }
  // Less than 1000, show as whole number
  return `${numberValue.toFixed(decimals ?? 0)}`;
}

export function formatNumberWithCommas(
  value: number | string,
  decimals?: number,
): string {
  const numberValue = typeof value === "string" ? Number(value) : value;

  if (isNaN(numberValue)) {
    return "0";
  }

  const [integerPart, decimalPart] = numberValue
    .toFixed(decimals ?? 2)
    .split(".");

  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

  return decimalPart !== undefined
    ? `${formattedIntegerPart}.${decimalPart}`
    : formattedIntegerPart;
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

/**
 * Creates an internal URL with referrer query parameter if referrer is provided.
 * Used for preserving referrer across internal navigation.
 * @param path - The internal path (e.g., "/defi", "/rewards", "/strk")
 * @param referrer - The referrer value from search params (can be null)
 * @returns The path with referrer query param if referrer exists, otherwise just the path
 */
export function getInternalUrl(path: string, referrer: string | null): string {
  if (!referrer) {
    return path;
  }
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}referrer=${referrer}`;
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

const priceCache = new Map<string, { price: number; timestamp: number }>();

export async function getAssetPrice(isSTRK: boolean = true): Promise<number> {
  if (priceCache.has(isSTRK ? "STRK" : "BTC")) {
    const { price, timestamp } = priceCache.get(isSTRK ? "STRK" : "BTC")!;
    if (Date.now() - timestamp < 1000 * 60 * 60 * 24) {
      // 1 hour (just for ui purposes, so ok)
      return price;
    }
  }
  const provider = new RpcProvider({
    nodeUrl:
      process.env.NEXT_PUBLIC_CHAIN_ID === "SN_MAIN"
        ? process.env.NEXT_PUBLIC_RPC_URL
        : "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
  });

  if (!provider) return 0;

  const oracleContract = isSTRK ? STRK_ORACLE_CONTRACT : BTC_ORACLE_CONTRACT;

  const contract = new Contract({
    abi: OracleAbi,
    address: oracleContract,
    providerOrAccount: provider,
  });
  const data = await contract.call("get_price", []);
  const price = Number(data) / 10 ** 8;
  priceCache.set(isSTRK ? "STRK" : "BTC", { price, timestamp: Date.now() });
  return price;
}

// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

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
