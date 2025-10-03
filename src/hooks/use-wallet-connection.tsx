import { useConnect } from "@starknet-react/core";
import { connect, ConnectOptionsWithConnectors } from "starknetkit";

import { useSidebar } from "@/components/ui/sidebar";
import { getProvider, NETWORK } from "@/constants";
import { tryCatch } from "@/lib/utils";
import { WalletConnector } from "@/services/wallet";
import { WalletAccount } from "starknet";

export function useWalletConnection() {
  const { connect: connectSnReact } = useConnect();
  const { isMobile } = useSidebar();

  const walletConnector = new WalletConnector(isMobile);

  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  const config: ConnectOptionsWithConnectors | any = {
    modalMode: "canAsk",
    modalTheme: "light",
    webWalletUrl: "https://web.argent.xyz",
    argentMobileOptions: {
      dappName: "Endur.fi",
      chainId: NETWORK,
      url: hostname,
    },
    dappName: "Endur.fi",
    connectors: walletConnector.getConnectors(),
  };

  const connectWallet = async (configParam = config) => {
    const { data, error } = await tryCatch(connect(configParam));
    console.log("data", data);

    if (data?.connector) {
      connectSnReact({ connector: data.connector as any });
    }

    const wallet = (data?.connector as any)?._wallet;

    const provider = getProvider();

    if (data?.connectorData) {
      const walletAccount = await WalletAccount.connect(provider, wallet);
      console.log("walletAccount", walletAccount);
      return walletAccount;
    }

    if (error) {
      console.error("connectWallet error", error.message);
    }
  };

  return { connectWallet, config };
}
