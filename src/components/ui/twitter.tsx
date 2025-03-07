"use client";

import { motion, useAnimation } from "motion/react";
import React from "react";

import { cn } from "@/lib/utils";

export interface CustomIconProps {
  className?: string;
  triggerAnimation?: boolean;
  asIcon?: boolean;
}

const TwitterIcon: React.FC<CustomIconProps> = ({
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
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        variants={{
          normal: {
            translateX: 0,
            translateY: 0,
            rotate: "0deg",
          },
          animate: {
            translateX: 2,
            rotate: "1deg",
          },
        }}
        animate={controls}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
      >
        <path
          d="M 15.418 19.037 L 3.44 3.637 C 3.311 3.471 3.288 3.247 3.381 3.058 C 3.473 2.87 3.665 2.75 3.875 2.75 L 6.148 2.75 C 6.318 2.75 6.478 2.829 6.582 2.963 L 18.56 18.363 C 18.689 18.529 18.712 18.753 18.619 18.942 C 18.527 19.13 18.335 19.25 18.125 19.25 L 15.852 19.25 C 15.682 19.25 15.522 19.171 15.418 19.037 Z"
          fill="transparent"
          strokeWidth="1.38"
          strokeMiterlimit="10"
          stroke={"currentColor"}
        ></path>
        <path
          d="M 18.333 2.75 L 3.667 19.25"
          fill="transparent"
          strokeWidth="1.38"
          strokeLinecap="round"
          strokeMiterlimit="10"
          stroke={"currentColor"}
        ></path>
      </motion.svg>
    </div>
  );
};

export { TwitterIcon };
