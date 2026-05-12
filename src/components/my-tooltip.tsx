import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [tooltipPosition, setTooltipPosition] = useState<{
    horizontal: "left" | "center" | "right";
    vertical: "top" | "bottom";
    x: number;
    y: number;
    arrowX: number;
  }>({ horizontal: "center", vertical: "top", x: 0, y: 0, arrowX: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (showTooltip && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const padding = 16; // 1rem padding from viewport edges

      // Force a reflow to get accurate tooltip dimensions
      tooltip.style.visibility = "hidden";
      tooltip.style.display = "block";
      const tooltipRect = tooltip.getBoundingClientRect();
      tooltip.style.visibility = "visible";

      // Calculate horizontal position
      const tooltipWidth = tooltipRect.width;
      const centerX = containerRect.left + containerRect.width / 2;
      const leftPosition = centerX - tooltipWidth / 2;
      const rightPosition = centerX + tooltipWidth / 2;

      let horizontalPos: "left" | "center" | "right" = "center";
      let x = centerX - tooltipWidth / 2;

      if (leftPosition < padding) {
        horizontalPos = "left";
        x = containerRect.left;
      } else if (rightPosition > viewportWidth - padding) {
        horizontalPos = "right";
        x = containerRect.right - tooltipWidth;
      }

      // Calculate vertical position (check if tooltip would overflow above viewport)
      const tooltipHeight = tooltipRect.height;
      const spaceAbove = containerRect.top;

      let verticalPos: "top" | "bottom" = "top";
      let y = containerRect.top - tooltipHeight - 8; // 8px gap

      if (spaceAbove < tooltipHeight + 8) {
        verticalPos = "bottom";
        y = containerRect.bottom + 8; // 8px gap
      }

      // Calculate arrow position (center of container relative to tooltip)
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const arrowX = containerCenterX - x;

      setTooltipPosition({
        horizontal: horizontalPos,
        vertical: verticalPos,
        x,
        y,
        arrowX,
      });
    }
  }, [showTooltip]);

  const getTooltipClasses = () => {
    return "fixed z-[1000000] rounded-lg border-[1px] border-gray-200 bg-white px-3 py-2 text-xs text-black shadow-lg w-[300px] max-w-[min(300px,calc(100vw-2rem))]";
  };

  const getTooltipStyles = () => {
    const styles: React.CSSProperties = {
      position: "fixed",
      zIndex: 1000000,
      wordBreak: "break-word",
      overflowWrap: "break-word",
      left: `${tooltipPosition.x}px`,
      top: `${tooltipPosition.y}px`,
      transform: "translateX(0)",
    };

    return styles;
  };

  const getArrowStyles = () => {
    const styles: React.CSSProperties = {
      position: "absolute",
      left: `${tooltipPosition.arrowX}px`,
      transform: "translateX(-50%)",
    };

    if (tooltipPosition.vertical === "top") {
      styles.top = "100%";
    } else {
      styles.bottom = "100%";
    }

    return styles;
  };

  const getArrowClasses = () => {
    const baseClasses =
      "absolute h-0 w-0 border-l-4 border-r-4 border-transparent";

    if (tooltipPosition.vertical === "top") {
      return `${baseClasses} border-t-4 border-t-gray-900`;
    }
    return `${baseClasses} border-b-4 border-b-gray-900`;
  };

  return (
    <>
      <span
        ref={containerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="cursor-help border-b border-dotted border-current">
          {children}
        </span>
      </span>
      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className={getTooltipClasses()}
            style={getTooltipStyles()}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="whitespace-normal break-words leading-relaxed">
              {tooltip}
            </div>
            <div className={getArrowClasses()} style={getArrowStyles()}></div>
          </div>,
          document.body,
        )}
    </>
  );
};

export { MyDottedTooltip };
