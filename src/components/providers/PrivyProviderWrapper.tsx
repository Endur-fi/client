"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";

interface PrivyProviderWrapperProps {
  children: React.ReactNode;
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  // If Privy is not configured, skip Privy provider
  if (!appId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google"],
        appearance: {
          theme: "light",
          accentColor: "#17876D", // Endur brand color
          showWalletLoginFirst: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
