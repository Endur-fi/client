import { BlockTag, type BlockIdentifier, Contract } from "starknet";

import vxstrkAbi from "@/abi/vxstrk.abi.json";
import {
  getLSTAssetBySymbol,
  getLSTAssetsByCategory,
  getPortfolioProvider,
  getSTRKAsset,
  type LSTAssetConfig,
} from "@/constants";
import { ASSET_SYMBOL_TO_LST_TOKEN } from "@/lib/portfolio-holdings-keys";
import type { PortfolioBalance, PortfolioData } from "@/lib/portfolio-types";
import MyNumber from "@/lib/MyNumber";
import { getHoldings } from "@/store/lst.store";
import { getEkuboHoldings } from "@/store/ekubo.store";
import { getOpusHoldings } from "@/store/opus.store";
import {
  getNostraDexHoldings,
  getNostraHoldingsByToken,
  i_XSTRK_C_CONTRACT_ADDRESS,
  i_XSTRK_CONTRACT_ADDRESS,
  N_XSTRK_C_CONTRACT_ADDRESS,
  N_XSTRK_CONTRACT_ADDRESS,
} from "@/store/nostra.store";
import {
  getEkuboXSTRKSTRKHoldings,
  getXSTRKSenseiHoldings,
} from "@/store/strkfarm.store";
import {
  getVesuHoldings,
  getVesuxSTRKCollateralWrapper,
} from "@/store/vesu.store";
import type { DAppHoldings } from "@/store/defi.store";

export type LstConfigWithAddresses = LSTAssetConfig & {
  LST_ADDRESS: string;
  WITHDRAWAL_QUEUE_ADDRESS: string;
  TROVES_HYPER_VAULT_ADDRESS?: string;
};

const ZERO_BALANCE: PortfolioBalance = {
  balance: "0",
  balanceInXstrk: "0",
};

export function emptyPortfolioData(): PortfolioData {
  const now = Math.floor(Date.now() / 1000);
  return {
    blockNumber: 0,
    timestamp: now,
    endur: { ...ZERO_BALANCE },
    ekubo: { ...ZERO_BALANCE },
    vesuCollateral: { ...ZERO_BALANCE },
    vesuVtoken: { ...ZERO_BALANCE },
    vesuDebt: { ...ZERO_BALANCE },
    trovesSensei: { ...ZERO_BALANCE },
    trovesHyper: { ...ZERO_BALANCE },
    trovesEkubo: { ...ZERO_BALANCE },
    nostra: { ...ZERO_BALANCE },
    opus: { ...ZERO_BALANCE },
  };
}

function holdingsToBalance(
  holdings: DAppHoldings,
  decimals: number,
): PortfolioBalance {
  const raw = holdings.lstAmount.toString();
  return {
    balance: raw,
    balanceInXstrk: raw,
  };
}

export function getLstConfigBySymbol(
  symbol: string,
): LstConfigWithAddresses | undefined {
  return getLSTAssetBySymbol(symbol) as LstConfigWithAddresses | undefined;
}

export function getLstConfigByPortfolioToken(
  lstToken: string,
): LstConfigWithAddresses | undefined {
  const symbol =
    Object.entries(ASSET_SYMBOL_TO_LST_TOKEN).find(
      ([, token]) => token === lstToken,
    )?.[0] ?? "STRK";
  return getLstConfigBySymbol(symbol);
}

export async function getTrovesHyperHoldings(
  address: string,
  vaultAddress: string,
  decimals: number,
  blockNumber?: BlockIdentifier,
): Promise<DAppHoldings> {
  if (!vaultAddress) {
    return {
      lstAmount: MyNumber.fromZero(decimals),
      underlyingTokenAmount: MyNumber.fromZero(decimals),
    };
  }

  const provider = getPortfolioProvider();
  const contract = new Contract({
    abi: vxstrkAbi,
    address: vaultAddress,
    providerOrAccount: provider,
  });

  const blockId = blockNumber ?? BlockTag.LATEST;
  const sharesResult = await contract.call("balance_of", [address], {
    blockIdentifier: blockId,
  });
  const shares = BigInt(sharesResult.toString());
  const assetsResult = await contract.call(
    "convert_to_assets",
    [shares.toString()],
    { blockIdentifier: blockId },
  );
  const assets = BigInt(assetsResult.toString());

  return {
    lstAmount: new MyNumber(assets.toString(), decimals),
    underlyingTokenAmount: MyNumber.fromZero(decimals),
  };
}

async function getNostraLendingForStrk(
  address: string,
  blockNumber?: BlockIdentifier,
): Promise<DAppHoldings> {
  const tokens = [
    N_XSTRK_CONTRACT_ADDRESS,
    N_XSTRK_C_CONTRACT_ADDRESS,
    i_XSTRK_CONTRACT_ADDRESS,
    i_XSTRK_C_CONTRACT_ADDRESS,
  ];
  const decimals = getSTRKAsset().DECIMALS;
  const holdings = await Promise.all(
    tokens.map((token) =>
      getNostraHoldingsByToken(address, token, blockNumber),
    ),
  );
  const lstAmount = holdings.reduce(
    (acc, cur) => acc.operate("plus", cur.toString()),
    MyNumber.fromZero(decimals),
  );
  return {
    lstAmount,
    underlyingTokenAmount: MyNumber.fromZero(decimals),
  };
}

export type GraphQLPortfolioFetcher = (
  userAddress: string,
  lstToken: string,
) => Promise<PortfolioData>;

export async function buildPortfolioDataForLst(
  userAddress: string,
  lstConfig: LstConfigWithAddresses,
  graphQLFallback?: GraphQLPortfolioFetcher,
  blockNumber?: BlockIdentifier,
): Promise<PortfolioData> {
  const decimals = lstConfig.DECIMALS;
  const lstAddress = lstConfig.LST_ADDRESS;
  const blockId = blockNumber ?? BlockTag.LATEST;
  const provider = getPortfolioProvider();
  const block = await provider.getBlock(blockId);
  const base = emptyPortfolioData();
  base.blockNumber = Number(block.block_number);
  base.timestamp = Number(block.timestamp);

  const wallet = await getHoldings({
    address: userAddress,
    lstAddress,
    decimals,
    blockNumber: blockId,
  });
  base.endur = holdingsToBalance(wallet, decimals);

  if (lstConfig.TROVES_HYPER_VAULT_ADDRESS) {
    const hyper = await getTrovesHyperHoldings(
      userAddress,
      lstConfig.TROVES_HYPER_VAULT_ADDRESS,
      decimals,
      blockId,
    );
    base.trovesHyper = holdingsToBalance(hyper, decimals);
  }

  const ekubo = await getEkuboHoldings({
    address: userAddress,
    blockNumber: blockId,
    lstAddress,
  });
  base.ekubo = holdingsToBalance(ekubo, decimals);

  if (lstConfig.SYMBOL === "STRK") {
    const vesuSupply = await getVesuHoldings({
      address: userAddress,
      blockNumber: blockId,
    });
    const vesuCollateral = await getVesuxSTRKCollateralWrapper()({
      address: userAddress,
      blockNumber: blockId,
    });
    const vesuLst = vesuSupply.lstAmount.operate(
      "plus",
      vesuCollateral.lstAmount.toString(),
    );
    base.vesuVtoken = {
      balance: vesuLst.toString(),
      balanceInXstrk: vesuLst.toString(),
    };
    base.vesuCollateral = holdingsToBalance(vesuCollateral, decimals);

    const sensei = await getXSTRKSenseiHoldings({
      address: userAddress,
      blockNumber: blockId,
    });
    base.trovesSensei = holdingsToBalance(sensei, decimals);

    const trovesEkubo = await getEkuboXSTRKSTRKHoldings({
      address: userAddress,
      blockNumber: blockId,
    });
    base.trovesEkubo = holdingsToBalance(trovesEkubo, decimals);

    const nostraLend = await getNostraLendingForStrk(userAddress, blockId);
    const nostraDex = await getNostraDexHoldings({
      address: userAddress,
      blockNumber: blockId,
    });
    const nostraLst = nostraLend.lstAmount.operate(
      "plus",
      nostraDex.lstAmount.toString(),
    );
    base.nostra = {
      balance: nostraLst.toString(),
      balanceInXstrk: nostraLst.toString(),
    };

    const opus = await getOpusHoldings({
      address: userAddress,
      blockNumber: blockId,
    });
    base.opus = holdingsToBalance(opus, decimals);
  } else if (graphQLFallback) {
    const lstToken =
      ASSET_SYMBOL_TO_LST_TOKEN[lstConfig.SYMBOL] ?? lstConfig.LST_SYMBOL;
    try {
      const indexed = await graphQLFallback(userAddress, lstToken);
      base.vesuCollateral = indexed.vesuCollateral;
      base.vesuVtoken = indexed.vesuVtoken;
      base.vesuDebt = indexed.vesuDebt;
      base.trovesSensei = indexed.trovesSensei;
      base.trovesEkubo = indexed.trovesEkubo;
      base.nostra = indexed.nostra;
      base.opus = indexed.opus;
      if (
        BigInt(base.ekubo.balance) === BigInt(0) &&
        BigInt(indexed.ekubo.balance) > 0
      ) {
        base.ekubo = indexed.ekubo;
      }
      if (
        BigInt(base.trovesHyper.balance) === BigInt(0) &&
        BigInt(indexed.trovesHyper.balance) > 0
      ) {
        base.trovesHyper = indexed.trovesHyper;
      }
    } catch {}
  }

  return base;
}

export async function getAllLstTokenBalancesRpc(
  userAddress: string,
  graphQLFallback?: GraphQLPortfolioFetcher,
): Promise<Record<string, PortfolioData>> {
  const configs = [
    getSTRKAsset(),
    ...getLSTAssetsByCategory("BTC"),
  ] as LstConfigWithAddresses[];

  const entries = await Promise.all(
    configs.map(async (config) => {
      const key =
        ASSET_SYMBOL_TO_LST_TOKEN[config.SYMBOL] ?? config.LST_SYMBOL;
      try {
        const data = await buildPortfolioDataForLst(
          userAddress,
          config,
          graphQLFallback,
        );
        return [key, data] as const;
      } catch {
        return [key, emptyPortfolioData()] as const;
      }
    }),
  );

  const result: Record<string, PortfolioData> = {};
  for (const [key, data] of entries) {
    result[key] = data;
  }
  return result;
}

export async function getPortfolioBalanceRpc(
  userAddress: string,
  lstToken: string = "XSTRK",
  graphQLFallback?: GraphQLPortfolioFetcher,
): Promise<PortfolioData> {
  const config = getLstConfigByPortfolioToken(lstToken);
  if (!config) {
    return emptyPortfolioData();
  }
  return buildPortfolioDataForLst(userAddress, config, graphQLFallback);
}
