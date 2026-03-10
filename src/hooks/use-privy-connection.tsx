import { usePrivy, useUser } from "@privy-io/react-auth";
import { accountPresets, OnboardStrategy, StarkZap } from "starkzap";
import { useEffect } from "react";

type WalletResponse = {
  address: string;
  id: string;
  isDeployed: boolean;
  publicKey: string;
  walletId: string;
};

export function usePrivyConnection() {
  const { getAccessToken } = usePrivy();
  const { user } = useUser();

  async function createWallet(token: string) {
    try {
      const response = await fetch("/api/wallet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create wallet");
      }

      const data = await response.json();
      return data.wallet;
    } catch (error: unknown) {
      console.error("Unable to set up wallet", error);
    }
  }

  async function setUpWallet(token: string) {
    let wallet: WalletResponse | null = null;

    try {
      const response = await fetch("/api/wallet", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wallet");
      }

      const data = await response.json();
      wallet = data.wallet;

      if (!wallet) {
        wallet = await createWallet(token);
      }
      if (!wallet) {
        throw new Error("Unable to create wallet");
      }

      const sdk = new StarkZap({
        network: "sepolia",
        // network: "mainnet",
        rpcUrl:
          "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/dC6tFhuox73F7S8TLlTId",
      });

      const onboard = await sdk.onboard({
        strategy: OnboardStrategy.Privy,
        accountPreset: accountPresets.argentXV050,
        privy: {
          resolve: async () => {
            // This will never happen: it is ensured above
            if (!wallet) {
              return {
                walletId: "",
                publicKey: "",
                serverUrl: "",
              };
            }

            return {
              walletId: wallet.walletId,
              publicKey: wallet.publicKey,
              serverUrl: "http://localhost:3000/api/wallet/sign",
            };
          },
        },
        deploy: "if_needed",
      });

      const connectedWallet = onboard.wallet;
    } catch (error: unknown) {
      console.error("Unable to set up wallet", error);
    }
  }

  useEffect(
    function () {
      if (user?.id) {
        const linkedWallets = user?.linkedAccounts.filter(
          (account) => account.type === "wallet",
        );

        getAccessToken()
          .then((token: unknown) => {
            if (typeof token === "string") {
              setUpWallet(token);
            }
          })
          .catch((error: unknown) => {
            console.error(
              "Error in getAccessToken call (from catch part)",
              error,
            );
          });
      }
    },
    [user?.id],
  );

  return null;
}
