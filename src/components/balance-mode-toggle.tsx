"use client";

import { useAtom } from "jotai";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  BalanceMode,
  balanceModeAtom,
} from "@/store/balance-mode.store";

export { BalanceMode };

type BalanceModeToggleProps = {
  onChange?: (mode: BalanceMode) => void;
};

const toggleButtonBase =
  "flex h-[30px] flex-1 grow flex-row items-start justify-center gap-1.5 rounded-[8px] p-1.5 text-sm font-medium transition-all";

const toggleButtonActive =
  "bg-white text-[#17876D] shadow-[0px_2px_4px_rgba(0,0,0,0.0313726)]";

const toggleButtonInactive = "text-[#6B7780]";

export const BalanceModeToggle = ({ onChange }: BalanceModeToggleProps) => {
  const [balanceMode, setBalanceMode] = useAtom(balanceModeAtom);

  const handleChange = (mode: BalanceMode) => {
    setBalanceMode(mode);
    onChange?.(mode);
  };

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
      <button
        type="button"
        onClick={() => handleChange(BalanceMode.SHIELDED)}
        className={cn(
          toggleButtonBase,
          balanceMode === BalanceMode.SHIELDED
            ? toggleButtonActive
            : toggleButtonInactive,
        )}
      >
        <EyeOff className="size-4" />
        Shielded
      </button>
    </div>
  );
};
