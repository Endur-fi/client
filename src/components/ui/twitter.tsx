"use client";

import { motion, useAnimation } from "motion/react";
import React from "react";

import { cn } from "@/lib/utils";

const TwitterIcon = ({
  className,
  triggerAnimation,
}: {
  className?: string;
  triggerAnimation?: boolean;
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
      //   onMouseEnter={() => controls.start("animate")}
      //   onMouseLeave={() => controls.start("normal")}
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
            // translate: 2,
            rotate: "1deg",
          },
        }}
        animate={controls}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
      >
        <g clipPath="url(#clip0_7_815)">
          <path
            d="M17.5608 16.9695L12.3459 8.76957L17.4897 3.11049C17.6052 2.97723 17.6674 2.80844 17.6585 2.63076C17.6496 2.45308 17.5697 2.29317 17.4453 2.17768C17.312 2.06219 17.1433 2 16.9656 2.00888C16.7879 2.00888 16.628 2.08884 16.5036 2.2221L11.5997 7.61466L8.23265 2.31094C8.17046 2.21321 8.09051 2.14214 7.99278 2.07996C7.89506 2.02665 7.77957 2 7.67296 2H3.67518C3.55969 2 3.43531 2.03554 3.33759 2.08884C3.23098 2.15103 3.15103 2.23987 3.08884 2.33759C3.02665 2.45308 3 2.56857 3 2.68406C3 2.79956 3.03554 2.92393 3.10661 3.02165L8.32149 11.2215L3.17768 16.8806C3.11549 16.9428 3.07107 17.0228 3.04442 17.1027C3.01777 17.1827 3 17.2715 3 17.3604C3 17.4492 3.02665 17.538 3.06219 17.618C3.09772 17.6979 3.15103 17.769 3.21321 17.8312C3.2754 17.8934 3.35536 17.9378 3.43531 17.9645C3.51527 17.9911 3.60411 18.0089 3.69295 18C3.78179 18 3.87063 17.9733 3.95058 17.9378C4.03054 17.9023 4.10161 17.849 4.1638 17.7779L9.06774 12.3853L12.4436 17.6891C12.5058 17.7868 12.5858 17.8579 12.6835 17.9112C12.7812 17.9645 12.8878 17.9911 13.0033 17.9911H17.0011C17.1166 17.9911 17.241 17.9556 17.3387 17.9023C17.4453 17.8401 17.5253 17.7513 17.5875 17.6535C17.6408 17.5469 17.6763 17.4314 17.6674 17.3159C17.6674 17.2004 17.6319 17.085 17.5608 16.9783V16.9695ZM13.3676 16.6585L4.8834 3.33259H7.29983L15.784 16.6585H13.3676Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_7_815">
            <rect
              width="14.6674"
              height="16"
              fill="white"
              transform="translate(3 2)"
            />
          </clipPath>
        </defs>
      </motion.svg>
    </div>
  );
};

export { TwitterIcon };
