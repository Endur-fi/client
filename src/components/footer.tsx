import React from "react";

import { BookTextIcon } from "@/components/ui/book-text";
import { FilePenLineIcon } from "@/components/ui/file-pen-line";
import { MessageCircleMoreIcon } from "@/components/ui/message-circle-more";
import { TelegramIcon } from "@/components/ui/telegram";
import { TwitterIcon } from "@/components/ui/twitter";
import { LINKS } from "@/constants";

import { FooterLink } from "./footer-link";

const navItems = [
  {
    label: "Twitter",
    href: LINKS.ENDUR_TWITTER,
    icon: TwitterIcon,
  },
  {
    label: "Telegram",
    href: LINKS.ENDUR_TELEGRAM,
    icon: TelegramIcon,
  },
  {
    label: "Blog",
    href: LINKS.ENDUR_BLOG,
    icon: FilePenLineIcon,
  },
  {
    label: "Docs",
    href: LINKS.ENDUR_DOCS,
    icon: BookTextIcon,
  },
];

const Footer = () => {
  return (
    <div className="w-full bg-[#17876D1A]">
      <div className="flex items-center gap-4 px-3 py-8 md:px-7">
        {navItems.map((item) => (
          <FooterLink key={item.label} href={item.href} label={item.label.toLowerCase()}>
            <item.icon asIcon className="size-4 text-[#03624C]" />
          </FooterLink>
        ))}
      </div>

      <FooterLink
        href={LINKS.ENDUR_TELEGRAM}
        label="support_telegram"
        className="flex items-center gap-3 border-t border-[#075A5A1A] px-3 py-3 text-[#03624C] md:px-7"
      >
        <MessageCircleMoreIcon asIcon className="size-4 shrink-0" />
        Support
      </FooterLink>
    </div>
  );
};

export default Footer;
