import { BlockTag, constants, RpcProvider } from "starknet";

export const NETWORK =
  process.env.NEXT_PUBLIC_CHAIN_ID === "SN_SEPOLIA"
    ? constants.NetworkName.SN_SEPOLIA
    : constants.NetworkName.SN_MAIN;

export const MERKLE_CONTRACT_ADDRESS_SEPOLIA =
  "0x0620325f0dfe1a31b06126af8612fe762f9dcab79960ce23ac734ff93ddf6c64";

export const MERKLE_CONTRACT_ADDRESS_MAINNET =
  "0x021660de54b2e2ba6189c70767f0be7916c8abe0962ff5c7bd912264855bf339";

export const STRK_TOKEN =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as const;
export const ETH_TOKEN =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const USDC_TOKEN =
  "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
export const USDT_TOKEN =
  "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8";
export const xSTRK_TOKEN_MAINNET =
  "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a";
export const xSTRK_TOKEN_MAINNET_DEPLOYMENT_BLOCK = 929092;
export const BLOCK_NUMBER_24_NOV_2024 = 925000; // block number at Nov 24 2024 04:17:28
export interface LSTAssetConfig {
  SYMBOL: string;
  ASSET_ADDRESS: string;
  LST_SYMBOL: string;
  DECIMALS: number;
  CATEGORY: "STRK" | "BTC";
  DISPLAY_NAME?: string;
  DESCRIPTION?: string;
  NETWORKS: {
    SN_MAIN?: {
      LST_ADDRESS: string;
      WITHDRAWAL_QUEUE_ADDRESS: string;
      TROVES_HYPER_VAULT_ADDRESS?: string;
    };
    SN_SEPOLIA?: {
      LST_ADDRESS: string;
      WITHDRAWAL_QUEUE_ADDRESS: string;
      TROVES_HYPER_VAULT_ADDRESS?: string;
    };
  };
  TROVES_VAULT_MAXED_OUT?: boolean;
}

export interface LSTNetworkConfig {
  [key: string]: LSTAssetConfig & {
    LST_ADDRESS: string;
    WITHDRAWAL_QUEUE_ADDRESS: string;
    TROVES_HYPER_VAULT_ADDRESS?: string;
    TROVES_VAULT_MAXED_OUT?: boolean;
  };
}

const LST_ASSETS: Record<string, LSTAssetConfig> = {
  STRK: {
    SYMBOL: "STRK",
    ASSET_ADDRESS:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    LST_SYMBOL: "xSTRK",
    DECIMALS: 18,
    CATEGORY: "STRK",
    DISPLAY_NAME: "Starknet Token",
    DESCRIPTION: "Native Starknet token for staking rewards",
    NETWORKS: {
      SN_MAIN: {
        LST_ADDRESS:
          "0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
        WITHDRAWAL_QUEUE_ADDRESS:
          "0x00518a66e579f9eb1603f5ffaeff95d3f013788e9c37ee94995555026b9648b6",
        TROVES_HYPER_VAULT_ADDRESS:
          "0x046c7a54c82b1fe374353859f554a40b8bd31d3e30f742901579e7b57b1b5960",
      },
      SN_SEPOLIA: {
        LST_ADDRESS:
          "0x042de5b868da876768213c48019b8d46cd484e66013ae3275f8a4b97b31fc7eb",
        WITHDRAWAL_QUEUE_ADDRESS:
          "0x0254cbdaf8275cb1b514ae63ccedb04a3a9996b1489829e5d6bbaf759ac100b6",
      },
    },
  },
  WBTC: {
    SYMBOL: "WBTC",
    ASSET_ADDRESS:
      "0x3fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    LST_SYMBOL: "xWBTC",
    DECIMALS: 8,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Wrapped Bitcoin",
    DESCRIPTION: "Wrapped Bitcoin on Starknet",
    TROVES_VAULT_MAXED_OUT: true,
    NETWORKS: {
      SN_MAIN: {
        LST_ADDRESS:
          "0x6a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13",
        WITHDRAWAL_QUEUE_ADDRESS:
          "0x670cdfa77487203cdf11d58db9617988d3a8fc2b22730594ed7d193a0430f72",
        TROVES_HYPER_VAULT_ADDRESS:
          "0x02da9d0f96a46b453f55604313785dc866424240b1c6811d13bef594343db818",
      },
    },
  },
  tBTC: {
    SYMBOL: "tBTC",
    ASSET_ADDRESS:
      "0x4daa17763b286d1e59b97c283c0b8c949994c361e426a28f743c67bdfe9a32f",
    LST_SYMBOL: "xtBTC",
    DECIMALS: 18,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Threshold Bitcoin",
    DESCRIPTION: "Threshold Bitcoin on Starknet",
    TROVES_VAULT_MAXED_OUT: true,
    NETWORKS: {
      SN_MAIN: {
        LST_ADDRESS:
          "0x43a35c1425a0125ef8c171f1a75c6f31ef8648edcc8324b55ce1917db3f9b91",
        WITHDRAWAL_QUEUE_ADDRESS:
          "0x35b194007fb5d9fd10cb1f8772ef45cced853e7b3239367de0e19ecba85d75a",
        TROVES_HYPER_VAULT_ADDRESS:
          "0x0047d5f68477e5637ce0e56436c6b5eee5a354e6828995dae106b11a48679328",
      },
    },
  },
  LBTC: {
    SYMBOL: "LBTC",
    ASSET_ADDRESS:
      "0x036834a40984312f7f7de8d31e3f6305b325389eaeea5b1c0664b2fb936461a4",
    LST_SYMBOL: "xLBTC",
    DECIMALS: 8,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Lightning Bitcoin",
    DESCRIPTION: "Lightning Bitcoin on Starknet",
    NETWORKS: {
      SN_MAIN: {
        LST_ADDRESS:
          "0x7dd3c80de9fcc5545f0cb83678826819c79619ed7992cc06ff81fc67cd2efe0",
        WITHDRAWAL_QUEUE_ADDRESS:
          "0x293caaca81259f02f17bd85de5056624626fc7cb25ff79f104c3ef07a4649ec",
        TROVES_HYPER_VAULT_ADDRESS:
          "0x064cf24d4883fe569926419a0569ab34497c6956a1a308fa883257f7486d7030",
      },
    },
  },
  solvBTC: {
    SYMBOL: "solvBTC",
    ASSET_ADDRESS:
      "0x0593e034dda23eea82d2ba9a30960ed42cf4a01502cc2351dc9b9881f9931a68",
    LST_SYMBOL: "xsBTC",
    DECIMALS: 18,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Solv Bitcoin",
    DESCRIPTION: "Solv Bitcoin on Starknet",
    NETWORKS: {
      SN_MAIN: {
        LST_ADDRESS:
          "0x580f3dc564a7b82f21d40d404b3842d490ae7205e6ac07b1b7af2b4a5183dc9",
        WITHDRAWAL_QUEUE_ADDRESS:
          "0x45f4f8affbfa6ef794f3b5eee7855bd19321745c5b442ad935cad4ae6a61006",
        TROVES_HYPER_VAULT_ADDRESS:
          "0x00437ef1e7d0f100b2e070b7a65cafec0b2be31b0290776da8b4112f5473d8d9",
      },
    },
  },
  // Testnet assets
  TBTC1: {
    SYMBOL: "TBTC1",
    ASSET_ADDRESS:
      "0x044aD07751Ad782288413C7DB42C48e1c4f6195876BCa3B6CAEF449bb4Fb8d36",
    LST_SYMBOL: "xBTC1",
    DECIMALS: 8,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Test Bitcoin 1",
    DESCRIPTION: "Test Bitcoin asset 1 on Sepolia",
    NETWORKS: {
      SN_SEPOLIA: {
        LST_ADDRESS:
          "0x036A2c3C56ae806B12A84bB253cBc1a009e3da5469e6a736C483303B864C8e2B",
        WITHDRAWAL_QUEUE_ADDRESS:
          "0x06259eC265D650C3Edd85d6B5f563603aA247c360879437D2372AeA7e2148eda",
      },
    },
  },
  TBTC2: {
    SYMBOL: "TBTC2",
    ASSET_ADDRESS:
      "0x07E97477601e5606359303cf50C050FD3bA94F66Bd041F4ed504673BA2b81696",
    LST_SYMBOL: "xBTC2",
    DECIMALS: 8,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Test Bitcoin 2",
    DESCRIPTION: "Test Bitcoin asset 2 on Sepolia",
    NETWORKS: {
      SN_SEPOLIA: {
        LST_ADDRESS:
          "0x0226324F63D994834E4729dd1bab443fe50Af8E97C608b812ee1f950ceaE68c7",
        WITHDRAWAL_QUEUE_ADDRESS:
          "0x0502B976EC50e85cE7E71997605a7DDbB70386844670ef270b9c721Db1cbE9c0",
      },
    },
  },
};

function buildLSTConfig(network: string): LSTNetworkConfig {
  const config: LSTNetworkConfig = {};

  const networkAssets =
    network === "SN_MAIN"
      ? ["STRK", "WBTC", "tBTC", "LBTC", "solvBTC"] // Mainnet assets
      : ["STRK", "TBTC1", "TBTC2"]; // Testnet assets

  networkAssets.forEach((assetKey) => {
    const baseAsset = LST_ASSETS[assetKey];
    const networkConfig =
      baseAsset?.NETWORKS[network as keyof typeof baseAsset.NETWORKS];

    if (baseAsset && networkConfig) {
      config[assetKey] = {
        ...baseAsset,
        LST_ADDRESS: networkConfig.LST_ADDRESS,
        WITHDRAWAL_QUEUE_ADDRESS: networkConfig.WITHDRAWAL_QUEUE_ADDRESS,
        TROVES_HYPER_VAULT_ADDRESS: networkConfig.TROVES_HYPER_VAULT_ADDRESS,
        TROVES_VAULT_MAXED_OUT: baseAsset.TROVES_VAULT_MAXED_OUT,
      };
    }
  });

  return config;
}

export const LST_CONFIG = buildLSTConfig(NETWORK);

export const getLSTAssetsByCategory = (
  category: "STRK" | "BTC",
): (LSTAssetConfig & {
  LST_ADDRESS: string;
  WITHDRAWAL_QUEUE_ADDRESS: string;
})[] => {
  return Object.values(LST_CONFIG).filter(
    (asset) => asset.CATEGORY === category,
  );
};

export const getLSTAssetBySymbol = (
  symbol: string,
):
  | (LSTAssetConfig & { LST_ADDRESS: string; WITHDRAWAL_QUEUE_ADDRESS: string })
  | undefined => {
  return Object.values(LST_CONFIG).find((asset) => asset.SYMBOL === symbol);
};

export const getFirstBTCAsset = ():
  | (LSTAssetConfig & { LST_ADDRESS: string; WITHDRAWAL_QUEUE_ADDRESS: string })
  | undefined => {
  return getLSTAssetsByCategory("BTC")[0];
};

export const getSTRKAsset = (): LSTAssetConfig & {
  LST_ADDRESS: string;
  WITHDRAWAL_QUEUE_ADDRESS: string;
} => {
  return LST_CONFIG.STRK;
};

export const WBTC_TOKEN =
  "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";
export const RUSDC =
  "0x02019e47a0bc54ea6b4853c6123ffc8158ea3ae2af4166928b0de6e89f06de6c";

export const STRK_DECIMALS = 18;
export const REWARD_FEES = 15;

export const RECEPIEINT_FEE_ADDRESS =
  "0x0066c76374A9AdB11D4d283aC400331ec6A691C61029168bD70CeA5d97dFc971";

export const STRK_ORACLE_CONTRACT =
  "0x7ca92dce6e5f7f81f6c393c647b5c0c266e7663088351a4bd34ee9f88569de5";

export const BTC_ORACLE_CONTRACT =
  "0x01bdcc831d4a3853d2cd6e56abbc82156625af515c8d828ed12953f2641978f0";

export const IS_PAUSED = process.env.NEXT_PUBLIC_IS_PAUSED === "true";

export const SN_STAKING_ADRESS =
  NETWORK === "SN_MAIN"
    ? "0x00ca1702e64c81d9a07b86bd2c540188d92a2c73cf5cc0e508d949015e7e84a7"
    : "0x03745ab04a431fc02871a139be6b93d9260b0ff3e779ad9c8b377183b23109f1";

export const SN_MINTING_CURVE_ADRESS =
  NETWORK === "SN_MAIN"
    ? "0x00ca1705e74233131dbcdee7f1b8d2926bf262168c7df339004b3f46015b6984"
    : "0x0351c67dc2d4653cbe457be59a035f80ff1e6f6939118dad1b7a94317a51a454";

export const SN_STAKING_REWARD_ADDRESS =
  NETWORK === "SN_MAIN"
    ? "0x009035556d1ee136e7722ae4e78f92828553a45eed3bc9b2aba90788ec2ca112"
    : "0x02ebbebb8ceb2e07f30a5088f5849afd4f908f04f3f9c97c694e5d83d2a7cc61";

export const NST_STRK_ADDRESS = process.env
  .NEXT_PUBLIC_NST_STRK_ADDRESS as `0x${string}`;

export const ARGENT_MOBILE_BASE64_ICON =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTE4LjQwMTggNy41NTU1NkgxMy41OTgyQzEzLjQzNzcgNy41NTU1NiAxMy4zMDkxIDcuNjg3NDcgMTMuMzA1NiA3Ljg1MTQzQzEzLjIwODUgMTIuNDYwMyAxMC44NDg0IDE2LjgzNDcgNi43ODYwOCAxOS45MzMxQzYuNjU3MTEgMjAuMDMxNCA2LjYyNzczIDIwLjIxNjIgNi43MjIwMiAyMC4zNDkzTDkuNTMyNTMgMjQuMzE5NkM5LjYyODE1IDI0LjQ1NDggOS44MTQ0NCAyNC40ODUzIDkuOTQ1NTggMjQuMzg2QzEyLjQ4NTYgMjIuNDYxMyAxNC41Mjg3IDIwLjEzOTUgMTYgMTcuNTY2QzE3LjQ3MTMgMjAuMTM5NSAxOS41MTQ1IDIyLjQ2MTMgMjIuMDU0NSAyNC4zODZDMjIuMTg1NiAyNC40ODUzIDIyLjM3MTkgMjQuNDU0OCAyMi40Njc2IDI0LjMxOTZMMjUuMjc4MSAyMC4zNDkzQzI1LjM3MjMgMjAuMjE2MiAyNS4zNDI5IDIwLjAzMTQgMjUuMjE0IDE5LjkzMzFDMjEuMTUxNiAxNi44MzQ3IDE4Ljc5MTUgMTIuNDYwMyAxOC42OTQ2IDcuODUxNDNDMTguNjkxMSA3LjY4NzQ3IDE4LjU2MjMgNy41NTU1NiAxOC40MDE4IDcuNTU1NTZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQuNzIzNiAxMC40OTJMMjQuMjIzMSA4LjkyNDM5QzI0LjEyMTMgOC42MDYxNCAyMy44NzM0IDguMzU4MjQgMjMuNTU3NyA4LjI2MDIzTDIyLjAwMzkgNy43NzU5NUMyMS43ODk1IDcuNzA5MDYgMjEuNzg3MyA3LjQwMTc3IDIyLjAwMTEgNy4zMzIwMUwyMy41NDY5IDYuODI0NjZDMjMuODYwOSA2LjcyMTQ2IDI0LjEwNiA2LjQ2OTUyIDI0LjIwMjcgNi4xNTAxMUwyNC42Nzk4IDQuNTc1MDJDMjQuNzQ1OCA0LjM1NzA5IDI1LjA0ODkgNC4zNTQ3NyAyNS4xMTgzIDQuNTcxNTZMMjUuNjE4OCA2LjEzOTE1QzI1LjcyMDYgNi40NTc0IDI1Ljk2ODYgNi43MDUzMSAyNi4yODQyIDYuODAzOUwyNy44MzggNy4yODc2MUMyOC4wNTI0IDcuMzM0NSAyOC4wNTQ3IDcuNjYxNzkgMjcuODQwOCA3LjczMjEzTDI2LjI5NSA4LjIzOTQ4QzI1Ljk4MTEgOC4zNDIxIDI1LjczNiA4LjU5NDA0IDI1LjYzOTMgOC45MTQwMkwyNS4xNjIxIDEwLjQ4ODVDMjUuMDk2MSAxMC43MDY1IDI0Ljc5MyAxMC43MDg4IDI0LjcyMzYgMTAuNDkyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==";

export const NOSTRA_IXSTRK =
  "0x04d1125a716f547a0b69413c0098e811da3b799d173429c95da4290a00c139f7";

export const VESU_vXSTRK_ADDRESS =
  "0x040f67320745980459615f4f3e7dd71002dbe6c68c8249c847c82dbe327b23cb";
export const NOSTRA_iXSTRK_ADDRESS =
  "0x04d1125a716f547a0b69413c0098e811da3b799d173429c95da4290a00c139f7";

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
    blockIdentifier: BlockTag.LATEST,
  });
}

export const ALPHA = 0.25;

export const LINKS = {
  DUNE_ANALYTICS: "https://dune.com/endurfi/xstrk-analytics",
  BTC_DUNE_ANALYTICS: "https://dune.com/endurfi/endurs-btc-staking-stats",
  DASHBOARD_URL: "https://dashboard.endur.fi",
  ENDUR_DISCORD: "https://endur.fi/discord",
  ENDUR_TWITTER: "https://endur.fi/x",
  ENDUR_TELEGRAM: "https://endur.fi/tg",
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

export const LEADERBOARD_ANALYTICS_EVENTS = {
  LEADERBOARD_PAGE_VIEW: "leaderboard_page_view",
  ELIGIBILITY_CHECK_CLICKED: "eligibility_check_clicked",
  ELIGIBILITY_RESULT: "eligibility_result",
  EMAIL_SUBMITTED: "email_submitted",
  EMAIL_SKIP_CLICKED: "email_skip_clicked",
  TWITTER_FOLLOW_CLICKED: "twitter_follow_clicked",
  TWITTER_FOLLOW_SKIPPED: "twitter_follow_skipped",
  CLICKED_CLAIM_REWARDS: "clicked_claim_rewards",
} as const;
