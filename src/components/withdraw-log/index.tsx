import { useAccount } from "@starknet-react/core";
import { useAtomValue } from "jotai";
import { Loader } from "lucide-react";
import React from "react";

import MyNumber from "@/lib/MyNumber";
import { formatNumber, formatNumberWithCommas } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletConnection } from "@/hooks/use-wallet-connection";

import { STRK_DECIMALS, LST_CONFIG } from "@/constants";
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
import { tabsAtom } from "@/store/merry.store";
import { ContractAddr } from "@strkfarm/sdk";

const WithdrawLog: React.FC = () => {
  const [withdrawals, setWithdrawals] = React.useState<WithdrawLogColumn[]>([]);
  console.log("withdrawals", withdrawals);
  const [_globalStats, setGlobalStats] = React.useState({
    globalPendingAmountSTRK: "0",
    globalPendingRequests: "0",
    globalAmountAvailable: "0",
  });

  const withdrawalLogs = useAtomValue(withdrawLogsAtom);
  console.log("withdrawalLogs", withdrawalLogs);
  const globalPendingWithdrawStats = useAtomValue(
    globalPendingWithdrawStatsAtom,
  );
  const globalAmountAvailable = useAtomValue(globalAmountAvailableAtom);
  const activeTab = useAtomValue(tabsAtom);

  const { address } = useAccount();
  const { connectWallet } = useWalletConnection();

  const _yourPendingWithdrawalsAmount = React.useMemo(
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

    // Filter withdrawals based on current tab
    const filteredWithdrawals = withdrawalData.filter((item: any) => {
      const lstConfig = Object.values(LST_CONFIG).find((config) =>
        ContractAddr.from(config.WITHDRAWAL_QUEUE_ADDRESS).eqString(
          item.queue_contract,
        ),
      );

      const symbol = lstConfig?.SYMBOL;

      if (activeTab === "strk") {
        return symbol === "STRK";
      } else if (activeTab === "btc") {
        return symbol?.toLowerCase().includes("btc");
      }
      return true;
    });

    // Sort withdrawals by timestamp (newest first)
    const sortedWithdrawals = filteredWithdrawals.sort(
      (a: any, b: any) => b.timestamp - a.timestamp,
    );

    const maxRequestID = sortedWithdrawals?.reduce(
      (acc: number, item: any) =>
        item.is_claimed ? Math.max(acc, Number(item.request_id)) : acc,
      0,
    );

    console.log(maxRequestID, "max");

    const formattedWithdrawals: WithdrawLogColumn[] = sortedWithdrawals.map(
      (item: any) => {
        const negativeDiff = Number(item.request_id) - maxRequestID;

        const rank = negativeDiff <= 0 ? 1 : negativeDiff;

        const lstConfig = Object.values(LST_CONFIG).find((config) =>
          ContractAddr.from(config.WITHDRAWAL_QUEUE_ADDRESS).eqString(
            item.queue_contract,
          ),
        );

        if (!lstConfig) return;

        const assetSymbol = lstConfig.SYMBOL;
        const isBtcAsset = assetSymbol.toLowerCase().includes("btc");
        const decimalPlaces = isBtcAsset ? 8 : 2;

        return {
          queuePosition: item.request_id,
          amount: new MyNumber(
            item.amount,
            lstConfig.DECIMALS,
          ).toEtherToFixedDecimals(decimalPlaces),
          status: (item.is_claimed ? "Success" : "Pending") as Status,
          claimTime: item.claim_time,
          txHash: item.tx_hash,
          rank,
          asset: assetSymbol,
        };
      },
    );

    setWithdrawals(formattedWithdrawals);
  }, [
    address,
    activeTab,
    globalAmountAvailable.value,
    globalPendingWithdrawStats?.value,
    withdrawalLogs.value,
  ]);

  if (!address) {
    return (
      <div className="relative h-full w-full">
        <Card className="mx-auto w-full max-w-md border-0 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center space-y-4 p-6 text-center sm:p-8">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground sm:text-lg">
                Connect Your Wallet
              </h3>
              <p className="px-2 text-xs text-muted-foreground sm:text-sm">
                Please connect your wallet to view your withdrawal transaction
                history and logs.
              </p>
            </div>
            <Button
              onClick={() => connectWallet()}
              className="w-full rounded-md bg-[#17876D] px-6 py-2 font-medium text-white transition-colors hover:bg-[#17876D] sm:w-auto"
            >
              Connect wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (withdrawalLogs.isLoading)
    return (
      <div className="relative h-full w-full">
        <Card className="mx-auto w-full max-w-md border-0 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center space-y-4 p-6 text-center sm:p-8">
            <div className="flex items-center gap-2">
              <Loader className="size-5 animate-spin" />
              <span className="text-xs text-muted-foreground sm:text-sm">
                Loading your withdrawals...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="relative h-full w-full">
      {/* <div className="my-3 flex w-full grid-cols-3 flex-wrap items-center justify-center gap-5 px-5 lg:grid">
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
      </div> */}

      <WithdrawDataTable columns={withdrawLogColumn} data={withdrawals} />
    </div>
  );
};

export default WithdrawLog;
