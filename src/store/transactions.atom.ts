import { gql } from "@apollo/client";
import { Getter, Setter, atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { TransactionExecutionStatus } from "starknet";

import apolloClient from "@/lib/apollo-client";
import MyNumber from "@/lib/MyNumber";
import { capitalize, standariseAddress } from "@/lib/utils";

import { getProvider } from "@/constants";
import { createAtomWithStorage, userAddressAtom } from "./common.store";

export interface StrategyTxProps {
  strategyId: string;
  actionType: "deposit" | "withdraw";
  amount: MyNumber;
  tokenAddr: string;
}
export interface TransactionInfo {
  txHash: string;
  info: StrategyTxProps;
  status: "pending" | "success" | "failed";
  createdAt: Date;
}

export interface TxHistory {
  findManyInvestment_flows: {
    amount: string;
    timestamp: number;
    type: string;
    txHash: string;
    asset: string;
    __typename: "Investment_flows";
  }[];
}

const withdrawLogsAtomWithQuery = atomWithQuery((get) => {
  return {
    queryKey: ["withdraw-logs"],
    queryFn: async ({ _queryKey }: any) => {
      const address: string | undefined = get(userAddressAtom);

      if (!address) return null;

      try {
        const { data } = await apolloClient.query({
          query: gql`
            query Withdraw_queues($where: Withdraw_queueWhereInput) {
              withdraw_queues(where: $where) {
                amount_strk
                request_id
                receiver
                is_claimed
                claim_time
                timestamp
                tx_hash
              }
            }
          `,
          variables: {
            where: {
              receiver: {
                equals: standariseAddress(address),
              },
            },
          },
        });

        return data?.withdraw_queues;
      } catch (error) {
        console.error("GraphQL Error:", error);
        throw error;
      }
    },
    refetchInterval: 30000,
  };
});

export const withdrawLogsAtom = atom((get) => {
  const { data, error } = get(withdrawLogsAtomWithQuery);

  return {
    value: error || !data ? [] : data,
    error,
    isLoading: !data && !error,
  };
});

export const newTxsAtom = atom<TransactionInfo[]>([]);

// in local storage, objects like Date, MyNumber are stored as strings
// this function deserialises them back to their original types
// declare let localStorage: any;
async function deserialiseTxInfo(key: string, initialValue: TransactionInfo[]) {
  let storedValue;

  if (typeof window !== "undefined") {
    storedValue = localStorage.getItem(key);
  }

  const txs: TransactionInfo[] = storedValue
    ? JSON.parse(storedValue)
    : initialValue;

  txs.forEach((tx) => {
    if (tx.info.amount) {
      tx.info.amount = new MyNumber(
        tx.info.amount.bigNumber.toString(),
        tx.info.amount.decimals,
      );
    }
    tx.createdAt = new Date(tx.createdAt);
  });
  return txs;
}

// Atom to store tx history in local storage
export const transactionsAtom = createAtomWithStorage<TransactionInfo[]>(
  "transactions",
  [],
  deserialiseTxInfo,
);

// call this func to add a new tx to the tx history
// initiates a toast notification
export const monitorNewTxAtom = atom(
  null,
  async (get, set, tx: TransactionInfo) => {
    console.log("monitorNewTxAtom", tx);
    await initToast(tx, get, set);
  },
);

async function waitForTransaction(
  tx: TransactionInfo,
  get: Getter,
  set: Setter,
) {
  console.log("waitForTransaction", tx);
  await isTxAccepted(tx.txHash);
  console.log("waitForTransaction done", tx);
  const txs = await get(transactionsAtom);
  tx.status = "success";
  txs.push(tx);
  set(transactionsAtom, txs);

  let newTxs = get(newTxsAtom);
  const txExists = newTxs.find(
    (t) => t.txHash.toLowerCase() === tx.txHash.toLowerCase(),
  );
  if (!txExists) {
    newTxs = [...newTxs, tx];
    set(newTxsAtom, newTxs);
  }
}

export async function isTxAccepted(txHash: string) {
  const provider = getProvider();

  let keepChecking = true;
  const maxRetries = 30;
  let retry = 0;

  while (keepChecking) {
    let txInfo: any;

    try {
      txInfo = await provider.getTransactionStatus(txHash);
    } catch (error) {
      console.error("isTxAccepted error", error);
      retry++;
      return true;
      if (retry > maxRetries) {
        throw new Error("Transaction status unknown");
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    console.debug("isTxAccepted", txInfo);
    if (!txInfo.finality_status || txInfo.finality_status === "RECEIVED") {
      // do nothing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
    if (txInfo.finality_status === "ACCEPTED_ON_L2") {
      if (txInfo.execution_status === TransactionExecutionStatus.SUCCEEDED) {
        keepChecking = false;
        return true;
      }
      throw new Error("Transaction reverted");
    } else if (txInfo.finality_status === "REJECTED") {
      throw new Error("Transaction rejected");
    } else {
      throw new Error("Transaction status unknown");
    }
  }
}

async function initToast(tx: TransactionInfo, get: Getter, set: Setter) {
  const msg = `${capitalize(tx.info.actionType)} ${tx.info.amount.toEtherToFixedDecimals(4)}`;

  // await toast.promise(
  //   waitForTransaction(tx, get, set),
  //   {
  //     loading: msg,
  //     error: msg,
  //     success: msg,
  //   },
  //   {
  //     position: "bottom-right",
  //     style: {
  //       background: "rgb(127 73 229)",
  //       color: "#fff",
  //       fontFamily: "sans-serif",
  //       fontSize: "14px",
  //     },
  //   },
  // );

  // return toast({
  //   description: (
  //     <div className="flex items-center gap-2">
  //       <Info className="size-5" />
  //       Please connect your wallet
  //     </div>
  //   ),
  // });
}
