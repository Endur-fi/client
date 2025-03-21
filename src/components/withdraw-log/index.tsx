import { useAccount } from "@starknet-react/core";
import { useAtomValue } from "jotai";
import React from "react";

import MyNumber from "@/lib/MyNumber";
import { withdrawLogsAtom } from "@/store/transactions.atom";

import { Loader } from "lucide-react";
import {
  type Status,
  withdrawLogColumn,
  type WithdrawLogColumn,
} from "./table/columns";
import { WithdrawDataTable } from "./table/data-table";

const WithdrawLog: React.FC = () => {
  const [withdrawals, setWithdrawals] = React.useState<WithdrawLogColumn[]>();

  const withdrawalLogs = useAtomValue(withdrawLogsAtom);

  const { address } = useAccount();

  React.useEffect(() => {
    (async () => {
      if (!address) return;

      const withdrawalData = withdrawalLogs?.value;

      // Filter to keep the record with the latest claim_time for each request_id
      const uniqueWithdrawals = Object.values(
        withdrawalData.reduce((acc: any, item: any) => {
          if (
            !acc[item.request_id] ||
            // use item with latest claim time
            acc[item.request_id].claim_time < item.claim_time ||
            // if claims same, and if it's claimed, use it
            (acc[item.request_id].claim_time === item.claim_time &&
              item.is_claimed)
          ) {
            acc[item.request_id] = item;
          }
          return acc;
        }, {}),
      )
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .reverse();

      const formattedWithdrawals: WithdrawLogColumn[] = uniqueWithdrawals.map(
        (item: any) => ({
          queuePosition: item?.request_id,
          amount: new MyNumber(item?.amount_strk, 18).toEtherToFixedDecimals(2),
          status: (item?.is_claimed ? "Success" : "Pending") as Status,
          claimTime: item?.claim_time,
          txHash: item?.tx_hash,
        }),
      );

      setWithdrawals(formattedWithdrawals);
    })();
  }, [address, withdrawalLogs?.value]);

  if (withdrawalLogs.isLoading)
    return (
      <div className="-mt-5 flex h-full items-center justify-center gap-2">
        Loading your withdraw logs <Loader className="size-5 animate-spin" />
      </div>
    );

  return (
    <div className="h-full w-full">
      <div className="my-3 flex w-full grid-cols-3 flex-wrap items-center justify-center gap-5 px-5 lg:grid">
        <div className="h-full rounded-[12px] border border-[#AACBC4]/30 bg-[#E3EFEC]/30 p-2 px-3 lg:col-span-1 lg:w-full">
          <p className="text-[10px] font-medium text-[#03624C]">
            Global Pending withdrawals
          </p>
          <p className="text-base font-medium text-[#021B1A]">500K STRK</p>
          <p className="mt-4 text-[10px] font-medium text-[#021B1A]">
            Your pending - 300 STRK
          </p>
        </div>

        <div className="h-full rounded-[12px] border border-[#AACBC4]/30 bg-[#E3EFEC]/30 p-2 px-3 lg:col-span-1 lg:w-full">
          <p className="text-[10px] font-medium text-[#03624C]">
            Global Pending requests
          </p>
          <p className="text-base font-medium text-[#021B1A]">50,000</p>
          <p className="mt-4 text-[10px] font-medium text-[#021B1A]">
            Your pending -{" "}
            {withdrawals?.filter((item) => item.status === "Pending")?.length}
          </p>
        </div>

        <div className="h-full rounded-[12px] border border-[#AACBC4]/30 bg-[#E3EFEC]/30 p-2 px-3 lg:col-span-1 lg:w-full">
          <p className="text-[10px] font-medium text-[#03624C]">
            Global Amount available
          </p>
          <p className="text-base font-medium text-[#021B1A]">500 STRK</p>
        </div>
      </div>

      <WithdrawDataTable columns={withdrawLogColumn} data={withdrawals ?? []} />

      {/* <Table className="h-full">
          <TableHeader>
            <TableRow className="border-none bg-gradient-to-t from-[#18a79b40] to-[#38EF7D00] hover:bg-gradient-to-t">
              <TableHead className="pl-3 font-normal text-black sm:w-[100px]">
                Log ID
              </TableHead>
              <TableHead className="min-w-[120px] shrink-0 px-0 text-center font-normal text-black sm:!pl-10">
                Amount in STRK
              </TableHead>
              <TableHead className="pr-3 text-right font-normal text-black">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="h-full">
            {!address && (
              <TableRow>
                <TableCell></TableCell>
                <TableCell className="flex items-center justify-center py-5 pl-5 text-muted-foreground">
                  Please connect your wallet
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}

            {withdrawalLogs.isLoading && (
              <TableRow>
                <TableCell></TableCell>
                <TableCell className="flex items-center justify-center py-5 pl-14 text-muted-foreground">
                  <LoaderCircle className="size-5 animate-spin" />
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}

            {withdrawals &&
              address &&
              withdrawals?.map((item: any, i: number) => (
                <TableRow
                  key={i}
                  className={cn(
                    "rounded-2xl border-0 bg-white hover:bg-white",
                    {
                      "bg-[#E3EFEC80] hover:bg-[#E3EFEC80]": i % 2 === 0,
                    },
                  )}
                >
                  <TableCell className="pl-4 font-thin text-[#939494]">
                    {item?.request_id}
                  </TableCell>

                  <TableCell className="text-center font-thin text-[#939494] sm:pl-12">
                    {new MyNumber(item?.amount_strk, 18).toEtherToFixedDecimals(
                      2,
                    )}
                  </TableCell>

                  {item?.is_claimed ? (
                    <TableCell className="flex justify-end pr-4 text-right font-thin text-[#17876D]">
                      <Link
                        target="_blank"
                        href={`${getExplorerEndpoint()}/tx/${item?.tx_hash}`}
                        className="group flex w-fit items-center justify-end gap-1 transition-all"
                      >
                        <span className="group-hover:underline">Success</span>
                        <Icons.externalLink className="group-hover:opacity-80" />
                      </Link>
                    </TableCell>
                  ) : (
                    <TableCell className="flex flex-col items-end pr-4 text-right font-thin">
                      Pending
                      <span className="text-sm text-[#939494]">
                        {convertFutureTimestamp(item?.claim_time)}
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {withdrawals &&
              address &&
              !withdrawals.length &&
              !withdrawalLogs.isLoading && (
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell className="flex items-center justify-center py-5 pl-5 text-muted-foreground">
                    No withdrawals
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table> */}
    </div>
  );
};

export default WithdrawLog;
