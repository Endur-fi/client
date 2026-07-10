"use client";

import { useAtomValue } from "jotai";
import {
  InteractionMode,
  useAccount,
  useBalance,
  useMode,
  useStrk20Balance,
} from "@easyleap/sdk";
import React from "react";
import { ChevronDown, Eye, EyeOff, Info, RotateCw } from "lucide-react";

import { Icons } from "./Icons";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  WBTC_ETH_TOKEN,
  getLSTAssetsByCategory,
  getSTRKAsset,
} from "@/constants";
import { cn, formatNumberWithCommas, standariseAddress } from "@/lib/utils";
import { lstStatsQueryAtom } from "@/store/lst.store";
import { btcPriceAtom, strkPriceAtom } from "@/store/staking.store";
import MyNumber from "@/lib/MyNumber";
import {
  GET_USER_NET_TOTAL_POINTS_SEASON1,
  GET_USER_NET_TOTAL_POINTS_SEASON2,
} from "@/constants/queries";
import { pointsApolloClient } from "@/lib/apollo-client";
import { MyAnalytics } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

const getBTCLSTIcon = (lstSymbol: string) => {
  switch (lstSymbol) {
    case "xstrkBTC":
      return <Icons.xstrkbtc className="h-5 w-5 shrink-0" />;
    case "xWBTC":
      return <Icons.xwbtc className="h-5 w-5 shrink-0" />;
    case "xtBTC":
      return <Icons.xtbtc className="h-5 w-5 shrink-0" />;
    case "xLBTC":
      return <Icons.xlbtc className="h-5 w-5 shrink-0" />;
    case "xsBTC":
      return <Icons.xsbtc className="h-5 w-5 shrink-0" />;
    default:
      return <div className="h-5 w-5 shrink-0" />;
  }
};

type PrivacyBalanceType = "shielded" | "unshielded";

type ShieldedBalanceState = {
  getBalance: () => void;
  isPending: boolean;
  isVisible: boolean;
  amount: number;
  decimals: number;
};

const PortfolioSection: React.FC = () => {
  const { starknetAddress: address } = useAccount();
  const mode = useMode();
  const strkLSTConfig = getSTRKAsset();
  const btcAssets = getLSTAssetsByCategory("BTC");

  const strkBtcAsset = btcAssets.find((asset) => asset.SYMBOL === "strkBTC");
  const wbtcAsset = btcAssets.find((asset) => asset.SYMBOL === "WBTC");
  const tbtcAsset = btcAssets.find((asset) => asset.SYMBOL === "tBTC");
  const lbtcAsset = btcAssets.find((asset) => asset.SYMBOL === "LBTC");
  const solvbtcAsset = btcAssets.find((asset) => asset.SYMBOL === "solvBTC");

  // xSTRK / xyBTC row dropdowns showing shielded + unshielded balances
  const [isStrkExpanded, setIsStrkExpanded] = React.useState(false);
  const [isBtcExpanded, setIsBtcExpanded] = React.useState(false);

  // Get STRK LST balance
  const strkLSTBalanceData = useBalance(
    strkLSTConfig.LST_ADDRESS as `0x${string}`,
  );

  // Get BTC LST balances
  const wbtcTokenAddress =
    mode === InteractionMode.EVM
      ? (WBTC_ETH_TOKEN as `0x${string}`)
      : (btcAssets.find((a) => a.SYMBOL === "WBTC")
          ?.LST_ADDRESS as `0x${string}`);

  const strkBtcBalance = useBalance(
    btcAssets.find((a) => a.SYMBOL === "strkBTC")?.LST_ADDRESS as `0x${string}`,
  );
  const wbtcBalance = useBalance(wbtcTokenAddress);
  const tbtcBalance = useBalance(
    btcAssets.find((a) => a.SYMBOL === "tBTC")?.LST_ADDRESS as `0x${string}`,
  );
  const lbtcBalance = useBalance(
    btcAssets.find((a) => a.SYMBOL === "LBTC")?.LST_ADDRESS as `0x${string}`,
  );
  const solvbtcBalance = useBalance(
    btcAssets.find((a) => a.SYMBOL === "solvBTC")?.LST_ADDRESS as `0x${string}`,
  );

  const xstrkShieldedBalance = useStrk20Balance(
    standariseAddress(strkLSTConfig.LST_ADDRESS) as `0x${string}`,
    { decimals: strkLSTConfig.DECIMALS },
  );
  const strkBtcShieldedBalance = useStrk20Balance(
    standariseAddress(strkBtcAsset?.LST_ADDRESS ?? "0x0") as `0x${string}`,
    { decimals: strkBtcAsset?.DECIMALS ?? 8 },
  );
  const wbtcShieldedBalance = useStrk20Balance(
    standariseAddress(wbtcAsset?.LST_ADDRESS ?? "0x0") as `0x${string}`,
    { decimals: wbtcAsset?.DECIMALS ?? 8 },
  );
  const tbtcShieldedBalance = useStrk20Balance(
    standariseAddress(tbtcAsset?.LST_ADDRESS ?? "0x0") as `0x${string}`,
    { decimals: tbtcAsset?.DECIMALS ?? 18 },
  );
  const lbtcShieldedBalance = useStrk20Balance(
    standariseAddress(lbtcAsset?.LST_ADDRESS ?? "0x0") as `0x${string}`,
    { decimals: lbtcAsset?.DECIMALS ?? 8 },
  );
  const solvbtcShieldedBalance = useStrk20Balance(
    standariseAddress(solvbtcAsset?.LST_ADDRESS ?? "0x0") as `0x${string}`,
    { decimals: solvbtcAsset?.DECIMALS ?? 18 },
  );

  React.useEffect(() => {
    if (!address) return;
    xstrkShieldedBalance.reset();
    strkBtcShieldedBalance.reset();
    wbtcShieldedBalance.reset();
    tbtcShieldedBalance.reset();
    lbtcShieldedBalance.reset();
    solvbtcShieldedBalance.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on wallet change only
  }, [address]);

  const getShieldedBalanceState = (
    hook: ReturnType<typeof useStrk20Balance>,
    decimals: number,
  ): ShieldedBalanceState => ({
    getBalance: hook.getBalance,
    isPending: hook.isPending,
    isVisible: Boolean(hook.data?.formatted),
    amount: hook.data?.formatted ? Number(hook.data.formatted) : 0,
    decimals,
  });

  const shieldedBalancesByAssetSymbol = React.useMemo<
    Record<string, ShieldedBalanceState>
  >(
    () => ({
      STRK: getShieldedBalanceState(
        xstrkShieldedBalance,
        strkLSTConfig.DECIMALS,
      ),
      ...(strkBtcAsset
        ? {
            strkBTC: getShieldedBalanceState(
              strkBtcShieldedBalance,
              strkBtcAsset.DECIMALS,
            ),
          }
        : {}),
      ...(wbtcAsset
        ? {
            WBTC: getShieldedBalanceState(
              wbtcShieldedBalance,
              wbtcAsset.DECIMALS,
            ),
          }
        : {}),
      ...(tbtcAsset
        ? {
            tBTC: getShieldedBalanceState(
              tbtcShieldedBalance,
              tbtcAsset.DECIMALS,
            ),
          }
        : {}),
      ...(lbtcAsset
        ? {
            LBTC: getShieldedBalanceState(
              lbtcShieldedBalance,
              lbtcAsset.DECIMALS,
            ),
          }
        : {}),
      ...(solvbtcAsset
        ? {
            solvBTC: getShieldedBalanceState(
              solvbtcShieldedBalance,
              solvbtcAsset.DECIMALS,
            ),
          }
        : {}),
    }),
    [
      lbtcAsset,
      lbtcShieldedBalance,
      solvbtcAsset,
      solvbtcShieldedBalance,
      strkBtcAsset,
      strkBtcShieldedBalance,
      strkLSTConfig.DECIMALS,
      tbtcAsset,
      tbtcShieldedBalance,
      wbtcAsset,
      wbtcShieldedBalance,
      xstrkShieldedBalance,
    ],
  );

  // Get prices and stats
  const strkPrice = useAtomValue(strkPriceAtom);
  const btcPrice = useAtomValue(btcPriceAtom);
  const lstStats = useAtomValue(lstStatsQueryAtom);

  // Calculate STRK holdings
  const strkHoldings = React.useMemo(() => {
    const unshieldedLstAmount =
      !strkLSTBalanceData.data?.value ||
      strkLSTBalanceData.data.value === BigInt(0)
        ? 0
        : Number(
            new MyNumber(
              strkLSTBalanceData.data.value.toString(),
              strkLSTConfig.DECIMALS,
            ).toEtherStr(),
          );

    const strkShielded = shieldedBalancesByAssetSymbol.STRK;
    const shieldedLstAmount =
      strkShielded?.isVisible && strkShielded.amount > 0
        ? strkShielded.amount
        : 0;
    const lstAmount = unshieldedLstAmount + shieldedLstAmount;

    if (lstAmount === 0) {
      return {
        lstAmount: 0,
        underlyingSTRK: 0,
        usdValue: 0,
        unshieldedLstAmount: 0,
        unshieldedUsdValue: 0,
      };
    }

    const strkStat = lstStats.data?.find(
      (stat) =>
        stat.lstAddress?.toLowerCase() ===
        strkLSTConfig.LST_ADDRESS?.toLowerCase(),
    );
    const exchangeRate = strkStat?.exchangeRate || 0;
    const underlyingSTRK = lstAmount * exchangeRate;
    const usdValue = strkPrice ? underlyingSTRK * strkPrice : 0;
    const unshieldedUnderlyingSTRK = unshieldedLstAmount * exchangeRate;
    const unshieldedUsdValue = strkPrice
      ? unshieldedUnderlyingSTRK * strkPrice
      : 0;

    return {
      lstAmount,
      underlyingSTRK,
      usdValue,
      unshieldedLstAmount,
      unshieldedUsdValue,
    };
  }, [
    shieldedBalancesByAssetSymbol.STRK,
    strkLSTBalanceData,
    strkLSTConfig,
    lstStats,
    strkPrice,
  ]);

  // Calculate BTC holdings
  const btcLSTBalances = React.useMemo(() => {
    return btcAssets.map((asset) => {
      let balance = BigInt(0);
      switch (asset.SYMBOL) {
        case "strkBTC":
          balance = strkBtcBalance.data?.value || BigInt(0);
          break;
        case "WBTC":
          balance = wbtcBalance.data?.value || BigInt(0);
          break;
        case "tBTC":
          balance = tbtcBalance.data?.value || BigInt(0);
          break;
        case "LBTC":
          balance = lbtcBalance.data?.value || BigInt(0);
          break;
        case "solvBTC":
          balance = solvbtcBalance.data?.value || BigInt(0);
          break;
        default:
          balance = BigInt(0);
      }
      return {
        asset,
        balance,
      };
    });
  }, [wbtcBalance, tbtcBalance, lbtcBalance, solvbtcBalance, btcAssets]);

  const btcHoldings = React.useMemo(() => {
    const holdings = btcLSTBalances
      .filter(({ balance, asset }) => {
        const shielded = shieldedBalancesByAssetSymbol[asset.SYMBOL];
        const hasShielded =
          shielded?.isVisible && (shielded.amount ?? 0) > 0;
        return balance > 0 || hasShielded;
      })
      .map(({ balance, asset }) => {
        const unshieldedLstAmount = Number(
          new MyNumber(balance.toString(), asset.DECIMALS).toEtherStr(),
        );
        const shielded = shieldedBalancesByAssetSymbol[asset.SYMBOL];
        const shieldedLstAmount =
          shielded?.isVisible && shielded.amount > 0 ? shielded.amount : 0;
        const lstAmount = unshieldedLstAmount + shieldedLstAmount;

        const lstStat = lstStats.data?.find(
          (stat) =>
            stat.lstAddress?.toLowerCase() === asset.LST_ADDRESS?.toLowerCase(),
        );
        const exchangeRate = lstStat?.exchangeRate || 1;
        const underlyingBTC = lstAmount * exchangeRate;
        const usdValue = btcPrice ? underlyingBTC * btcPrice : 0;

        return {
          asset,
          lstAmount,
          underlyingBTC,
          usdValue,
          unshieldedLstAmount,
          unshieldedUsdValue: btcPrice
            ? unshieldedLstAmount *
              (lstStat?.exchangeRate || 1) *
              btcPrice
            : 0,
        };
      });

    const totalLSTAmount = holdings.reduce((sum, h) => sum + h.lstAmount, 0);
    const totalUnderlyingBTC = holdings.reduce(
      (sum, h) => sum + h.underlyingBTC,
      0,
    );
    const totalUsd = holdings.reduce((sum, h) => sum + h.usdValue, 0);

    return {
      holdings,
      totalLSTAmount,
      totalUnderlyingBTC,
      totalUsd,
    };
  }, [btcLSTBalances, btcPrice, lstStats, shieldedBalancesByAssetSymbol]);

  // Calculate total value staked
  const totalValueStaked = React.useMemo(() => {
    let total = 0;
    if (strkHoldings) {
      total += strkHoldings.usdValue;
    }
    total += btcHoldings.totalUsd;
    return total;
  }, [strkHoldings, btcHoldings]);

  // Fetch Season 1 points from API - using same logic as rewards page
  const [season1Points, setSeason1Points] = React.useState<string | null>(null);
  const [season1Loading, setSeason1Loading] = React.useState(false);

  const [season2Points, setSeason2Points] = React.useState<string | null>(null);
  const [season2Loading, setSeason2Loading] = React.useState(false);

  React.useEffect(() => {
    if (!address) {
      setSeason1Points(null);
      return;
    }

    const fetchSeason1Points = async () => {
      setSeason1Loading(true);
      try {
        const result = await pointsApolloClient.query({
          query: GET_USER_NET_TOTAL_POINTS_SEASON1,
          variables: { userAddress: address },
          fetchPolicy: "network-only",
        });

        const userData = result.data?.getUserNetTotalPointsSeason1;

        // Use weightedTotalPoints for display (weighted points refer to previous total_points)
        if (userData?.weightedTotalPoints) {
          setSeason1Points(userData.weightedTotalPoints);
        } else {
          setSeason1Points("0");
        }
      } catch (error) {
        console.error("Error fetching Season 1 points:", error);
        setSeason1Points("0");
      } finally {
        setSeason1Loading(false);
      }
    };

    fetchSeason1Points();
  }, [address, pointsApolloClient]);

  // Season 2 is 0 for now
  React.useEffect(() => {
    if (!address) {
      setSeason2Points(null);
      return;
    }

    const fetchSeason2Points = async () => {
      setSeason2Loading(true);
      try {
        const result = await pointsApolloClient.query({
          query: GET_USER_NET_TOTAL_POINTS_SEASON2,
          variables: { userAddress: address, overall: true },
          fetchPolicy: "network-only",
        });

        const userData = result.data?.getUserNetTotalPointsSeason2;

        // Use weightedTotalPoints for display (weighted points refer to previous total_points)
        if (userData?.weightedTotalPoints) {
          setSeason2Points(userData.weightedTotalPoints);
        } else {
          setSeason2Points("0");
        }
      } catch (error) {
        console.error("Error fetching Season 2 points:", error);
        setSeason2Points("0");
      } finally {
        setSeason2Loading(false);
      }
    };

    fetchSeason2Points();
  }, [address, pointsApolloClient]);

  const getShieldedUsdValue = (
    lstAmount: number,
    fallbackExchangeRate: number,
    price: number | undefined,
    lstAddress: string,
  ) => {
    const lstStat = lstStats.data?.find(
      (stat) => stat.lstAddress?.toLowerCase() === lstAddress.toLowerCase(),
    );
    const exchangeRate = lstStat?.exchangeRate ?? fallbackExchangeRate;
    const underlying = lstAmount * exchangeRate;
    return price ? underlying * price : 0;
  };

  const renderPrivacyBalanceRow = (
    assetSymbol: string,
    lstSymbol: string,
    type: PrivacyBalanceType,
    options?: {
      unshieldedValue?: { amount: number; usdValue: number; decimals?: number };
      lstAddress?: string;
      fallbackExchangeRate?: number;
      price?: number;
      displayDecimals?: number;
    },
  ) => {
    const key = `${assetSymbol}-${type}`;
    const isShielded = type === "shielded";
    const shieldedBalance = shieldedBalancesByAssetSymbol[assetSymbol];
    const displayDecimals =
      options?.displayDecimals ?? options?.unshieldedValue?.decimals ?? 2;

    return (
      <div
        key={key}
        className="flex items-start justify-between gap-3 text-xs"
      >
        <div className="flex shrink-0 gap-1.5">
          {isShielded ? (
            <EyeOff className="h-4 w-4 shrink-0 text-[#0D5F4E]" />
          ) : (
            <Eye className="h-4 w-4 shrink-0 text-[#6B7780]" />
          )}
          <span className={isShielded ? "text-[#0D5F4E]" : "text-[#6B7780]"}>
            {isShielded ? "Shielded" : "Unshielded"}
          </span>
        </div>
        {isShielded ? (
          <div className="flex min-w-0 max-w-[65%] flex-col items-end gap-0.5">
            {!shieldedBalance?.isVisible ? (
              <span className="flex items-center gap-1 text-[#1A1F24]">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={shieldedBalance?.getBalance}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      shieldedBalance?.getBalance();
                    }
                  }}
                  aria-label={`Reveal shielded balance for ${lstSymbol}`}
                  aria-disabled={shieldedBalance?.isPending}
                  className={cn(
                    "shrink-0 text-[#6B7780] transition-colors hover:text-[#1A1F24]",
                    shieldedBalance?.isPending &&
                      "cursor-not-allowed opacity-50",
                  )}
                >
                  <Eye
                    className={cn(
                      "h-3 w-3",
                      shieldedBalance?.isPending && "animate-pulse",
                    )}
                  />
                </span>
                **** {lstSymbol}
              </span>
            ) : (
              <>
                <span className="flex max-w-full items-center justify-end gap-1 text-[#1A1F24]">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={shieldedBalance.getBalance}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        shieldedBalance.getBalance();
                      }
                    }}
                    aria-label={`Refresh shielded balance for ${lstSymbol}`}
                    aria-disabled={shieldedBalance.isPending}
                    className={cn(
                      "shrink-0 text-[#6B7780] transition-colors hover:text-[#1A1F24]",
                      shieldedBalance.isPending &&
                        "cursor-not-allowed opacity-50",
                    )}
                  >
                    <RotateCw
                      className={cn(
                        "h-3 w-3",
                        shieldedBalance.isPending && "animate-spin",
                      )}
                    />
                  </span>
                  <span className="truncate">
                    {formatNumberWithCommas(
                      shieldedBalance.amount,
                      displayDecimals,
                    )}{" "}
                    {lstSymbol}
                  </span>
                </span>
                <span className="max-w-full truncate text-right text-[#6B7780]">
                  $
                  {formatNumberWithCommas(
                    getShieldedUsdValue(
                      shieldedBalance.amount,
                      options?.fallbackExchangeRate ?? 1,
                      options?.price,
                      options?.lstAddress ?? "",
                    ),
                    2,
                  )}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex min-w-0 max-w-[65%] flex-col items-end gap-0.5">
            <span className="max-w-full truncate text-right text-[#1A1F24]">
              {formatNumberWithCommas(
                options?.unshieldedValue?.amount ?? 0,
                displayDecimals,
              )}{" "}
              {lstSymbol}
            </span>
            <span className="max-w-full truncate text-right text-[#6B7780]">
              ${formatNumberWithCommas(options?.unshieldedValue?.usdValue ?? 0, 2)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-col gap-6 lg:max-w-none",
        "rounded-[14px] border border-[#E5E8EB]",
        "shadow-[0_1px_2px_-1px_#0000001A,_0_1px_3px_0_#0000001A]",
      )}
    >
      <div className="flex flex-col gap-4 rounded-xl border border-[#E5E8EB] bg-white px-2 py-3 shadow-sm lg:p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-[#6B7780]">PORTFOLIO</h2>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-[#E5E8EB] pb-2">
          <span className="text-sm text-[#6B7780]">Your Stake</span>
          <span className="text-xl text-[#1A1F24]">
            {!address
              ? "-"
              : `$${formatNumberWithCommas(totalValueStaked.toFixed(2))}`}
          </span>
        </div>

        {/* xSTRK Holdings */}
        <Collapsible
          open={isStrkExpanded}
          onOpenChange={setIsStrkExpanded}
          className="rounded-xl px-0 py-1 lg:px-0 lg:py-0"
        >
          <CollapsibleTrigger className="group flex w-full items-start gap-3 text-left">
            <Icons.strkLogo className="h-10 w-10 shrink-0" />
            <div className="flex flex-1 items-start justify-between">
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex w-full items-center justify-between">
                  <span className="text-left text-sm text-[#1A1F24]">
                    {formatNumberWithCommas(strkHoldings.lstAmount, 2)} xSTRK
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-[#1A1F24]">
                      {formatNumberWithCommas(strkHoldings.underlyingSTRK, 2)}{" "}
                      STRK
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#6B7780] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </div>
                <span className="text-left text-xs text-[#6B7780]">
                  ${formatNumberWithCommas(strkHoldings.usdValue, 2)}
                </span>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 space-y-3 lg:ml-[52px]">
              {renderPrivacyBalanceRow("STRK", "xSTRK", "shielded", {
                lstAddress: strkLSTConfig.LST_ADDRESS,
                fallbackExchangeRate: 0,
                price: strkPrice,
                displayDecimals: 2,
              })}
              {renderPrivacyBalanceRow("STRK", "xSTRK", "unshielded", {
                unshieldedValue: {
                  amount: strkHoldings.unshieldedLstAmount,
                  usdValue: strkHoldings.unshieldedUsdValue,
                  decimals: 2,
                },
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* BTC Holdings */}
        <Collapsible
          open={isBtcExpanded}
          onOpenChange={setIsBtcExpanded}
          className="rounded-xl px-0 py-1 lg:px-0 lg:py-0"
        >
          <CollapsibleTrigger className="group flex w-full items-start gap-3 text-left">
            <Icons.btcLogo className="h-10 w-10 shrink-0" />
            <div className="flex flex-1 items-start justify-between">
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex w-full items-center justify-between">
                  <span className="text-left text-sm text-[#1A1F24]">
                    {formatNumberWithCommas(btcHoldings.totalLSTAmount, 6)}{" "}
                    xyBTC
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-[#1A1F24]">
                      {formatNumberWithCommas(
                        btcHoldings.totalUnderlyingBTC,
                        6,
                      )}{" "}
                      BTC
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#6B7780] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </div>
                <span className="text-left text-xs text-[#6B7780]">
                  ${formatNumberWithCommas(btcHoldings.totalUsd, 2)}
                </span>
              </div>
            </div>
          </CollapsibleTrigger>
          {btcHoldings.holdings.length > 0 && (
            <CollapsibleContent>
              <div className="mt-3 space-y-4 rounded-lg bg-[#F5F7F8] p-3 lg:ml-[20px]">
                {btcHoldings.holdings.map((holding) => (
                  <div key={holding.asset.SYMBOL} className="space-y-2">
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          {getBTCLSTIcon(holding.asset.LST_SYMBOL)}
                          <span className="text-[#1A1F24]">
                            {formatNumberWithCommas(holding.lstAmount, 6)}{" "}
                            {holding.asset.LST_SYMBOL}
                          </span>
                        </div>
                        <span className="ml-[22px] text-[#6B7780]">
                          ${formatNumberWithCommas(holding.usdValue, 2)}
                        </span>
                      </div>
                      <span className="text-right text-[#6B7780]">
                        {formatNumberWithCommas(holding.underlyingBTC, 6)}{" "}
                        {holding.asset.SYMBOL}
                      </span>
                    </div>
                    <div className="ml-[22px] space-y-1.5 border-l border-[#E5E8EB] pl-2">
                      {renderPrivacyBalanceRow(
                        holding.asset.SYMBOL,
                        holding.asset.LST_SYMBOL,
                        "shielded",
                        {
                          lstAddress: holding.asset.LST_ADDRESS,
                          fallbackExchangeRate: 1,
                          price: btcPrice,
                          displayDecimals: 6,
                        },
                      )}
                      {renderPrivacyBalanceRow(
                        holding.asset.SYMBOL,
                        holding.asset.LST_SYMBOL,
                        "unshielded",
                        {
                          unshieldedValue: {
                            amount: holding.unshieldedLstAmount,
                            usdValue: holding.unshieldedUsdValue,
                            decimals: 6,
                          },
                        },
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>

        {/* Info Message */}
        <div className="rounded-lg border border-[#FFC46680] bg-[#FFC4661A] p-2 text-xs text-[#D69733]">
          <p className="mb-1">
            Only wallet-held LSTs are shown. LSTs deployed in third-party dApps
            {" won't"} appear here.
          </p>
          {/* TODO: Add link to portfolio page */}
          {/* <Link
            href="/portfolio"
            className="inline-flex items-center gap-1 font-medium text-[#0D5F4E] hover:underline"
          >
            Visit Portfolio page
            <ExternalLink className="h-3 w-3" />
          </Link> */}
        </div>

        {/* Season Points */}
        <div className="border-t border-[#E5E8EB] p-2 lg:p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#6B7780]">Season 1 Points</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-[#6B7780]" />
                    </TooltipTrigger>
                    <TooltipContent
                      className="max-w-xs rounded-md border border-[#03624C] bg-white text-[#03624C]"
                      onPointerDownOutside={() => {
                        MyAnalytics.track(
                          AnalyticsEvents.SEASON_POINTS_TOOLTIP_OPEN,
                          { season: 1 },
                        );
                      }}
                    >
                      Points earned during Season 1 [Nov 27th 2024 - Dec 15th
                      2025]
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm text-[#1A1F24]">
                {!address
                  ? "-"
                  : season1Loading
                    ? "..."
                    : season1Points !== null
                      ? `${formatNumberWithCommas(season1Points)} pts`
                      : "0 pts"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#6B7780]">Season 2 Points</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-[#6B7780]" />
                    </TooltipTrigger>
                    <TooltipContent
                      className="max-w-xs rounded-md border border-[#03624C] bg-white text-[#03624C]"
                      onPointerDownOutside={() => {
                        MyAnalytics.track(
                          AnalyticsEvents.SEASON_POINTS_TOOLTIP_OPEN,
                          { season: 2 },
                        );
                      }}
                    >
                      Points earned during Season 2 [Dec 16th 2025 - June 15th
                      2026]
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm text-[#1A1F24]">
                {!address
                  ? "-"
                  : season2Loading
                    ? "..."
                    : season2Points !== null
                      ? `${formatNumberWithCommas(season2Points)} pts`
                      : "0 pts"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSection;
