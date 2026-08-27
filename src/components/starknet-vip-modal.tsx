"use client";

import { useAtom, useAtomValue } from "jotai";
import React from "react";
import { Sparkles } from "lucide-react";
import { MyAnalytics } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { userAddressAtom } from "@/store/common.store";
import { Dialog, DialogContent } from "./ui/dialog";
import {
  isStarknetVipAtom,
  starknetVipCtaAtom,
  starknetVipModalOpenAtom,
} from "@/store/starknet-vip.store";

const SHOWN_KEY_PREFIX = "starknet_vip_modal_shown_";

function isAnyDialogMounted() {
  if (typeof document === "undefined") return false;
  return document.querySelector('[role="dialog"]') !== null;
}

const POLL_INTERVAL_MS = 150;
const MAX_DIALOG_WAIT_MS = 5000;

function releaseStrandedBodyLock() {
  if (typeof document === "undefined") return;
  if (isAnyDialogMounted()) return;
  if (document.body.style.pointerEvents !== "none") return;

  document.body.style.removeProperty("pointer-events");
}

const StarknetVipChip = () => (
  <div
    className="flex flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
    style={{
      background: "linear-gradient(180deg, #38EF7D -41.45%, #11998E 98.9%)",
    }}
  >
    <Sparkles className="size-4 text-white" fill="#fff" />
    <span className="text-[11px] font-bold leading-[16.5px] tracking-[-0.11px] text-white">
      STARKNET VIP PROGRAM
    </span>
  </div>
);

const StarknetVipModal = () => {
  const [isOpen, setIsOpen] = useAtom(starknetVipModalOpenAtom);
  const cta = useAtomValue(starknetVipCtaAtom);

  React.useEffect(() => {
    if (isOpen && cta) {
      MyAnalytics.track(AnalyticsEvents.STARKNET_VIP_MODAL_VIEW, {});
    }
  }, [isOpen, cta]);

  React.useEffect(() => {
    if (isOpen) return;

    const timer = setTimeout(releaseStrandedBodyLock, 400);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!cta) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          MyAnalytics.track(AnalyticsEvents.STARKNET_VIP_MODAL_CLOSE, {});
        }
        setIsOpen(open);
      }}
    >
      <DialogContent className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <StarknetVipChip />
            <h3 className="text-[24px] font-bold leading-[36px] tracking-[-0.24px] text-[#1A1F24]">
              You are an important user for us!
            </h3>
          </div>
          <p className="text-center text-[16px] leading-[24px] tracking-[0px] text-[#6B7780]">
            {cta.body}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          {cta.links.map((link, index) => (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                MyAnalytics.track(
                  AnalyticsEvents.STARKNET_VIP_MODAL_LINK_CLICK,
                  {
                    label: link.label,
                    url: link.url,
                  },
                )
              }
              className="flex h-auto w-full items-center justify-center gap-2 rounded-[10px] py-[16px] text-center text-[16px] font-bold leading-[19.5px] tracking-[-0.13px] text-white transition-opacity hover:opacity-90"
              style={{
                background:
                  index === 0
                    ? "#03624C"
                    : "linear-gradient(180deg, #38EF7D -59.65%, #11998E 100%)",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const StarknetVipController = () => {
  const address = useAtomValue(userAddressAtom);
  const isStarknetVip = useAtomValue(isStarknetVipAtom);
  const cta = useAtomValue(starknetVipCtaAtom);
  const setIsOpen = useAtom(starknetVipModalOpenAtom)[1];

  React.useEffect(() => {
    if (!address) return;
    if (!isStarknetVip) return;
    if (!cta) return;
    if (typeof window === "undefined") return;

    const shownKey = `${SHOWN_KEY_PREFIX}${address}`;
    if (sessionStorage.getItem(shownKey)) return;

    const open = () => {
      sessionStorage.setItem(shownKey, "true");
      setIsOpen(true);
    };

    if (!isAnyDialogMounted()) {
      open();
      return;
    }

    let waited = 0;
    const poll = setInterval(() => {
      waited += POLL_INTERVAL_MS;

      if (!isAnyDialogMounted() || waited >= MAX_DIALOG_WAIT_MS) {
        clearInterval(poll);
        open();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [address, isStarknetVip, cta, setIsOpen]);

  return <StarknetVipModal />;
};

export default StarknetVipModal;
