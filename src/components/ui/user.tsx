"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import React from "react";

import { cn } from "@/lib/utils";

import { CustomIconProps } from "./twitter";

const headVariants: Variants = {
  normal: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 15,
    },
  },
  animate: {
    scale: [0.5, 1],
    opacity: [0, 1],
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 15,
    },
  },
};

const bodyVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.3 },
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      delay: 0.15,
      duration: 0.4,
      opacity: { duration: 0.15, delay: 0.1 },
    },
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
        "flex shrink-0 cursor-pointer select-none items-center justify-center rounded-md",
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
          variants={headVariants}
          style={{ transformOrigin: "12px 8px" }}
        />
        <motion.path
          d="M20 21a8 8 0 0 0-16 0"
          variants={bodyVariants}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { UserIcon };
