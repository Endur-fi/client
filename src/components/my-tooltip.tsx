import React, { useState } from "react";

import { cn } from "@/lib/utils";

const MyDottedTooltip = ({
  children,
  tooltip,
  className = "",
  tooltipClassName = "",
  showDot = true,
}: {
  children: React.ReactNode;
  tooltip: React.ReactNode;
  className?: string;
  tooltipClassName?: string;
  showDot?: boolean;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="cursor-help border-b border-dotted border-current">
        {children}
      </span>

      {showTooltip && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 z-10 mb-2 w-[300px] max-w-[300px] -translate-x-1/2 transform rounded-lg border-[1px] border-gray-200 bg-white px-3 py-2 text-xs text-black shadow-lg",
            tooltipClassName,
          )}
        >
          {tooltip}
          {showDot && (
            <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          )}
        </div>
      )}
    </span>
  );
};

export { MyDottedTooltip };
