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
import { SidebarProvider } from "@/components/ui/sidebar";

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
          backgroundColor: "rgba(23, 135, 109, 0.53)",
          color: "#FFFFFF",
          border: "0px solid transparent",
        },

        evmButton: {
          backgroundColor: "#17876D",
          color: "#FFFFFF",
          border: "2px solid  #443F53",
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
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
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
      </SidebarProvider>
    </QueryClientProvider>
  );
};

export default Providers;
