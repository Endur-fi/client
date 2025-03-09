/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useProvider
} from "@starknet-react/core";
import { useAtomValue } from "jotai";
import { ChevronDown, Info } from "lucide-react";
import { Figtree } from "next/font/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { TwitterShareButton } from "react-share";
import { Call, Contract } from "starknet";

import * as z from "zod";
import { formatUnits } from "ethers";

import erc4626Abi from "@/abi/erc4626.abi.json";
import ixstrkAbi from "@/abi/ixstrk.abi.json";
import vxstrkAbi from "@/abi/vxstrk.abi.json";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  LINKS,
  LST_ADDRRESS,
  NOSTRA_iXSTRK_ADDRESS,
  REWARD_FEES,
  STRK_TOKEN,
  VESU_vXSTRK_ADDRESS,
} from "@/constants";
import { toast } from "@/hooks/use-toast";
import { useTransactionHandler } from "@/hooks/use-transactions";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { MyAnalytics } from "@/lib/analytics";
import MyNumber from "@/lib/MyNumber";
import { cn, eventNames, formatNumberWithCommas } from "@/lib/utils";
import LSTService from "@/services/lst";
import { providerAtom } from "@/store/common.store";
import { protocolYieldsAtom } from "@/store/defi.store";
import { exchangeRateAtom } from "@/store/lst.store";
import { snAPYAtom } from "@/store/staking.store";

import { Icons } from "./Icons";
import { PlatformCard } from "./platform-card";
import Stats from "./stats";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSidebar } from "./ui/sidebar";
import { PlatformCard } from "./platform-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { providerAtom } from "@/store/common.store";
import { useAvnuPaymaster } from '@/hooks/use-avnu-paymaster';

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

export type Platform = "none" | "vesu" | "nostraLending";

const PLATFORMS = {
  VESU: "vesu",
  NOSTRA: "nostraLending",
} as const;

const Stake: React.FC = () => {
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<Platform>("none");
  const [isLendingOpen, setIsLendingOpen] = React.useState(false);

  const searchParams = useSearchParams();

  const { address } = useAccount();
  const { connectWallet } = useWalletConnection();
  const { data: balance } = useBalance({
    address,
    token: STRK_TOKEN,
  });

  const exchangeRate = useAtomValue(exchangeRateAtom);
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

  const { provider } = useProvider();

  const contractSTRK = new Contract(
    erc4626Abi,
    STRK_TOKEN,
    provider
  );

  const lstService = new LSTService();

  const contract = rpcProvider ? lstService.getLSTContract(rpcProvider) : null;

  const { sendAsync, data, isPending, error } = useSendTransaction({});
  const { executeTransaction, selectedGasToken, loading: paymasterLoading, estimatedGasFees } = useAvnuPaymaster();


  const { handleTransaction } = useTransactionHandler();

  const getPlatformYield = (platform: Platform) => {
    if (platform === "none") return 0;
    const key = platform === "vesu" ? "vesu" : "nostraLending";
    return yields[key]?.value ?? 0;
  };

  const sortedPlatforms = React.useMemo(() => {
    return Object.values(PLATFORMS).sort((a, b) => {
      const totalSuppliedA = yields[a]?.totalSupplied || 0;
      const totalSuppliedB = yields[b]?.totalSupplied || 0;
      return totalSuppliedB - totalSuppliedA;
    });
  }, [yields]);

  React.useEffect(() => {
    handleTransaction("STAKE", {
      form,
      address: address ?? "",
      data: data ?? { transaction_hash: "" },
      error: error ?? { name: "" },
      isPending,
      setShowShareModal,
    });
  }, [data?.transaction_hash, form, isPending]);

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
      console.error("Error in getCalculatedXSTRK", error);
      return "0";
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

  return (
    <div className="relative h-full w-full">
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
                textWrap: "nowrap",
              }}
            >
              Share on
              <Icons.X className="size-4 shrink-0" />
            </TwitterShareButton>
          </div>
        </DialogContent>
      </Dialog>

      <Stats
        selectedPlatform={selectedPlatform}
        getPlatformYield={getPlatformYield}
      />

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
                  platform === "vesu" ? "vesu" : ("nostraLending" as const);
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
                    href={LINKS.ENDUR_VALUE_DISTRUBUTION_BLOG_LINK}
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
              href={LINKS.ENDUR_VALUE_DISTRUBUTION_BLOG_LINK}
              className="underline"
            >
              Fee Rebate
            </Link>
          </p>
        </div>

        {selectedGasToken && (
          <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
            <p className="flex items-center gap-1">
              Estimated Gas Fee
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                  >
                    Estimated gas fee to be paid in your selected token. The actual fee may vary.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
            <p>
              {formatUnits(estimatedGasFees, selectedGasToken.decimals)} {selectedGasToken.priceInUSD}
              {selectedGasToken.priceInUSD && (
                <span className="text-[#8D9C9C] ml-1">
                  (≈${(
                    Number(formatUnits(estimatedGasFees, selectedGasToken.decimals)) * 
                    selectedGasToken.priceInUSD
                  ).toFixed(2)})
                </span>
              )}
            </p>
          </div>
        )}
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