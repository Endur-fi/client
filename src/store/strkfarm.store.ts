import { BlockIdentifier, Contract } from "starknet";
import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import SenseiAbi from "@/abi/sensei.abi.json";
import EkuboSTRKFarmAbi from "@/abi/ekubo_strkfarm.abi.json";
import { isContractNotDeployed } from "@/lib/utils";
import MyNumber from "@/lib/MyNumber";
import { STRK_DECIMALS } from "@/constants";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

const XSTRK_SENSEI =
  "0x07023a5cadc8a5db80e4f0fde6b330cbd3c17bbbf9cb145cbabd7bd5e6fb7b0b";
const XSTRK_SENSEI_DEPLOYMENT_BLOCK = 1053807;

const EKUBO_XSTRK_STRK =
  "0x01f083b98674bc21effee29ef443a00c7b9a500fd92cf30341a3da12c73f2324";
const EKUBO_XSTRK_STRK_DEPLOYMENT_BLOCK = 1209881;

export const getXSTRKSenseiHoldings: DAppHoldingsFn = async (
  address: string,
  provider: any,
  blockNumber?: BlockIdentifier,
) => {
  if (isContractNotDeployed(blockNumber, XSTRK_SENSEI_DEPLOYMENT_BLOCK)) {
    return {
      xSTRKAmount: MyNumber.fromZero(),
      STRKAmount: MyNumber.fromZero(),
    };
  }

  const contract = new Contract(SenseiAbi, XSTRK_SENSEI, provider);
  const info: any = await contract.call("describe_position", [address], {
    blockIdentifier: blockNumber ?? "pending",
  });
  const holdings = info["1"];
  console.log(
    "getXSTRKSenseiHoldings::info",
    holdings.deposit2.toString(),
    holdings,
  );
  // const strkAmount = new MyNumber(holdings.estimated_size.toString(), STRK_DECIMALS);
  // const totalAssets = await getTotalAssetsByBlock();
  // const totalSupply = await getTotalSupplyByBlock();
  // const exchangeRate = Number(totalAssets.operate('multipliedBy', '1000000').operate('div', totalSupply.toString()).toString()) / 1000000;
  // const xSTRKAmount = strkAmount.operate('multipliedBy', exchangeRate.toString());
  return {
    xSTRKAmount: new MyNumber(holdings.deposit2.toString(), STRK_DECIMALS),
    STRKAmount: MyNumber.fromZero(),
  };
};

export const getEkuboXSTRKSTRKHoldings: DAppHoldingsFn = async (
  address: string,
  provider: any,
  blockNumber?: BlockIdentifier,
) => {
  if (isContractNotDeployed(blockNumber, EKUBO_XSTRK_STRK_DEPLOYMENT_BLOCK)) {
    return {
      xSTRKAmount: MyNumber.fromZero(),
      STRKAmount: MyNumber.fromZero(),
    };
  }

  const contract = new Contract(EkuboSTRKFarmAbi, EKUBO_XSTRK_STRK, provider);
  const bal: any = await contract.call("balanceOf", [address], {
    blockIdentifier: blockNumber ?? "pending",
  });
  const info: any = await contract.call("convert_to_assets", [bal.toString()], {
    blockIdentifier: blockNumber ?? "pending",
  });
  const xSTRKHolings = info.amount0;
  const STRKHolings = info.amount1;
  console.log("getEkuboXSTRKSTRKHoldings::info", xSTRKHolings, STRKHolings);
  // const strkAmount = new MyNumber(holdings.estimated_size.toString(), STRK_DECIMALS);
  // const totalAssets = await getTotalAssetsByBlock();
  // const totalSupply = await getTotalSupplyByBlock();
  // const exchangeRate = Number(totalAssets.operate('multipliedBy', '1000000').operate('div', totalSupply.toString()).toString()) / 1000000;
  // const xSTRKAmount = strkAmount.operate('multipliedBy', exchangeRate.toString());
  return {
    xSTRKAmount: new MyNumber(xSTRKHolings.toString(), STRK_DECIMALS),
    STRKAmount: new MyNumber(STRKHolings.toString(), STRK_DECIMALS),
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

      let xSTRKAmount = data?.xSTRKAmount ?? new MyNumber("0", STRK_DECIMALS);
      let STRKAmount = data?.STRKAmount ?? new MyNumber("0", STRK_DECIMALS);

      if (data2) {
        xSTRKAmount = xSTRKAmount.operate(
          "plus",
          data2?.xSTRKAmount ? data2.xSTRKAmount.toString() : "0",
        );
        STRKAmount = STRKAmount.operate(
          "plus",
          data2?.STRKAmount ? data2.STRKAmount.toString() : "0",
        );
      }

      console.log(
        "getSTRKFarmBalanceAtom",
        data?.STRKAmount.toString(),
        data?.xSTRKAmount.toString(),
        data2?.STRKAmount.toString(),
        data2?.xSTRKAmount.toString(),
      );
      console.log(
        "getSTRKFarmBalanceAtom2",
        xSTRKAmount.toString(),
        STRKAmount.toString(),
      );
      return {
        data: {
          xSTRKAmount,
          STRKAmount,
        },
        error: error || error2,
        isLoading: !data && !error,
      };
    });
  },
);
