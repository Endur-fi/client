import React, { JSX } from "react";
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MyHeaderProps {
    title: string;
    description: string | React.ReactNode;
    icon: (props: LucideProps) => JSX.Element,
    customTitleSibling?: React.ReactNode
}

function MyHeader({ title, description, icon, customTitleSibling }: MyHeaderProps) {
    // return (
    //     <div className="grid grid-cols-[30px_auto] place-items-center gap-2">
    //         <div className="rounded-full bg-gradient-to-b from-[#0D5F4E] to-[#11998E] p-2">
    //             {icon({ className: "h-4 w-4" })}
    //         </div>
    //         <div className="w-full flex items-center gap-2">
    //             <h1 className="font-semibold text-[#1A1F24] lg:text-lg">
    //                 {title}
    //             </h1>
    //             {customTitleSibling}
    //         </div>
    //         <div className="col-span-full w-full lg:col-start-2">
    //             <p className="lg:text-[15px] mt-2 text-xs text-[#8D9C9C]">
    //                 {description}
    //             </p>
    //         </div>
    //     </div>
    // );

    return (
        <div
          className={cn(
            "flex w-full max-w-[calc(100vw-1rem)] flex-col gap-4 px-2 lg:max-w-4xl lg:items-start lg:px-0",
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
                <div className="rounded-full bg-gradient-to-b from-[#0D5F4E] to-[#11998E] p-2">
                    {icon({ className: "h-4 w-4" })}
                </div>
              <h1 className="text-left text-xl font-bold text-black">
                {title}
              </h1>
            </div>
            {customTitleSibling}
          </div>

          <p className="mt-1 text-sm text-[#8D9C9C]">
            {description}
          </p>
        </div>
    );
}

export default MyHeader;