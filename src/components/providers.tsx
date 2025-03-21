"use client";

import React from "react";

import { InjectedConnector } from "@starknet-react/core";
import { WebWalletConnector } from "starknetkit/webwallet";
import {
  defaultEasyleapConfig,
  EasyleapConfig,
  EasyleapProvider,
} from "@easyleap/sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient();

  const easyleapConfig: EasyleapConfig = {
    theme: {
      noneMode: {
        backgroundColor: "#17876D",
        color: "#fff",
        border: "1px solid #fff",
      },
      starknetMode: {
        mainBgColor: "#03624C4D",

        button: {
          backgroundColor: "#17876D",
          color: "#FFFFFF",
          border: "2px solid #443F53",
          borderRadius: "0.75rem",
        },

        switchButton: {
          backgroundColor: "#17876D",
          color: "#FFFFFF",
          border: "2px solid #443F53",
        },

        historyButton: {
          backgroundColor: "#17876D",
          color: "#FFFFFF",
          border: "2px solid #443F53",
        },
      },
      bridgeMode: {
        mainBgColor: "#03624C4D",

        starknetButton: {
          backgroundColor: "#17876D",
          color: "#FFFFFF",
          border: "0px solid transparent",
          borderRadius: "0.75rem",
        },

        evmButton: {
          backgroundColor: "#17876D",
          color: "#FFFFFF",
          border: "2px solid #B5AADF",
          borderRadius: "0.75rem",
        },

        switchButton: {
          backgroundColor: "#17876D",
          color: "#FFFFFF",
          border: "2px solid #B5AADF",
        },

        historyButton: {
          backgroundColor: "#17876D",
          color: "#FFFFFF",
          border: "2px solid #443F53",
        },
      },
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <EasyleapProvider
        starknetConfig={{
          chains: defaultEasyleapConfig().starknetConfig.chains,
          provider: defaultEasyleapConfig().starknetConfig.provider,
          explorer: defaultEasyleapConfig().starknetConfig.explorer,
          connectors: [
            new WebWalletConnector(),
            new InjectedConnector({ options: { id: "argentX" } }),
            new InjectedConnector({ options: { id: "braavos" } }),
          ],
        }}
        theme={easyleapConfig.theme}
      >
        {children}
      </EasyleapProvider>
    </QueryClientProvider>
  );
};

export default Providers;
