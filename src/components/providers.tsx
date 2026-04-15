"use client";

import { mainnet, sepolia } from "@starknet-react/chains";
import { Connector, jsonRpcProvider } from "@starknet-react/core";
import { EasyleapProvider } from "@easyleap/sdk";
import { Figtree } from "next/font/google";
import React, { type PropsWithChildren } from "react";
import { BlockTag, constants, RpcProviderOptions } from "starknet";
import { PrivyProvider as Privy } from "@privy-io/react-auth";

import { SidebarProvider } from "@/components/ui/sidebar";
import { endurEasyleapTheme } from "@/constants/easyleap-theme";
import { NETWORK } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { WalletConnector } from "@/services/wallet";

import "@easyleap/sdk/styles.css";

const font = Figtree({
  subsets: ["latin-ext"],
});

interface ProvidersProps {
  children: React.ReactNode;
}

const chains =
  NETWORK === constants.NetworkName.SN_MAIN ? [mainnet] : [sepolia];

const provider = jsonRpcProvider({
  rpc: () => {
    const args: RpcProviderOptions = {
      nodeUrl: process.env.NEXT_PUBLIC_RPC_URL,
      chainId:
        NETWORK === constants.NetworkName.SN_MAIN
          ? constants.StarknetChainId.SN_MAIN
          : constants.StarknetChainId.SN_SEPOLIA,
      blockIdentifier: BlockTag.LATEST,
    };
    return args;
  },
});

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const walletConnector = new WalletConnector(isMobile);

  const privyConfig = React.useMemo(
    () => ({
      loginMethods: ["google", "email"] as const,
      // Intentionally omit wallet UI here; wallet connectors are handled separately.
    }),
    [],
  );

  return (
    <EasyleapProvider
      theme={endurEasyleapTheme}
      privyAppId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      privyConfig={privyConfig}
      starkzap={{
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
        network:
          NETWORK === constants.NetworkName.SN_MAIN ? "mainnet" : "sepolia",
      }}
      ui={{ enableEvmMode: false }}
      starknetConfig={{
        chains,
        provider,
        connectors: walletConnector.getConnectors() as Connector[],
      }}
    >
      <SidebarProvider className={cn(font.className, "w-full")}>
        <PrivyProvider>{children}</PrivyProvider>
      </SidebarProvider>
    </EasyleapProvider>
  );
};

function PrivyProvider({ children }: PropsWithChildren) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  return appId ? (
    <Privy
      appId={appId}
      config={{
        loginMethods: ["google", "email"],
      }}
    >
      {children}
    </Privy>
  ) : (
    children
  );
}

export default Providers;
