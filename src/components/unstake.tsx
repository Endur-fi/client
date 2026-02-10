/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAccount, useSendTransaction } from "@easyleap/sdk";
import { useAccount as useAccountStarknet } from "@starknet-react/core";
import { useAtom, useAtomValue } from "jotai";
import { Info } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { AccountInterface, Contract } from "starknet";

import * as z from "zod";

import erc4626Abi from "@/abi/erc4626.abi.json";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getProvider, IS_PAUSED, isMainnet, REWARD_FEES } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { useTransactionHandler } from "@/hooks/use-transactions";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { MyAnalytics } from "@/lib/analytics";
import MyNumber from "@/lib/MyNumber";
import { cn, eventNames, formatNumberWithCommas } from "@/lib/utils";
import { executeAvnuSwap, getAvnuQuotes } from "@/services/avnu";
import {
  avnuErrorAtom,
  avnuLoadingAtom,
  avnuQuoteAtom,
} from "@/store/avnu.store";
import {
  apiExchangeRateAtom,
  userLSTBalanceAtom,
  withdrawalQueueStateAtom,
} from "@/store/lst.store";

import { Icons } from "./Icons";
import Stats from "./stats";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { assetPriceAtom, lstConfigAtom } from "@/store/common.store";
import { Web3Number } from "@strkfarm/sdk";

const formSchema = z.object({
  unstakeAmount: z.string().refine(
    (v) => {
      if (!v) return false;
      // always 18 decimal precision for now
      const n = new Web3Number(v, 18);
      return !n.isNaN() && n.gt(0) && n.toNumber() < Number.MAX_SAFE_INTEGER;
    },
    { message: "Invalid input" },
  ),
  displayUnstakeAmount: z.string().refine(
    (v) => {
      if (!v) return false;
      // always 18 decimal precision for now
      const n = new Web3Number(v, 18);
      return !n.isNaN() && n.gt(0) && n.toNumber() < Number.MAX_SAFE_INTEGER;
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

const FeeSection = () => (
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
            This fee applies exclusively to your staking rewards and does NOT
            affect your staked amount.{" "}
            {/* <Link
              target="_blank"
              href={LINKS.ENDUR_VALUE_DISTRUBUTION_BLOG_LINK}
            >
              Learn more
            </Link> */}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </p>
    <p>
      <span className="">{REWARD_FEES}%</span>{" "}
      {/* <Link
        target="_blank"
        href={LINKS.ENDUR_VALUE_DISTRUBUTION_BLOG_LINK}
        className="underline"
      >
        Fee Rebate
      </Link> */}
    </p>
  </div>
);

const YouWillGetSection = ({
  amount,
  tooltipContent,
  usdValue,
}: {
  amount: string;
  tooltipContent: React.ReactNode;
  usdValue?: number | null;
}) => {
  const lstConfig = useAtomValue(lstConfigAtom)!;
  const isBTC = lstConfig.SYMBOL?.toLowerCase().includes("btc");
  return (
    <div className="flex items-center justify-between rounded-md text-xs text-[#03624C] lg:text-[13px]">
      <p className="flex items-center gap-1">
        You will receive
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
            >
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </p>
      <div className="flex flex-col">
        <span className="text-xs">
          {formatNumberWithCommas(amount, isBTC ? 8 : 2)} {lstConfig.SYMBOL}
        </span>
        {usdValue !== null && usdValue !== undefined && (
          <span className="text-right text-xs text-[#6B7780]">
            ≈ ${usdValue.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

// const _calculateWaitingTime = (queueState: any, unstakeAmount: string) => {
//   if (!queueState || !unstakeAmount) return "-";

//   try {
//     const amount = MyNumber.fromEther(unstakeAmount, 18);
//     const pendingQueue = new MyNumber(
//       queueState.unprocessed_withdraw_queue_amount || "0",
//       18,
//     );

//     const currentAmount = BigInt(amount.toString());
//     const queueAmount = BigInt(pendingQueue.toString());
//     const totalAmount = currentAmount + queueAmount;

//     const THRESHOLD = BigInt(70000) * BigInt(10 ** 18);

//     if (totalAmount <= THRESHOLD) {
//       return "1-2 hours";
//     } else if (totalAmount <= THRESHOLD * BigInt(2)) {
//       return "1-2 days";
//     }
//     return "~7 days";
//   } catch (error) {
//     console.error("Error calculating waiting time:", error);
//     return "-";
//   }
// };

interface UnstakeOptionCardProps {
  isActive: boolean;
  title: string;
  logo: React.ReactNode;
  rate: string | number;
  waitingTime: string;
  isLoading?: boolean;
  isRecommended?: boolean;
  isBestRate?: boolean;
  percentDiff?: number | null;
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
  percentDiff,
}: UnstakeOptionCardProps) => {
  const lstConfig = useAtomValue(lstConfigAtom)!;

  return (
    <TabsTrigger
      value={title.toLowerCase().includes("endur") ? "endur" : "dex"}
      className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-[15px] border px-4 py-3 transition-all ${
        isActive
          ? "border-[#17876D] bg-[#D0E6E0]"
          : "border-[#8D9C9C20] bg-white"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
              isActive
                ? "border-[#17876D] bg-[#17876D]"
                : "border-[#8D9C9C] bg-transparent"
            }`}
          >
            {isActive && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
          <p className="text-sm font-semibold">
            {title}
            {isRecommended && " (Recommended)"}
          </p>
        </div>
        {logo}
      </div>

      <div className="flex w-full items-center justify-between text-xs text-[#939494] lg:text-[13px]">
        <div className="flex items-center gap-0.5">
          Rate
          {title.toLowerCase().includes("endur") && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  {typeof rate === "number" && rate === 0
                    ? "-"
                    : `1 ${lstConfig.LST_SYMBOL} = ${Number(rate).toFixed(4)} ${lstConfig.SYMBOL}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2">
        <p className={isBestRate ? "font-semibold text-[#17876D]" : ""}>
          {isLoading ? "Loading..." : `1=${Number(rate).toFixed(4)}`}
        </p>
          {percentDiff !== null && percentDiff !== undefined && !isLoading && (
            <p
              className={`text-xs ${
                percentDiff > 0
                  ? "font-semibold text-[#17876D]"
                  : percentDiff < -0.5
                    ? "text-[red]"
                    : "text-[#939494]"
              }`}
            >
              ({percentDiff > 0 ? "+" : ""}
              {percentDiff.toFixed(2)}%)
            </p>
          )}
        </div>
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
};

const Unstake = () => {
  const [txnDapp, setTxnDapp] = React.useState<"endur" | "dex">("dex");

  // Use Easyleap SDK for address (works with both Privy and standard wallets)
  const { addressDestination: address } = useAccount();
  // Keep standard Starknet hook for account (needed for Avnu swap)
  const { account } = useAccountStarknet();
  const { connectWallet } = useWalletConnection();

  const [avnuQuote, setAvnuQuote] = useAtom(avnuQuoteAtom);
  const [avnuLoading, setAvnuLoading] = useAtom(avnuLoadingAtom);
  const [_avnuError, setAvnuError] = useAtom(avnuErrorAtom);

  const exRate = useAtomValue(apiExchangeRateAtom);
  const currentLSTBalance = useAtomValue(userLSTBalanceAtom);
  const queueState = useAtomValue(withdrawalQueueStateAtom);
  const lstConfig = useAtomValue(lstConfigAtom)!;
  const { data: assetPrice } = useAtomValue(assetPriceAtom);
  const isBTC = lstConfig.SYMBOL?.toLowerCase().includes("btc");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      unstakeAmount: "",
      displayUnstakeAmount: "",
    },
    mode: "onChange",
  });

  const provider = getProvider();

  const contract = new Contract({
    abi: erc4626Abi,
    address: lstConfig.LST_ADDRESS,
    providerOrAccount: provider,
  });

  // Prepare bridge config for Easyleap SDK
  const unstakeAmountValue = form.watch("unstakeAmount");
  const unstakeAmountBigInt = React.useMemo(() => {
    try {
      if (!unstakeAmountValue || isNaN(Number(unstakeAmountValue))) {
        return BigInt(0);
      }
      const amount = MyNumber.fromEther(unstakeAmountValue, lstConfig.DECIMALS);
      return BigInt(amount.toString());
    } catch {
      return BigInt(0);
    }
  }, [unstakeAmountValue, lstConfig.DECIMALS]);

  const { sendAsync, data, isPending, error } = useSendTransaction({
    bridgeConfig: {
      l2_token_address: lstConfig.LST_ADDRESS as `0x${string}`,
      userInputAmount: unstakeAmountBigInt,
      postFeeAmount: unstakeAmountBigInt, // No fees for unstaking
    },
    calls: [],
  });

  const { handleTransaction } = useTransactionHandler();

  const dexRate = React.useMemo(() => {
    if (!avnuQuote) return 0;
    return Number(avnuQuote.buyAmount) / Number(avnuQuote.sellAmount);
  }, [avnuQuote]);

  const youWillGet = React.useMemo(() => {
    const unstakeAmount = form.getValues("unstakeAmount");
    if (!unstakeAmount) return "0";

    if (txnDapp === "endur") {
      // Always use 18 decimal precision
      return (Number(unstakeAmount) * exRate.rate).toFixed(18);
    } else if (txnDapp === "dex" && avnuQuote) {
      // Always use 18 decimal precision
      return (Number(unstakeAmount) * dexRate).toFixed(18);
    }
    return "0";
  }, [exRate.rate, form.watch("unstakeAmount"), txnDapp, avnuQuote, dexRate]);

  const youWillGetUSD = React.useMemo(() => {
    if (!youWillGet || youWillGet === "0" || !assetPrice) return null;
    const amount = Number(youWillGet);
    if (isNaN(amount) || amount <= 0) return null;
    return amount * assetPrice;
  }, [youWillGet, assetPrice]);

  // Calculate USD value for display (based on what user will receive)
  const unstakeAmountUSD = React.useMemo(() => {
    const unstakeAmount = form.getValues("unstakeAmount");
    if (!unstakeAmount || unstakeAmount === "" || !assetPrice) {
      return null;
    }
    const amount = Number(unstakeAmount);
    if (isNaN(amount) || amount <= 0) {
      return null;
    }
    // Calculate USD value based on the amount of underlying asset user will receive
    const underlyingAmount =
      amount * (txnDapp === "endur" ? exRate.rate : dexRate);
    return underlyingAmount * assetPrice;
  }, [form.watch("unstakeAmount"), assetPrice, txnDapp, exRate.rate, dexRate]);

  const waitingTime = React.useMemo(() => {
    return "~7 days";
  }, [queueState.value, form.watch("unstakeAmount")]);

  React.useEffect(() => {
    handleTransaction("UNSTAKE", {
      form,
      address: address ?? "",
      data: data ? { transaction_hash: data } : { transaction_hash: "" },
      error: error ?? { name: "" },
      isPending,
    });
  }, [data, form, isPending]);

  React.useEffect(() => {
    const initializeAvnuQuote = async () => {
      setAvnuLoading(true);
      try {
        const quotes = await getAvnuQuotes(
         lstConfig.LST_SYMBOL == 'xSTRK' ? "1000" : "0.001",
          "0x0",
          lstConfig.LST_ADDRESS,
          lstConfig.ASSET_ADDRESS,
          lstConfig.DECIMALS,
        );
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
          address || "0x0",
          lstConfig.LST_ADDRESS,
          lstConfig.ASSET_ADDRESS,
          lstConfig.DECIMALS,
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
  }, [address, form.watch("unstakeAmount")]);

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

    let displayAmount = "";
    let unstakeAmount = "";
    // to reduce some dust
    const ONE_WEI = Web3Number.fromWei(9999999, 18);
    const balance = new Web3Number(
      Web3Number.fromWei(
        currentLSTBalance.value.toString(),
        currentLSTBalance.value.decimals,
      ).toFixed(18),
      18,
    );
    const available = balance.minus(ONE_WEI);

    // exact balance will be used for unstake amount only when percentage is 100
    // for other percentages, we are still rounding up to 8/2 decimals precision
    if (Number(currentLSTBalance.value.toEtherToFixedDecimals(8)) === 0) {
      return;
    }
    if (percentage === 100) {
      // Round down to prevent exceeding balance
      displayAmount = currentLSTBalance.value.toEtherToFixedDecimals(8);
      // always 18 ok
      unstakeAmount = available.toFixed(18);
    } else {
      // display and unstake amount will be same in this case
      // calculate display amount based on percentage
      const amount = Number(available.toFixed(18));
      displayAmount = ((amount * percentage) / 100).toFixed(isBTC ? 8 : 6);
      unstakeAmount = displayAmount;
    }

    if (
      displayAmount &&
      unstakeAmount &&
      displayAmount.length > 0 &&
      unstakeAmount.length > 0
    ) {
      form.setValue("unstakeAmount", unstakeAmount);
      form.setValue("displayUnstakeAmount", displayAmount);
      form.clearErrors("unstakeAmount");
      form.clearErrors("displayUnstakeAmount");
    }
  };

  const handleDexSwap = async () => {
    if (!address || !avnuQuote) return;

    MyAnalytics.track(eventNames.UNSTAKE_CLICK, {
      address,
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
                  Unstaked {form.getValues("unstakeAmount")} {lstConfig.SYMBOL}{" "}
                  via Avnu
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
              <div className="flex gap-2 text-red-500">
                <Info className="mt-0.5 size-5 flex-shrink-0" />
                <div className="max-h-32 flex-1 space-y-1 overflow-y-auto">
                  <div className="font-semibold">{error.name}</div>
                  <div className="text-sm">{error.message}</div>
                </div>
              </div>
            ),
          });
        },
      );
    } catch (error) {
      console.error("AVNU DEX Swap error", error);
    } finally {
      setAvnuLoading(false);
    }
  };

  const getBetterRate = () => {
    const endurRate = exRate.rate;
    const dexRate = avnuQuote
      ? Number(avnuQuote.buyAmount) / Number(avnuQuote.sellAmount)
      : 0;

    if (endurRate === 0 || dexRate === 0) return "none";
    if (dexRate < (endurRate * 0.995)) return "endur";
    return "dex";
  };

  const calculatePercentDiff = (
    rate1: number,
    rate2: number,
  ): number | null => {
    if (rate1 === 0 || rate2 === 0) return null;
    // Calculate percentage difference: ((rate1 - rate2) / rate2) * 100
    return ((rate1 - rate2) / rate2) * 100;
  };

  const endurPercentDiff = React.useMemo(() => {
    const endurRate = exRate.rate;
    const dexRate = avnuQuote
      ? Number(avnuQuote.buyAmount) / Number(avnuQuote.sellAmount)
      : 0;
    return calculatePercentDiff(endurRate, dexRate);
  }, [exRate.rate, avnuQuote]);

  const dexPercentDiff = React.useMemo(() => {
    const endurRate = exRate.rate;
    const dexRate = avnuQuote
      ? Number(avnuQuote.buyAmount) / Number(avnuQuote.sellAmount)
      : 0;
    return calculatePercentDiff(dexRate, endurRate);
  }, [exRate.rate, avnuQuote]);

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
    const balance = Web3Number.fromWei(
      currentLSTBalance.value.toString(),
      currentLSTBalance.value.decimals,
    );
    if (balance.lessThan(values.unstakeAmount)) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Insufficient {lstConfig.LST_SYMBOL} balance
            <br />
            {Number(values.unstakeAmount)} {">"} Available {balance.toString()}
          </div>
        ),
      });
    }

    // Track unstake button click
    MyAnalytics.track(eventNames.UNSTAKE_CLICK, {
      address,
      amount: Number(values.unstakeAmount),
      mode: "ViaEndur",
    });

    const call1 = contract.populate("redeem", [
      MyNumber.fromEther(values.unstakeAmount, lstConfig.DECIMALS),
      address,
      address,
    ]);

    // Prepare token transfer data for Easyleap SDK
    const tokensIn = [
      {
        name: lstConfig.LST_SYMBOL,
        amount: values.unstakeAmount,
        logo: "",
      },
    ];

    const tokensOut = [
      {
        name: lstConfig.SYMBOL,
        amount: youWillGet,
        logo: "",
      },
    ];

    const destinationDapp = {
      name: "Endur",
      logo: "",
    };

    await sendAsync(tokensIn, tokensOut, destinationDapp, [call1]);
  };

  return (
    <div className="relative flex h-full w-full flex-col gap-6">
      <Stats mode="unstake" />

      <div className="flex w-full max-w-full flex-col items-start gap-2 lg:max-w-none">
        <div className="flex w-full max-w-full flex-1 flex-col items-start lg:max-w-none">
          <Form {...form}>
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7780]">Enter Amount</p>
              </div>

              <div className="flex items-center gap-1">
                <Icons.wallet className="size-3" />
                <span className="hidden text-xs text-[#6B7780] md:block">
                  Balance:
                </span>
                <span className="text-xs text-[#1A1F24]">
                  {Number(
                    currentLSTBalance.value.toEtherToFixedDecimals(
                      isBTC ? 8 : 2,
                    ),
                  ).toFixed(isBTC ? 8 : 2)}{" "}
                  {lstConfig.LST_SYMBOL}
                </span>
              </div>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
              <FormField
                control={form.control}
                name="displayUnstakeAmount"
                render={({ field, fieldState }) => {
                  const maxDecimals = isBTC ? 8 : 6;
                  const hasError = !!fieldState.error;

                  // Format for display: limit decimal places while preserving precision in storage
                  const getDisplayValue = (value: string) => {
                    if (!value || value === "") return "";

                    // Allow typing decimal point and trailing zeros
                    const trailingZerosRegex = /\.\d*0+$/;
                    if (value.endsWith(".") || trailingZerosRegex.test(value)) {
                      return value;
                    }

                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) return value;

                    // Check if value has more decimals than allowed
                    const parts = value.split(".");
                    if (parts[1] && parts[1].length > maxDecimals) {
                      // Truncate to maxDecimals (don't round to preserve user intent)
                      return `${parts[0]}.${parts[1].slice(0, maxDecimals)}`;
                    }

                    return value;
                  };

                  return (
                    <FormItem className="w-full space-y-1">
                      <FormControl>
                        <div
                          className={cn(
                            "w-full rounded-[14px] border px-3 py-4",
                            hasError
                              ? "border-destructive"
                              : "border-[#E5E8EB]",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Input
                              className="h-fit flex-1 border-none px-0 pr-1 text-2xl shadow-none outline-none placeholder:text-[#8D9C9C] focus-visible:ring-0 lg:pr-0 lg:!text-3xl"
                              placeholder="0.00"
                              value={getDisplayValue(field.value)}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Store the precise value as-is (string)
                                field.onChange(value);
                                form.setValue("unstakeAmount", value);
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                            <span className="text-xl text-[#8D9C9C]">
                              {lstConfig.LST_SYMBOL}
                            </span>
                          </div>
                          {assetPrice && (
                            <div className="px-3 text-xs text-[#6B7780]">
                              &asymp; ${(unstakeAmountUSD ?? 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-destructive" />
                    </FormItem>
                  );
                }}
              />
            </form>
          </Form>
        </div>

        <div className="flex w-full flex-col items-end">
          {(() => {
            const quickUnstakeOptions = [
              { label: "25%", value: 25 },
              { label: "50%", value: 50 },
              { label: "75%", value: 75 },
              { label: "Max", value: 100 },
            ];
            return (
              <div className="flex w-full gap-2 text-[#8D9C9C]">
                {quickUnstakeOptions.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickUnstakePrice(value)}
                    className={`w-full rounded-md bg-[#F5F7F8] px-2 py-2 text-xs text-[#6B7780] transition-all hover:bg-[#8D9C9C33]`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <Tabs
        value={txnDapp}
        defaultValue="endur"
        className="w-full max-w-none"
        onValueChange={(value) => setTxnDapp(value as "endur" | "dex")}
      >
        <TabsList className="flex h-full flex-col items-center justify-between gap-3 bg-transparent">
          <UnstakeOptionCard
            isActive={txnDapp === "endur"}
            title="Use Endur"
            logo={<Icons.endurLogo className="size-6" />}
            rate={exRate.rate}
            waitingTime={waitingTime}
            isBestRate={getBetterRate() === "endur"}
            isRecommended={getBetterRate() === "endur"}
            percentDiff={null}
          />

          {isMainnet() && (
            <UnstakeOptionCard
              isActive={txnDapp === "dex"}
              title="Use DEX"
              logo={
                <Icons.avnuLogo className="size-6 rounded-full border border-[#8D9C9C20]" />
              }
              rate={dexRate}
              waitingTime="Instant"
              isLoading={avnuLoading}
              isRecommended={getBetterRate() === "dex"}
              isBestRate={getBetterRate() === "dex"}
              percentDiff={dexPercentDiff}
            />
          )}
        </TabsList>
      </Tabs>

      {txnDapp === "endur" ? (
        <>
          <div className="space-y-3">
            <h2 className="text-md text-[#6B7780]">TRANSACTION SUMMARY</h2>
            <YouWillGetSection
              amount={youWillGet}
              tooltipContent={`You will receive the equivalent amount of ${lstConfig.SYMBOL} for the ${lstConfig.LST_SYMBOL} you are unstaking. The amount of ${lstConfig.SYMBOL} you receive will be based on the current exchange rate of ${lstConfig.LST_SYMBOL} to ${lstConfig.SYMBOL}.`}
              usdValue={youWillGetUSD}
            />
            <FeeSection />
          </div>

          <div className="">
            {!address ? (
              <StyledButton onClick={() => connectWallet()}>
                Connect Wallet
              </StyledButton>
            ) : (
              <StyledButton
                onClick={form.handleSubmit(onSubmit)}
                disabled={
                  Number(form.getValues("unstakeAmount")) <= 0 ||
                  isNaN(Number(form.getValues("unstakeAmount"))) ||
                  IS_PAUSED
                }
              >
                {IS_PAUSED ? "Paused" : "Unstake via Endur"}
              </StyledButton>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-md text-[#6B7780]">TRANSACTION SUMMARY</h2>
            <YouWillGetSection
              amount={youWillGet}
              tooltipContent="Instant unstaking via Avnu DEX. The amount you receive will be based on current market rates."
              usdValue={youWillGetUSD}
            />
            <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
              <p className="flex items-center gap-1">
                Unstake DEX fee
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                    >
                      Avnu and Endur service fee for using DEX unstake
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
          <div className="">
            {!address ? (
              <StyledButton onClick={() => connectWallet()}>
                Connect Wallet
              </StyledButton>
            ) : (
              <StyledButton
                onClick={handleDexSwap}
                disabled={
                  Number(form.getValues("unstakeAmount")) <= 0 ||
                  isNaN(Number(form.getValues("unstakeAmount"))) ||
                  avnuLoading ||
                  !avnuQuote ||
                  IS_PAUSED
                }
              >
                {IS_PAUSED ? (
                  "Paused"
                ) : avnuLoading ? (
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
