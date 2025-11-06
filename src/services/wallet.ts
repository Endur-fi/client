import { InjectedConnector } from "@starknet-react/core";
import { StarknetkitConnector } from "starknetkit";
import {
  ArgentMobileConnector,
  isInArgentMobileAppBrowser,
} from "starknetkit/argentMobile";
import {
  BraavosMobileConnector,
  isInBraavosMobileAppBrowser,
} from "starknetkit/braavosMobile";

import { WebWalletConnector } from "starknetkit/webwallet";
import { ControllerConnector } from "starknetkit/controller";

import { NETWORK } from "@/constants";

export class WalletConnector {
  private isMobile: boolean;

  constructor(isMobile: boolean) {
    this.isMobile = isMobile;
  }

  public getConnectors() {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";

    // Desktop/Extension wallets
    const argentXConnector = new InjectedConnector({
      options: {
        id: "argentX",
        name: "Argent X",
      },
    });

    const braavosConnector = new InjectedConnector({
      options: {
        id: "braavos",
        name: "Braavos",
      },
    });

    const keplrConnector = new InjectedConnector({
      options: {
        id: "keplr",
        name: "Keplr",
      },
    }) as unknown as StarknetkitConnector;

    const fordefiConnector = new InjectedConnector({
      options: {
        id: "fordefi",
        name: "Fordefi",
      },
    });

    const okx = new InjectedConnector({
      options: {
        id: "okxwallet",
        name: "OKX",
      },
    });

    const xverseConnector = new InjectedConnector({
      options: {
        id: "xverse",
        name: "Xverse",
      },
    }) as unknown as StarknetkitConnector;

    const cartridgeConnector = new ControllerConnector();

    // Mobile connectors
    const argentMobileConnector = ArgentMobileConnector.init({
      options: {
        dappName: "Endur.fi",
        url: hostname,
        chainId: NETWORK,
      },
      inAppBrowserOptions: {},
    });

    const braavosMobileConnector = BraavosMobileConnector.init({
      inAppBrowserOptions: {},
    });

    // Web wallet (email login)
    const webWalletConnector = new WebWalletConnector({
      url: "https://web.argent.xyz",
    });

    // Check if we're in mobile app browsers
    const isInArgentMobile = isInArgentMobileAppBrowser();
    const isInBraavosMobile = isInBraavosMobileAppBrowser();

    // Return appropriate connectors based on environment
    if (isInArgentMobile) {
      return [argentMobileConnector];
    }

    if (isInBraavosMobile) {
      return [braavosMobileConnector];
    }

    // if (this.isInKeplrMobileAppBrowser()) {
    //   return [keplrConnector];
    // }

    // For mobile devices, prioritize mobile connectors
    if (this.isMobile) {
      return [
        argentMobileConnector,
        braavosMobileConnector,
        webWalletConnector,
        keplrConnector,
      ];
    }

    // For desktop, only show extension wallets and web wallet (no mobile connectors)
    return [
      argentXConnector,
      braavosConnector,
      keplrConnector,
      xverseConnector,
      cartridgeConnector,
      fordefiConnector,
      okx,
      webWalletConnector,
    ];
  }

  public isInKeplrMobileAppBrowser() {
    if (typeof window === "undefined") {
      return false;
    }

    const userAgent = navigator.userAgent;
    const isKeplrMobileApp = userAgent.includes("KeplrWalletMobile");

    if (!isKeplrMobileApp) {
      return false;
    }

    return isKeplrMobileApp;
  }
}
