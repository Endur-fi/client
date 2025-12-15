"use client";

import { useState, useEffect } from "react";
import { useBalance, useAccount } from "@starknet-react/core";
import { usePrivy } from "@privy-io/react-auth";
import { useAtomValue } from "jotai";
import { privyWalletAtom } from "@/store/privy-wallet.store";

interface BalanceData {
  value: bigint;
  decimals: number;
  formatted: string;
}

interface UseBalanceUnifiedOptions {
  address?: string;
  token?: string;
}

/**
 * Unified balance hook that works with both Privy and Starknet wallets
 * Automatically detects which wallet type is connected and uses the appropriate method
 * Prioritizes Starknet wallets over Privy wallets
 */
export function useBalanceUnified(options: UseBalanceUnifiedOptions = {}) {
  const { isConnected: isStarknetConnected } = useAccount();
  const { user, getAccessToken } = usePrivy();
  const privyWallet = useAtomValue(privyWalletAtom);

  // Use Starknet's useBalance hook (will return undefined if not connected)
  const starknetBalance = useBalance({
    address: options.address as `0x${string}` | undefined,
    token: options.token as `0x${string}` | undefined,
  });

  const [privyBalance, setPrivyBalance] = useState<BalanceData | null>(null);
  const [privyLoading, setPrivyLoading] = useState(false);
  const [privyError, setPrivyError] = useState<Error | null>(null);

  // Fetch Privy balance
  useEffect(() => {
    // Skip if Starknet is connected (prioritize Starknet)
    if (isStarknetConnected) {
      setPrivyBalance(null);
      setPrivyError(null);
      return;
    }

    // Skip if no Privy user or wallet
    if (!user || !privyWallet?.address || !options.token) {
      setPrivyBalance(null);
      setPrivyError(null);
      return;
    }

    // Use the address from options or fallback to Privy wallet address
    const addressToUse = options.address || privyWallet.address;

    const fetchBalance = async () => {
      setPrivyLoading(true);
      setPrivyError(null);

      try {
        const userJwt = await getAccessToken();
        if (!userJwt) {
          throw new Error("Unable to retrieve user session. Please re-login.");
        }

        const response = await fetch("/api/privy/get-balance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJwt}`,
          },
          body: JSON.stringify({
            address: addressToUse,
            tokenAddress: options.token,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.error ||
              `Failed to fetch balance: ${response.statusText}`,
          );
        }

        const result = await response.json();
        setPrivyBalance({
          value: BigInt(result.value),
          decimals: result.decimals,
          formatted: result.formatted,
        });
      } catch (error: any) {
        setPrivyError(error);
        setPrivyBalance(null);
      } finally {
        setPrivyLoading(false);
      }
    };

    fetchBalance();
  }, [
    isStarknetConnected,
    user,
    privyWallet?.address,
    options.address,
    options.token,
    getAccessToken,
  ]);

  // Return Starknet balance if connected, otherwise Privy balance
  if (isStarknetConnected && starknetBalance.data) {
    return {
      data: starknetBalance.data,
      isLoading: starknetBalance.isLoading,
      error: starknetBalance.error,
    };
  }

  return {
    data: privyBalance
      ? {
          value: privyBalance.value,
          decimals: privyBalance.decimals,
          formatted: privyBalance.formatted,
        }
      : undefined,
    isLoading: privyLoading,
    error: privyError,
  };
}
