"use client";

import { useAtomValue } from "jotai";
import { Pin } from "lucide-react";
import { Inter } from "next/font/google";
import React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { isMerryChristmasAtom } from "@/store/merry.store";

import { Icons } from "./Icons";
import SidebarFooterMenuItems from "./sidebar-footer-menu-items";
import SidebarMenuItems from "./sidebar-menu-items";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const font = Inter({ subsets: ["latin-ext"] });

export function AppSidebar() {
  const { open, isMobile, setOpen, isPinned, setIsPinned } = useSidebar();

  const isMerry = useAtomValue(isMerryChristmasAtom);

  if (typeof window === "undefined" || isMobile) return null;

  return (
    <Sidebar
      variant="floating"
      onMouseOver={() => !isPinned && setOpen(true)}
      onMouseLeave={() => !isPinned && setOpen(false)}
      containerClassname={cn("absolute group z-40", {
        static: isPinned,
        "z-20": isMerry,
      })}
    >
      <SidebarHeader className="p-0">
        <SidebarMenu>
          <SidebarMenuItem
            className={cn(
              font.className,
              "relative flex flex-row items-center justify-start gap-2 bg-[#AACBC433] px-2 py-10 transition-all duration-300",
              {
                "px-4": open,
              },
            )}
          >
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Pin
                    className={cn(
                      "absolute right-2 top-3 hidden size-4 cursor-pointer text-muted-foreground transition-all group-hover:block",
                      {
                        "block fill-[#17876D] text-[#17876D]": isPinned && open,
                      },
                    )}
                    onClick={() => setIsPinned(!isPinned)}
                  />
                </TooltipTrigger>

                <TooltipContent
                  side="right"
                  className="rounded-md border border-[#03624C] bg-[#E3EEEC] text-[#03624C]"
                >
                  {isPinned ? "Unpin Sidebar (⌘B)" : "Pin Sidebar (⌘B)"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Icons.logo className="shrink-0" />
            <div
              className={cn("hidden group-hover:block", {
                block: isPinned && open,
              })}
            >
              <Icons.endurNameOnlyLogo className="h-fit w-20" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className={cn("bg-[#AACBC433] pt-5", {})}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[#AACBC433] p-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarFooterMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
