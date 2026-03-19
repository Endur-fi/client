"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils";
import { MyAnalytics } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { Icons } from "./Icons";
import {
  ArrowRight,
  Crown,
  MessageCircle,
  Phone,
  LucideProps,
} from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { isVIPAtom } from "@/store/portfolio.store";
import React from "react";
import { useAccount } from "@starknet-react/core";

interface VipFeatureItemProps {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
}

const VipFeatureItem = ({
  icon: Icon,
  title,
  description,
}: VipFeatureItemProps) => (
  <div className="flex flex-row items-center gap-2 rounded-[10px] bg-[#F0F9F780] px-2 py-3">
    <div
      className="flex rounded-full p-[6.75px]"
      style={{
        background:
          "linear-gradient(179.7deg, #38EF7D -22.29%, #11998E 99.74%)",
      }}
    >
      <Icon className="size-[14px] text-white" strokeWidth={2.5} />
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-bold leading-[13.75px] tracking-[0px] text-[#1A1F24]">
        {title}
      </span>
      <span className="text-[10px] font-medium leading-[12.5px] tracking-[0px] text-[#6B7780]">
        {description}
      </span>
    </div>
  </div>
);

const EliteMemberChip = () => (
  <div
    className="flex flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
    style={{
      background: "linear-gradient(180deg, #38EF7D -41.45%, #11998E 98.9%)",
    }}
  >
    <Icons.crown className="size-4" fill="#fff" stroke="#fff" />
    <span className="text-[11px] font-bold leading-[16.5px] tracking-[-0.11px] text-white">
      ELITE MEMBER CLUB
    </span>
  </div>
);

interface VIPStatus {
    isVIP: boolean,
    totalValueUSD: number,
    contacts: {
        call: string | null,
        telegram: string | null,
    }
}

const VipModal = ({ isModalOpen, setIsModalOpen, vipStatus }: { isModalOpen: boolean, setIsModalOpen: (open: boolean) => void, vipStatus: VIPStatus }) => (
	<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <EliteMemberChip />
              <h3 className="text-[24px] font-bold leading-[36px] tracking-[-0.24px] text-[#1A1F24]">
                You are an important user for us!
              </h3>
            </div>
            <p className="text-[16px] leading-[24px] tracking-[0px] text-[#6B7780]">
              Connect with our Founder over a call to know Endur better
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            {vipStatus.contacts.call && (
              <Button
                className="h-auto w-full gap-2 rounded-[10px] bg-[#03624C] py-[16px] text-[16px] font-bold leading-[19.5px] tracking-[-0.13px] text-white transition-opacity hover:opacity-90 lg:w-auto lg:px-6"
                onClick={() => {
                  MyAnalytics.track(AnalyticsEvents.VIP_CARD_SCHEDULE_CALL_CLICK, {
                    totalValueUSD: vipStatus.totalValueUSD,
                    source: "modal",
                  });
                  window.open(vipStatus.contacts.call || "", "_blank");
                }}
              >
                <Phone className="size-[16px] text-white" strokeWidth={2.5} />
                Schedule a Call
              </Button>
            )}
            {vipStatus.contacts.telegram && (
              <Button
                className="h-auto w-full gap-2 rounded-[10px] py-[16px] text-[16px] font-bold leading-[19.5px] tracking-[-0.13px] text-white transition-opacity hover:opacity-90 lg:w-auto lg:px-6"
                style={{
                  background:
                    "linear-gradient(180deg, #38EF7D -59.65%, #11998E 100%)",
                }}
                onClick={() => {
                  MyAnalytics.track(AnalyticsEvents.VIP_CARD_TELEGRAM_CLICK, {
                    totalValueUSD: vipStatus.totalValueUSD,
                    source: "modal",
                  });
                  window.open(vipStatus.contacts.telegram || "", "_blank");
                }}
              >
                <MessageCircle className="size-[16px] text-white" strokeWidth={2.5} />
                Message on Telegram
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="h-[1px] w-full bg-[#E5E8EB]" />
            <span className="text-center text-[12px] leading-[18px] tracking-[0px] text-[#6B7780]">
              As a valued member, you get priority
              access to our founder for personalized guidance and exclusive
              opportunities.
            </span>
          </div>
        </DialogContent>
      </Dialog>
);

const VipCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const vipStatus = useAtomValue(isVIPAtom);

  // useEffect(() => {
  //   const firstTime = localStorage.getItem("firstTimeVipCard");
  //   if (!firstTime && vipStatus.isVIP) {
  //     setIsModalOpen(true);
  //     localStorage.setItem("firstTimeVipCard", "true");
  //   }
  // }, [vipStatus.isVIP]);

  if (!vipStatus.isVIP) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-col gap-4 p-4 px-7 lg:max-w-none",
        "items-center rounded-[14px] border border-[#E5E8EB] bg-white",
        "shadow-[0_1px_2px_-1px_#0000001A,_0_1px_3px_0_#0000001A]",
      )}
    >
      <EliteMemberChip />
      <span className="text-[16px] font-bold leading-[20px] tracking-[-0.32px] text-[##1A1F24]">
        Direct Founder Access
      </span>
      <span className="text-[12px] leading-[16.5px] tracking-[-0.06px] text-[#6B7780]">
        Exclusive 1-on-1 strategy sessions for elite investors
      </span>
      <div className="flex w-full flex-col gap-2">
        <VipFeatureItem
          icon={MessageCircle}
          title="Priority Support"
          description="Instant response time"
        />
        <VipFeatureItem
          icon={Crown}
          title="Custom Strategies"
          description="Tailored growth plans"
        />
      </div>
      <Button
        className="w-full self-stretch rounded-[10px] py-2.5 text-[13px] font-bold leading-[19.5px] tracking-[-0.13px] text-white transition-opacity hover:opacity-90 lg:w-auto lg:px-6 lg:text-sm"
        style={{
          background: "linear-gradient(180deg, #38EF7D -59.65%, #11998E 100%)",
        }}
        onClick={() => {
          MyAnalytics.track(AnalyticsEvents.VIP_CARD_SCHEDULE_CALL_CLICK, {
            totalValueUSD: vipStatus.totalValueUSD,
            source: "card",
          });
          setIsModalOpen(true);
        }}
      >
        <MessageCircle className="size-[14px] text-white" strokeWidth={2.5} />
        Schedule a Call
        <ArrowRight className="size-[14px] text-white" strokeWidth={2.5} />
      </Button>
			<VipModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} vipStatus={vipStatus} />
    </div>
  );
};

export default VipCard;

export const VipNavbarChip = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const vipStatus = useAtomValue(isVIPAtom);
  const { address } = useAccount();

  React.useEffect(() => {
    if (vipStatus.isLoading) return;
    if (typeof window === "undefined") return;

    // Fire once per session for every connected user so we can measure
    // the VIP vs non-VIP split — regardless of whether they are VIP.
    const resolvedKey = "vip_status_resolved";
    if (!sessionStorage.getItem(resolvedKey) && address) { // check address as if not connected, then it will be null and isVIP will be false
      MyAnalytics.track(AnalyticsEvents.VIP_STATUS_RESOLVED, {
        isVIP: vipStatus.isVIP,
        totalValueUSD: vipStatus.totalValueUSD,
      });
      sessionStorage.setItem(resolvedKey, "true");
    }

    // Track chip impression once per session for VIP users only.
    if (!vipStatus.isVIP) return;
    const chipKey = "vip_navbar_chip_seen";
    if (sessionStorage.getItem(chipKey)) return;
    MyAnalytics.track(AnalyticsEvents.VIP_NAVBAR_CHIP_VIEW, {
      totalValueUSD: vipStatus.totalValueUSD,
    });
    sessionStorage.setItem(chipKey, "true");
  }, [vipStatus.isLoading, vipStatus.isVIP, vipStatus.totalValueUSD]);

  if (!vipStatus.isVIP) {
    return null;
  }

  return (
    <>
      <button
        className="relative flex aspect-square items-center gap-1 overflow-hidden rounded-full px-2 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] sm:aspect-auto md:gap-1.5 md:px-4 md:py-3"
        style={{
          background: "linear-gradient(180deg, #38EF7D -41.45%, #11998E 98.9%)",
        }}
        onClick={() => {
          MyAnalytics.track(AnalyticsEvents.VIP_NAVBAR_CHIP_CLICK, {
            totalValueUSD: vipStatus.totalValueUSD,
          });
          setIsModalOpen(true);
        }}
      >
        <div className="absolute h-[200%] w-3 rotate-45 bg-[#FFFFFF] opacity-15" />
        <div className="absolute right-[15px] hidden h-[200%] w-1 rotate-45 bg-[#FFFFFF] opacity-15 sm:block" />
        <Icons.crown className="z-[1] size-3 md:size-4" />
        <p className="z-[1] hidden text-xs font-semibold text-white sm:inline md:text-[14px]">
          VIP
        </p>
      </button>
      <VipModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        vipStatus={vipStatus}
      />
    </>
  );
};
