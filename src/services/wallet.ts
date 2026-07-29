import {
  ArgentMobileConnector,
  isInArgentMobileAppBrowser,
} from "starknetkit/argentMobile";
import {
  BraavosMobileConnector,
  isInBraavosMobileAppBrowser,
} from "starknetkit/braavosMobile";

import { WebWalletConnector } from "starknetkit/webwallet";
import Controller from "@cartridge/controller";

import { NETWORK } from "@/constants";

const CARTRIDGE_WALLET_ID = "cartridge";

const cartridgeController = new Controller();
cartridgeController.name = "Cartridge";

// Note -> we are custom building the wallet object just like WalletWithStarknetFeatures
// BECAUSE -> The cartridge sdk controller generalizes CONTROLLER id, but we need cartridge controller id for management
const rawCartridgeWallet = cartridgeController.asWalletStandard();
export const cartridgeStandardWallet = {
  get version() {
    return rawCartridgeWallet.version;
  },
  get name() {
    return rawCartridgeWallet.name;
  },
  get icon() {
    return rawCartridgeWallet.icon;
  },
  get chains() {
    return rawCartridgeWallet.chains;
  },
  get accounts() {
    return rawCartridgeWallet.accounts;
  },
  get features() {
    const features = rawCartridgeWallet.features as Record<string, any>;
    return {
      ...features,
      "starknet:walletApi": {
        ...features["starknet:walletApi"],
        id: CARTRIDGE_WALLET_ID,
      },
    };
  },
};

/**
 * Legacy wallet connector helper. Extension wallets are now auto-discovered by
 * get-starknet via `@starknetfoundation/starknet-start-react`.
 */
export class WalletConnector {
  private isMobile: boolean;

  constructor(isMobile: boolean) {
    this.isMobile = isMobile;
  }

  public getConnectors() {
    const hostname = typeof window !== "undefined" ? window.location.href : "";

    const argentMobileConnector = ArgentMobileConnector.init({
      options: {
        dappName: "Endur.fi",
        url: hostname,
        chainId: NETWORK,
      },
      inAppBrowserOptions: {
        name: "Ready X (mobile)",
      },
    });

    const braavosMobileConnector = BraavosMobileConnector.init({
      inAppBrowserOptions: {},
    });

    const webWalletConnector = new WebWalletConnector({
      url: "https://web.argent.xyz",
    });

    const isInArgentMobile = isInArgentMobileAppBrowser();
    const isInBraavosMobile = isInBraavosMobileAppBrowser();

    if (isInArgentMobile) {
      return [argentMobileConnector];
    }

    if (isInBraavosMobile) {
      return [braavosMobileConnector];
    }

    if (this.isMobile) {
      return [braavosMobileConnector, webWalletConnector];
    }

    return [webWalletConnector];
  }
}
