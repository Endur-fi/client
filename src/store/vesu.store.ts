import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { BlockIdentifier, Contract } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import vesuSingletonAbi from "@/abi/vesu.singleton.abi.json";
import { STRK_DECIMALS, STRK_TOKEN, xSTRK_TOKEN_MAINNET } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import { isContractNotDeployed } from "@/lib/utils";

const VESU_XSTRK_ADDRESS =
  "0x037ff012710c5175004687bc4d9e4c6e86d6ce5ca6fb6afee72ea02b1208fdb7";
const VESU_XSTRK_ADDRESS_DEPLOYMENT_BLOCK = 954847;

const VESU_SINGLETON_ADDRESS =
  "0x02545b2e5d519fc230e9cd781046d3a64e092114f07e44771e0d719d148725ef";

export const getVesuHoldings: DAppHoldingsFn = async (
  address: string,
  provider: any,
  blockNumber?: BlockIdentifier,
) => {
  const VESU_xSTRK = VESU_XSTRK_ADDRESS;

  if (isContractNotDeployed(blockNumber, VESU_XSTRK_ADDRESS_DEPLOYMENT_BLOCK)) {
    return {
      xSTRKAmount: MyNumber.fromZero(),
      STRKAmount: MyNumber.fromZero(),
    };
  }

  const contract = new Contract(erc4626Abi, VESU_xSTRK, provider);
  const shares = await contract.call("balance_of", [address], {
    blockIdentifier: blockNumber ?? "pending",
  });

  const balance = await contract.call("convert_to_assets", [shares], {
    blockIdentifier: blockNumber ?? "pending",
  });

  return {
    xSTRKAmount: new MyNumber(balance.toString(), STRK_DECIMALS),
    STRKAmount: MyNumber.fromZero(),
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
          STRKAmount: MyNumber.fromZero(),
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
  blockNumber?: BlockIdentifier,
) => {
  if (isContractNotDeployed(blockNumber, VESU_XSTRK_ADDRESS_DEPLOYMENT_BLOCK)) {
    return {
      xSTRKAmount: MyNumber.fromZero(),
      STRKAmount: MyNumber.fromZero(),
    };
  }
  try {
    const contract = new Contract(
      vesuSingletonAbi,
      VESU_SINGLETON_ADDRESS,
      provider,
    );
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
      STRKAmount: MyNumber.fromZero(),
    };
  } catch (error) {
    console.error("getVesuxSTRKCollateral", error);
    return {
      xSTRKAmount: MyNumber.fromZero(),
      STRKAmount: MyNumber.fromZero(),
    };
  }
};

export const RE7_XSTRK_POOL_ID =
  "0x52fb52363939c3aa848f8f4ac28f0a51379f8d1b971d8444de25fbd77d8f161";
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
      blockNumber,
    );
    // ? add more pools here and update in below promise.all

    const result = await Promise.all([output1]);
    const sumXSTRKAmount = result.reduce(
      (acc, cur) => acc.operate("plus", cur.xSTRKAmount.toString()),
      new MyNumber("0", STRK_DECIMALS),
    );
    const sumSTRKAmount = MyNumber.fromZero();
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
