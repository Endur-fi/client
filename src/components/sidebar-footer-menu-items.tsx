"use client";

import Link from "next/link";
import React from "react";

import { BookTextIcon } from "./ui/book-text";
import { FilePenLineIcon } from "./ui/file-pen-line";
import { MessageCircleMoreIcon } from "./ui/message-circle-more";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar";
import { TelegramIcon } from "./ui/telegram";
import { TwitterIcon } from "./ui/twitter";

const SidebarFooterMenuItems = () => {
  const [triggerTwitterIconAnimation, setTriggerTwitterIconAnimation] =
    React.useState(false);
  const [triggerTelegramIconAnimation, setTriggerTelegramIconAnimation] =
    React.useState(false);
  const [triggerBlogIconAnimation, setTriggerBlogIconAnimation] =
    React.useState(false);
  const [triggerDocsIconAnimation, setTriggerDocsIconAnimation] =
    React.useState(false);
  const [triggerChatIconAnimation, setTriggerChatIconAnimation] =
    React.useState(false);

  const { open } = useSidebar();

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="transition-all hover:bg-[#17876D] hover:text-white"
          onMouseEnter={() => setTriggerTwitterIconAnimation(true)}
          onMouseLeave={() => setTriggerTwitterIconAnimation(false)}
        >
          <Link
            href={"https://x.com/endurfi"}
            target="_blank"
            className="flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <TwitterIcon
              className="size-4"
              triggerAnimation={triggerTwitterIconAnimation}
            />
            <span>{open && "Twitter"}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="transition-all hover:bg-[#17876D] hover:text-white"
          onMouseEnter={() => setTriggerTelegramIconAnimation(true)}
          onMouseLeave={() => setTriggerTelegramIconAnimation(false)}
        >
          <Link
            href={"https://t.me/+jWY71PfbMMIwMTBl"}
            target="_blank"
            className="flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <TelegramIcon
              className="size-4"
              triggerAnimation={triggerTelegramIconAnimation}
            />
            <span>{open && "Telegram"}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="transition-all hover:bg-[#17876D] hover:text-white"
          onMouseEnter={() => setTriggerBlogIconAnimation(true)}
          onMouseLeave={() => setTriggerBlogIconAnimation(false)}
        >
          <Link
            href={"https://blog.endur.fi/"}
            target="_blank"
            className="flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <FilePenLineIcon
              className="size-4"
              triggerAnimation={triggerBlogIconAnimation}
            />
            <span>{open && "Blog"}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="transition-all hover:bg-[#17876D] hover:text-white"
          onMouseEnter={() => setTriggerDocsIconAnimation(true)}
          onMouseLeave={() => setTriggerDocsIconAnimation(false)}
        >
          <Link
            href={"https://docs.endur.fi"}
            target="_blank"
            className="flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <BookTextIcon
              triggerAnimation={triggerDocsIconAnimation}
              className="size-4"
            />
            <span>{open && "Docs"}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="transition-all hover:bg-[#17876D] hover:text-white"
          onMouseEnter={() => setTriggerChatIconAnimation(true)}
          onMouseLeave={() => setTriggerChatIconAnimation(false)}
        >
          <Link
            href="https://t.me/+jWY71PfbMMIwMTBl"
            target="_blank"
            className="flex w-full cursor-pointer flex-row items-center gap-2 text-nowrap rounded-md text-base font-semibold text-[#03624C] transition-all"
          >
            <MessageCircleMoreIcon
              triggerAnimation={triggerChatIconAnimation}
              className="size-4 shrink-0"
            />
            <span>{open && "Support"}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default SidebarFooterMenuItems;
