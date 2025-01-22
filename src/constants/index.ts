import { constants, RpcProvider } from "starknet";

export const STRK_TOKEN =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as const;
export const STRK_DECIMALS = 18;
export const REWARD_FEES = 15;

export const RECEPIEINT_FEE_ADDRESS = "0x0066c76374A9AdB11D4d283aC400331ec6A691C61029168bD70CeA5d97dFc971";

export const LST_ADDRRESS = process.env
  .NEXT_PUBLIC_LST_ADDRESS as `0x${string}`;

export const SN_STAKING_ADRESS = process.env
  .NEXT_PUBLIC_SN_STAKING_ADDRESS as `0x${string}`;

export const SN_MINTING_CURVE_ADRESS = process.env
  .NEXT_PUBLIC_SN_MINTING_CURVE_ADDRESS as `0x${string}`;

export const WITHDRAWAL_QUEUE_ADDRESS = process.env
  .NEXT_PUBLIC_WITHDRAWAL_QUEUE_ADDRESS as `0x${string}`;

export const NST_STRK_ADDRESS = process.env
  .NEXT_PUBLIC_NST_STRK_ADDRESS as `0x${string}`;

export const ARGENT_MOBILE_BASE64_ICON =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTE4LjQwMTggNy41NTU1NkgxMy41OTgyQzEzLjQzNzcgNy41NTU1NiAxMy4zMDkxIDcuNjg3NDcgMTMuMzA1NiA3Ljg1MTQzQzEzLjIwODUgMTIuNDYwMyAxMC44NDg0IDE2LjgzNDcgNi43ODYwOCAxOS45MzMxQzYuNjU3MTEgMjAuMDMxNCA2LjYyNzczIDIwLjIxNjIgNi43MjIwMiAyMC4zNDkzTDkuNTMyNTMgMjQuMzE5NkM5LjYyODE1IDI0LjQ1NDggOS44MTQ0NCAyNC40ODUzIDkuOTQ1NTggMjQuMzg2QzEyLjQ4NTYgMjIuNDYxMyAxNC41Mjg3IDIwLjEzOTUgMTYgMTcuNTY2QzE3LjQ3MTMgMjAuMTM5NSAxOS41MTQ1IDIyLjQ2MTMgMjIuMDU0NSAyNC4zODZDMjIuMTg1NiAyNC40ODUzIDIyLjM3MTkgMjQuNDU0OCAyMi40Njc2IDI0LjMxOTZMMjUuMjc4MSAyMC4zNDkzQzI1LjM3MjMgMjAuMjE2MiAyNS4zNDI5IDIwLjAzMTQgMjUuMjE0IDE5LjkzMzFDMjEuMTUxNiAxNi44MzQ3IDE4Ljc5MTUgMTIuNDYwMyAxOC42OTQ2IDcuODUxNDNDMTguNjkxMSA3LjY4NzQ3IDE4LjU2MjMgNy41NTU1NiAxOC40MDE4IDcuNTU1NTZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQuNzIzNiAxMC40OTJMMjQuMjIzMSA4LjkyNDM5QzI0LjEyMTMgOC42MDYxNCAyMy44NzM0IDguMzU4MjQgMjMuNTU3NyA4LjI2MDIzTDIyLjAwMzkgNy43NzU5NUMyMS43ODk1IDcuNzA5MDYgMjEuNzg3MyA3LjQwMTc3IDIyLjAwMTEgNy4zMzIwMUwyMy41NDY5IDYuODI0NjZDMjMuODYwOSA2LjcyMTQ2IDI0LjEwNiA2LjQ2OTUyIDI0LjIwMjcgNi4xNTAxMUwyNC42Nzk4IDQuNTc1MDJDMjQuNzQ1OCA0LjM1NzA5IDI1LjA0ODkgNC4zNTQ3NyAyNS4xMTgzIDQuNTcxNTZMMjUuNjE4OCA2LjEzOTE1QzI1LjcyMDYgNi40NTc0IDI1Ljk2ODYgNi43MDUzMSAyNi4yODQyIDYuODAzOUwyNy44MzggNy4yODc2MUMyOC4wNTI0IDcuMzU0NSAyOC4wNTQ3IDcuNjYxNzkgMjcuODQwOCA3LjczMjEzTDI2LjI5NSA4LjIzOTQ4QzI1Ljk4MTEgOC4zNDIxIDI1LjczNiA4LjU5NDA0IDI1LjYzOTMgOC45MTQwMkwyNS4xNjIxIDEwLjQ4ODVDMjUuMDk2MSAxMC43MDY1IDI0Ljc5MyAxMC43MDg4IDI0LjcyMzYgMTAuNDkyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==";

export const NOSTRA_IXSTRK =
  "0x04d1125a716f547a0b69413c0098e811da3b799d173429c95da4290a00c139f7";

export const NETWORK =
  process.env.NEXT_PUBLIC_CHAIN_ID == "SN_SEPOLIA"
    ? constants.NetworkName.SN_SEPOLIA
    : constants.NetworkName.SN_MAIN;

export const isMainnet = () => {
  return NETWORK === constants.NetworkName.SN_MAIN;
};

export const DASHBOARD_URL = "https://dashboard.endur.fi";

export function getEndpoint() {
  return (
    (typeof window === "undefined"
      ? process.env.HOSTNAME
      : window.location.origin) || "https://app.endur.fi"
  );
}

export function getProvider() {
  return new RpcProvider({
    nodeUrl:
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://starknet-mainnet.public.blastapi.io",
    blockIdentifier: "pending",
  });
}

export function getExplorerEndpoint() {
  if (isMainnet()) {
    return "https://starkscan.co";
  }

  return "https://sepolia.starkscan.co";
}

export function convertTimeString(timeString: string): string {
  const timeRegex = /(\d+)\s(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
  const match = timeString.match(timeRegex);

  if (!match) {
    throw new Error("Invalid time format. Expected format '0 00:00:04.876'");
  }
  // currently returns upper end of estimate;
  // can update as withdrawal queue becomes more automated

  const hours = parseFloat(`${match[4]}.${match[5]}`);

  if (hours < 1) return "1-2 hours";
  if (hours < 24) {
    const roundedHour = Math.ceil(hours);
    return `${roundedHour}-${roundedHour + 2} hours`;
  }
  const days = Math.ceil(hours / 24);
  return `${days}-${days + 1} days`;
}
