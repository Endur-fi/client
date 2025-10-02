/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAccount,
  useBalance,
  useSendTransaction,
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

import erc4626Abi from "@/abi/erc4626.abi.json";
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
  IS_PAUSED,
  LSTAssetConfig,
  NOSTRA_iXSTRK_ADDRESS,
  REWARD_FEES,
  VESU_vXSTRK_ADDRESS,
} from "@/constants";
import { toast } from "@/hooks/use-toast";
import { useTransactionHandler } from "@/hooks/use-transactions";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { MyAnalytics } from "@/lib/analytics";
import MyNumber from "@/lib/MyNumber";
import { cn, eventNames } from "@/lib/utils";
import LSTService from "@/services/lst";
import { lstConfigAtom } from "@/store/common.store";
import { protocolYieldsAtom, type SupportedDApp } from "@/store/defi.store";
import { apiExchangeRateAtom } from "@/store/lst.store";
import { tabsAtom } from "@/store/merry.store";
import { snAPYAtom } from "@/store/staking.store";

import { Icons } from "./Icons";
import { PlatformCard } from "./platform-card";
import Stats from "./stats";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ASSET_ICONS } from "./asset-selector";

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

export type Platform = "none" | "trovesHyper";

const PLATFORMS = {
  TROVES_HYPER: "trovesHyper",
} as const;

const platformConfig = (lstConfig: LSTAssetConfig) => {
  // Determine the correct yield key based on the LST symbol
  let yieldKey: string;
  switch (lstConfig.LST_SYMBOL) {
    case "xWBTC":
      yieldKey = "hyperxWBTC";
      break;
    case "xtBTC":
      yieldKey = "hyperBTCxtBTC";
      break;
    case "xLBTC":
      yieldKey = "hyperBTCxLBTC";
      break;
    case "xsBTC":
      yieldKey = "hyperBTCxsBTC";
      break;
    default:
      yieldKey = "trovesHyper";
  }

  return {
    trovesHyper: {
      platform: "Troves",
      name: `Troves' Hyper ${lstConfig.LST_SYMBOL} Vault`,
      icon: <Icons.trovesLogoLight className="size-6" />,
      key: yieldKey as SupportedDApp,
      description: (
        <p>
          Leveraged liquidation risk managed vault.{" "}
          <a
            href={`https://app.troves.fi/strategy/hyper_${lstConfig.LST_SYMBOL.toLowerCase()}`}
            target="_blank"
            className="text-blue-600 underline"
          >
            Read more
          </a>
        </p>
      ),
    },
  };
};

const Stake: React.FC = () => {
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<Platform>("none");
  const [isLendingOpen, setIsLendingOpen] = React.useState(true);

  const searchParams = useSearchParams();

  const { address } = useAccount();
  const { connectWallet } = useWalletConnection();
  const lstConfig = useAtomValue(lstConfigAtom)!;
  const { data: balance } = useBalance({
    address,
    token: lstConfig.ASSET_ADDRESS as `0x${string}`,
  });

  const exchangeRate = useAtomValue(apiExchangeRateAtom);
  const apy = useAtomValue(snAPYAtom);
  const yields = useAtomValue(protocolYieldsAtom);
  const activeTab = useAtomValue(tabsAtom);
  console.log("yields", yields);

  const referrer = searchParams.get("referrer");

  const isBTC = lstConfig.SYMBOL?.toLowerCase().includes("btc");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      stakeAmount: "",
    },
    mode: "onChange",
  });

  const assetContract = new Contract({
    abi: erc4626Abi,
    address: lstConfig.ASSET_ADDRESS,
  });

  const lstService = new LSTService();

  const contract = lstConfig.LST_ADDRESS
    ? lstService.getLSTContract(lstConfig.LST_ADDRESS)
    : null;

  const { sendAsync, data, isPending, error } = useSendTransaction({});

  const { handleTransaction } = useTransactionHandler();

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
      // For BTC tokens, use the full balance since they're often less than 1
      // For other tokens, reserve 1 unit for gas fees
      if (isBTC) {
        form.setValue("stakeAmount", Number(balance?.formatted).toFixed(8));
      } else {
        if (Number(balance?.formatted) < 1) {
          form.setValue("stakeAmount", "0");
          form.clearErrors("stakeAmount");
          return;
        }

        form.setValue(
          "stakeAmount",
          (Number(balance?.formatted) - 1).toFixed(2),
        );
      }
      form.clearErrors("stakeAmount");
      return;
    }

    if (balance) {
      const calculatedAmount = (Number(balance?.formatted) * percentage) / 100;
      form.setValue("stakeAmount", calculatedAmount.toFixed(isBTC ? 6 : 2));
      form.clearErrors("stakeAmount");
    }
  };

  const getCalculatedLSTAmount = () => {
    const amount = form.watch("stakeAmount");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return "0";

    try {
      return MyNumber.fromEther(amount, lstConfig.DECIMALS)
        .operate(
          "multipliedBy",
          MyNumber.fromEther("1", lstConfig.DECIMALS).toString(),
        )
        .operate("div", exchangeRate.preciseRate.toString())
        .toEtherStr();
    } catch (error) {
      console.error("Error in getCalculatedLSTAmount", error);
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

    if (!lstConfig) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            LST is not available
          </div>
        ),
      });
    }
    // track stake button click
    MyAnalytics.track(eventNames.STAKE_CLICK, {
      address,
      amount: Number(values.stakeAmount),
    });

    const underlyingTokenAmount = MyNumber.fromEther(
      values.stakeAmount,
      lstConfig.DECIMALS,
    );
    const previewCall = await contract?.preview_deposit(
      underlyingTokenAmount.toString(),
    );
    const lstAmount = previewCall?.toString() || "0";

    const call1 = assetContract.populate("approve", [
      lstConfig.LST_ADDRESS,
      underlyingTokenAmount,
    ]);

    const call2 = referrer
      ? contract?.populate("deposit_with_referral", [
          underlyingTokenAmount,
          address,
          referrer,
        ])
      : contract?.populate("deposit", [underlyingTokenAmount, address]);

    const calls: Call[] = [call1];
    if (call2) {
      calls.push(call2);
    }

    if (selectedPlatform !== "none") {
      const lstContract = new Contract({
        abi: erc4626Abi,
        address: lstConfig.LST_ADDRESS,
      });

      console.log("hyper address", lstConfig.TROVES_HYPER_VAULT_ADDRESS);
      const lendingAddress =
        selectedPlatform === "trovesHyper"
          ? lstConfig.TROVES_HYPER_VAULT_ADDRESS // TODO: update the address
          : selectedPlatform === "vesu"
            ? VESU_vXSTRK_ADDRESS
            : NOSTRA_iXSTRK_ADDRESS;

      const approveCall = lstContract.populate("approve", [
        lendingAddress,
        lstAmount,
      ]);

      if (selectedPlatform === "trovesHyper") {
        const trovesHyperContract = new Contract({
          abi: vxstrkAbi,
          address: lstConfig.TROVES_HYPER_VAULT_ADDRESS!,
        });

        const lendingCall = trovesHyperContract.populate("deposit", [
          lstAmount,
          address,
        ]);
        calls.push(approveCall, lendingCall);
      } else if (selectedPlatform === "vesu") {
        const vesuContract = new Contract({
          abi: vxstrkAbi,
          address: VESU_vXSTRK_ADDRESS,
        });

        const lendingCall = vesuContract.populate("deposit", [
          lstAmount,
          address,
        ]);
        calls.push(approveCall, lendingCall);
      }
    }

    await sendAsync(calls);
  };

  const getPlatformYield = (platform: Platform) => {
    if (platform === "none") return 0;
    const yieldData = getYieldData(platform, yields);
    return yieldData?.value ?? 0;
  };

  const sortPlatforms = (platforms: string[], yields: any) => {
    return platforms.sort((a, b) => {
      const apyA = yields[a]?.value || 0;
      const apyB = yields[b]?.value || 0;
      return apyB - apyA;
    });
  };

  const getPlatformConfig = (platform: string) => {
    const config = platformConfig(lstConfig);
    return config[platform as keyof typeof config];
  };

  const sortedPlatforms = React.useMemo(() => {
    const allPlatforms = Object.values(PLATFORMS);
    return sortPlatforms(allPlatforms, yields);
  }, [yields]);

  const hasPositiveYields = React.useMemo(() => {
    return sortedPlatforms.some((platform) => {
      const config = getPlatformConfig(platform);
      if (!config) return false;
      const yieldData = yields[config.key];
      return (yieldData?.value ?? 0) > 0;
    });
  }, [sortedPlatforms, yields]);

  const PlatformList: React.FC<{
    sortedPlatforms: string[];
    yields: any;
    apy: number;
    selectedPlatform: Platform;
    setSelectedPlatform: (platform: Platform) => void;
  }> = ({
    sortedPlatforms,
    yields,
    apy,
    selectedPlatform,
    setSelectedPlatform,
  }) => {
    return (
      <div className="flex w-full flex-col gap-3">
        {sortedPlatforms.map((platform) => {
          const config = getPlatformConfig(platform);
          const yieldData = getYieldData(platform, yields);
          console.log("yieldData", yieldData);

          if (!config) {
            console.warn(`Platform configuration missing for: ${platform}`);
            return null;
          }

          return (
            <PlatformCard
              key={platform}
              name={config.name}
              description={config.description}
              icon={config.icon}
              apy={yieldData?.value ?? 0}
              baseApy={apy}
              xstrkLent={yieldData?.totalSupplied ?? 0}
              isSelected={selectedPlatform === platform}
              onClick={() => {
                const newSelection =
                  selectedPlatform === platform
                    ? "none"
                    : (platform as Platform);
                setSelectedPlatform(newSelection);
              }}
            />
          );
        })}
      </div>
    );
  };

  const getYieldData = (platform: string, yields: any) => {
    const config = getPlatformConfig(platform);
    return config ? yields[config.key] : null;
  };

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
              title={`Just staked my ${lstConfig.SYMBOL} on @endurfi, earning ${((activeTab === "strk" ? apy.value.strkApy : apy.value.btcApy) * 100 + (selectedPlatform !== "none" ? getPlatformYield(selectedPlatform) : 0)).toFixed(2)}% APY! 🚀 \n\n${selectedPlatform !== "none" ? `My ${lstConfig.LST_SYMBOL} is now with an additional ${getPlatformYield(selectedPlatform).toFixed(2)}% yield on ${getPlatformConfig(selectedPlatform).platform}! 📈\n\n` : ""}${lstConfig.SYMBOL !== "STRK" ? `Building the future of Bitcoin staking on Starknet` : `Laying the foundation for decentralising Starknet`} with Endur!\n\n`}
              related={["endurfi", "troves", "karnotxyz"]}
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
        mode="stake"
      />

      <div className="flex w-full items-center px-7 pb-1.5 pt-5 lg:gap-2">
        <div className="flex flex-1 flex-col items-start">
          <Form {...form}>
            <div className="flex items-center gap-2">
              {ASSET_ICONS[lstConfig.SYMBOL] &&
                React.createElement(ASSET_ICONS[lstConfig.SYMBOL], {
                  className: "size-4",
                })}
              <p className="text-xs text-[#06302B]">
                Enter Amount ({lstConfig.SYMBOL})
              </p>
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
              {balance?.formatted
                ? Number(balance?.formatted).toFixed(isBTC ? 6 : 2)
                : "0"}{" "}
              {lstConfig.SYMBOL}
            </span>
          </div>
        </div>
      </div>

      {hasPositiveYields && (
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
                      You can earn additional yield by lending your xSTRK on
                      DeFi platforms. Your base staking rewards will continue to
                      accumulate.
                    </p>
                    <p className="text-xs text-[#8D9C9C]">
                      Note: These are third-party protocols not affiliated with
                      Endur. Please DYOR and understand the risks before using
                      any DeFi platform.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CollapsibleContent className="mt-2">
              <div className="flex flex-wrap items-center gap-2">
                <PlatformList
                  sortedPlatforms={sortedPlatforms}
                  yields={yields}
                  apy={
                    activeTab === "strk" ? apy.value.strkApy : apy.value.btcApy
                  }
                  selectedPlatform={selectedPlatform}
                  setSelectedPlatform={setSelectedPlatform}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

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
                      <strong>{lstConfig.LST_SYMBOL}</strong> is the liquid
                      staking token (LST) of Endur, representing your staked
                      {lstConfig.SYMBOL}.{" "}
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
            {Number(getCalculatedLSTAmount()).toFixed(isBTC ? 6 : 2)}{" "}
            {lstConfig.LST_SYMBOL}
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
                  <strong>{lstConfig.LST_SYMBOL}</strong> is a yield bearing
                  token whose value will appreciate against {lstConfig.SYMBOL}{" "}
                  as you get more
                  {lstConfig.SYMBOL} rewards. The increase in exchange rate of{" "}
                  {lstConfig.LST_SYMBOL} will determine your share of rewards.{" "}
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
            1 {lstConfig.LST_SYMBOL} = {exchangeRate.rate.toFixed(4)}{" "}
            {lstConfig.SYMBOL}
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
                  NOT affect your staked amount.{" "}
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
              !!form.formState.errors.stakeAmount ||
              IS_PAUSED
            }
            onClick={form.handleSubmit(onSubmit)}
            className="w-full rounded-2xl bg-[#17876D] py-6 text-sm font-semibold text-white hover:bg-[#17876D] disabled:bg-[#03624C4D] disabled:text-[#17876D] disabled:opacity-90"
          >
            {IS_PAUSED
              ? "Paused"
              : selectedPlatform === "none"
                ? `Stake ${lstConfig.SYMBOL}`
                : `Stake & Invest on ${selectedPlatform === "trovesHyper" ? "Troves" : selectedPlatform === "vesu" ? "Vesu" : "Platform"}`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Stake;
