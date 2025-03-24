import { useAccount } from "@starknet-react/core";
import { useAtomValue } from "jotai";
import { Loader } from "lucide-react";
import React from "react";

import MyNumber from "@/lib/MyNumber";
import { formatNumber, formatNumberWithCommas } from "@/lib/utils";

import { STRK_DECIMALS } from "@/constants";
import {
  globalAmountAvailableAtom,
  globalPendingWithdrawStatsAtom,
  withdrawLogsAtom,
} from "@/store/withdraw.store";
import {
  type Status,
  withdrawLogColumn,
  type WithdrawLogColumn,
} from "./table/columns";
import { WithdrawDataTable } from "./table/data-table";

const getUniqueWithdrawals = (data: any[]) => {
  return Object.values(
    data.reduce((acc: Record<string, any>, item: any) => {
      if (
        !acc[item.request_id] ||
        acc[item.request_id].claim_time < item.claim_time ||
        (acc[item.request_id].claim_time === item.claim_time && item.is_claimed)
      ) {
        acc[item.request_id] = item;
      }
      return acc;
    }, {}),
  ).sort((a: any, b: any) => b.timestamp - a.timestamp);
};

const WithdrawLog: React.FC = () => {
  const [withdrawals, setWithdrawals] = React.useState<WithdrawLogColumn[]>([]);
  const [globalStats, setGlobalStats] = React.useState({
    globalPendingAmountSTRK: "0",
    globalPendingRequests: "0",
    globalAmountAvailable: "0",
  });

  const withdrawalLogs = useAtomValue(withdrawLogsAtom);
  const globalPendingWithdrawStats = useAtomValue(
    globalPendingWithdrawStatsAtom,
  );
  const globalAmountAvailable = useAtomValue(globalAmountAvailableAtom);
  const { address } = useAccount();

  const yourPendingWithdrawalsAmount = React.useMemo(
    () =>
      withdrawals.reduce(
        (acc, item) =>
          item.status === "Pending" ? acc + Number(item.amount) : acc,
        0,
      ),
    [withdrawals],
  );

  React.useEffect(() => {
    if (!address || !withdrawalLogs?.value) return;

    const withdrawalData = withdrawalLogs.value;
    const globalPendingWithdrawStatsData = globalPendingWithdrawStats?.value;

    console.log(globalAmountAvailable.value, "globalAmountAvailable");

    setGlobalStats({
      globalPendingAmountSTRK: formatNumber(
        new MyNumber(
          globalPendingWithdrawStatsData?.getPendingWithdrawStats
            ?.totalAmountStrk || 0,
          STRK_DECIMALS,
        ).toEtherStr(),
      ),
      globalPendingRequests: formatNumberWithCommas(
        globalPendingWithdrawStatsData?.getPendingWithdrawStats?.pendingCount,
      ),
      globalAmountAvailable: formatNumber(
        globalAmountAvailable?.value as string,
      ),
    });

    const uniqueWithdrawals = getUniqueWithdrawals(withdrawalData);

    const formattedWithdrawals: WithdrawLogColumn[] = uniqueWithdrawals.map(
      (item: any) => ({
        queuePosition: item.request_id,
        amount: new MyNumber(item.amount_strk, 18).toEtherToFixedDecimals(2),
        status: (item.is_claimed ? "Success" : "Pending") as Status,
        claimTime: item.claim_time,
        txHash: item.tx_hash,
      }),
    );

    setWithdrawals(formattedWithdrawals);
  }, [
    address,
    globalAmountAvailable.value,
    globalPendingWithdrawStats?.value,
    withdrawalLogs.value,
  ]);

  if (withdrawalLogs.isLoading)
    return (
      <div className="-mt-5 flex h-full items-center justify-center gap-2">
        Loading your withdrawals <Loader className="size-5 animate-spin" />
      </div>
    );

  return (
    <div className="h-full w-full">
      <div className="my-3 flex w-full grid-cols-3 flex-wrap items-center justify-center gap-5 px-5 lg:grid">
        <div className="h-full rounded-[12px] border border-[#AACBC4]/30 bg-[#E3EFEC]/30 p-2 px-3 lg:col-span-1 lg:w-full">
          <p className="text-[10px] font-medium text-[#03624C]">
            Global Pending withdrawals
          </p>
          <p className="text-base font-medium text-[#021B1A]">
            {globalStats.globalPendingAmountSTRK} STRK
          </p>
          <p className="mt-4 text-[10px] font-medium text-[#021B1A]">
            Your pending - {yourPendingWithdrawalsAmount} STRK
          </p>
        </div>

        <div className="h-full rounded-[12px] border border-[#AACBC4]/30 bg-[#E3EFEC]/30 p-2 px-3 lg:col-span-1 lg:w-full">
          <p className="text-[10px] font-medium text-[#03624C]">
            Global Pending requests
          </p>
          <p className="text-base font-medium text-[#021B1A]">
            {globalStats.globalPendingRequests}
          </p>
          <p className="mt-4 text-[10px] font-medium text-[#021B1A]">
            Your pending -{" "}
            {withdrawals.filter((item) => item.status === "Pending").length}
          </p>
        </div>

        <div className="h-full rounded-[12px] border border-[#AACBC4]/30 bg-[#E3EFEC]/30 p-2 px-3 lg:col-span-1 lg:w-full">
          <p className="text-[10px] font-medium text-[#03624C]">
            Global Amount available
          </p>
          <p className="text-base font-medium text-[#021B1A]">
            {globalStats.globalAmountAvailable} STRK
          </p>
        </div>
      </div>

      <WithdrawDataTable columns={withdrawLogColumn} data={withdrawals} />
    </div>
  );
};

export default WithdrawLog;
