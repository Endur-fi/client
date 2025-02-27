"use client";

import { mainnet, sepolia } from "@starknet-react/chains";
import {
  Connector,
  jsonRpcProvider,
  StarknetConfig,
} from "@starknet-react/core";
import React from "react";
import { constants, RpcProviderOptions } from "starknet";

import { NETWORK } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { WalletConnector } from "@/services/wallet";

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
  const walletConnector = new WalletConnector(isMobile);

  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={walletConnector.getConnectors() as Connector[]}
    >
      {children}
    </StarknetConfig>
  );
};

export default Providers;
