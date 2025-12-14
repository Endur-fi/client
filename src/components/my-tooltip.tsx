import React, { useState } from "react";

const MyDottedTooltip = ({
  children,
  tooltip,
  className = "",
}: {
  children: React.ReactNode;
  tooltip: React.ReactNode;
  className?: string;
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
        <div className="absolute bottom-full left-1/2 z-[1000000] mb-2 w-[300px] max-w-[300px] -translate-x-1/2 transform rounded-lg border-[1px] border-gray-200 bg-white px-3 py-2 text-xs text-black shadow-lg" style={{zIndex: 1000000}}>
          {tooltip}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </span>
  );
};

export { MyDottedTooltip };
