import { InjectedConnector } from "@starknet-react/core";
import { constants } from "starknet";
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

import { NETWORK } from "@/constants";

export class WalletConnector {
  private isMobile: boolean;

  constructor(isMobile: boolean) {
    this.isMobile = isMobile;
  }

  public getConnectors() {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";

    const argentMobileConnector = ArgentMobileConnector.init({
      options: {
        dappName: "Endurfi",
        url: hostname,
        chainId: constants.NetworkName.SN_MAIN,
      },
      inAppBrowserOptions: {},
    }) as StarknetkitConnector;

    const argentXConnector = new InjectedConnector({
      options: {
        id: "argentX",
        name: "Argent X",
      },
    }) as unknown as StarknetkitConnector;

    const braavosConnector = new InjectedConnector({
      options: {
        id: "braavos",
        name: "Braavos",
      },
    }) as unknown as StarknetkitConnector;

    const keplrConnector = new InjectedConnector({
      options: {
        id: "keplr",
        name: "Keplr",
      },
    }) as unknown as StarknetkitConnector;

    const foredefiConnector = new InjectedConnector({
      options: {
        id: "fordefi",
        name: "Fordefi",
      },
    }) as unknown as StarknetkitConnector;

    const braavosMobile = BraavosMobileConnector.init({
      inAppBrowserOptions: {},
    }) as StarknetkitConnector;

    const webWalletConnector = new WebWalletConnector({
      url: "https://web.argent.xyz",
    }) as StarknetkitConnector;

    const isMainnet = NETWORK === constants.NetworkName.SN_MAIN;

    const isInstalled = [
      argentXConnector,
      braavosConnector,
      keplrConnector,
    ].map((wallet) => {
      return {
        id: wallet.id,
        isInstalled:
          typeof window === "undefined"
            ? false
            : window[`starknet_${wallet.id}`] !== undefined,
      };
    });

    // console.warn("isInstalled", isInstalled);

    const defaultConnectors = [
      argentXConnector,
      braavosConnector,
      keplrConnector,
      foredefiConnector,
    ];

    // put uninstall wallets at the end
    const sortedConnectors: any[] = defaultConnectors.sort((a, b) => {
      const aInstalled = isInstalled.find(
        (wallet) => wallet.id === a.id,
      )?.isInstalled;
      const bInstalled = isInstalled.find(
        (wallet) => wallet.id === b.id,
      )?.isInstalled;

      if (aInstalled && bInstalled) {
        return 0;
      } else if (aInstalled) {
        return -1;
      }
      return 1;
    });

    if (isMainnet) {
      if (isInArgentMobileAppBrowser()) {
        return [argentMobileConnector];
      } else if (isInBraavosMobileAppBrowser()) {
        return [braavosMobile];
      } else if (this.isMobile) {
        return [argentMobileConnector, braavosMobile, webWalletConnector];
      }

      // sortedConnectors.push(argentMobileConnector);
      sortedConnectors.push(webWalletConnector);
      return sortedConnectors;
    }
    return sortedConnectors;
  }
}
