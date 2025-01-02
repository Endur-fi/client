"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAccount,
  useConnect,
  useSendTransaction,
} from "@starknet-react/core";
import { useAtom, useAtomValue } from "jotai";
import { Info } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { Contract } from "starknet";
import {
  connect,
  ConnectOptionsWithConnectors,
  StarknetkitConnector,
} from "starknetkit";
import * as z from "zod";

import erc4626Abi from "@/abi/erc4626.abi.json";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast, useToast } from "@/hooks/use-toast";
import MyNumber from "@/lib/MyNumber";
import {
  exchangeRateAtom,
  totalStakedAtom,
  totalStakedUSDAtom,
  userSTRKBalanceAtom,
} from "@/store/lst.store";
import { snAPYAtom } from "@/store/staking.store";
import { isTxAccepted } from "@/store/transactions.atom";

import { getProvider, NETWORK, REWARD_FEES } from "@/constants";
import { MyAnalytics } from "@/lib/analytics";
import { formatNumber, formatNumberWithCommas, eventNames } from "@/lib/utils";
import { isMerryChristmasAtom } from "@/store/merry.store";
import { Icons } from "./Icons";
import { getConnectors } from "./navbar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSidebar } from "./ui/sidebar";

const formSchema = z.object({
  unstakeAmount: z.string().refine(
    (v) => {
      const n = Number(v);
      return !isNaN(n) && v?.length > 0 && n > 0;
    },
    { message: "Invalid input" },
  ),
});

export type FormValues = z.infer<typeof formSchema>;

const Unstake = () => {
  const { address } = useAccount();
  const { connect: connectSnReact } = useConnect();

  const { isMobile } = useSidebar();
  const { dismiss } = useToast();

  const [isMerry, setIsMerry] = useAtom(isMerryChristmasAtom);
  const currentStaked = useAtomValue(userSTRKBalanceAtom);
  const exRate = useAtomValue(exchangeRateAtom);
  const totalStaked = useAtomValue(totalStakedAtom);
  const totalStakedUSD = useAtomValue(totalStakedUSDAtom);
  const apy = useAtomValue(snAPYAtom);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      unstakeAmount: "",
    },
    mode: "onChange",
  });

  const provider = getProvider();

  const contract = new Contract(
    erc4626Abi,
    process.env.NEXT_PUBLIC_LST_ADDRESS as string,
    provider,
  );

  const { sendAsync, data, isPending, error } = useSendTransaction({});

  React.useEffect(() => {
    (async () => {
      if (data?.transaction_hash) {
        // Track transaction init analytics
        MyAnalytics.track(eventNames.UNSTAKE_TX_INIT, {
          address,
          amount: Number(form.getValues("unstakeAmount")),
        });
      }
      if (isPending) {
        toast({
          itemID: "unstake",
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
                  In Progress..
                </span>
                Unstaking {form.getValues("unstakeAmount")} STRK
              </div>
            </div>
          ),
        });
      }

      if (error?.name?.includes("UserRejectedRequestError")) {
        // Track transaction rejected analytics
        MyAnalytics.track(eventNames.UNSTAKE_TX_REJECTED, {
          address,
          amount: Number(form.getValues("unstakeAmount")),
        });
        dismiss();
      }

      if (error?.name && !error?.name?.includes("UserRejectedRequestError")) {
        // Track transaction rejected analytics
        MyAnalytics.track(eventNames.UNSTAKE_TX_REJECTED, {
          address,
          amount: Number(form.getValues("unstakeAmount")),
        });
        toast({
          itemID: "unstake",
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
      }

      if (data) {
        const res = await isTxAccepted(data?.transaction_hash);

        if (res) {
          // Track transaction successful analytics
          MyAnalytics.track(eventNames.UNSTAKE_TX_SUCCESSFUL, {
            address,
            amount: Number(form.getValues("unstakeAmount")),
          });
          toast({
            itemID: "unstake",
            variant: "complete",
            duration: 3000,
            description: (
              <div className="flex items-center gap-2 border-none">
                <Icons.toastSuccess />
                <div className="flex flex-col items-start gap-2 text-sm font-medium text-[#3F6870]">
                  <span className="text-[18px] font-semibold text-[#075A5A]">
                    Success 🎉
                  </span>
                  Unstaked {form.getValues("unstakeAmount")} STRK
                </div>
              </div>
            ),
          });

          form.reset();
        }
      }
    })();
  }, [data, data?.transaction_hash, error?.name, form, isPending]);

  React.useEffect(() => {
    if (form.getValues("unstakeAmount").toLowerCase() === "xstrk") {
      setIsMerry(true);
      MyAnalytics.track("Activated Merry Christmas Theme", {
        address,
        tab: "unstake",
      });
    }
  }, [form.getValues("unstakeAmount"), form]);

  const connectorConfig: ConnectOptionsWithConnectors = React.useMemo(() => {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";
    return {
      modalMode: "canAsk",
      modalTheme: "light",
      webWalletUrl: "https://web.argent.xyz",
      argentMobileOptions: {
        dappName: "Endur.fi",
        chainId: NETWORK,
        url: hostname,
      },
      dappName: "Endur.fi",
      connectors: getConnectors(isMobile) as StarknetkitConnector[],
    };
  }, [isMobile]);

  async function connectWallet(config = connectorConfig) {
    try {
      const { connector } = await connect(config);

      if (connector) {
        connectSnReact({ connector: connector as any });
      }
    } catch (error) {
      console.error("connectWallet error", error);
    }
  }

  const handleQuickUnstakePrice = (percentage: number) => {
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

    const amount = Number(currentStaked.value.toEtherToFixedDecimals(9));

    if (amount) {
      form.setValue("unstakeAmount", ((amount * percentage) / 100).toString());
      form.clearErrors("unstakeAmount");
    }
  };

  const onSubmit = async (values: FormValues) => {
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

    if (
      Number(values.unstakeAmount) >
      Number(currentStaked.value.toEtherToFixedDecimals(9))
    ) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Insufficient staked(xSTRK) balance
          </div>
        ),
      });
    }

    // Track unstake button click
    MyAnalytics.track(eventNames.UNSTAKE_CLICK, {
      address,
      amount: Number(values.unstakeAmount),
    });

    const call1 = contract.populate("withdraw", [
      MyNumber.fromEther(values.unstakeAmount, 18),
      address,
      address,
    ]);

    sendAsync([call1]);
  };

  return (
    <div className="relative h-full w-full">
      {isMerry && (
        <div className="pointer-events-none absolute -left-[15px] -top-[7.5rem] hidden transition-all duration-500 lg:block">
          <Icons.cloud />
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2 lg:px-6">
        <p className="flex flex-col items-center text-xs font-semibold lg:flex-row lg:gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#3F6870] lg:text-[#8D9C9C]">
            APY
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-56 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  Estimated current compounded annualised yield on staking in
                  terms of STRK.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
          ~{(apy.value * 100).toFixed(2)}%
        </p>

        <div className="flex flex-col items-end text-xs font-bold text-[#3F6870] lg:flex-row lg:items-center lg:gap-2 lg:text-[#8D9C9C]">
          TVL
          <p className="flex items-center gap-2">
            <span>
              {formatNumber(totalStaked.value.toEtherToFixedDecimals(2))} STRK
            </span>
            <span className="font-medium">
              | ${formatNumber(totalStakedUSD.value)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b bg-gradient-to-t from-[#E9F3F0] to-white px-5 py-12 lg:py-12">
        <div className="flex items-center gap-2 text-sm font-semibold text-black lg:gap-4 lg:text-2xl">
          <Icons.strkLogo className="size-6 lg:size-[35px]" />
          STRK
        </div>
        <div className="rounded-md bg-[#17876D] px-2 py-1 text-xs text-white">
          Current staked:{" "}
          {formatNumber(currentStaked.value.toEtherToFixedDecimals(2))} STRK
        </div>
      </div>

      <div className="flex h-[88px] w-full items-center gap-2 px-7 pb-1.5 pt-5 md:h-[84px] lg:h-fit">
        <div className="flex flex-1 flex-col items-start">
          <p className="text-xs text-[#06302B]">Enter Amount</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
              <FormField
                control={form.control}
                name="unstakeAmount"
                render={({ field }) => (
                  <FormItem className="relative space-y-1">
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-fit border-none px-0 pr-1 text-2xl shadow-none outline-none placeholder:text-[#8D9C9C] focus-visible:ring-0 lg:pr-0 lg:!text-3xl"
                          placeholder="0.00"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    {form.getValues("unstakeAmount").toLowerCase() ===
                    "xstrk" ? (
                      <p className="absolute -bottom-4 left-0 text-xs font-medium text-green-500 transition-all lg:left-1 lg:-ml-1">
                        Merry Christmas!
                      </p>
                    ) : (
                      <FormMessage className="absolute -bottom-5 left-0 text-xs lg:left-1" />
                    )}{" "}
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="mt-px flex flex-col items-end">
          <div className="hidden text-[#8D9C9C] lg:block">
            <button
              onClick={() => handleQuickUnstakePrice(25)}
              className="rounded-md rounded-r-none border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              25%
            </button>
            <button
              onClick={() => handleQuickUnstakePrice(50)}
              className="border border-x-0 border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              50%
            </button>
            <button
              onClick={() => handleQuickUnstakePrice(75)}
              className="border border-r-0 border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              75%
            </button>
            <button
              onClick={() => handleQuickUnstakePrice(100)}
              className="rounded-md rounded-l-none border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              Max
            </button>
          </div>

          <button
            onClick={() => handleQuickUnstakePrice(100)}
            className="rounded-md bg-[#BBE7E7] px-2 py-1 text-xs font-semibold text-[#215959] transition-all hover:bg-[#BBE7E7] hover:opacity-80 lg:hidden"
          >
            Max
          </button>
        </div>
      </div>

      <div className="my-5 h-px w-full rounded-full bg-[#AACBC480]" />

      <div className="space-y-3 px-7">
        <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
          <p className="flex items-center gap-1">
            Burnt xSTRK
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-56 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  Burnt <strong>xSTRK</strong> is the amount of xSTRK that will
                  be redeemed to unstake the requested STRK
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <span>
            {form.watch("unstakeAmount")
              ? formatNumberWithCommas(
                  Number(form.watch("unstakeAmount")) / exRate.rate,
                )
              : 0}{" "}
            xSTRK
          </span>
        </div>

        <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
          <p className="flex items-center gap-1">
            Exchange rate
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-64 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  <strong>xSTRK</strong> is a yield bearing token whose value
                  will appreciate against STRK as you get more STRK rewards. The
                  increase in exchange rate of xSTRK will determine your share
                  of rewards.{" "}
                  <Link
                    target="_blank"
                    href="https://docs.endur.fi/docs"
                    className="text-blue-600 underline"
                  >
                    Learn more
                  </Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <span>
            {exRate.rate === 0
              ? "-"
              : `1 xSTRK = ${exRate.rate.toFixed(4)} STRK`}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
          <p className="flex items-center gap-1">
            Reward fees
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  This fee applies exclusively to your staking rewards and does
                  NOT affect your staked amount. You might qualify for a future
                  fee rebate.{" "}
                  <Link
                    target="_blank"
                    href="https://blog.endur.fi/endur-reimagining-value-distribution-in-liquid-staking-on-starknet"
                    className="text-blue-600 underline"
                  >
                    Learn more
                  </Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <p>
            <span className="line-through">{REWARD_FEES}%</span>{" "}
            <Link
              target="_blank"
              href="https://blog.endur.fi/endur-reimagining-value-distribution-in-liquid-staking-on-starknet"
              className="underline"
            >
              Fee Rebate
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 px-5">
        {!address && (
          <Button
            onClick={() => connectWallet()}
            className="w-full rounded-2xl bg-[#17876D] py-6 text-sm font-semibold text-white hover:bg-[#17876D] disabled:bg-[#03624C4D] disabled:text-[#17876D] disabled:opacity-90"
          >
            Connect Wallet
          </Button>
        )}

        {address && (
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={
              Number(form.getValues("unstakeAmount")) <= 0 ||
              isNaN(Number(form.getValues("unstakeAmount")))
                ? true
                : false
            }
            className="w-full rounded-2xl bg-[#17876D] py-6 text-sm font-semibold text-white hover:bg-[#17876D] disabled:bg-[#03624C4D] disabled:text-[#17876D] disabled:opacity-90"
          >
            Unstake
          </Button>
        )}
      </div>
    </div>
  );
};

export default Unstake;
