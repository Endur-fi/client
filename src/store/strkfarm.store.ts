import { BlockIdentifier, Contract } from "starknet";
import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import SenseiAbi from "@/abi/sensei.abi.json";
import { isContractNotDeployed } from "@/lib/utils";
import MyNumber from "@/lib/MyNumber";
import { STRK_DECIMALS } from "@/constants";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

const XSTRK_SENSEI =
  "0x07023a5cadc8a5db80e4f0fde6b330cbd3c17bbbf9cb145cbabd7bd5e6fb7b0b";
const XSTRK_SENSEI_DEPLOYMENT_BLOCK = 1053807;

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

export const userXSTRKSenseiBalanceQueryAtom = getHoldingAtom(
  "xstrkSenseiBalance",
  getXSTRKSenseiHoldings,
);

export const getXSTRKSenseiBalanceAtom: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) => {
    return atom((get) => {
      const { data, error } = get(userXSTRKSenseiBalanceQueryAtom(blockNumber));

      const xSTRKAmount = data?.xSTRKAmount ?? new MyNumber("0", STRK_DECIMALS);
      const STRKAmount = data?.STRKAmount ?? new MyNumber("0", STRK_DECIMALS);

      return {
        data: {
          xSTRKAmount,
          STRKAmount,
        },
        error,
        isLoading: !data && !error,
      };
    });
  },
);
