"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAccount,
  useConnect,
  useSendTransaction,
} from "@starknet-react/core";
import { useAtom, useAtomValue } from "jotai";
import { Info } from 'lucide-react';
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
  userXSTRKBalanceAtom,
} from "@/store/lst.store";
import { snAPYAtom } from "@/store/staking.store";
import { isTxAccepted } from "@/store/transactions.atom";
import { amountAtom, dexRatesAtom } from "@/store/dex.store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NETWORK,
  REWARD_FEES,
  getProvider,
} from "@/constants";
import { formatNumber } from "@/lib/utils";

import { getProvider, NETWORK, REWARD_FEES } from "@/constants";
import { formatNumber, formatNumberWithCommas } from "@/lib/utils";
import { MyAnalytics } from "@/lib/analytics";
import { isMerryChristmasAtom } from "@/store/merry.store";

import { Icons } from "./Icons";
import { getConnectors } from "./navbar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSidebar } from "./ui/sidebar";

// Types
interface DexRoute {
  dex: 'ekubo' | 'avnu';
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

const DexRouteCard = ({
  route,
  unstakeAmount
}: {
  route: DexRoute;
  unstakeAmount: string;
}) => {
  const handleClick = () => {
    const baseUrl = route.dex === 'ekubo'
      ? 'https://app.ekubo.org/'
      : 'https://app.avnu.fi/en/xstrk-strk';

    const params = route.dex === 'ekubo'
      ? `?inputCurrency=xSTRK&amount=${unstakeAmount}&outputCurrency=STRK`
      : `?inputCurrency=xSTRK&outputCurrency=STRK&amount=${unstakeAmount}`;

    const dexUrl = `${baseUrl}${params}`;
    window.open(dexUrl, '_blank');
  };

  const outputAmount = Number(unstakeAmount) * route.exchangeRate;

  return (
    <button
      onClick={handleClick}
      className="w-full flex flex-col gap-1.5 rounded-[15.89px] border border-[#8D9C9C20] px-4 py-2.5 bg-[#E9F3F0] hover:bg-[#D0E6E0] transition-colors"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          {route.logo}
          <span className="text-base font-semibold text-[#075A5A]">{route.name}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-lg lg:text-xl font-bold text-[#03624C]">
            {outputAmount.toFixed(2)} STRK
          </span>
          <span className="text-xs text-[#8D9C9C]">
            Rate: 1:{route.exchangeRate.toFixed(4)}
          </span>
        </div>
      </div>
    </button>
  );
};

const Unstake = () => {
  const [txnDapp, setTxnDapp] = React.useState<"endur" | "dex">("dex");

  const { address } = useAccount();
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
  const { rates, isLoading: ratesLoading } = useAtomValue(dexRatesAtom);
  const [, setAmount] = useAtom(amountAtom);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      unstakeAmount: "",
    },
    mode: "onChange",
  });

  // Update amount atom when form value changes
  React.useEffect(() => {
    const amount = form.watch('unstakeAmount');
    setAmount(amount);
  }, [form.watch('unstakeAmount'), setAmount]);

  const provider = getProvider();
  const contract = new Contract(
    erc4626Abi,
    process.env.NEXT_PUBLIC_LST_ADDRESS as string,
    provider,
  );

  const { sendAsync, data, isPending, error } = useSendTransaction({});

  React.useEffect(() => {
    (async () => {
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
        dismiss();
      }

      if (error?.name && !error?.name?.includes("UserRejectedRequestError")) {
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

  const youWillGet = React.useMemo(() => {
    if (form.getValues("unstakeAmount") && txnDapp === "endur") {
      return (Number(form.getValues("unstakeAmount")) * exRate.rate).toFixed(2);
    }
    return "0";
  }, [exRate.rate, form.watch("unstakeAmount"), txnDapp]);

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

    const amount = Number(currentXSTRKBalance.value.toEtherToFixedDecimals(9));

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

    const call1 = contract.populate("redeem", [
      MyNumber.fromEther(values.unstakeAmount, 18),
      address,
      address,
    ]);

    sendAsync([call1]);
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
          <p className="text-xs text-[#06302B]">Enter Amount (xSTRK)</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
              <FormField
                control={form.control}
                name="unstakeAmount"
                render={({ field }) => (
                  <FormItem className="relative space-y-1">
                    <FormControl>
                      <div className="relative">
                        <Input className="h-fit border-none px-0 pr-1 text-2xl shadow-none outline-none placeholder:text-[#8D9C9C] focus-visible:ring-0 lg:pr-0 lg:!text-3xl"
                          placeholder="0.00"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="absolute -bottom-5 left-0 text-xs lg:left-1" />
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
              {formatNumber(currentXSTRKBalance.value.toEtherToFixedDecimals(2))}{" "}
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
        <TabsList className="flex h-full w-full flex-col items-center justify-between gap-3 bg-transparent px-6 md:flex-row">
          <TabsTrigger
            value="endur"
            className="flex w-full flex-col gap-1.5 rounded-[15.89px] border border-[#8D9C9C20] px-4 py-2.5 data-[state=active]:border-[#17876D]"
          >
            <div className="flex w-full items-center justify-between font-semibold">
              <p>Use Endur</p>
              <Icons.endurLogo className="size-6" />
            </div>

            <div className="flex w-full items-center justify-between text-sm font-semibold text-[#17876D]">
              <div className="flex items-center gap-0.5">
                Rate
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="rounded-md border border-[#03624C] bg-white text-[#03624C]"
                    >
                      {exRate.rate === 0
                        ? "-"
                        : `1 xSTRK = ${exRate.rate.toFixed(4)} STRK`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p>{exRate.rate === 0 ? "-" : `1=${exRate.rate.toFixed(4)}`}</p>
            </div>

            <div className="flex w-full items-center justify-between text-sm font-thin text-[#939494]">
              <p>Waiting time:</p>
              <p>~4h</p> {/* TODO: fetch avg wait time from backend */}
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="dex"
            className="flex w-full flex-col gap-1.5 rounded-[15.89px] border border-[#8D9C9C20] px-4 py-2.5 data-[state=active]:border-[#17876D] bg-[#E9F3F0] data-[state=active]:bg-[#D0E6E0]"
          >
            <div className="flex w-full items-center justify-between font-semibold">
              <p>Use DEX (Recommended)</p>
              <div className="flex items-center">
                <Icons.ekuboLogo className="size-6 rounded-full" />
                <Icons.avnuLogo className="-ml-3 size-[26px] rounded-full border border-[#8D9C9C20]" />
              </div>
            </div>

            <div className="flex w-full items-center justify-between text-sm font-thin text-[#939494]">
              <p>Best Rate:</p>
              <p>{ratesLoading ? "Loading..." : (rates?.[0]?.rate ? `1:${rates[0].rate.toFixed(4)}` : "-")}</p>
            </div>

            <div className="flex w-full items-center justify-between text-sm font-semibold text-[#17876D]">
              <p>Waiting time:</p>
              <p className="flex items-center gap-1">
                <Icons.zap className="h-4 w-4" />
                Instant
              </p>
            </div>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {txnDapp === "endur" ? (
        <>
          <div className="mb-5 mt-[14px] h-px w-full rounded-full bg-[#AACBC480]" />
          <div className="space-y-3 px-7">
            <div className="flex items-center justify-between rounded-md text-base font-bold text-[#03624C] lg:text-lg">
              <p className="flex items-center gap-1">
                You will get
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-56 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                    >
                      You will receive the equivalent amount of STRK for the xSTRK
                      you are unstaking. The amount of STRK you receive will be
                      based on the current exchange rate of xSTRK to STRK.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </p>
              <span className="text-lg lg:text-xl">{youWillGet} STRK</span>
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
                }
                className="w-full rounded-2xl bg-[#17876D] py-6 text-sm font-semibold text-white hover:bg-[#17876D] disabled:bg-[#03624C4D] disabled:text-[#17876D] disabled:opacity-90"
              >
                Unstake
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 mt-[14px] h-px w-full rounded-full bg-[#AACBC480]" />
          <div className="px-7">
            <div className="space-y-2">
              {form.getValues("unstakeAmount") && rates?.length > 0 ? (
                rates.map((route) => (
                  <DexRouteCard
                    key={route.dex}
                    route={{
                      dex: route.dex,
                      exchangeRate: route.rate,
                      name: route.dex === 'ekubo' ? 'Ekubo' : 'AVNU',
                      logo: route.dex === 'ekubo'
                        ? <Icons.ekuboLogo className="size-6 rounded-full" />
                        : <Icons.avnuLogo className="size-[26px] rounded-full border border-[#8D9C9C20]" />,
                      link: route.dex === 'ekubo'
                        ? 'https://app.ekubo.org/swap'
                        : 'https://app.avnu.fi'
                    }}
                    unstakeAmount={form.getValues('unstakeAmount')}
                  />
                ))
              ) : ratesLoading && form.getValues("unstakeAmount") ? (
                <div className="rounded-[15.89px] border border-[#8D9C9C20] px-4 py-2.5 text-center text-sm text-[#8D9C9C]">
                  Loading available routes...
                </div>
              ) : (
                <div className="rounded-[15.89px] border border-[#8D9C9C20] px-4 py-2.5 text-center text-sm text-[#8D9C9C]">
                  {form.getValues("unstakeAmount") ? "No routes available" : "Enter an amount to see available routes"}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Unstake;