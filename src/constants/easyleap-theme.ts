import type { GlobalTheme } from "@easyleap/sdk";

/** Brand-aligned Easyleap UI (connect modal, wallet chip, mode switch) — green for Endur / Troves. */
export const endurEasyleapTheme = {
  noneMode: {
    backgroundColor: "#AACBC433",
    color: "#03624C",
    border: "1px solid #ECECED80",
  },
  starknetMode: {
    mainBgColor: "rgba(170, 203, 196, 0.14)",
    button: {
      backgroundColor: "#AACBC433",
      color: "#03624C",
      border: "1px solid #ECECED80",
      borderRadius: "10px",
    },
    switchButton: {
      backgroundColor: "rgba(170, 203, 196, 0.2)",
      color: "#03624C",
      border: "1px solid #ECECED80",
    },
    historyButton: {
      backgroundColor: "#17876D",
      color: "#F4FFFB",
      border: "1px solid #ECECED80",
    },
  },
  evmMode: {
    mainBgColor: "rgba(170, 203, 196, 0.14)",
    button: {
      backgroundColor: "#AACBC433",
      color: "#03624C",
      border: "1px solid #ECECED80",
      borderRadius: "10px",
    },
    switchButton: {
      backgroundColor: "rgba(170, 203, 196, 0.2)",
      color: "#03624C",
      border: "1px solid #ECECED80",
    },
    historyButton: {
      backgroundColor: "#17876D",
      color: "#F4FFFB",
      border: "1px solid #ECECED80",
    },
  },
  connectDialog: {
    // Match Endur app’s light surfaces and green accents.
    modalBackground: "#FFFFFF",
    modalBorder: "1px solid #ECECED80",
    modalBorderRadius: "16px",
    titleColor: "#03624C",
    mutedTextColor: "#17876D",
    accent: "#17876D",
    accentForeground: "#FFFFFF",
    tabBarBorder: "1px solid #ECECED80",
    tabInactiveBackground: "transparent",
    rowBorder: "1px solid #ECECED80",
    rowHoverBackground: "#E5EFED",
    rowTextColor: "#03624C",
    closeButtonColor: "#03624C",
    moreOptionsBackground: "#03624F",
    moreOptionsTextColor: "#FFFFFF",
  },
} as GlobalTheme;
