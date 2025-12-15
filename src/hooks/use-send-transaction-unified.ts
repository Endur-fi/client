"use client";

import { useState } from "react";
import { useSendTransaction, useAccount } from "@starknet-react/core";
import { usePrivy } from "@privy-io/react-auth";
import { useAtomValue } from "jotai";
import { Call } from "starknet";
import { privyWalletAtom } from "@/store/privy-wallet.store";

interface TransactionResponse {
  transaction_hash: string;
}

/**
 * Unified transaction hook that works with both Privy and Starknet wallets
 * Automatically detects which wallet type is connected and uses the appropriate signing method
 * Prioritizes Starknet wallets over Privy wallets
 */
export function useSendTransactionUnified() {
  const {
    sendAsync: starknetSendAsync,
    data: starknetData,
    isPending: starknetPending,
    error: starknetError,
  } = useSendTransaction({});

  const { isConnected: isStarknetConnected } = useAccount();
  const { user, getAccessToken } = usePrivy();
  const privyWallet = useAtomValue(privyWalletAtom);
  const [privyData, setPrivyData] = useState<TransactionResponse | null>(null);
  const [privyPending, setPrivyPending] = useState(false);
  const [privyError, setPrivyError] = useState<Error | null>(null);

  const sendAsync = async (calls: Call[]): Promise<TransactionResponse> => {
    if (isStarknetConnected) {
      return await starknetSendAsync(calls);
    }

    if (user) {
      try {
        setPrivyPending(true);
        setPrivyError(null);
        setPrivyData(null);

        const userJwt = await getAccessToken();
        if (!userJwt) {
          throw new Error("Unable to retrieve user session. Please re-login.");
        }

        if (!privyWallet?.walletId) {
          throw new Error(
            "No Privy wallet found. Please wait for wallet creation.",
          );
        }

        const response = await fetch("/api/privy/execute-transaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJwt}`,
          },
          body: JSON.stringify({
            walletId: privyWallet.walletId,
            calls: calls.map((call) => ({
              contractAddress: call.contractAddress,
              entrypoint: call.entrypoint,
              calldata: call.calldata,
            })),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.error || `Transaction failed: ${response.statusText}`,
          );
        }

        const result = await response.json();
        const transactionHash =
          result.transactionHash || result.transaction_hash;

        if (!transactionHash) {
          throw new Error("No transaction hash returned from server");
        }

        const txResponse: TransactionResponse = {
          transaction_hash: transactionHash,
        };

        setPrivyData(txResponse);
        setPrivyPending(false);
        return txResponse;
      } catch (error: any) {
        setPrivyError(error);
        setPrivyPending(false);
        throw error;
      }
    }

    throw new Error(
      "No wallet connected. Please connect a Starknet or Privy wallet.",
    );
  };

  return {
    sendAsync,
    data: privyData || starknetData,
    isPending: privyPending || starknetPending,
    error: privyError || starknetError,
  };
}
