import { BlockIdentifier, BlockTag, Contract } from "starknet";
import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import SenseiAbi from "@/abi/sensei.abi.json";
import EkuboSTRKFarmAbi from "@/abi/ekubo_strkfarm.abi.json";
import { isContractNotDeployed } from "@/lib/utils";
import MyNumber from "@/lib/MyNumber";
import { getProvider, STRK_DECIMALS } from "@/constants";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

const XSTRK_SENSEI =
  "0x07023a5cadc8a5db80e4f0fde6b330cbd3c17bbbf9cb145cbabd7bd5e6fb7b0b";
const XSTRK_SENSEI_DEPLOYMENT_BLOCK = 1053807;

const EKUBO_XSTRK_STRK =
  "0x01f083b98674bc21effee29ef443a00c7b9a500fd92cf30341a3da12c73f2324";
const EKUBO_XSTRK_STRK_DEPLOYMENT_BLOCK = 1209881;

export const getXSTRKSenseiHoldings: DAppHoldingsFn = async ({
  address,
  blockNumber,
}: {
  address: string;
  blockNumber?: BlockIdentifier;
}) => {
  if (isContractNotDeployed(blockNumber, XSTRK_SENSEI_DEPLOYMENT_BLOCK)) {
    return {
      lstAmount: MyNumber.fromZero(STRK_DECIMALS),
      underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }
  try {
    const contract = new Contract({
      abi: SenseiAbi,
      address: XSTRK_SENSEI,
      providerOrAccount: getProvider(),
    });
    const info: any = await contract.call("describe_position", [address], {
      blockIdentifier: blockNumber ?? BlockTag.LATEST,
    });
    const holdings = info["1"];
    // const strkAmount = new MyNumber(holdings.estimated_size.toString(), STRK_DECIMALS);
    // const totalAssets = await getTotalAssetsByBlock();
    // const totalSupply = await getTotalSupplyByBlock();
    // const exchangeRate = Number(totalAssets.operate('multipliedBy', '1000000').operate('div', totalSupply.toString()).toString()) / 1000000;
    // const xSTRKAmount = strkAmount.operate('multipliedBy', exchangeRate.toString());
    return {
      lstAmount: new MyNumber(holdings.deposit2.toString(), STRK_DECIMALS),
      underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  } catch (error) {
    return {
      lstAmount: MyNumber.fromZero(STRK_DECIMALS),
      underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }
};

export const getEkuboXSTRKSTRKHoldings: DAppHoldingsFn = async ({
  address,
  blockNumber,
}: {
  address: string;
  blockNumber?: BlockIdentifier;
}) => {
  if (isContractNotDeployed(blockNumber, EKUBO_XSTRK_STRK_DEPLOYMENT_BLOCK)) {
    return {
      lstAmount: MyNumber.fromZero(STRK_DECIMALS),
      underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }

  const contract = new Contract({
    abi: EkuboSTRKFarmAbi,
    address: EKUBO_XSTRK_STRK,
    providerOrAccount: getProvider(),
  });
  const bal: any = await contract.call("balanceOf", [address], {
    blockIdentifier: blockNumber ?? BlockTag.LATEST,
  });
  const info: any = await contract.call("convert_to_assets", [bal.toString()], {
    blockIdentifier: blockNumber ?? BlockTag.LATEST,
  });
  const xSTRKHolings = info.amount0;
  const STRKHolings = info.amount1;
  // const strkAmount = new MyNumber(holdings.estimated_size.toString(), STRK_DECIMALS);
  // const totalAssets = await getTotalAssetsByBlock();
  // const totalSupply = await getTotalSupplyByBlock();
  // const exchangeRate = Number(totalAssets.operate('multipliedBy', '1000000').operate('div', totalSupply.toString()).toString()) / 1000000;
  // const xSTRKAmount = strkAmount.operate('multipliedBy', exchangeRate.toString());
  return {
    lstAmount: new MyNumber(xSTRKHolings.toString(), STRK_DECIMALS),
    underlyingTokenAmount: new MyNumber(STRKHolings.toString(), STRK_DECIMALS),
  };
};

export const userXSTRKSenseiBalanceQueryAtom = getHoldingAtom(
  "xstrkSenseiBalance",
  getXSTRKSenseiHoldings,
);

export const userEkuboXSTRKSTRKBalanceQueryAtom = getHoldingAtom(
  "ekuboXSTRKSTRKBalance",
  getEkuboXSTRKSTRKHoldings,
);

export const getSTRKFarmBalanceAtom: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) => {
    return atom((get) => {
      const { data, error } = get(userXSTRKSenseiBalanceQueryAtom(blockNumber));
      const { data: data2, error: error2 } = get(
        userEkuboXSTRKSTRKBalanceQueryAtom(blockNumber),
      );

      let lstAmount = data?.lstAmount ?? new MyNumber("0", STRK_DECIMALS);
      let underlyingTokenAmount =
        data?.underlyingTokenAmount ?? new MyNumber("0", STRK_DECIMALS);

      if (data2) {
        lstAmount = lstAmount.operate(
          "plus",
          data2?.lstAmount ? data2.lstAmount.toString() : "0",
        );
        underlyingTokenAmount = underlyingTokenAmount.operate(
          "plus",
          data2?.underlyingTokenAmount
            ? data2.underlyingTokenAmount.toString()
            : "0",
        );
      }

      return {
        data: {
          lstAmount,
          underlyingTokenAmount,
        },
        error: error || error2,
        isLoading: !data && !error,
      };
    });
  },
);
