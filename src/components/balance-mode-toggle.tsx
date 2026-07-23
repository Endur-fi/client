"use client";

import { useAccount } from "@easyleap/sdk";
import { useAtom } from "jotai";
import { Eye, EyeOff } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isShieldedModeSupported } from "@/lib/shielded-wallets";
import {
  BalanceMode,
  balanceModeAtom,
} from "@/store/balance-mode.store";

export { BalanceMode };

const MODE_QUERY_KEY = "mode";

type BalanceModeToggleProps = {
  onChange?: (mode: BalanceMode) => void;
};

const toggleButtonBase =
  "flex h-[30px] flex-1 grow flex-row items-start justify-center gap-1.5 rounded-[8px] p-1.5 text-sm font-medium transition-all";

const toggleButtonActive =
  "bg-white text-[#17876D] shadow-[0px_2px_4px_rgba(0,0,0,0.0313726)]";

const toggleButtonInactive = "text-[#6B7780]";

function modeFromSearchParams(searchParams: URLSearchParams): BalanceMode {
  return searchParams.get(MODE_QUERY_KEY) === BalanceMode.SHIELDED
    ? BalanceMode.SHIELDED
    : BalanceMode.UNSHIELDED;
}

export const BalanceModeToggle = ({ onChange }: BalanceModeToggleProps) => {
  const [balanceMode, setBalanceMode] = useAtom(balanceModeAtom);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { starknetAddress, connector } = useAccount();
  const isWalletConnected = Boolean(starknetAddress);
  const isShieldedSupported = isShieldedModeSupported(connector?.name);

  // Keep atom in sync with URL (deep links, back/forward, asset switches)
  useEffect(() => {
    const nextMode = modeFromSearchParams(searchParams);
    setBalanceMode(nextMode);
  }, [searchParams, setBalanceMode]);

  const updateUrl = (mode: BalanceMode) => {
    const params = new URLSearchParams(searchParams.toString());

    if (mode === BalanceMode.SHIELDED) {
      params.set(MODE_QUERY_KEY, BalanceMode.SHIELDED);
    } else {
      params.delete(MODE_QUERY_KEY);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleChange = (mode: BalanceMode) => {
    if (mode === BalanceMode.SHIELDED && !isShieldedSupported) return;
    setBalanceMode(mode);
    updateUrl(mode);
    onChange?.(mode);
  };

  const shieldedButton = (
    <button
      type="button"
      onClick={() => handleChange(BalanceMode.SHIELDED)}
      aria-disabled={!isShieldedSupported}
      className={cn(
        toggleButtonBase,
        balanceMode === BalanceMode.SHIELDED
          ? toggleButtonActive
          : toggleButtonInactive,
        !isShieldedSupported && "cursor-not-allowed opacity-50",
      )}
    >
      <EyeOff className="size-4" />
      Shielded
    </button>
  );

  return (
    <div className="flex h-[38px] w-full flex-none grow-0 flex-row items-start gap-1 self-stretch rounded-[10px] bg-[#F5F7FA] p-1">
      <button
        type="button"
        onClick={() => handleChange(BalanceMode.UNSHIELDED)}
        className={cn(
          toggleButtonBase,
          balanceMode === BalanceMode.UNSHIELDED
            ? toggleButtonActive
            : toggleButtonInactive,
        )}
      >
        <Eye className="size-4" />
        Unshielded
      </button>
      {isShieldedSupported ? (
        shieldedButton
      ) : (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{shieldedButton}</TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-60 rounded-md border border-[#03624C] bg-white text-center text-[#03624C]"
            >
              {isWalletConnected
                ? "Your connected wallet doesn't support shielded mode"
                : "Please connect wallet"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
