import { BlockIdentifier, Contract, RpcProvider } from "starknet";
import { DAppHoldingsAtom, DAppHoldingsFn, getHoldingAtom } from "./defi.store";
import OpusAbi from "@/abi/opus.abi.json";
import { isContractNotDeployed } from "@/lib/utils";
import { STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { XSTRK_ADDRESS } from "./ekubo.store";
import { atomFamily } from "jotai/utils";
import { atom } from "jotai";

const OPUS_CONTRACT =
  "0x04d0bb0a4c40012384e7c419e6eb3c637b28e8363fb66958b60d90505b9c072f";
const OPUS_CONTRACT_DEPLOYMENT_BLOCK = 973643;

export const getOpusHoldings: DAppHoldingsFn = async (
  address: string,
  provider: RpcProvider,
  blockNumber?: BlockIdentifier,
) => {
  const isDeployed = !isContractNotDeployed(
    blockNumber,
    OPUS_CONTRACT_DEPLOYMENT_BLOCK,
  );
  if (!isDeployed) {
    return {
      xSTRKAmount: MyNumber.fromZero(STRK_DECIMALS),
      STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
    };
  }

  const contract = new Contract(OpusAbi, OPUS_CONTRACT, provider);
  const userTroves: any = await contract.call("get_user_trove_ids", [address], {
    blockIdentifier: blockNumber,
  });

  const proms = userTroves.map((troveId: string) => {
    return contract.call("get_trove_asset_balance", [troveId, XSTRK_ADDRESS], {
      blockIdentifier: blockNumber,
    });
  });
  const balances: bigint[] = await Promise.all(proms);
  const xSTRKAmount = balances.reduce(
    (acc: MyNumber, cur: bigint) => acc.operate("plus", cur.toString()),
    MyNumber.fromZero(STRK_DECIMALS),
  );
  return {
    xSTRKAmount,
    STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
  };
};

export const userOpusBalanceQueryAtom = getHoldingAtom(
  "userOpusBalance",
  getOpusHoldings,
);

export const userOpusBalanceAtom: DAppHoldingsAtom = atomFamily(
  (blockNumber?: number) =>
    atom((get) => {
      const { data, error } = get(userOpusBalanceQueryAtom(blockNumber));

      const xSTRKAmount1 =
        data?.xSTRKAmount ?? new MyNumber("0", STRK_DECIMALS);

      return {
        data: {
          xSTRKAmount: xSTRKAmount1,
          STRKAmount: MyNumber.fromZero(STRK_DECIMALS),
        },
        error,
        isLoading: !data && !error,
      };
    }),
);
