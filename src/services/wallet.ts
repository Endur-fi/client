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

import { NETWORK } from "@/constants";

type WalletConfig = {
  id: string;
  name: string;
  type: "injected" | "mobile" | "web";
};

// TODO: review this refactored code
export class WalletConnector {
  private isMobile: boolean;

  constructor(isMobile: boolean) {
    this.isMobile = isMobile;
  }

  private getHostname(): string {
    return typeof window !== "undefined" ? window.location.hostname : "";
  }

  private createInjectedConnectors(): InjectedConnector[] {
    const wallets: WalletConfig[] = [
      { id: "argentX", name: "Argent X", type: "injected" },
      { id: "braavos", name: "Braavos", type: "injected" },
      { id: "keplr", name: "Keplr", type: "injected" },
      { id: "fordefi", name: "Fordefi", type: "injected" },
      { id: "okxwallet", name: "OKX", type: "injected" },
      { id: "xverse", name: "Xverse", type: "injected" },
    ];

    return wallets.map(
      (w) =>
        new InjectedConnector({
          options: { id: w.id, name: w.name },
        }) as InjectedConnector,
    );
  }

  private createMobileConnectors() {
    const hostname = this.getHostname();

    const argentMobile = ArgentMobileConnector.init({
      options: { dappName: "Endur.fi", url: hostname, chainId: NETWORK },
      inAppBrowserOptions: {},
    });

    const braavosMobile = BraavosMobileConnector.init({
      inAppBrowserOptions: {},
    });

    return {argent: argentMobile, braavos: braavosMobile, both: [argentMobile, braavosMobile]};
  }

  private createWebWalletConnector() {
    return new WebWalletConnector({ url: "https://web.argent.xyz" });
  }

  public getConnectors() {
    const injected = this.createInjectedConnectors();
    const mobileConnectors = this.createMobileConnectors();
    const webWallet = this.createWebWalletConnector();

    if (isInArgentMobileAppBrowser()) return [mobileConnectors.argent]; // Argent mobile only
    if (isInBraavosMobileAppBrowser()) return [mobileConnectors.braavos]; // Braavos mobile only

    if (this.isMobile) {
      return [...mobileConnectors.both, webWallet];
    }

    return [...injected, webWallet];
  }
}
