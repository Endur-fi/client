import { useConnect, useDisconnect } from "@starknet-react/core";
import { connect, disconnect } from "starknetkit";

import { useSidebar } from "@/components/ui/sidebar";
import { NETWORK } from "@/constants";
import { WalletConnector } from "@/services/wallet";

export function useWalletConnection() {
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { isMobile } = useSidebar();

  const connectWallet = async (modalMode: "canAsk" | "neverAsk" = "canAsk") => {
    try {
      // Ensure we're in a browser environment
      if (typeof window === "undefined") {
        console.warn("Wallet connection attempted in non-browser environment");
        return null;
      }

      const hostname = window.location.hostname;
      const walletConnector = new WalletConnector(isMobile);

      const result = await connect({
        modalMode,
        modalTheme: "light",
        webWalletUrl: "https://web.argent.xyz",
        argentMobileOptions: {
          dappName: "Endur.fi",
          chainId: NETWORK,
          url: hostname,
        },
        dappName: "Endur.fi",
        connectors: walletConnector.getConnectors(),
      });

      if (result?.connector) {
        // Connect using starknet-react
        await connectAsync({ connector: result.connector });
        return result.connector;
      }

      console.warn("No connector returned from starknetkit connect");
      return null;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // Don't throw error for neverAsk mode to avoid breaking auto-connect
      if (modalMode === "neverAsk") {
        return null;
      }
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
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
