import { useConnect } from "@starknet-react/core";
import { connect, ConnectOptionsWithConnectors } from "starknetkit";

import { useSidebar } from "@/components/ui/sidebar";
import { NETWORK } from "@/constants";
import { tryCatch } from "@/lib/utils";
import { WalletConnector } from "@/services/wallet";

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

    if (data?.connector) {
      connectSnReact({ connector: data.connector as any });
    }

    if (error) {
      console.error("connectWallet error", error.message);
    }
  };

  return { connectWallet, config };
}
