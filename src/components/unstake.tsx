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
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Contract } from "starknet";
import * as z from "zod";

import erc4626Abi from "@/abi/erc4626.abi.json";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getProvider, REWARD_FEES } from "@/constants";
import { toast, useToast } from "@/hooks/use-toast";
import { MyAnalytics } from "@/lib/analytics";
import MyNumber from "@/lib/MyNumber";
import { eventNames, formatNumber } from "@/lib/utils";
import { executeAvnuSwap, getAvnuQuotes } from "@/services/avnu";
import {
  avnuErrorAtom,
  avnuLoadingAtom,
  avnuQuoteAtom,
} from "@/store/avnu.store";
import {
  exchangeRateAtom,
  totalStakedAtom,
  totalStakedUSDAtom,
  userSTRKBalanceAtom,
  userXSTRKBalanceAtom,
  withdrawalQueueStateAtom,
} from "@/store/lst.store";
import { snAPYAtom } from "@/store/staking.store";
import { isTxAccepted } from "@/store/transactions.atom";
import { AccountInterface } from "starknet";
import { Icons } from "./Icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSidebar } from "./ui/sidebar";
import { ConnectButton, useAccount as useAccountEasyleap } from "@easyleap/sdk";

interface DexRoute {
  dex: "avnu";
  exchangeRate: number;
  logo: React.ReactNode;
  name: string;
  link: string;
}

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

const StyledButton = ({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className="w-full rounded-2xl bg-[#17876D] py-6 text-sm font-semibold text-white hover:bg-[#17876D] disabled:bg-[#03624C4D] disabled:text-[#17876D] disabled:opacity-90"
  >
    {children}
  </Button>
);

const InfoTooltip = ({
  content,
  side = "right",
}: {
  content: React.ReactNode;
  side?: "right" | "left" | "top" | "bottom";
}) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger>
        <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const FeeSection = () => (
  <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
    <p className="flex items-center gap-1">
      Reward fees
      <InfoTooltip
        content={
          <>
            This fee applies exclusively to your staking rewards and does NOT
            affect your staked amount. You might qualify for a future fee
            rebate.{" "}
            <Link
              target="_blank"
              href="https://blog.endur.fi/endur-reimagining-value-distribution-in-liquid-staking-on-starknet"
              className="text-blue-600 underline"
            >
              Learn more
            </Link>
          </>
        }
      />
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
);

const YouWillGetSection = ({
  amount,
  tooltipContent,
}: {
  amount: string;
  tooltipContent: React.ReactNode;
}) => (
  <div className="flex items-center justify-between rounded-md text-xs font-bold text-[#03624C] lg:text-[13px]">
    <p className="flex items-center gap-1">
      You will get
      <InfoTooltip content={tooltipContent} />
    </p>
    <span className="text-xs lg:text-[13px]">{amount} STRK</span>
  </div>
);

const calculateWaitingTime = (queueState: any, unstakeAmount: string) => {
  if (!queueState || !unstakeAmount) return "-";

  try {
    const amount = MyNumber.fromEther(unstakeAmount, 18);
    const pendingQueue = new MyNumber(
      queueState.unprocessed_withdraw_queue_amount || "0",
      18,
    );

    const currentAmount = BigInt(amount.toString());
    const queueAmount = BigInt(pendingQueue.toString());
    const totalAmount = currentAmount + queueAmount;

    const THRESHOLD = BigInt(70000) * BigInt(10 ** 18);

    if (totalAmount <= THRESHOLD) {
      return "1-2 hours";
    } else if (totalAmount <= THRESHOLD * BigInt(2)) {
      return "1-2 days";
    }
    return "~21 days";
  } catch (error) {
    console.error("Error calculating waiting time:", error);
    return "-";
  }
};

interface UnstakeOptionCardProps {
  isActive: boolean;
  title: string;
  logo: React.ReactNode;
  rate: string | number;
  waitingTime: string;
  isLoading?: boolean;
  isRecommended?: boolean;
  isBestRate?: boolean;
  bgColor?: string;
}

const UnstakeOptionCard = ({
  isActive,
  title,
  logo,
  rate,
  waitingTime,
  isLoading,
  isRecommended,
  isBestRate,
  bgColor = "#E9F3F0",
}: UnstakeOptionCardProps) => (
  <TabsTrigger
    value={title.toLowerCase().includes("endur") ? "endur" : "dex"}
    className={`flex w-full flex-col gap-1.5 rounded-[15px] border border-[#8D9C9C20] px-4 py-3 ${
      isActive ? "border-[#17876D]" : ""
    }`}
    style={{ backgroundColor: isActive ? "#D0E6E0" : bgColor }}
  >
    <div className="flex w-full items-center justify-between">
      <p className="text-sm font-semibold">
        {title}
        {isRecommended && " (Recommended)"}
      </p>
      {logo}
    </div>

    <div className="flex w-full items-center justify-between text-xs text-[#939494] lg:text-[13px]">
      <div className="flex items-center gap-0.5">
        Rate
        {title.toLowerCase().includes("endur") && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="rounded-md border border-[#03624C] bg-white text-[#03624C]"
              >
                {typeof rate === "number" && rate === 0
                  ? "-"
                  : `1 xSTRK = ${Number(rate).toFixed(4)} STRK`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <p className={isBestRate ? "font-semibold text-[#17876D]" : ""}>
        {isLoading ? "Loading..." : `1=${Number(rate).toFixed(4)}`}
      </p>
    </div>

    <div className="flex w-full items-center justify-between text-xs text-[#939494] lg:text-[13px]">
      <p>Waiting time</p>
      {title.toLowerCase().includes("dex") ? (
        <p className="flex items-center gap-1 font-semibold text-[#17876D]">
          <Icons.zap className="h-4 w-4" />
          {waitingTime}
        </p>
      ) : (
        <p>{waitingTime}</p>
      )}
    </div>
  </TabsTrigger>
);

const Unstake = () => {
  const [txnDapp, setTxnDapp] = React.useState<"endur" | "dex">("dex");

  const { account } = useAccount();
  const { addressSource, addressDestination } = useAccountEasyleap();
  const { connect: connectSnReact } = useConnect();
  const { isMobile } = useSidebar();
  const { dismiss } = useToast();

  // const [isMerry, setIsMerry] = useAtom(isMerryChristmasAtom);
  const currentStaked = useAtomValue(userSTRKBalanceAtom);
  const exRate = useAtomValue(exchangeRateAtom);
  const totalStaked = useAtomValue(totalStakedAtom);
  const totalStakedUSD = useAtomValue(totalStakedUSDAtom);
  const currentXSTRKBalance = useAtomValue(userXSTRKBalanceAtom);
  const apy = useAtomValue(snAPYAtom);
  const queueState = useAtomValue(withdrawalQueueStateAtom);

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
          address: addressDestination,
          amount: Number(form.getValues("unstakeAmount")),
          txHash: data.transaction_hash,
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
          address: addressDestination,
          amount: Number(form.getValues("unstakeAmount")),
          type: error.name,
        });
        dismiss();
      }

      if (error?.name && !error?.name?.includes("UserRejectedRequestError")) {
        // Track transaction rejected analytics
        MyAnalytics.track(eventNames.UNSTAKE_TX_REJECTED, {
          address: addressDestination,
          amount: Number(form.getValues("unstakeAmount")),
          type: error.name,
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
            address: addressDestination,
            amount: Number(form.getValues("unstakeAmount")),
            txHash: data.transaction_hash,
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

  // React.useEffect(() => {
  //   if (form.getValues("unstakeAmount").toLowerCase() === "xstrk") {
  //     setIsMerry(true);
  //     MyAnalytics.track("Activated Merry Christmas Theme", {
  //       address,
  //       tab: "unstake",
  //     });
  //   }
  // }, [form.getValues("unstakeAmount"), form]);

  const youWillGet = React.useMemo(() => {
    if (form.getValues("unstakeAmount") && txnDapp === "endur") {
      return (Number(form.getValues("unstakeAmount")) * exRate.rate).toFixed(2);
    }
    return "0";
  }, [exRate.rate, form.watch("unstakeAmount"), txnDapp]);

  const handleQuickUnstakePrice = (percentage: number) => {
    if (!addressDestination) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Please connect your wallet
          </div>
        ),
      });
    }

    const amount = Number(currentXSTRKBalance.value.toEtherToFixedDecimals(9));

    if (amount) {
      form.setValue("unstakeAmount", ((amount * percentage) / 100).toString());
      form.clearErrors("unstakeAmount");
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!addressDestination || !addressSource) {
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
      Number(currentXSTRKBalance.value.toEtherToFixedDecimals(9))
    ) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Insufficient xSTRK balance
          </div>
        ),
      });
    }

    // Track unstake button click
    MyAnalytics.track(eventNames.UNSTAKE_CLICK, {
      address: addressDestination,
      amount: Number(values.unstakeAmount),
      mode: "ViaEndur",
    });

    const call1 = contract.populate("redeem", [
      MyNumber.fromEther(values.unstakeAmount, 18),
      addressDestination,
      addressDestination,
    ]);

    sendAsync([call1]);
  };

  const [avnuQuote, setAvnuQuote] = useAtom(avnuQuoteAtom);
  const [avnuLoading, setAvnuLoading] = useAtom(avnuLoadingAtom);
  const [avnuError, setAvnuError] = useAtom(avnuErrorAtom);

  React.useEffect(() => {
    const initializeAvnuQuote = async () => {
      setAvnuLoading(true);
      try {
        const quotes = await getAvnuQuotes("1000", "0x0");
        setAvnuQuote(quotes[0] || null);
        setAvnuError(null);
      } catch (error) {
        console.error("Error fetching initial Avnu quote:", error);
        setAvnuError((error as Error).message);
        setAvnuQuote(null);
      } finally {
        setAvnuLoading(false);
      }
    };

    initializeAvnuQuote();
  }, []);

  React.useEffect(() => {
    if (!form.getValues("unstakeAmount")) return;

    const fetchQuote = async () => {
      setAvnuLoading(true);
      try {
        const quotes = await getAvnuQuotes(
          form.getValues("unstakeAmount"),
          addressDestination || "0x0",
        );
        setAvnuQuote(quotes[0] || null);
        setAvnuError(null);
      } catch (error) {
        setAvnuError((error as Error).message);
        setAvnuQuote(null);
      } finally {
        setAvnuLoading(false);
      }
    };

    fetchQuote();
  }, [addressDestination, form.watch("unstakeAmount")]);

  const handleDexSwap = async () => {
    if (!addressDestination || !avnuQuote) return;

    MyAnalytics.track(eventNames.UNSTAKE_CLICK, {
      address: addressDestination,
      amount: Number(form.getValues("unstakeAmount")),
      mode: "Instant",
    });

    setAvnuLoading(true);
    try {
      await executeAvnuSwap(
        account as AccountInterface,
        avnuQuote,
        () => {
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
                  Unstaked {form.getValues("unstakeAmount")} STRK via Avnu
                </div>
              </div>
            ),
          });
          form.reset();
        },
        (error) => {
          toast({
            itemID: "unstake",
            description: (
              <div className="flex items-center gap-2 text-red-500">
                <Info className="size-5" />
                {error.message}
              </div>
            ),
          });
        },
      );
    } finally {
      setAvnuLoading(false);
    }
  };

  const dexRate = useMemo(() => {
    if (!avnuQuote) return 0;
    return Number(avnuQuote.buyAmount) / Number(avnuQuote.sellAmount);
  }, [avnuQuote]);

  const waitingTime = useMemo(() => {
    return "~21 days";
  }, [queueState.value, form.watch("unstakeAmount")]);

  const getBetterRate = () => {
    const endurRate = exRate.rate;
    const dexRate = avnuQuote
      ? Number(avnuQuote.buyAmount) / Number(avnuQuote.sellAmount)
      : 0;

    if (endurRate === 0 || dexRate === 0) return "none";
    return endurRate > dexRate ? "endur" : "dex";
  };

  return (
    <div className="relative h-full w-full">
      {/* {isMerry && (
        <div className="pointer-events-none absolute -left-[15px] -top-[7.5rem] hidden transition-all duration-500 lg:block">
          <Icons.cloud />
        </div>
      )} */}

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

      <div className="flex items-center justify-between border-b bg-gradient-to-t from-[#E9F3F0] to-white px-5 py-12 lg:py-[41px]">
        <div className="flex items-center gap-2 text-sm font-semibold text-black lg:gap-4 lg:text-2xl">
          <Icons.strkLogo className="size-6 lg:size-[35px]" />
          STRK
        </div>

        <div className="rounded-md bg-[#17876D] px-2 py-1 text-xs text-white">
          Current staked:{" "}
          {formatNumber(currentStaked.value.toEtherToFixedDecimals(2))} STRK
        </div>
      </div>

      <div className="flex h-[88px] w-full items-center px-7 pb-3 pt-5 md:h-[84px] lg:h-fit lg:gap-2">
        <div className="flex flex-1 flex-col items-start">
          <div className="flex items-center gap-2">
            <p className="text-xs text-[#06302B]">Enter Amount (xSTRK)</p>
            {form.formState.errors.unstakeAmount && (
              <p className="text-xs text-destructive">
                {form.formState.errors.unstakeAmount.message}
              </p>
            )}
          </div>
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
                    {/* {form.getValues("unstakeAmount").toLowerCase() ===
                    "xstrk" ? (
                      <p className="absolute -bottom-4 left-0 text-xs font-medium text-green-500 transition-all lg:left-1 lg:-ml-1">
                        Merry Christmas!
                      </p>
                    ) : (
                      <FormMessage className="absolute -bottom-5 left-0 text-xs lg:left-1" />
                    )}{" "} */}
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

          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#8D9C9C] lg:text-sm">
            <Icons.wallet className="size-3 lg:size-5" />
            <span className="hidden md:block">Balance:</span>
            <span className="font-bold">
              {formatNumber(
                currentXSTRKBalance.value.toEtherToFixedDecimals(2),
              )}{" "}
              xSTRK
            </span>
          </div>
        </div>
      </div>

      <Tabs
        value={txnDapp}
        defaultValue="dex"
        className="w-full max-w-none pt-1"
        onValueChange={(value) => setTxnDapp(value as "endur" | "dex")}
      >
        <TabsList className="flex h-full w-full flex-col items-center justify-between gap-2 bg-transparent px-5 md:flex-row">
          <UnstakeOptionCard
            isActive={txnDapp === "endur"}
            title="Use Endur"
            logo={<Icons.endurLogo className="size-6" />}
            rate={exRate.rate}
            waitingTime={waitingTime}
            isBestRate={getBetterRate() === "endur"}
            bgColor="transparent"
          />

          <UnstakeOptionCard
            isActive={txnDapp === "dex"}
            title="Use DEX"
            logo={
              <Icons.avnuLogo className="size-6 rounded-full border border-[#8D9C9C20]" />
            }
            rate={dexRate}
            waitingTime="Instant"
            isLoading={avnuLoading}
            isRecommended
            isBestRate={getBetterRate() === "dex"}
          />
        </TabsList>
      </Tabs>

      {txnDapp === "endur" ? (
        <>
          <div className="my-5 h-px w-full rounded-full bg-[#AACBC480]" />
          <div className="space-y-3 px-7">
            <YouWillGetSection
              amount={formatNumber(youWillGet, 2)}
              tooltipContent="You will receive the equivalent amount of STRK for the xSTRK you are unstaking. The amount of STRK you receive will be based on the current exchange rate of xSTRK to STRK."
            />
            <FeeSection />
          </div>

          <div className="mt-6 px-5">
            {!!addressSource && !addressDestination ? (
              <ConnectButton
                style={{
                  buttonStyles: {
                    width: "100%",
                  },
                }}
              />
            ) : (
              <StyledButton
                onClick={form.handleSubmit(onSubmit)}
                disabled={
                  Number(form.getValues("unstakeAmount")) <= 0 ||
                  isNaN(Number(form.getValues("unstakeAmount")))
                }
              >
                Unstake via Endur
              </StyledButton>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="my-5 h-px w-full rounded-full bg-[#AACBC480]" />
          <div className="space-y-3 px-7">
            <YouWillGetSection
              amount={formatNumber(
                Number(form.getValues("unstakeAmount") || 0) *
                  (avnuQuote ? dexRate : 0),
                2,
              )}
              tooltipContent="Instant unstaking via Avnu DEX. The amount you receive will be based on current market rates."
            />
            <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
              <p className="flex items-center gap-1">
                Unstake DEX fee
                <InfoTooltip content="Avnu and Endur service fee for using DEX unstake" />
              </p>
              <p>0.05%</p>
            </div>
            {/* <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
              <p className="flex items-center gap-1">
                Waiting time
                <InfoTooltip content="Time until your unstaking request is processed" />
              </p>
              <p className="flex items-center gap-1">
                {txnDapp === "dex" ? (
                <span className="flex items-center gap-1 font-semibold text-[#17876D]">
                  <Icons.zap className="h-4 w-4" />
                  Instant
                </span>
                ) : (
                  waitingTime
                )}
              </p>
            </div> */}
          </div>
          <div className="mt-6 px-5">
            {!addressSource && !addressDestination ? (
              <ConnectButton
                style={{
                  buttonStyles: {
                    width: "100%",
                  },
                }}
              />
            ) : (
              <StyledButton
                onClick={handleDexSwap}
                disabled={
                  Number(form.getValues("unstakeAmount")) <= 0 ||
                  isNaN(Number(form.getValues("unstakeAmount"))) ||
                  avnuLoading ||
                  !avnuQuote
                }
              >
                {avnuLoading ? (
                  <span className="flex items-center gap-2">
                    {/* <Icons.loader className="size-4 animate-spin" /> */}
                    {form.getValues("unstakeAmount")
                      ? "Fetching quote..."
                      : "Processing..."}
                  </span>
                ) : (
                  "Unstake Instantly"
                )}
              </StyledButton>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Unstake;
