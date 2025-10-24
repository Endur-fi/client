import { gql } from "@apollo/client";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { Contract } from "starknet";

import WqAbi from "@/abi/wq.abi.json";
import { getProvider, STRK_DECIMALS } from "@/constants";
import apolloClient from "@/lib/apollo-client";
import MyNumber from "@/lib/MyNumber";

import { lstConfigAtom, userAddressAtom } from "./common.store";

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
                tx_hash
                queue_contract
                amount
                amount_lst
                request_id
                is_claimed
                claim_time
                receiver
                caller
                cumulative_requested_amount_snapshot
                is_rejected
                is_notified
                timestamp
              }
            }
          `,
          variables: {
            where: {
              receiver: {
                equals: address,
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

const globalPendingWithdrawStatsAtomWithQuery = atomWithQuery((_get) => {
  return {
    queryKey: ["global-withdraw-pending-stats"],
    queryFn: async ({ _queryKey }: any) => {
      try {
        const { data } = await apolloClient.query({
          query: gql`
            query FindFirstWithdraw_queue {
              getPendingWithdrawStats {
                pendingCount
                totalAmountStrk
              }
            }
          `,
        });

        return data;
      } catch (error) {
        console.error("GraphQL Error:", error);
        throw error;
      }
    },
    refetchInterval: 30000,
  };
});

const globalAmountAvailableAtomWithQuery = atomWithQuery((get) => {
  return {
    queryKey: ["global-amount-available"],
    queryFn: async ({ _queryKey }: any) => {
      try {
        const provider = getProvider();
        const lstConfig = get(lstConfigAtom)!;

        const withdrawContract = new Contract({
          abi: WqAbi,
          address: lstConfig.WITHDRAWAL_QUEUE_ADDRESS,
          providerOrAccount: provider,
        });

        const res: any = await withdrawContract.call("get_queue_state"); //DOUBT: what is the use of this data?

        const cumulativeRequestedAmount = new MyNumber(
          res?.cumulative_requested_amount?.toString(),
          STRK_DECIMALS,
        );

        const intransitAmount = new MyNumber(
          res?.intransit_amount?.toString(),
          STRK_DECIMALS,
        );

        const globalAmountAvailable = cumulativeRequestedAmount.operate(
          "plus",
          intransitAmount.toEtherStr(),
        );

        return globalAmountAvailable.toEtherToFixedDecimals(2);
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
  console.log("withdrawlogs", data);

  return {
    value: error || !data ? [] : data,
    error,
    isLoading: !data && !error,
  };
});

export const globalPendingWithdrawStatsAtom = atom((get) => {
  const { data, error } = get(globalPendingWithdrawStatsAtomWithQuery);

  return {
    value: error || !data ? [] : data,
    error,
    isLoading: !data && !error,
  };
});

export const globalAmountAvailableAtom = atom((get) => {
  const { data, error } = get(globalAmountAvailableAtomWithQuery);

  return {
    value: error || !data ? [] : data,
    error,
    isLoading: !data && !error,
  };
});
