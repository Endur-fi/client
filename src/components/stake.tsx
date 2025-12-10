/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAccount,
  useBalance,
  useSendTransaction,
} from "@starknet-react/core";

import { useAtomValue } from "jotai";
import { AlertCircleIcon, ChevronDown, Info } from "lucide-react";
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
import {
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
import {
  cn,
  eventNames,
  formatNumberWithCommas,
  formatNumber,
} from "@/lib/utils";
import LSTService from "@/services/lst";
import { lstConfigAtom, assetPriceAtom } from "@/store/common.store";
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
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Web3Number } from "@strkfarm/sdk";

const font = Figtree({ subsets: ["latin-ext"] });

const formSchema = z.object({
  stakeAmount: z.string().refine(
    (v) => {
      if (!v) return false;
      // always 18 decimal precision for now
      const n = new Web3Number(v, 18);
      return !n.isNaN() && n.gt(0) && n.toNumber() < Number.MAX_SAFE_INTEGER;
    },
    { message: "Please enter a valid amount" },
  ),
});

export type FormValues = z.infer<typeof formSchema>;

export type Platform = "none" | "trovesHyper";

const PLATFORMS = {
  HYPER_HYPER: "trovesHyper",
} as const;

const platformConfig = (lstConfig: LSTAssetConfig) => {
  // Determine the correct yield key based on the LST symbol
  let yieldKey: string;
  switch (lstConfig.LST_SYMBOL) {
    case "xSTRK":
      yieldKey = "hyperxSTRK";
      break;
    case "xWBTC":
      yieldKey = "hyperxWBTC";
      break;
    case "xtBTC":
      yieldKey = "hyperxtBTC";
      break;
    case "xLBTC":
      yieldKey = "hyperxLBTC";
      break;
    case "xsBTC":
      yieldKey = "hyperxsBTC";
      break;
    default:
      throw new Error("Invalid LST config");
  }

  return {
    trovesHyper: {
      platform: "Troves",
      name: `Troves' Hyper ${lstConfig.LST_SYMBOL} Vault`,
      icon: <Icons.trovesLogoLight className="size-8" />,
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
      isMaxedOut: lstConfig.TROVES_VAULT_MAXED_OUT,
    },
  };
};

const Stake: React.FC = () => {
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showMaxedOutModal, setShowMaxedOutModal] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<Platform>("none");

  const searchParams = useSearchParams();

  const { address } = useAccount();
  const { connectWallet } = useWalletConnection();
  const lstConfig = useAtomValue(lstConfigAtom)!;
  const [isLendingOpen, setIsLendingOpen] = React.useState(
    // !lstConfig.TROVES_VAULT_MAXED_OUT,
    true,
  );
  const { data: balance } = useBalance({
    address,
    token: lstConfig.ASSET_ADDRESS as `0x${string}`,
  });
  const { data: assetPrice } = useAtomValue(assetPriceAtom);

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
        // Always use 18 decimal precision
        form.setValue("stakeAmount", Number(balance?.formatted).toFixed(18));
      } else {
        if (Number(balance?.formatted) < 1) {
          form.setValue("stakeAmount", "0");
          form.clearErrors("stakeAmount");
          return;
        }

        form.setValue(
          "stakeAmount",
          (Number(balance?.formatted) - 1).toFixed(6),
        );
      }
      form.clearErrors("stakeAmount");
      return;
    }

    if (balance) {
      const calculatedAmount = (Number(balance?.formatted) * percentage) / 100;
      // Always use 18 decimal precision
      form.setValue("stakeAmount", calculatedAmount.toFixed(18));
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

  const calculatedLSTAmountUSD = React.useMemo(() => {
    const lstAmount = getCalculatedLSTAmount();
    if (!lstAmount || lstAmount === "0" || !assetPrice || !exchangeRate.rate) {
      return null;
    }
    const lstAmountNum = Number(lstAmount);
    const underlyingAmount = lstAmountNum * exchangeRate.rate;
    const usdValue = underlyingAmount * assetPrice;
    return usdValue;
  }, [form.watch("stakeAmount"), assetPrice, exchangeRate.rate]);

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
            <br />
            {stakeAmount} {">"} Available {Number(balance?.formatted)}
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

      return !config.isMaxedOut && (yieldData?.value ?? 0) > 0;
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

          if (!config) {
            console.warn(`Platform configuration missing for: ${platform}`);
            return null;
          }

          const isMaxedOut = config.isMaxedOut;

          return (
            <PlatformCard
              key={platform}
              name={config.name}
              description={config.description}
              icon={config.icon}
              apy={isMaxedOut ? -1 : (yieldData?.value ?? 0)} // Use -1 to indicate maxed out
              baseApy={apy}
              xstrkLent={yieldData?.totalSupplied ?? 0}
              isSelected={selectedPlatform === platform}
              onClick={() => {
                if (isMaxedOut) {
                  setShowMaxedOutModal(true);
                  return;
                }
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
    <div className="relative flex h-full w-full flex-col gap-6">
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className={cn(font.className, "p-16 sm:max-w-xl")}>
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-semibold text-[#17876D]">
              Thank you for taking a step towards decentralizing Starknet!
            </DialogTitle>

            {selectedPlatform === "trovesHyper" && (
              <p className="!mt-5 text-center text-sm text-muted-foreground">
                You&apos;ve successfully staked your asset with <br />{" "}
                <Link
                  href={`https://app.troves.fi/strategy/hyper_${lstConfig.LST_SYMBOL.toLowerCase()}`}
                  target="_blank"
                  className="font-bold text-[#17876D] hover:underline"
                >
                  {" "}
                  Troves Vault
                </Link>
              </p>
            )}
            <DialogDescription
              className={cn("!mt-5 text-center text-sm", {
                hidden: selectedPlatform === "trovesHyper",
              })}
            >
              While your stake is being processed, if you like Endur, do you
              mind sharing on X/Twitter?
            </DialogDescription>

            <div className="!mt-6 flex items-center justify-center">
              <TwitterShareButton
                url={`https://endur.fi`}
                title={`Just staked my ${lstConfig.SYMBOL} on @endurfi, earning ${((activeTab === "strk" ? apy.value.strkApy : apy.value.btcApy) * 100 + (selectedPlatform !== "none" ? getPlatformYield(selectedPlatform) : 0)).toFixed(2)}% APY! 🚀 \n\n${selectedPlatform !== "none" ? `My ${lstConfig.LST_SYMBOL} is now with an additional ${getPlatformYield(selectedPlatform).toFixed(2)}% yield on ${getPlatformConfig(selectedPlatform).platform}! 📈\n\n` : ""}${lstConfig.SYMBOL !== "STRK" ? `Building the future of Bitcoin staking on Starknet` : `Laying the foundation for decentralising Starknet`} with Endur!\n\n`}
                related={["endurfi", "troves", "karnotxyz"]}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".6rem",
                  padding: ".5rem 2rem",
                  borderRadius: "12px",
                  backgroundColor: "#17876D",
                  color: "white",
                  textWrap: "nowrap",
                }}
              >
                Share on
                <Icons.X className="size-4 shrink-0" />
              </TwitterShareButton>
            </div>

            {selectedPlatform === "trovesHyper" && (
              <Alert className="!mt-8 border border-[#03624C] bg-[#E5EFED] p-4 text-[#03624C]">
                <AlertCircleIcon className="size-4 !text-[#03624C]" />
                <AlertTitle className="text-base font-semibold leading-[1]">
                  Important
                </AlertTitle>
                <AlertDescription className="mt-2 flex flex-col items-start -space-y-0.5 text-[#5B616D]">
                  <p>Your staked balance is now managed by Troves Vault.</p>
                  <p>
                    View your position and rewards on Troves.{" "}
                    <Link
                      href={`https://app.troves.fi/strategy/hyper_${lstConfig.LST_SYMBOL.toLowerCase()}`}
                      target="_blank"
                      className="font-semibold text-[#03624C] underline"
                    >
                      Link.
                    </Link>
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showMaxedOutModal} onOpenChange={setShowMaxedOutModal}>
        <DialogContent
          className={cn(font.className, "p-8 sm:max-w-md")}
          hideCloseIcon
        >
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold text-[#17876D]">
              Vault Maxed Out
            </DialogTitle>
            <DialogDescription className="!mt-3 text-center text-sm text-[#8D9C9C]">
              The vault is currently maxed out, may open in future.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setShowMaxedOutModal(false)}
              className="rounded-lg bg-[#17876D] px-6 py-2 text-sm font-semibold text-white hover:bg-[#17876D]/90 focus:outline-none focus:ring-0"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Stats
        selectedPlatform={selectedPlatform}
        getPlatformYield={getPlatformYield}
        mode="stake"
      />

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
                  {balance?.formatted
                    ? Number(balance?.formatted).toFixed(isBTC ? 8 : 2)
                    : "0"}{" "}
                  {lstConfig.SYMBOL}
                </span>
                {balance?.formatted && assetPrice && (
                  <span className="text-xs text-[#6B7780]">
                    | $
                    {formatNumber(
                      (Number(balance.formatted) * assetPrice).toFixed(2),
                    )}
                  </span>
                )}
              </div>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
              <FormField
                control={form.control}
                name="stakeAmount"
                render={({ field }) => {
                  const maxDecimals = isBTC ? 8 : 6;

                  // Format for display: limit decimal places while preserving precision in storage
                  const getDisplayValue = (value: string) => {
                    if (!value || value === "") return "";

                    // Allow typing decimal point and trailing zeros
                    if (value.endsWith(".") || /\.\d*0+$/.test(value)) {
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

                  const stakeAmount = field.value;
                  const usdValue = React.useMemo(() => {
                    if (!stakeAmount || stakeAmount === "" || !assetPrice) {
                      return null;
                    }
                    const amount = Number(stakeAmount);
                    if (isNaN(amount) || amount <= 0) {
                      return null;
                    }
                    return amount * assetPrice;
                  }, [stakeAmount, assetPrice]);

                  return (
                    <FormItem className="w-full space-y-1">
                      <FormControl>
                        <div className="w-full rounded-[14px] border border-[#E5E8EB] px-3 py-4">
                          <Input
                            className="h-fit border-none px-0 pr-1 text-2xl shadow-none outline-none placeholder:text-[#8D9C9C] focus-visible:ring-0 lg:pr-0 lg:!text-3xl"
                            placeholder="0.00"
                            value={getDisplayValue(field.value)}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Store the precise value as-is (string)
                              field.onChange(value);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                          {usdValue !== null && (
                            <div className="px-3 text-xs text-[#6B7780]">
                              &asymp; ${formatNumber(usdValue.toFixed(2))}
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
            const quickStakeOptions = [
              { label: "25%", value: 25 },
              { label: "50%", value: 50 },
              { label: "75%", value: 75 },
              { label: "Max", value: 100 },
            ];
            return (
              <div className="flex w-full gap-2 text-[#8D9C9C]">
                {quickStakeOptions.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickStakePrice(value)}
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

      {sortedPlatforms.length > 0 && (
        <div className="">
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

      <div className="space-y-3">
        <h2 className="text-md text-[#6B7780]">TRANSACTION SUMMARY</h2>
        <div className="flex items-center justify-between rounded-md text-xs text-[#03624C] lg:text-[13px]">
          <p className="flex items-center gap-1">
            {selectedPlatform === "none" ? "You will receive" : "You will lend"}
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
                      staking token (LST) of Endur, representing your staked{" "}
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
          <div className="flex flex-col">
            <span className="text-xs">
              {formatNumberWithCommas(getCalculatedLSTAmount(), isBTC ? 8 : 2)}{" "}
              {lstConfig.LST_SYMBOL}
            </span>
            {calculatedLSTAmountUSD !== null && (
              <span className="text-right text-xs text-[#6B7780]">
                ≈ ${formatNumber(calculatedLSTAmountUSD.toFixed(2))}
              </span>
            )}
          </div>
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
                  as you get more {lstConfig.SYMBOL} rewards. The increase in
                  exchange rate of {lstConfig.LST_SYMBOL} will determine your
                  share of rewards.{" "}
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

      <div className="">
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
