import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { BlockIdentifier, Contract } from "starknet";

import erc4626Abi from "@/abi/erc4626.abi.json";
import nostraLpAbi from "@/abi/nostra.lp.abi.json";
import { getProvider, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";

import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import { isContractNotDeployed } from "@/lib/utils";

export const N_XSTRK_CONTRACT_ADDRESS =
  "0x06878fd475d5cea090934d690ecbe4ad78503124e4f80380a2e45eb417aafb9c";
export const N_XSTRK_C_CONTRACT_ADDRESS =
  "0x01b8d8e31f9dd1bde7dc878dd871225504837c78c40ff01cbf03a255e2154bf0";
export const i_XSTRK_CONTRACT_ADDRESS =
  "0x04d1125a716f547a0b69413c0098e811da3b799d173429c95da4290a00c139f7";
export const i_XSTRK_C_CONTRACT_ADDRESS =
  "0x0257afe480da9255a026127cd3a295a580ef316b297a69be22b89729ae8c1d2a";
export const D_XSTRK_CONTRACT_ADDRESS =
  "0x0424638c9060d08b4820aabbb28347fc7234e2b7aadab58ad0f101e2412ea42d";
export const LP_TOKEN_CONTRACT_ADDRESS =
  "0x00205fd8586f6be6c16f4aa65cc1034ecff96d96481878e55f629cd0cb83e05f";

const deploymentBlocksOfNostraContracts: { [contract: string]: number } = {
  "0x06878fd475d5cea090934d690ecbe4ad78503124e4f80380a2e45eb417aafb9c": 968482,
  "0x01b8d8e31f9dd1bde7dc878dd871225504837c78c40ff01cbf03a255e2154bf0": 968483,
  "0x04d1125a716f547a0b69413c0098e811da3b799d173429c95da4290a00c139f7": 968483,
  "0x0257afe480da9255a026127cd3a295a580ef316b297a69be22b89729ae8c1d2a": 968484,
  "0x0424638c9060d08b4820aabbb28347fc7234e2b7aadab58ad0f101e2412ea42d": 968481,
  "0x00205fd8586f6be6c16f4aa65cc1034ecff96d96481878e55f629cd0cb83e05f": 940755,
};

export async function getNostraHoldingsByToken(
  address: string,
  nostraToken: string,
  blockNumber?: BlockIdentifier,
) {
  const contract = new Contract({
    abi: erc4626Abi,
    address: nostraToken,
    providerOrAccount: getProvider(),
  });
  if (
    isContractNotDeployed(
      blockNumber,
      deploymentBlocksOfNostraContracts[nostraToken],
    )
  ) {
    return MyNumber.fromZero(STRK_DECIMALS);
  }

  const balance = await contract.call("balance_of", [address], {
    blockIdentifier: blockNumber ?? "latest",
  });
  return new MyNumber(balance.toString(), STRK_DECIMALS);
}

function getNostraHoldings(nostraToken: string): DAppHoldingsFn {
  return async ({
    address,
    blockNumber,
  }: {
    address: string;
    blockNumber?: BlockIdentifier;
  }) => {
    const lstAmount = await getNostraHoldingsByToken(
      address,
      nostraToken,
      blockNumber,
    );
    return {
      lstAmount,
      underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  };
}

const usernxSTRKBalanceQueryAtom = getHoldingAtom(
  "usernxSTRKBalance",
  getNostraHoldings(N_XSTRK_CONTRACT_ADDRESS),
);

const usernxSTRKcBalanceQueryAtom = getHoldingAtom(
  "usernxSTRKcBalance",
  getNostraHoldings(N_XSTRK_C_CONTRACT_ADDRESS),
);

const userixSTRKBalanceQueryAtom = getHoldingAtom(
  "userixSTRKBalance",
  getNostraHoldings(i_XSTRK_CONTRACT_ADDRESS),
);

const userixSTRKcBalanceQueryAtom = getHoldingAtom(
  "userixSTRKcBalance",
  getNostraHoldings(i_XSTRK_C_CONTRACT_ADDRESS),
);

const userdxSTRKBalanceQueryAtom = getHoldingAtom(
  "userdxSTRKBalance",
  getNostraHoldings(D_XSTRK_CONTRACT_ADDRESS),
);

export const getNostraDexHoldings: DAppHoldingsFn = async ({
  address,
  blockNumber,
}: {
  address: string;
  blockNumber?: BlockIdentifier;
}) => {
  const contract = new Contract({
    abi: nostraLpAbi,
    address: LP_TOKEN_CONTRACT_ADDRESS,
    providerOrAccount: getProvider(),
  });

  if (
    isContractNotDeployed(
      blockNumber,
      deploymentBlocksOfNostraContracts[LP_TOKEN_CONTRACT_ADDRESS],
    )
  ) {
    return {
      lstAmount: MyNumber.fromZero(STRK_DECIMALS),
      underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }

  const balance = await contract.call("balance_of", [address], {
    blockIdentifier: blockNumber ?? "latest",
  });

  const totalSupply = await contract.call("total_supply", [], {
    blockIdentifier: blockNumber ?? "latest",
  });

  const getReserves: any = await contract.call("get_reserves", [], {
    blockIdentifier: blockNumber ?? "latest",
  });

  const balanceStr = new MyNumber(
    balance.toString(),
    STRK_DECIMALS,
  ).toEtherStr();

  const totalSupplyStr = new MyNumber(
    totalSupply.toString(),
    STRK_DECIMALS,
  ).toEtherStr();

  const getReserves0Str = new MyNumber(
    getReserves[0].toString(),
    STRK_DECIMALS,
  ).toEtherStr();

  const getReserves1Str = new MyNumber(
    getReserves[1].toString(),
    STRK_DECIMALS,
  ).toEtherStr();

  const lstTokenBal =
    Number(totalSupplyStr) == 0
      ? 0
      : (Number(balanceStr) / Number(totalSupplyStr)) * Number(getReserves0Str);

  const underlyingTokenBal =
    Number(totalSupplyStr) == 0
      ? 0
      : (Number(balanceStr) / Number(totalSupplyStr)) * Number(getReserves1Str);

  return {
    lstAmount: MyNumber.fromEther(lstTokenBal.toFixed(8), STRK_DECIMALS),
    underlyingTokenAmount: MyNumber.fromEther(
      underlyingTokenBal.toFixed(8),
      STRK_DECIMALS,
    ),
  };
};

const userLPTokenBalanceQueryAtom = getHoldingAtom(
  "userLPTokenBalance",
  getNostraDexHoldings,
);

//
// Wrapper atoms on above query atoms
//

export const usernxSTRKBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(usernxSTRKBalanceQueryAtom(blockNumber));

    return {
      value:
        error || !data
          ? {
              lstAmount: MyNumber.fromZero(STRK_DECIMALS),
              underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
            }
          : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const usernxSTRKcBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(usernxSTRKcBalanceQueryAtom(blockNumber));

    return {
      value:
        error || !data
          ? {
              lstAmount: MyNumber.fromZero(STRK_DECIMALS),
              underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
            }
          : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userixSTRKBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userixSTRKBalanceQueryAtom(blockNumber));

    return {
      value:
        error || !data
          ? {
              lstAmount: MyNumber.fromZero(STRK_DECIMALS),
              underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
            }
          : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userixSTRKcBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userixSTRKcBalanceQueryAtom(blockNumber));

    return {
      value:
        error || !data
          ? {
              lstAmount: MyNumber.fromZero(STRK_DECIMALS),
              underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
            }
          : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userdxSTRKBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userdxSTRKBalanceQueryAtom(blockNumber));

    return {
      value:
        error || !data
          ? {
              lstAmount: MyNumber.fromZero(STRK_DECIMALS),
              underlyingTokenAmount: MyNumber.fromZero(STRK_DECIMALS),
            }
          : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userLPTokenBalance = atomFamily((blockNumber?: number) =>
  atom((get) => {
    const { data, error } = get(userLPTokenBalanceQueryAtom(blockNumber));

    return {
      value:
        error || !data
          ? {
              lstAmount: MyNumber.fromEther("0", STRK_DECIMALS),
              underlyingTokenAmount: MyNumber.fromEther("0", STRK_DECIMALS),
            }
          : data,
      error,
      isLoading: !data && !error,
    };
  }),
);

export const userLSTNostraBalance: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      let isLoading = false;
      let error: any = null;
      const data = {
        lstAmount: MyNumber.fromEther("0", STRK_DECIMALS),
        underlyingTokenAmount: MyNumber.fromEther("0", STRK_DECIMALS),
      };

      const atoms = [
        usernxSTRKBalance(blockNumber),
        usernxSTRKcBalance(blockNumber),
        userixSTRKBalance(blockNumber),
        userixSTRKcBalance(blockNumber),
        // userdxSTRKBalance(blockNumber),
        userLPTokenBalance(blockNumber),
      ];

      for (const atom of atoms) {
        const output = get(atom);
        if (output.isLoading) {
          isLoading = true;
        }
        if (output.error) {
          error = output.error;
        }
        if (output.value) {
          data.lstAmount = data.lstAmount.operate(
            "plus",
            output.value.lstAmount.toString(),
          );
          data.underlyingTokenAmount = data.underlyingTokenAmount.operate(
            "plus",
            output.value.underlyingTokenAmount.toString(),
          );
        }
      }
      return {
        data,
        error,
        isLoading,
      };
    }),
);
