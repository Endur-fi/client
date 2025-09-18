import React, { useState } from 'react';

const MyDottedTooltip = ({ children, tooltip, className = "" }: { children: React.ReactNode, tooltip: React.ReactNode, className?: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="border-b border-dotted border-current cursor-help">
        {children}
      </span>
      {showTooltip && (
        <div className="max-w-[300px] absolute bg-white text-black px-3 py-2 z-10 mb-2 bottom-full transform -translate-x-1/2 border-[1px] border-gray-200 shadow-lg text-xs rounded-lg shadow-lg left-1/2 w-[300px]">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </span>
  );
};

export { MyDottedTooltip };