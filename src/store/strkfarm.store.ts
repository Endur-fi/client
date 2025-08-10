import { BlockIdentifier, Contract } from "starknet";
import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import SenseiAbi from "@/abi/sensei.abi.json";
import EkuboSTRKFarmAbi from "@/abi/ekubo_strkfarm.abi.json";
import { isContractNotDeployed } from "@/lib/utils";
import MyNumber from "@/lib/MyNumber";
import { STRK_DECIMALS } from "@/constants";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import { holdingsService } from "@/services/holdings.service";
import { providerAtom, userAddressAtom } from "./common.store";

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
      xSTRKAmount: MyNumber.fromZero(STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }
  try {
    const contract = new Contract(SenseiAbi, XSTRK_SENSEI, provider);
    const info: any = await contract.call("describe_position", [address], {
      blockIdentifier: blockNumber ?? "pending",
    });
    const holdings = info["1"];
    // const strkAmount = new MyNumber(holdings.estimated_size.toString(), STRK_DECIMALS);
    // const totalAssets = await getTotalAssetsByBlock();
    // const totalSupply = await getTotalSupplyByBlock();
    // const exchangeRate = Number(totalAssets.operate('multipliedBy', '1000000').operate('div', totalSupply.toString()).toString()) / 1000000;
    // const xSTRKAmount = strkAmount.operate('multipliedBy', exchangeRate.toString());
    return {
      xSTRKAmount: new MyNumber(holdings.deposit2.toString(), STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  } catch (error) {
    return {
      xSTRKAmount: MyNumber.fromZero(STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }
};

export const getEkuboXSTRKSTRKHoldings: DAppHoldingsFn = async (
  address: string,
  provider: any,
  blockNumber?: BlockIdentifier,
) => {
  if (isContractNotDeployed(blockNumber, EKUBO_XSTRK_STRK_DEPLOYMENT_BLOCK)) {
    return {
      xSTRKAmount: MyNumber.fromZero(STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
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
    const queryAtom = atomWithQuery((get) => {
      return {
        queryKey: [
          "strkfarmHoldings",
          blockNumber,
          get(userAddressAtom),
          get(providerAtom),
        ],
        queryFn: async ({ queryKey }: any) => {
          const [, , userAddress] = queryKey;
          const provider = get(providerAtom);
          
          if (!provider || !userAddress) {
            return {
              xSTRKAmount: MyNumber.fromZero(),
              STRKAmount: MyNumber.fromZero(),
            };
          }

          try {
            holdingsService.setProvider(provider);
            const holdings = await holdingsService.getProtocolHoldings(userAddress, 'strkfarm', blockNumber as any);
            return {
              xSTRKAmount: holdings.xSTRKAmount,
              STRKAmount: holdings.STRKAmount,
            };
          } catch (error) {
            console.error('Error fetching STRKFarm holdings via SDK:', error);
            return {
              xSTRKAmount: MyNumber.fromZero(),
              STRKAmount: MyNumber.fromZero(),
            };
          }
        },
      };
    });

    return atom((get) => {
      const { data, error, isLoading } = get(queryAtom);
      return {
        data: data || {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
        error,
        isLoading,
      };
    });
  },
);
