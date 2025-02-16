import Link from "next/link";
import React from "react";

import { BookTextIcon } from "./ui/book-text";
import { FilePenLineIcon } from "./ui/file-pen-line";
import { MessageCircleMoreIcon } from "./ui/message-circle-more";
import { TelegramIcon } from "./ui/telegram";
import { TwitterIcon } from "./ui/twitter";

const Footer = () => {
  return (
    <div className="w-full bg-[#17876D1A]">
      <div className="flex items-center gap-4 px-3 py-8 md:px-7">
        <Link href="https://x.com/endurfi" target="_blank">
          <TwitterIcon asIcon className="size-4 text-[#03624C]" />
        </Link>
        <Link href="https://t.me/+jWY71PfbMMIwMTBl" target="_blank">
          <TelegramIcon asIcon className="size-4 text-[#03624C]" />
        </Link>
        <Link href="https://t.me/+jWY71PfbMMIwMTBl" target="_blank">
          <FilePenLineIcon asIcon className="size-4 text-[#03624C]" />
        </Link>
        <Link href="https://docs.endur.fi/" target="_blank">
          <BookTextIcon asIcon className="size-4 text-[#03624C]" />
        </Link>
      </div>

      <Link
        href="https://t.me/+jWY71PfbMMIwMTBl"
        target="_blank"
        className="flex items-center gap-3 border-t border-[#075A5A1A] px-3 py-3 text-[#03624C] md:px-7"
      >
        <MessageCircleMoreIcon asIcon className="size-4 shrink-0" />
        Support
      </Link>
    </div>
  );
};

export default Footer;
