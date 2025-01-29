"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { mainnet, sepolia } from "@starknet-react/chains";
import {
  Connector,
  jsonRpcProvider,
  StarknetConfig,
} from "@starknet-react/core";
import { Figtree } from "next/font/google";
import React from "react";
import { constants, RpcProviderOptions } from "starknet";

import { SidebarProvider } from "@/components/ui/sidebar";
import { NETWORK } from "@/constants";
import { cn } from "@/lib/utils";

import { getConnectors } from "./navbar";

const font = Figtree({
  subsets: ["latin-ext"],
});

interface ProvidersProps {
  children: React.ReactNode;
}

const chains = [mainnet, sepolia];

const provider = jsonRpcProvider({
  rpc: () => {
    const args: RpcProviderOptions = {
      nodeUrl: process.env.NEXT_PUBLIC_RPC_URL,
      chainId:
        NETWORK === constants.NetworkName.SN_MAIN
          ? constants.StarknetChainId.SN_MAIN
          : constants.StarknetChainId.SN_SEPOLIA,
      blockIdentifier: "pending",
    };
    return args;
  },
});

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={getConnectors(isMobile) as Connector[]}
    >
      <SidebarProvider className={cn(font.className, "w-full")}>
        {children}
      </SidebarProvider>
    </StarknetConfig>
  );
};

export default Providers;
