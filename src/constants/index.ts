import { constants, RpcProvider } from "starknet";

export const STRK_TOKEN =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as const;
export const ETH_TOKEN =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const USDC_TOKEN =
  "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
export const USDT_TOKEN =
  "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8";
export const WBTC_TOKEN =
  "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";
export const RUSDC = '0x02019e47a0bc54ea6b4853c6123ffc8158ea3ae2af4166928b0de6e89f06de6c';

export const xSTRK_TOKEN_MAINNET =
  "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a";
export const xSTRK_TOKEN_MAINNET_DEPLOYMENT_BLOCK = 929092;
export const BLOCK_NUMBER_24_NOV_2024 = 925000; // block number at Nov 24 2024 04:17:28

export const STRK_DECIMALS = 18;
export const REWARD_FEES = 15;

export const RECEPIEINT_FEE_ADDRESS =
  "0x0066c76374A9AdB11D4d283aC400331ec6A691C61029168bD70CeA5d97dFc971";

export const STRK_ORACLE_CONTRACT =
  "0x7ca92dce6e5f7f81f6c393c647b5c0c266e7663088351a4bd34ee9f88569de5";

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

export const VESU_vXSTRK_ADDRESS =
  "0x040f67320745980459615f4f3e7dd71002dbe6c68c8249c847c82dbe327b23cb";
export const NOSTRA_iXSTRK_ADDRESS =
  "0x04d1125a716f547a0b69413c0098e811da3b799d173429c95da4290a00c139f7";

export const NETWORK =
  process.env.NEXT_PUBLIC_CHAIN_ID === "SN_SEPOLIA"
    ? constants.NetworkName.SN_SEPOLIA
    : constants.NetworkName.SN_MAIN;

export const isMainnet = () => {
  return NETWORK === constants.NetworkName.SN_MAIN;
};

export function getEndpoint() {
  return (
    (typeof window === "undefined"
      ? process.env.HOSTNAME
      : window.location.origin) || "https://app.endur.fi"
  );
}

export function getProvider() {
  const rpcUrl =
    process.env.RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    "https://starknet-mainnet.public.blastapi.io";

  return new RpcProvider({
    nodeUrl: rpcUrl,
    blockIdentifier: "pending",
  });
}

export const LINKS = {
  DUNE_ANALYTICS: "https://dune.com/endurfi/xstrk-analytics",
  DASHBOARD_URL: "https://dashboard.endur.fi",
  ENDUR_TWITTER: "https://x.com/endurfi",
  ENDUR_TELEGRAM: "https://t.me/+jWY71PfbMMIwMTBl",
  ENDUR_BLOG: "https://blog.endur.fi/",
  ENDUR_DOCS: "https://docs.endur.fi",
  ENDUR_VALUE_DISTRUBUTION_BLOG_LINK:
    "https://blog.endur.fi/endur-reimagining-value-distribution-in-liquid-staking-on-starknet",
} as const;

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

export const convertToPlainObject = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};
