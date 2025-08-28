import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { BlockIdentifier, Contract } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import vesuSingletonAbi from "@/abi/vesu.singleton.abi.json";
import {
  ETH_TOKEN,
  getProvider,
  RUSDC,
  STRK_DECIMALS,
  STRK_TOKEN,
  USDC_TOKEN,
  USDT_TOKEN,
  WBTC_TOKEN,
  xSTRK_TOKEN_MAINNET,
} from "@/constants";
import MyNumber from "@/lib/MyNumber";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import { isContractNotDeployed } from "@/lib/utils";

const VESU_XSTRK_ADDRESS =
  "0x037ff012710c5175004687bc4d9e4c6e86d6ce5ca6fb6afee72ea02b1208fdb7";
const VESU_XSTRK_ADDRESS_DEPLOYMENT_BLOCK = 954847;
const VESU_XSTRK_ADDRESS_MAX_BLOCK = 1440400;

const VESU_XSTRK_ADDRESS_V2 =
  "0x040f67320745980459615f4f3e7dd71002dbe6c68c8249c847c82dbe327b23cb";
const VESU_XSTRK_ADDRESS_V2_DEPLOYMENT_BLOCK = 1440456;

const VESU_ALTERSCOPR_XSTRK_ADDRESS =
  "0x062b16a3c933bd60eddc9630c3d088f0a1e9dcd510fbbf4ff3fb3b6a3839fd8a";
const VESU_ALTERSCOPR_XSTRK_ADDRESS_DEPLOYMENT_BLOCK = 1197971;
const VESU_ALTERSCOPR_XSTRK_ADDRESS_MAX_BLOCK = 1440400;

const VESU_ALTERSCOPR_XSTRK_ADDRESS_V2 =
  "0x020478f0a1b1ef010aa24104ba0e91bf60efcabed02026b75e1d68690809e453";
const VESU_ALTERSCOPR_XSTRK_ADDRESS_V2_DEPLOYMENT_BLOCK = 1440471;

const VESU_RE7_rUSDC_XSTRK_ADDRESS =
  "0x069d2c197680bd60bafe1804239968275a1c85a1cad921809277306634b332b5";
const VESU_RE7_rUSDC_XSTRK_ADDRESS_DEPLOYMENT_BLOCK = 1240391;
const VESU_RE7_rUSDC_XSTRK_ADDRESS_MAX_BLOCK = 1440400;

const VESU_RE7_rUSDC_XSTRK_ADDRESS_V2 =
  "0x0318761ecb936a2905306c371c7935d2a6a0fa24493ac7c87be3859a36e2563a";
const VESU_RE7_rUSDC_XSTRK_ADDRESS_V2_DEPLOYMENT_BLOCK = 1440481;

const VESU_SINGLETON_ADDRESS =
  "0x02545b2e5d519fc230e9cd781046d3a64e092114f07e44771e0d719d148725ef";
const VESU_SINGLETON_ADDRESS_DEPLOYMENT_BLOCK = 954847;
const VESU_SINGLETON_ADDRESS_MAX_BLOCK = 1440400;
const VESU_SINGLETON_ADDRESS_V2 =
  "0x000d8d6dfec4d33bfb6895de9f3852143a17c6f92fd2a21da3d6924d34870160";
const VESU_SINGLETON_ADDRESS_V2_DEPLOYMENT_BLOCK = 1440481;

const getVTokenHoldings = async (
  address: string,
  provider: any,
  blockNumber: BlockIdentifier,
  vToken: string,
  vTokenDeploymentBlock: number,
  vTokenMaxBlock: number,
  vTokenV2: string,
  vTokenV2DeploymentBlock: number,
) => {
  const isV1Deployed = !isContractNotDeployed(
    blockNumber,
    vTokenDeploymentBlock,
    vTokenMaxBlock,
  );
  const isV2Deployed = !isContractNotDeployed(
    blockNumber,
    vTokenV2DeploymentBlock,
  );
  if (!isV1Deployed && !isV2Deployed) {
    return {
      xSTRKAmount: MyNumber.fromZero(STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }

  const vTokens = isV2Deployed ? [vToken, vTokenV2] : [vToken];
  const balances = Promise.all(
    vTokens.map(async (token) => {
      const contract = new Contract(erc4626Abi, token, provider);
      const shares = await contract.call("balance_of", [address], {
        blockIdentifier: blockNumber ?? "pending",
      });

      const assetsToken = isV2Deployed ? vTokenV2 : vToken;
      const contractV2 = new Contract(erc4626Abi, assetsToken, provider);
      const balance = await contractV2.call("convert_to_assets", [shares], {
        blockIdentifier: blockNumber ?? "pending",
      });

      return balance.toString();
    }),
  );

  const result = await balances;
  let balance = new MyNumber("0", STRK_DECIMALS);
  result.forEach((bal) => {
    balance = balance.operate("plus", bal);
  });
  return {
    xSTRKAmount: balance,
    STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
  };
};

export const getVesuHoldings: DAppHoldingsFn = async (
  address: string,
  lstAddress: string,
  lstDecimals: number,
  blockNumber?: BlockIdentifier,
) => {
  const provider = getProvider();
  const proms = [
    getVTokenHoldings(
      address,
      provider,
      blockNumber ?? "pending",
      VESU_XSTRK_ADDRESS,
      VESU_XSTRK_ADDRESS_DEPLOYMENT_BLOCK,
      VESU_XSTRK_ADDRESS_MAX_BLOCK,
      VESU_XSTRK_ADDRESS_V2,
      VESU_XSTRK_ADDRESS_V2_DEPLOYMENT_BLOCK,
    ),
    getVTokenHoldings(
      address,
      provider,
      blockNumber ?? "pending",
      VESU_ALTERSCOPR_XSTRK_ADDRESS,
      VESU_ALTERSCOPR_XSTRK_ADDRESS_DEPLOYMENT_BLOCK,
      VESU_ALTERSCOPR_XSTRK_ADDRESS_MAX_BLOCK,
      VESU_ALTERSCOPR_XSTRK_ADDRESS_V2,
      VESU_ALTERSCOPR_XSTRK_ADDRESS_V2_DEPLOYMENT_BLOCK,
    ),
    getVTokenHoldings(
      address,
      provider,
      blockNumber ?? "pending",
      VESU_RE7_rUSDC_XSTRK_ADDRESS,
      VESU_RE7_rUSDC_XSTRK_ADDRESS_DEPLOYMENT_BLOCK,
      VESU_RE7_rUSDC_XSTRK_ADDRESS_MAX_BLOCK,
      VESU_RE7_rUSDC_XSTRK_ADDRESS_V2,
      VESU_RE7_rUSDC_XSTRK_ADDRESS_V2_DEPLOYMENT_BLOCK,
    ),
  ];
  const res = await Promise.all(proms);
  const balance = res.reduce(
    (acc, cur) => acc.operate("plus", cur.xSTRKAmount.toString()),
    new MyNumber("0", STRK_DECIMALS),
  );
  const balance2 = res.reduce(
    (acc, cur) => acc.operate("plus", cur.STRKAmount.toString()),
    MyNumber.fromZero(STRK_DECIMALS),
  );
  return {
    xSTRKAmount: balance,
    STRKAmount: balance2,
  };
};

export const uservXSTRKBalanceQueryAtom = getHoldingAtom(
  "uservXSTRKBalance",
  getVesuHoldings,
);

export const uservXSTRKBalanceAtom: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      const { data, error } = get(uservXSTRKBalanceQueryAtom(blockNumber));
      const { data: data2, error: error2 } = get(
        userVesuxSTRKCollateralAtom(blockNumber),
      );

      const xSTRKAmount1 =
        data?.xSTRKAmount ?? new MyNumber("0", STRK_DECIMALS);
      const xSTRKAmount2 =
        data2?.xSTRKAmount ?? new MyNumber("0", STRK_DECIMALS);

      return {
        data: {
          xSTRKAmount: xSTRKAmount1.operate("plus", xSTRKAmount2.toString()),
          STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
        },
        error,
        isLoading: !data && !error,
      };
    }),
);

export const getVesuxSTRKCollateral = async (
  address: string,
  provider: any,
  poolId: string,
  debtToken: string,
  poolDeploymentBlock: number,
  blockNumber?: BlockIdentifier,
) => {
  const isSingletonDeployed = !isContractNotDeployed(
    blockNumber,
    VESU_SINGLETON_ADDRESS_DEPLOYMENT_BLOCK,
    VESU_SINGLETON_ADDRESS_MAX_BLOCK,
  );
  const isV2SingletonDeployed = !isContractNotDeployed(
    blockNumber,
    VESU_SINGLETON_ADDRESS_V2_DEPLOYMENT_BLOCK,
  );

  // Check if the pool is deployed
  const isPoolDeployed = !isContractNotDeployed(
    blockNumber,
    poolDeploymentBlock,
  );

  if ((!isSingletonDeployed && !isV2SingletonDeployed) || !isPoolDeployed) {
    return {
      xSTRKAmount: MyNumber.fromZero(STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }

  const singletonAddress = isV2SingletonDeployed
    ? VESU_SINGLETON_ADDRESS_V2
    : VESU_SINGLETON_ADDRESS;
  try {
    const contract = new Contract(vesuSingletonAbi, singletonAddress, provider);
    const currentPosition: any = await contract.call(
      "position_unsafe",
      [poolId, xSTRK_TOKEN_MAINNET, debtToken, address],
      {
        blockIdentifier: blockNumber ?? "pending",
      },
    );
    // const exRate = await contract.call("rate_accumulator", [
    //   poolId,
    //   xSTRK_TOKEN_MAINNET,
    // ], {
    //   blockIdentifier: blockNumber ?? "pending",
    // });

    return {
      xSTRKAmount: new MyNumber(currentPosition[1].toString(), STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  } catch (error: any) {
    if (error.message.includes("unknown-pool")) {
      // do nothing, its ok, dont log
    } else {
      console.error("getVesuxSTRKCollateral", error);
    }
    return {
      xSTRKAmount: MyNumber.fromZero(STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }
};

export const RE7_XSTRK_POOL_ID =
  "0x52fb52363939c3aa848f8f4ac28f0a51379f8d1b971d8444de25fbd77d8f161";
const RE7_XSTRK_DEPLOYMENT_BLOCK = 954847;
export const ALTERSCOPE_XSTRK_POOL_ID =
  "0x27f2bb7fb0e232befc5aa865ee27ef82839d5fad3e6ec1de598d0fab438cb56";
const ALTERSCOPE_XSTRK_POOL_ID_DEPLOYMENT_BLOCK = 1197971;

export const RE7_rUSDC_POOL_ID =
  "0x3de03fafe6120a3d21dc77e101de62e165b2cdfe84d12540853bd962b970f99";
const RE7_rUSDC_DEPLOYMENT_BLOCK = 1240391;

export const RE7_XSTRK_POOL_DEBT_STRK = STRK_TOKEN;

export const getVesuxSTRKCollateralWrapper = (): DAppHoldingsFn => {
  return async (
    address: string,
    provider: any,
    blockNumber?: BlockIdentifier,
  ) => {
    // Re7 pool
    const output1 = getVesuxSTRKCollateral(
      address,
      provider,
      RE7_XSTRK_POOL_ID,
      RE7_XSTRK_POOL_DEBT_STRK,
      RE7_XSTRK_DEPLOYMENT_BLOCK,
      blockNumber,
    );

    // Re7 rUSDC
    const output2 = getVesuxSTRKCollateral(
      address,
      provider,
      RE7_XSTRK_POOL_ID,
      RUSDC,
      RE7_rUSDC_DEPLOYMENT_BLOCK,
      blockNumber,
    );

    // Alterscope
    const alterScopeBTC = getVesuxSTRKCollateral(
      address,
      provider,
      ALTERSCOPE_XSTRK_POOL_ID,
      WBTC_TOKEN,
      ALTERSCOPE_XSTRK_POOL_ID_DEPLOYMENT_BLOCK,
      blockNumber,
    );
    const alterScopeETH = getVesuxSTRKCollateral(
      address,
      provider,
      ALTERSCOPE_XSTRK_POOL_ID,
      ETH_TOKEN,
      ALTERSCOPE_XSTRK_POOL_ID_DEPLOYMENT_BLOCK,
      blockNumber,
    );
    const alterScopeUSDC = getVesuxSTRKCollateral(
      address,
      provider,
      ALTERSCOPE_XSTRK_POOL_ID,
      USDC_TOKEN,
      ALTERSCOPE_XSTRK_POOL_ID_DEPLOYMENT_BLOCK,
      blockNumber,
    );
    const alterScopeUSDT = getVesuxSTRKCollateral(
      address,
      provider,
      ALTERSCOPE_XSTRK_POOL_ID,
      USDT_TOKEN,
      ALTERSCOPE_XSTRK_POOL_ID_DEPLOYMENT_BLOCK,
      blockNumber,
    );
    const alterScopeSTRK = getVesuxSTRKCollateral(
      address,
      provider,
      ALTERSCOPE_XSTRK_POOL_ID,
      STRK_TOKEN,
      ALTERSCOPE_XSTRK_POOL_ID_DEPLOYMENT_BLOCK,
      blockNumber,
    );
    // ? add more pools here and update in below promise.all

    const result = await Promise.all([
      output1,
      output2,
      alterScopeBTC,
      alterScopeETH,
      alterScopeUSDC,
      alterScopeUSDT,
      alterScopeSTRK,
    ]);
    const sumXSTRKAmount = result.reduce(
      (acc, cur) => acc.operate("plus", cur.xSTRKAmount.toString()),
      new MyNumber("0", STRK_DECIMALS),
    );
    const sumSTRKAmount = MyNumber.fromZero(STRK_DECIMALS);
    return {
      xSTRKAmount: sumXSTRKAmount,
      STRKAmount: sumSTRKAmount,
    };
  };
};

export const userVesuxSTRKCollateralAtom = getHoldingAtom(
  "userVesuxSTRKCollateral",
  getVesuxSTRKCollateralWrapper(),
);
