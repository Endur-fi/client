"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import React from "react";

import { cn } from "@/lib/utils";

import { CustomIconProps } from "./twitter";

const pathVariant: Variants = {
  normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
  },
};

const circleVariant: Variants = {
  normal: {
    pathLength: 1,
    pathOffset: 0,
    scale: 1,
  },
  animate: {
    pathLength: [0, 1],
    pathOffset: [1, 0],
    scale: [0.5, 1],
  },
};

const UserIcon: React.FC<CustomIconProps> = ({
  className,
  triggerAnimation,
  asIcon = false,
}) => {
  const controls = useAnimation();

  React.useEffect(() => {
    if (triggerAnimation) {
      controls.start("animate");
    } else {
      controls.start("normal");
    }
  }, [triggerAnimation]);

  return (
    <div
      className={cn(
        "flex cursor-pointer select-none items-center justify-center rounded-md",
        className,
      )}
      onMouseEnter={() => asIcon && controls.start("animate")}
      onMouseLeave={() => asIcon && controls.start("normal")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.circle
          cx="12"
          cy="8"
          r="5"
          animate={controls}
          variants={circleVariant}
        />

        <motion.path
          d="M20 21a8 8 0 0 0-16 0"
          variants={pathVariant}
          transition={{
            delay: 0.2,
            duration: 0.4,
          }}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { UserIcon };
