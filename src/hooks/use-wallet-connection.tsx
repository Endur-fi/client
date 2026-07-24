import { useConnect, useDisconnect } from "@starknetfoundation/starknet-start-react";

export function useWalletConnection() {
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined") {
        console.warn("Wallet connection attempted in non-browser environment");
        return null;
      }

      const connector = connectors[0];
      if (!connector) {
        console.warn("No Starknet wallets available to connect");
        return null;
      }

      await connectAsync({ connector });
      return connector;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnectAsync();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw error;
    }
  };

  return {
    connectWallet,
    disconnectWallet,
  };
}
