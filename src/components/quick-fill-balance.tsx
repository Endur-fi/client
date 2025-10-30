import React from "react";

import { Icons } from "./Icons";

const QuickFillAndBalance: React.FC<{
  onQuickFill: (pct: number) => void;
  balance?: string | undefined;
  isBTC: boolean;
  symbol: string;
}> = ({ onQuickFill, balance, isBTC, symbol }) => {
  return (
    <div className="flex flex-col items-end">
      <div className="hidden text-[#8D9C9C] lg:block">
        <button
          onClick={() => onQuickFill(25)}
          className="rounded-md rounded-r-none border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
        >
          25%
        </button>
        <button
          onClick={() => onQuickFill(50)}
          className="border border-x-0 border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
        >
          50%
        </button>
        <button
          onClick={() => onQuickFill(75)}
          className="border border-r-0 border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
        >
          75%
        </button>
        <button
          onClick={() => onQuickFill(100)}
          className="rounded-md rounded-l-none border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
        >
          Max
        </button>
      </div>

      <button
        onClick={() => onQuickFill(100)}
        className="rounded-md bg-[#BBE7E7] px-2 py-1 text-xs font-semibold text-[#215959] transition-all hover:bg-[#BBE7E7] hover:opacity-80 lg:hidden"
      >
        Max
      </button>

      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#8D9C9C] lg:text-sm">
        <Icons.wallet className="size-3 lg:size-5" />
        <span className="hidden md:block">Balance:</span>
        <span className="font-bold">
          {balance ? Number(balance).toFixed(isBTC ? 8 : 2) : "0"} {symbol}
        </span>
      </div>
    </div>
  );
};

export default QuickFillAndBalance;
