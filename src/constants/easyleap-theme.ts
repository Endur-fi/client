import { Figtree } from "next/font/google";
import type { GlobalTheme } from "@easyleap/sdk";

/**
 * Single Figtree instance for Endur + Easyleap (connect + bridge).
 * Use `className` on a layout wrapper and `style.fontFamily` in theme.
 */
export const endurEasyleapFont = Figtree({
  subsets: ["latin-ext"],
});

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
    fontFamily: endurEasyleapFont.style.fontFamily,
  },
  bridgeDialog: {
    // Base colors
    white: "#FFFFFF",
    black: "#000000",
    brandGreen: "#17876D",
    brandGreenHover: "#14755F",
    brandGreenActive: "#116652",
    brandGreenDark: "#03624C",
    brandGreenDarker: "#0D5F4E",
    brandGreenDarkest: "#135638",
    brandGreenLight: "#E8F5F1",

    // Gray scale
    gray50: "#F9FAFB",
    gray100: "#F5F7F8",
    gray200: "#EBEEF0",
    gray300: "#E5E8EB",
    gray350: "#E5E7EB",
    gray400: "#D1D5DC",
    gray500: "#CBD0D5",
    gray600: "#C9D1D6",
    gray700: "#9CA3AF",
    gray800: "#8D9C9C",
    gray900: "#6B7780",
    gray1000: "#4A5565",
    gray1100: "#1A1F24",
    gray1200: "#101828",

    // Border colors
    iconBorderColor: "#DBDBDB",
    cardHoverBackground: "#FAFBFC",

    modalBorder: "1px solid #ECECED80",
    modalBorderRadius: "10px",
    providerExternalIconOpacity: 0.4,
    providerExternalIconHoverOpacity: 0.7,
    fontFamily: endurEasyleapFont.style.fontFamily,
  },
} as GlobalTheme;
