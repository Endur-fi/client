"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { MyAnalytics } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

interface FooterLinkProps {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}

export function FooterLink({ href, label, className, children }: FooterLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      onClick={() =>
        MyAnalytics.track(AnalyticsEvents.FOOTER_NAV_CLICK, { link: label })
      }
      className={className}
    >
      {children}
    </Link>
  );
}
