import { cn } from "@/lib/utils";
import React from "react";

interface MaxWidthWrapperProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const MaxWidthWrapper: React.FC<MaxWidthWrapperProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      {...props}
      className={cn("mx-auto w-[min(80rem,_100%-2rem)]", className)}
    >
      {children}
    </div>
  );
};

export default MaxWidthWrapper;
