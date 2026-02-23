import { InjectedConnector } from "@starknet-react/core";
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
import { constants } from "starknet";
import { NETWORK } from "@/constants";

// Cartridge Controller connector created at module level (outside React) so it
// is not recreated on every render, which would cause connection issues per Cartridge/StarknetKit docs.
const cartridgeConnector = new ControllerConnector({
  defaultChainId:
    NETWORK === constants.NetworkName.SN_MAIN
      ? constants.StarknetChainId.SN_MAIN
      : constants.StarknetChainId.SN_SEPOLIA,
});

export class WalletConnector {
  private isMobile: boolean;

  constructor(isMobile: boolean) {
    this.isMobile = isMobile;
  }

  public getConnectors() {
    const hostname = typeof window !== "undefined" ? window.location.href : "";

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
    });

    const fordefiConnector = new InjectedConnector({
      options: {
        id: "fordefi",
        name: "Fordefi",
      },
    });

    const metamaskConnector = new InjectedConnector({
      options: {
        id: "metamask",
        name: "Metamask",
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
    });

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

    // For mobile devices, prioritize mobile connectors
    if (this.isMobile) {
      return [
        argentMobileConnector,
        braavosMobileConnector,
        webWalletConnector
      ];
    }

    // For desktop, only show extension wallets and web wallet (no mobile connectors)
    return [
      argentXConnector,
      braavosConnector,
      cartridgeConnector,
      keplrConnector,
      xverseConnector,
      metamaskConnector,
      fordefiConnector,
      okx,
      webWalletConnector,
    ];
  }
}
