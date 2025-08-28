"use client";

import erc4626Abi from "@/abi/erc4626.abi.json";
import nostraIXSTRK from "@/abi/ixstrk.abi.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LST_ADDRRESS, NOSTRA_IXSTRK, STRK_TOKEN } from "@/constants";
import { toast, useToast } from "@/hooks/use-toast";
import { cn, formatNumberWithCommas } from "@/lib/utils";
import { providerAtom, lstAddressAtom } from "@/store/common.store";
import {
  exchangeRateAtom,
  nstStrkWithdrawalFeeAtom,
  userNstSTRKBalanceAtom,
} from "@/store/lst.store";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import { Figtree, Inter } from "next/font/google";
import Link from "next/link";
import { Contract, uint256 } from "starknet";

import { MyAnalytics } from "@/lib/analytics";
import MyNumber from "@/lib/MyNumber";
import LSTService from "@/services/lst";
import { nostraLendYieldAtom } from "@/store/defi.store";
import { snAPYAtom } from "@/store/staking.store";
import { isTxAccepted } from "@/store/transactions.atom";
import React, { useEffect, useMemo } from "react";
import { Icons } from "./Icons";

const font = Figtree({ subsets: ["latin-ext"] });
const fontInter = Inter({ subsets: ["latin-ext"] });

const MigrateNostra = () => {
  const { address } = useAccount();
  const { sendAsync, data, isPending, error } = useSendTransaction({});
  const [isMigrationDone, setIsMigrationDone] = React.useState(false);

  const rpcProvider = useAtomValue(providerAtom);
  const lstAddress = useAtomValue(lstAddressAtom);
  const nstStrkBalanceRes = useAtomValue(userNstSTRKBalanceAtom);
  const nstStrkWithdrawal = useAtomValue(nstStrkWithdrawalFeeAtom);
  const exchangeRate = useAtomValue(exchangeRateAtom);
  const stakingApy = useAtomValue(snAPYAtom);
  const nostraLendApy = useAtomValue(nostraLendYieldAtom);

  const lstService = new LSTService();

  const nstStrkWithdrawalFee = parseFloat(
    nstStrkWithdrawal.value.toEtherToFixedDecimals(4),
  );

  const nstStrkBalance = useMemo(() => {
    if (Number(nstStrkBalanceRes.value.toEtherStr()) < 0.01) {
      return MyNumber.fromZero();
    }
    return nstStrkBalanceRes.value;
    // return MyNumber.fromEther("0.1", 18); // for testing
  }, [nstStrkBalanceRes]);

  const youWillStakeFull = nstStrkBalance.operate(
    "multipliedBy",
    1 - nstStrkWithdrawalFee,
  );

  const youWillStake = youWillStakeFull.toEtherToFixedDecimals(4);

  const xSTRKAmount = useMemo(() => {
    if (exchangeRate.rate === 0 || nstStrkBalance.isZero())
      return MyNumber.fromZero();
    const amount = youWillStakeFull
      .operate("multipliedBy", MyNumber.fromEther("1", 18).toString())
      .operate("div", exchangeRate.preciseRate.toString());
    return amount.subtract(MyNumber.fromEther("0.001", 18));
  }, [youWillStake, exchangeRate]);

  useEffect(() => {
    console.log(
      "exchangeRateAtom",
      xSTRKAmount.toString(),
      exchangeRate.rate,
      exchangeRate.preciseRate.toString(),
    );
  }, [xSTRKAmount]);

  useEffect(() => {
    if (!nstStrkBalance.isZero()) {
      // track the user has nstStrk
      MyAnalytics.track("Has Nostra STRK", {
        address,
        nstStrkBalance: nstStrkBalance.toEtherStr(),
      });
    }
  });

  const handleMigrateToEndur = async () => {
    if (!address) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Please connect your wallet
          </div>
        ),
      });
    }

    if (!rpcProvider || !lstAddress) return;

    const lstContract = lstService.getLSTContract(lstAddress);
    const nstContract = lstService.getNstSTRKContract();
    const strkContract = new Contract(erc4626Abi, STRK_TOKEN);
    const xSTRKContract = new Contract(erc4626Abi, LST_ADDRRESS);
    const ixSTRKContract = new Contract(nostraIXSTRK, NOSTRA_IXSTRK);

    const call1 = nstContract.populate("redeem", [
      uint256.bnToUint256(nstStrkBalance.toString()),
      address,
      address,
    ]);

    const call2 = strkContract.populate("approve", [
      lstContract.address,
      uint256.bnToUint256(youWillStakeFull.toString()),
    ]);

    const call3 = lstContract.populate("mint", [
      uint256.bnToUint256(xSTRKAmount.toString()),
      address,
    ]);

    const call4 = xSTRKContract.populate("approve", [
      NOSTRA_IXSTRK,
      uint256.bnToUint256(xSTRKAmount.toString()),
    ]);

    const call5 = ixSTRKContract.populate("mint", [
      address,
      uint256.bnToUint256(xSTRKAmount.toString()),
    ]);

    MyAnalytics.track("Init Nostra migrate", {
      address,
      nstStrkBalance: nstStrkBalance.toEtherStr(),
      youWillStake: youWillStakeFull.toEtherStr(),
      xSTRKAmount: xSTRKAmount.toEtherStr(),
    });
    await sendAsync([call1, call2, call3, call4, call5]);
  };

  const { dismiss } = useToast();
  React.useEffect(() => {
    (async () => {
      if (isPending) {
        toast({
          itemID: "stake",
          variant: "pending",
          description: (
            <div className="flex items-center gap-5 border-none">
              <div className="relative shrink-0">
                <div className="absolute left-3 top-3 z-10 size-[52px] rounded-full bg-[#BBC2CC]" />
                <Icons.toastPending className="animate-spin" />
                <Icons.clock className="absolute left-[26.5px] top-[26.5px] z-20" />
              </div>
              <div className="flex flex-col items-start gap-2 text-sm font-medium text-[#3F6870]">
                <span className="text-[18px] font-semibold text-[#075A5A]">
                  transferring...
                </span>
              </div>
            </div>
          ),
        });
        MyAnalytics.track("Init Tx Nostra migrate", {
          address,
          nstStrkBalance: nstStrkBalance.toEtherStr(),
          youWillStake: youWillStakeFull.toEtherStr(),
          xSTRKAmount: xSTRKAmount.toEtherStr(),
          transactionHash: data?.transaction_hash,
        });
      }

      if (error?.name?.includes("UserRejectedRequestError")) {
        dismiss();
      }

      if (error?.name && !error?.name?.includes("UserRejectedRequestError")) {
        toast({
          itemID: "stake",
          variant: "pending",
          description: (
            <div className="flex items-center gap-5 border-none pl-2">
              ❌
              <div className="flex flex-col items-start text-sm font-medium text-[#3F6870]">
                <span className="text-base font-semibold text-[#075A5A]">
                  Something went wrong
                </span>
                Please try again
              </div>
            </div>
          ),
        });
        MyAnalytics.track("Error Nostra migrate", {
          address,
          nstStrkBalance: nstStrkBalance.toEtherStr(),
          youWillStake: youWillStakeFull.toEtherStr(),
          xSTRKAmount: xSTRKAmount.toEtherStr(),
          error: error?.name || JSON.stringify(error),
        });
      }

      if (data) {
        const res = await isTxAccepted(data?.transaction_hash);

        if (res) {
          setIsMigrationDone(true);
          toast({
            itemID: "stake",
            variant: "complete",
            duration: 3000,
            description: (
              <div className="flex items-center gap-2 border-none">
                <Icons.toastSuccess />
                <div className="flex flex-col items-start gap-2 text-sm font-medium text-[#3F6870]">
                  <span className="text-[18px] font-semibold text-[#075A5A]">
                    Success 🎉
                  </span>
                </div>
              </div>
            ),
          });
          MyAnalytics.track("Completed Nostra migrate", {
            address,
            nstStrkBalance: nstStrkBalance.toEtherStr(),
            youWillStake: youWillStakeFull.toEtherStr(),
            xSTRKAmount: xSTRKAmount.toEtherStr(),
            transactionHash: data?.transaction_hash,
          });
        }
      }
    })();
  }, [data, data?.transaction_hash, error?.name, isPending]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-md bg-[#FF4240] px-3 py-2 text-sm font-medium text-white transition-all hover:bg-[#b03d3c]"
          onClick={() => {
            MyAnalytics.track("Click Migrate Nostra STRK", {
              address,
              nstStrkBalance: nstStrkBalance.toEtherStr(),
            });
          }}
        >
          <Icons.migrate />
          Migrate Nostra STRK
        </button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          font.className,
          "px-3 pb-8 pt-12 sm:max-w-[668px] md:px-8",
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#0B453A]">
            Migrate your Nostra staked STRK
          </DialogTitle>
          <DialogDescription className="!mt-3.5 text-base font-normal text-[#8D9C9C]">
            nstSTRK is now{" "}
            <a
              style={{ textDecoration: "underline" }}
              target="_blank"
              href="https://snapshot.box/#/sn:0x07c251045154318a2376a3bb65be47d3c90df1740d8e35c9b9d943aa3f240e50/proposal/5"
            >
              retired
            </a>
            . Effortlessly migrate your nstSTRK to xSTRK and lend it on Nostra
            to receive ixSTRK, unlocking high-yield earning opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-between rounded-md bg-[#E8F3F0] px-3 py-3.5 text-[#17876D]">
          <span>Current staked STRK on Nostra</span>
          <span>
            {formatNumberWithCommas(nstStrkBalance.toEtherToFixedDecimals(4))}{" "}
            STRK
          </span>
        </div>

        <div className="mt-3">
          <p className="text-base text-[#8D9C9C]">If transferred to Endur.fi</p>
          <div className="mt-1 flex flex-col rounded-md bg-[#E8F3F0] px-3 py-3.5 text-[#17876D]">
            <div className="flex items-center justify-between">
              <span>You will stake</span>
              <span>{formatNumberWithCommas(youWillStake)} STRK</span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span>xSTRK minted</span>
              <span>{xSTRKAmount.toEtherToFixedDecimals(2)} xSTRK</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>
                xSTRK is automatically sent to{" "}
                <span className="color-[#FF4240]">Nostra</span>
              </span>
              <span>{nostraLendApy.value?.toFixed(2)}% APY</span>
            </div>
            <div className="mt-2 flex items-center justify-between font-bold">
              <span>Net APY (Incl. Staking yield)</span>
              <span>
                {(stakingApy.value * 100 + (nostraLendApy.value || 0)).toFixed(
                  2,
                )}
                % APY
              </span>
            </div>
          </div>
        </div>

        {!isMigrationDone && !nstStrkBalance.isZero() && (
          <div>
            <button
              className={cn(
                fontInter.className,
                "mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg bg-[#17876D] px-5 py-3 text-sm font-medium text-white transition-all",
              )}
              onClick={() => handleMigrateToEndur()}
            >
              <Icons.migrate />
              Transfer
            </button>
            <div className="mt-4 items-center gap-2 rounded-md bg-[#FFC4664D] px-3 py-3.5 text-[#3F6870]">
              <span className="text-sm">
                <b>Note: </b>On clicking Transfer, Your nstSTRK is converted to
                xSTRK and deposited into Nostra (ixSTRK). You will find your
                assets{" "}
                <Link
                  href="https://app.nostra.finance/lend-borrow"
                  target="_blank"
                >
                  <u>here on Nostra.</u>
                </Link>
              </span>
            </div>
          </div>
        )}
        {!isMigrationDone && nstStrkBalance.isZero() && address && (
          <div className="mt-4 items-center gap-2 rounded-md bg-[#FFC4664D] px-3 py-3.5 text-[#3F6870]">
            <p className="font-bold">
              ⚠️ You do not have any Nostra Staked STRK (nstSTRK) to migrate
            </p>
          </div>
        )}
        {!isMigrationDone && nstStrkBalance.isZero() && !address && (
          <div className="mt-4 items-center gap-2 rounded-md bg-[#FFC4664D] px-3 py-3.5 text-[#3F6870]">
            <p className="font-bold">⚠️ Wallet not connected</p>
          </div>
        )}
        {isMigrationDone && (
          <div className="mt-4 items-center gap-2 rounded-md bg-[#17876D] px-3 py-3.5 text-[#E8F3F0]">
            <p className="font-bold">Migration completed</p>
            <span className="text-sm">
              Your nstSTRK is converted to xSTRK and deposited into Nostra. You
              can check it{" "}
              <Link
                href="https://app.nostra.finance/lend-borrow"
                target="_blank"
              >
                <u>here.</u>
              </Link>
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MigrateNostra;
