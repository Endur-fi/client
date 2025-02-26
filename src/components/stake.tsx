"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAccount,
  useBalance,
  useConnect,
  useSendTransaction,
} from "@starknet-react/core";
import { useAtom, useAtomValue } from "jotai";
import { ChevronDown, Info } from "lucide-react";
import { Figtree } from "next/font/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { TwitterShareButton } from "react-share";
import { Call, Contract } from "starknet";
import {
  connect,
  ConnectOptionsWithConnectors,
  StarknetkitConnector,
} from "starknetkit";
import * as z from "zod";

import erc4626Abi from "@/abi/erc4626.abi.json";
import ixstrkAbi from "@/abi/ixstrk.abi.json";
import vxstrkAbi from "@/abi/vxstrk.abi.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getEndpoint,
  LST_ADDRRESS,
  NETWORK,
  NOSTRA_iXSTRK_ADDRESS,
  REWARD_FEES,
  STRK_TOKEN,
  VESU_vXSTRK_ADDRESS,
} from "@/constants";
import { toast, useToast } from "@/hooks/use-toast";
import { MyAnalytics } from "@/lib/analytics";
import MyNumber from "@/lib/MyNumber";
import {
  cn,
  eventNames,
  formatNumber,
  formatNumberWithCommas,
} from "@/lib/utils";
import { protocolYieldsAtom } from "@/store/defi.store";
import {
  exchangeRateAtom,
  totalStakedAtom,
  totalStakedUSDAtom,
  userSTRKBalanceAtom,
} from "@/store/lst.store";
import {
  isMerryChristmasAtom,
  isStakeInputFocusAtom,
} from "@/store/merry.store";
import { snAPYAtom } from "@/store/staking.store";
import { isTxAccepted } from "@/store/transactions.atom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import LSTService from "@/services/lst";
import { providerAtom } from "@/store/common.store";
import { Icons } from "./Icons";
import { getConnectors } from "./navbar";
import { PlatformCard } from "./platform-card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSidebar } from "./ui/sidebar";

const font = Figtree({ subsets: ["latin-ext"] });

const formSchema = z.object({
  stakeAmount: z.string().refine(
    (v) => {
      if (!v) return false;
      const n = Number(v);
      return !isNaN(n) && n > 0 && n < Number.MAX_SAFE_INTEGER;
    },
    { message: "Please enter a valid amount" },
  ),
});

export type FormValues = z.infer<typeof formSchema>;

type Platform = "none" | "vesu" | "nostra-lend";

const PLATFORMS = {
  VESU: "vesu",
  NOSTRA: "nostra-lend",
} as const;

type ValidPlatform = (typeof PLATFORMS)[keyof typeof PLATFORMS];

const Stake: React.FC = () => {
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("none");
  const [isLendingOpen, setIsLendingOpen] = useState(false);

  const searchParams = useSearchParams();

  const { address } = useAccount();
  const { connect: connectSnReact } = useConnect();
  const { data: balance } = useBalance({
    address,
    token: STRK_TOKEN,
  });

  const { isMobile } = useSidebar();
  const { dismiss } = useToast();

  const [isMerry, setIsMerry] = useAtom(isMerryChristmasAtom);
  const [focusStakeInput, setFocusStakeInput] = useAtom(isStakeInputFocusAtom);

  const currentStaked = useAtomValue(userSTRKBalanceAtom);
  const totalStaked = useAtomValue(totalStakedAtom);
  const exchangeRate = useAtomValue(exchangeRateAtom);
  const totalStakedUSD = useAtomValue(totalStakedUSDAtom);
  const apy = useAtomValue(snAPYAtom);
  const yields = useAtomValue(protocolYieldsAtom);
  const rpcProvider = useAtomValue(providerAtom);

  const referrer = searchParams.get("referrer");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      stakeAmount: "",
    },
    mode: "onChange",
  });

  const contractSTRK = new Contract(erc4626Abi, STRK_TOKEN);

  const lstService = new LSTService();

  const contract = rpcProvider ? lstService.getLSTContract(rpcProvider) : null;

  const { sendAsync, data, isPending, error } = useSendTransaction({});

  const getPlatformYield = (platform: Platform) => {
    if (platform === "none") return 0;
    const key = platform === "vesu" ? "vesu" : "nostra-lend";
    return yields[key]?.value ?? 0;
  };

  const sortedPlatforms = useMemo(() => {
    return Object.values(PLATFORMS).sort((a, b) => {
      const totalSuppliedA = yields[a]?.totalSupplied || 0;
      const totalSuppliedB = yields[b]?.totalSupplied || 0;
      return totalSuppliedB - totalSuppliedA;
    });
  }, [yields]);

  React.useEffect(() => {
    (async () => {
      if (data?.transaction_hash) {
        // Track transaction init analytics
        MyAnalytics.track(eventNames.STAKE_TX_INIT, {
          address,
          amount: Number(form.getValues("stakeAmount")),
          txHash: data?.transaction_hash,
        });
      }
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
                  In Progress..
                </span>
                Staking {form.getValues("stakeAmount")} STRK
              </div>
            </div>
          ),
        });
      }

      if (error?.name?.includes("UserRejectedRequestError")) {
        // Track transaction rejected analytics
        MyAnalytics.track(eventNames.STAKE_TX_REJECTED, {
          address,
          amount: Number(form.getValues("stakeAmount")),
          type: error.name,
        });
        dismiss();
      }

      if (error?.name && !error?.name?.includes("UserRejectedRequestError")) {
        // Track transaction rejected analytics
        MyAnalytics.track(eventNames.STAKE_TX_REJECTED, {
          address,
          amount: Number(form.getValues("stakeAmount")),
          type: error.name,
        });
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
      }

      if (data) {
        const res = await isTxAccepted(data?.transaction_hash);

        if (res) {
          // Track transaction successful analytics
          MyAnalytics.track(eventNames.STAKE_TX_SUCCESSFUL, {
            address,
            amount: Number(form.getValues("stakeAmount")),
          });
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
                  Staked {form.getValues("stakeAmount")} STRK
                </div>
              </div>
            ),
          });

          setShowShareModal(true);

          form.reset();
        }
      }
    })();
  }, [data, data?.transaction_hash, error?.name, form, isPending]);

  // React.useEffect(() => {
  //   if (form.getValues("stakeAmount").toLowerCase() === "xstrk") {
  //     setIsMerry(true);
  //     MyAnalytics.track("Activated Merry Christmas Theme", {
  //       address,
  //       tab: "stake",
  //     });
  //   }
  // }, [form.getValues("stakeAmount"), form]);

  // React.useEffect(() => {
  //   if (!address) return;

  //   if (focusStakeInput) {
  //     handleQuickStakePrice(100);
  //     form.setFocus("stakeAmount");
  //     setFocusStakeInput(false);
  //   }
  // }, [address, focusStakeInput]);

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

  const handleQuickStakePrice = (percentage: number) => {
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

    if (balance && percentage === 100) {
      if (Number(balance?.formatted) < 1) {
        form.setValue("stakeAmount", "0");
        form.clearErrors("stakeAmount");
        return;
      }

      form.setValue("stakeAmount", (Number(balance?.formatted) - 1).toString());
      form.clearErrors("stakeAmount");
      return;
    }

    if (balance) {
      form.setValue(
        "stakeAmount",
        ((Number(balance?.formatted) * percentage) / 100).toString(),
      );
      form.clearErrors("stakeAmount");
    }
  };

  const onSubmit = async (values: FormValues) => {
    const stakeAmount = Number(values.stakeAmount);

    if (
      isNaN(stakeAmount) ||
      !Number.isFinite(stakeAmount) ||
      stakeAmount <= 0
    ) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Invalid stake amount
          </div>
        ),
      });
    }

    if (stakeAmount > Number(balance?.formatted)) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Insufficient balance
          </div>
        ),
      });
    }

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
    // track stake button click
    MyAnalytics.track(eventNames.STAKE_CLICK, {
      address,
      amount: Number(values.stakeAmount),
    });

    const strkAmount = MyNumber.fromEther(values.stakeAmount, 18);
    const previewCall = await contract?.preview_deposit(strkAmount.toString());
    const xstrkAmount = previewCall?.toString() || "0";

    const call1 = contractSTRK.populate("approve", [LST_ADDRRESS, strkAmount]);

    const call2 = referrer
      ? contract?.populate("deposit_with_referral", [
          strkAmount,
          address,
          referrer,
        ])
      : contract?.populate("deposit", [strkAmount, address]);

    const calls: Call[] = [call1];
    if (call2) {
      calls.push(call2);
    }

    if (selectedPlatform !== "none") {
      const lstContract = new Contract(erc4626Abi, LST_ADDRRESS);

      const lendingAddress =
        selectedPlatform === "vesu"
          ? VESU_vXSTRK_ADDRESS
          : NOSTRA_iXSTRK_ADDRESS;

      const approveCall = lstContract.populate("approve", [
        lendingAddress,
        xstrkAmount,
      ]);

      if (selectedPlatform === "vesu") {
        const vesuContract = new Contract(vxstrkAbi, VESU_vXSTRK_ADDRESS);
        const lendingCall = vesuContract.populate("deposit", [
          xstrkAmount,
          address,
        ]);
        calls.push(approveCall, lendingCall);
      } else {
        const nostraContract = new Contract(ixstrkAbi, NOSTRA_iXSTRK_ADDRESS);
        const lendingCall = nostraContract.populate("mint", [
          address,
          xstrkAmount,
        ]);
        calls.push(approveCall, lendingCall);
      }
    }

    await sendAsync(calls);
  };

  const getCalculatedXSTRK = () => {
    const amount = form.watch("stakeAmount");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return "0";

    try {
      return formatNumberWithCommas(
        MyNumber.fromEther(amount, 18)
          .operate("multipliedBy", MyNumber.fromEther("1", 18).toString())
          .operate("div", exchangeRate.preciseRate.toString())
          .toEtherStr(),
      );
    } catch (error) {
      return "0";
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* {isMerry && (
        <div className="pointer-events-none absolute -left-[15px] -top-[7.5rem] hidden transition-all duration-500 lg:block">
          <Icons.cloud />
        </div>
      )} */}

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className={cn(font.className, "p-16 sm:max-w-xl")}>
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-semibold text-[#17876D]">
              Thank you for taking a step towards decentralizing Starknet!
            </DialogTitle>
            <DialogDescription className="!mt-5 text-center text-sm">
              While your stake is being processed, if you like Endur, do you
              mind sharing on X/Twitter?
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex items-center justify-center">
            <TwitterShareButton
              url={getEndpoint()}
              title={`Just staked my STRK on Endur.fi, earning ${(apy.value * 100 + (selectedPlatform !== "none" ? getPlatformYield(selectedPlatform) : 0)).toFixed(2)}% APY! 🚀 \n\n${selectedPlatform !== "none" ? `My xSTRK is now earning an additional ${getPlatformYield(selectedPlatform).toFixed(2)}% yield on ${selectedPlatform === "vesu" ? "Vesu" : "Nostra"}! 📈\n\n` : ""}Laying the foundation for decentralising Starknet — be part of the journey at @endurfi!\n\n`}
              related={["endurfi", "strkfarm", "karnotxyz"]}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".6rem",
                padding: ".5rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#17876D",
                color: "white",
              }}
            >
              Share on
              <Icons.X />
            </TwitterShareButton>
          </div>
        </DialogContent>
      </Dialog>

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
                  {selectedPlatform === "none"
                    ? "Estimated current compounded annualised yield on staking in terms of STRK."
                    : `Estimated yield including both staking and lending on ${selectedPlatform === "vesu" ? "Vesu" : "Nostra"}.`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
          <span className="flex items-center gap-1">
            ~{(apy.value * 100).toFixed(2)}%
            {selectedPlatform !== "none" && (
              <span className="font-semibold text-[#17876D]">
                + {getPlatformYield(selectedPlatform).toFixed(2)}%
              </span>
            )}
          </span>
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

      <div className="flex w-full items-center px-7 pb-1.5 pt-5 lg:gap-2">
        <div className="flex flex-1 flex-col items-start">
          <Form {...form}>
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#06302B]">Enter Amount (STRK)</p>
              {form.formState.errors.stakeAmount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.stakeAmount.message}
                </p>
              )}
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
              <FormField
                control={form.control}
                name="stakeAmount"
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
                    {/* {form.getValues("stakeAmount").toLowerCase() === "xstrk" ? (
                      <p className="absolute -bottom-4 left-0 text-xs font-medium text-green-500 transition-all lg:left-1 lg:-ml-1">
                        Merry Christmas!
                      </p>
                    ) : (
                      <FormMessage className="absolute -bottom-5 left-0 text-xs lg:left-1" />
                    )} */}
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="flex flex-col items-end">
          <div className="hidden text-[#8D9C9C] lg:block">
            <button
              onClick={() => handleQuickStakePrice(25)}
              className="rounded-md rounded-r-none border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              25%
            </button>
            <button
              onClick={() => handleQuickStakePrice(50)}
              className="border border-x-0 border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              50%
            </button>
            <button
              onClick={() => handleQuickStakePrice(75)}
              className="border border-r-0 border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              75%
            </button>
            <button
              onClick={() => handleQuickStakePrice(100)}
              className="rounded-md rounded-l-none border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              Max
            </button>
          </div>

          <button
            onClick={() => handleQuickStakePrice(100)}
            className="rounded-md bg-[#BBE7E7] px-2 py-1 text-xs font-semibold text-[#215959] transition-all hover:bg-[#BBE7E7] hover:opacity-80 lg:hidden"
          >
            Max
          </button>

          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#8D9C9C] lg:text-sm">
            <Icons.wallet className="size-3 lg:size-5" />
            <span className="hidden md:block">Balance:</span>
            <span className="font-bold">
              {balance?.formatted ? Number(balance?.formatted).toFixed(2) : "0"}{" "}
              STRK
            </span>
          </div>
        </div>
      </div>

      <div className="px-7">
        <Collapsible
          open={isLendingOpen}
          onOpenChange={(open) => {
            setIsLendingOpen(open);
            if (!open) {
              setSelectedPlatform("none");
            }
          }}
        >
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-[#17876D] hover:opacity-80">
              <h3 className="font-semibold">Stake & Earn</h3>
              <span className="text-[#8D9C9C]">(optional)</span>
              <ChevronDown className="size-3 text-[#8D9C9C] transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-72 rounded-md border border-[#03624C] bg-white p-3 text-[#03624C]"
                >
                  <p className="mb-2">
                    You can earn additional yield by lending your xSTRK on DeFi
                    platforms. Your base staking rewards will continue to
                    accumulate.
                  </p>
                  <p className="text-xs text-[#8D9C9C]">
                    Note: These are third-party protocols not affiliated with
                    Endur. Please DYOR and understand the risks before using any
                    DeFi platform.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CollapsibleContent className="mt-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sortedPlatforms.map((platform) => {
                const platformKey =
                  platform === "vesu" ? "vesu" : ("nostra-lend" as const);
                const yieldData = yields[platformKey];
                return (
                  <PlatformCard
                    key={platform}
                    name={platform === "vesu" ? "Vesu" : "Nostra"}
                    icon={
                      platform === "vesu" ? (
                        <Icons.vesuLogo className="h-6 w-6 rounded-full" />
                      ) : (
                        <Icons.nostraLogo className="h-6 w-6" />
                      )
                    }
                    apy={yieldData?.value ?? 0}
                    baseApy={apy.value}
                    xstrkLent={yieldData?.totalSupplied ?? 0}
                    isSelected={selectedPlatform === platform}
                    onClick={() =>
                      setSelectedPlatform(
                        selectedPlatform === platform
                          ? "none"
                          : (platform as Platform),
                      )
                    }
                  />
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="my-5 h-px w-full rounded-full bg-[#AACBC480]" />

      <div className="mt-5 space-y-3 px-7">
        <div className="flex items-center justify-between rounded-md text-xs font-bold text-[#03624C] lg:text-[13px]">
          <p className="flex items-center gap-1">
            {selectedPlatform === "none" ? "You will get" : "You will lend"}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  {selectedPlatform === "none" ? (
                    <>
                      <strong>xSTRK</strong> is the liquid staking token (LST)
                      of Endur, representing your staked STRK.{" "}
                    </>
                  ) : (
                    <>
                      {`This is the amount of xSTRK you're lending on ${selectedPlatform}. `}
                    </>
                  )}
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
          <span className="text-xs lg:text-[13px]">
            {getCalculatedXSTRK()} xSTRK
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
          <span>1 xSTRK = {exchangeRate.rate.toFixed(4)} STRK</span>
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
            disabled={
              !form.getValues("stakeAmount") ||
              isNaN(Number(form.getValues("stakeAmount"))) ||
              Number(form.getValues("stakeAmount")) <= 0 ||
              !!form.formState.errors.stakeAmount
            }
            onClick={form.handleSubmit(onSubmit)}
            className="w-full rounded-2xl bg-[#17876D] py-6 text-sm font-semibold text-white hover:bg-[#17876D] disabled:bg-[#03624C4D] disabled:text-[#17876D] disabled:opacity-90"
          >
            {selectedPlatform === "none"
              ? "Stake STRK"
              : `Stake & Lend on ${selectedPlatform === "vesu" ? "Vesu" : "Nostra"}`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Stake;
