import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "@/hooks/use-toast";

// -------- Formatting & Strings --------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

export function formatNumber(
  num: number | string,
  decimals?: number,
  caps = false,
): string {
  const numberValue = typeof num === "string" ? Number(num) : num;
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
  // TODO: why are we not using this => num.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})
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

// -------- Referral --------
export function generateReferralCode() {
  const code = Math.random().toString(36).slice(2, 8);
  return code;
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

// -------- Time --------
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

// -------- Validation --------
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

// -------- Async Helper --------
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